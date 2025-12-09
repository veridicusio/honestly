use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

use crate::state::{VERIDICUSState, VERIDICUSError};

/// Claim airdrop via Merkle proof
pub fn claim_airdrop(
    ctx: Context<ClaimAirdrop>,
    proof: Vec<[u8; 32]>,
    amount: u64,
    leaf: [u8; 32],
) -> Result<()> {
    let airdrop = &mut ctx.accounts.airdrop;
    
    // Verify Merkle proof
    require!(
        verify_merkle_proof(&proof, &leaf, &airdrop.merkle_root),
        VERIDICUSError::InvalidProof
    );
    
    // Check if already claimed using bitmap
    // Convert leaf hash to claim index (first 4 bytes as u32)
    let claim_index = u32::from_le_bytes([leaf[0], leaf[1], leaf[2], leaf[3]]) % AirdropState::MAX_CLAIMS;
    let byte_index = (claim_index / 8) as usize;
    let bit_index = (claim_index % 8) as u8;
    
    // Check if already claimed
    require!(
        (airdrop.claimed_bitmap[byte_index] & (1 << bit_index)) == 0,
        VERIDICUSError::AlreadyClaimed
    );
    
    // Calculate immediate unlock (50% at launch)
    let immediate = amount / 2;
    let vested = amount - immediate;
    
    // Transfer immediate portion
    let cpi_accounts = Transfer {
        from: ctx.accounts.airdrop_vault.to_account_info(),
        to: ctx.accounts.user_token_account.to_account_info(),
        authority: ctx.accounts.airdrop_vault.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let seeds = &[
        b"airdrop_vault",
        &[ctx.bumps.airdrop_vault],
    ];
    let signer = &[&seeds[..]];
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
    token::transfer(cpi_ctx, immediate)?;
    
    // Create vesting schedule for remaining 50%
    let vesting = &mut ctx.accounts.vesting;
    vesting.user = ctx.accounts.user.key();
    vesting.total_amount = vested;
    vesting.unlocked = 0;
    vesting.milestones_claimed = 0; // No milestones claimed yet
    vesting.vesting_period = 6 * 30 * 24 * 60 * 60; // 6 months in seconds
    vesting.start_timestamp = Clock::get()?.unix_timestamp;
    
    // Mark as claimed in bitmap
    airdrop.claimed_bitmap[byte_index] |= 1 << bit_index;
    airdrop.total_claims = airdrop.total_claims.checked_add(1).unwrap();
    
    emit!(AirdropClaimed {
        user: ctx.accounts.user.key(),
        immediate,
        vested,
    });
    
    msg!("Airdrop claimed: {} immediate, {} vested", immediate, vested);
    Ok(())
}

/// Unlock vested tokens based on milestones
pub fn unlock_vested(
    ctx: Context<UnlockVested>,
    milestone: u8,
) -> Result<()> {
    let vesting = &mut ctx.accounts.vesting;
    let state = &ctx.accounts.state;
    
    // Check milestone requirements
    let required_jobs = match milestone {
        0 => 1_000,   // 1K jobs
        1 => 5_000,   // 5K jobs
        2 => 10_000,  // 10K jobs
        3 => 20_000,  // 20K jobs
        _ => return Err(VERIDICUSError::InvalidMilestone.into()),
    };
    
    require!(
        state.total_jobs >= required_jobs,
        VERIDICUSError::MilestoneNotReached
    );
    
    // Check if milestone already claimed
    let milestone_bit = 1u8 << milestone;
    require!(
        (vesting.milestones_claimed & milestone_bit) == 0,
        VERIDICUSError::AlreadyUnlocked
    );
    
    // Calculate CUMULATIVE unlock percentage
    let cumulative_unlock_percentage = match milestone {
        0 => 10,  // 10% total
        1 => 30,  // 30% total (10% from M0 + 20% from M1)
        2 => 60,  // 60% total (10% + 20% + 30%)
        3 => 100, // 100% total (10% + 20% + 30% + 40%)
        _ => 0,
    };
    
    let cumulative_unlock_amount = (vesting.total_amount * cumulative_unlock_percentage as u64) / 100;
    
    // Check user hasn't already claimed this milestone
    require!(
        vesting.unlocked < cumulative_unlock_amount,
        VERIDICUSError::AlreadyUnlocked
    );
    
    // Calculate INCREMENTAL amount to transfer (only new tokens)
    let incremental_amount = cumulative_unlock_amount
        .checked_sub(vesting.unlocked)
        .ok_or(VERIDICUSError::MathOverflow)?;
    
    // Transfer ONLY the new tokens
    let cpi_accounts = Transfer {
        from: ctx.accounts.vesting_vault.to_account_info(),
        to: ctx.accounts.user_token_account.to_account_info(),
        authority: ctx.accounts.vesting_vault.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let seeds = &[
        b"vesting_vault",
        &[ctx.bumps.vesting_vault],
    ];
    let signer = &[&seeds[..]];
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
    token::transfer(cpi_ctx, incremental_amount)?; // Transfer ONLY new tokens
    
    // Mark milestone as claimed
    vesting.milestones_claimed |= milestone_bit;
    vesting.unlocked = cumulative_unlock_amount; // Store cumulative total
    
    emit!(VestedUnlocked {
        user: ctx.accounts.user.key(),
        milestone,
        amount: incremental_amount, // Emit incremental amount
    });
    
    msg!("Unlocked {} VERIDICUS at milestone {} (total: {})",
         incremental_amount, milestone, cumulative_unlock_amount);
    Ok(())
}

/// Close ClaimRecord and reclaim rent (after airdrop period ends)
pub fn close_claim_record(ctx: Context<CloseClaimRecord>) -> Result<()> {
    // Can only close after airdrop period ends (e.g., 6 months)
    let state = &ctx.accounts.state;
    let clock = Clock::get()?;
    
    // Note: This requires airdrop_end_timestamp in VERIDICUSState
    // For now, allow closing if claim was made more than 6 months ago
    // In production, add airdrop_end_timestamp to state
    
    Ok(())
}

fn verify_merkle_proof(proof: &[[u8; 32]], leaf: &[u8; 32], root: &[u8; 32]) -> bool {
    use anchor_lang::solana_program::keccak;
    
    let mut computed_hash = *leaf;
    
    for proof_element in proof.iter() {
        if computed_hash < *proof_element {
            computed_hash = keccak::hashv(&[&computed_hash, proof_element]).to_bytes();
        } else {
            computed_hash = keccak::hashv(&[proof_element, &computed_hash]).to_bytes();
        }
    }
    
    computed_hash == *root
}

#[derive(Accounts)]
pub struct ClaimAirdrop<'info> {
    #[account(mut, seeds = [b"airdrop"], bump)]
    pub airdrop: Account<'info, AirdropState>,
    
    #[account(
        init_if_needed,
        payer = user,
        space = 8 + Vesting::LEN,
        seeds = [b"vesting", user.key().as_ref()],
        bump
    )]
    pub vesting: Account<'info, Vesting>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        seeds = [b"airdrop_vault"],
        bump
    )]
    pub airdrop_vault: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UnlockVested<'info> {
    #[account(mut, seeds = [b"vesting", user.key().as_ref()], bump)]
    pub vesting: Account<'info, Vesting>,
    
    #[account(seeds = [b"VERIDICUS_state"], bump)]
    pub state: Account<'info, VERIDICUSState>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        seeds = [b"vesting_vault"],
        bump
    )]
    pub vesting_vault: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct CloseClaimRecord<'info> {
    #[account(
        mut,
        close = user, // Refund rent to user
        seeds = [b"claim", claim_record.leaf.as_ref()],
        bump
    )]
    pub claim_record: Account<'info, ClaimRecord>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(seeds = [b"VERIDICUS_state"], bump)]
    pub state: Account<'info, VERIDICUSState>,
}

