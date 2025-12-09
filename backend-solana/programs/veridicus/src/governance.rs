use anchor_lang::prelude::*;
use anchor_spl::token::TokenAccount;

use crate::state::{Staking, VERIDICUSError};

/// Quadratic voting: voting power = sqrt(staked_amount)
pub fn calculate_voting_power(staked: u64) -> u64 {
    // Quadratic: sqrt(staked) to prevent whale dominance
    (staked as f64).sqrt() as u64
}

/// Create a governance proposal
pub fn create_proposal(
    ctx: Context<CreateProposal>,
    proposal_type: u8,
    description: String,
    proposal_id: u64, // Unique proposal ID provided by caller
) -> Result<()> {
    let proposal = &mut ctx.accounts.proposal;
    proposal.author = ctx.accounts.author.key();
    proposal.proposal_type = proposal_type;
    proposal.description = description;
    proposal.votes_for = 0;
    proposal.votes_against = 0;
    proposal.created_at = Clock::get()?.unix_timestamp;
    proposal.status = ProposalStatus::Active;
    
    emit!(ProposalCreated {
        proposal: ctx.accounts.proposal.key(),
        author: ctx.accounts.author.key(),
        proposal_type,
    });
    
    msg!("Proposal created: {}", proposal.description);
    Ok(())
}

/// Vote on a proposal using quadratic voting
pub fn vote(
    ctx: Context<Vote>,
    choice: bool, // true = for, false = against
) -> Result<()> {
    let proposal = &mut ctx.accounts.proposal;
    let staking = &ctx.accounts.staking;
    
    require!(
        proposal.status == ProposalStatus::Active,
        VERIDICUSError::ProposalNotActive
    );
    
    let vote_record = &mut ctx.accounts.vote_record;
    
    // Check if already voted
    require!(
        !vote_record.voted,
        VERIDICUSError::AlreadyVoted
    );
    
    // Calculate voting power (quadratic)
    let voting_power = calculate_voting_power(staking.amount);
    
    // Record vote
    vote_record.voter = ctx.accounts.voter.key();
    vote_record.proposal = ctx.accounts.proposal.key();
    vote_record.choice = choice;
    vote_record.voting_power = voting_power;
    vote_record.voted = true;
    
    if choice {
        proposal.votes_for = proposal.votes_for.checked_add(voting_power).unwrap();
    } else {
        proposal.votes_against = proposal.votes_against.checked_add(voting_power).unwrap();
    }
    
    emit!(VoteCast {
        proposal: ctx.accounts.proposal.key(),
        voter: ctx.accounts.voter.key(),
        choice,
        voting_power,
    });
    
    msg!("Vote cast: {} with {} voting power", if choice { "FOR" } else { "AGAINST" }, voting_power);
    Ok(())
}

/// Execute a passed proposal
pub fn execute_proposal(ctx: Context<ExecuteProposal>) -> Result<()> {
    let proposal = &mut ctx.accounts.proposal;
    
    require!(
        proposal.status == ProposalStatus::Active,
        VERIDICUSError::ProposalNotActive
    );
    
    // Check if proposal passed (simple majority)
    let total_votes = proposal.votes_for + proposal.votes_against;
    require!(
        total_votes > 0,
        VERIDICUSError::NoVotes
    );
    
    let passed = proposal.votes_for > proposal.votes_against;
    
    if passed {
        proposal.status = ProposalStatus::Passed;
        
        // Execute proposal based on type
        match proposal.proposal_type {
            0 => {
                // Add new provider
                msg!("Executing: Add new quantum provider");
            }
            1 => {
                // Update burn rates
                msg!("Executing: Update burn rates");
            }
            2 => {
                // Treasury allocation
                msg!("Executing: Treasury allocation");
            }
            3 => {
                // Phase 4 node rules
                msg!("Executing: Phase 4 node rules");
            }
            _ => {
                return Err(VERIDICUSError::InvalidProposalType.into());
            }
        }
        
        emit!(ProposalExecuted {
            proposal: ctx.accounts.proposal.key(),
            passed: true,
        });
    } else {
        proposal.status = ProposalStatus::Rejected;
        
        emit!(ProposalExecuted {
            proposal: ctx.accounts.proposal.key(),
            passed: false,
        });
    }
    
    Ok(())
}

#[derive(Accounts)]
#[instruction(proposal_id: u64)]
pub struct CreateProposal<'info> {
    #[account(
        init,
        payer = author,
        space = 8 + Proposal::LEN,
        seeds = [b"proposal", proposal_id.to_le_bytes().as_ref()],
        bump
    )]
    pub proposal: Account<'info, Proposal>,
    
    #[account(mut)]
    pub author: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Vote<'info> {
    #[account(mut, seeds = [b"proposal", proposal.key().as_ref()], bump)]
    pub proposal: Account<'info, Proposal>,
    
    #[account(seeds = [b"staking", voter.key().as_ref()], bump)]
    pub staking: Account<'info, Staking>,
    
    #[account(
        init_if_needed,
        payer = voter,
        space = 8 + VoteRecord::LEN,
        seeds = [b"vote_record", proposal.key().as_ref(), voter.key().as_ref()],
        bump
    )]
    pub vote_record: Account<'info, VoteRecord>,
    
    #[account(mut)]
    pub voter: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ExecuteProposal<'info> {
    #[account(mut, seeds = [b"proposal", proposal.key().as_ref()], bump)]
    pub proposal: Account<'info, Proposal>,
    
    pub authority: Signer<'info>,
}

#[account]
pub struct Proposal {
    pub author: Pubkey,
    pub proposal_type: u8,
    pub description: String,
    pub votes_for: u64,
    pub votes_against: u64,
    pub created_at: i64,
    pub status: ProposalStatus,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq)]
pub enum ProposalStatus {
    Active,
    Passed,
    Rejected,
}

impl Proposal {
    pub const LEN: usize = 32 + 1 + 4 + 200 + 8 + 8 + 8 + 1; // author + type + desc_len + desc + votes + created + status
}

#[account]
pub struct VoteRecord {
    pub voter: Pubkey,
    pub proposal: Pubkey,
    pub choice: bool,
    pub voting_power: u64,
    pub voted: bool,
}

impl VoteRecord {
    pub const LEN: usize = 32 + 32 + 1 + 8 + 1; // voter + proposal + choice + power + voted
}

// Removed proposal_seed() - now using proposal_id parameter for PDA derivation

#[event]
pub struct ProposalCreated {
    pub proposal: Pubkey,
    pub author: Pubkey,
    pub proposal_type: u8,
}

#[event]
pub struct VoteCast {
    pub proposal: Pubkey,
    pub voter: Pubkey,
    pub choice: bool,
    pub voting_power: u64,
}

#[event]
pub struct ProposalExecuted {
    pub proposal: Pubkey,
    pub passed: bool,
}

// Errors in state.rs