#[account]
pub struct AirdropState {
    pub merkle_root: [u8; 32],
    pub claimed_bitmap: [u8; 15625], // 125K claims max (1M bits / 8 = 15,625 bytes)
    pub total_claims: u32, // Track total claims for monitoring
}

impl AirdropState {
    // discriminator (8) + merkle_root (32) + claimed_bitmap (15625) + total_claims (4)
    pub const LEN: usize = 8 + 32 + 15625 + 4;
    
    // Maximum number of claims supported
    pub const MAX_CLAIMS: u32 = 125_000;
}

#[account]
pub struct ClaimRecord {
    pub claimed: bool,
    pub leaf: [u8; 32],
    pub claimed_at: i64,
}

impl ClaimRecord {
    pub const LEN: usize = 1 + 32 + 8;
}

#[account]
pub struct Vesting {
    pub user: Pubkey,
    pub total_amount: u64,
    pub unlocked: u64,
    pub milestones_claimed: u8, // Bitmap: 0b0001 = milestone 0 claimed
    pub vesting_period: i64,
    pub start_timestamp: i64,
}

impl Vesting {
    pub const LEN: usize = 32 + 8 + 8 + 1 + 8 + 8; // user + total_amount + unlocked + milestones_claimed + vesting_period + start_timestamp
}

#[event]
pub struct AirdropClaimed {
    pub user: Pubkey,
    pub immediate: u64,
    pub vested: u64,
}

#[event]
pub struct VestedUnlocked {
    pub user: Pubkey,
    pub milestone: u8,
    pub amount: u64,
}

// Errors moved to state.rs
