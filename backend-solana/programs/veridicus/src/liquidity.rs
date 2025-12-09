use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

use crate::state::VERIDICUSError;

/// Lock liquidity pool tokens to prevent rug pulls
pub fn lock_liquidity(
    ctx: Context<LockLiquidity>,
    unlock_timestamp: i64,
    amount: u64, // LP token amount to lock
) -> Result<()> {
    let lock = &mut ctx.accounts.lock;
    let clock = Clock::get()?;
    
    require!(
        unlock_timestamp > clock.unix_timestamp,
        VERIDICUSError::InvalidUnlockTime
    );
    
    require!(
        unlock_timestamp - clock.unix_timestamp >= 12 * 30 * 24 * 60 * 60, // Minimum 12 months
        VERIDICUSError::LockPeriodTooShort
    );
    
    // Transfer LP tokens to lock vault
    let cpi_accounts = Transfer {
        from: ctx.accounts.authority_lp_account.to_account_info(),
        to: ctx.accounts.lock_lp_vault.to_account_info(),
        authority: ctx.accounts.authority.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    token::transfer(cpi_ctx, amount)?;
    
    lock.lp_mint = ctx.accounts.authority_lp_account.mint;
    lock.locked_amount = amount;
    lock.unlock_timestamp = unlock_timestamp;
    lock.locked = true;
    lock.authority = ctx.accounts.authority.key();
    
    emit!(LiquidityLocked {
        lp_mint: lock.lp_mint,
        amount,
        unlock_timestamp,
        locked_by: ctx.accounts.authority.key(),
    });
    
    msg!("Liquidity locked: {} LP tokens until {}", amount, unlock_timestamp);
    Ok(())
}

/// Unlock liquidity after lock period expires
pub fn unlock_liquidity(ctx: Context<UnlockLiquidity>) -> Result<()> {
    let lock = &mut ctx.accounts.lock;
    let clock = Clock::get()?;
    
    require!(
        clock.unix_timestamp >= lock.unlock_timestamp,
        VERIDICUSError::LiquidityStillLocked
    );
    
    require!(
        lock.locked,
        VERIDICUSError::LiquidityNotLocked
    );
    
    // Transfer LP tokens back from vault to authority
    let seeds = &[
        b"liquidity_lock",
        &[ctx.bumps.lock],
    ];
    let signer = &[&seeds[..]];
    
    let cpi_accounts = Transfer {
        from: ctx.accounts.lock_lp_vault.to_account_info(),
        to: ctx.accounts.authority_lp_account.to_account_info(),
        authority: ctx.accounts.lock.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
    token::transfer(cpi_ctx, lock.locked_amount)?; // Transfer locked amount
    
    let unlocked_amount = lock.locked_amount;
    lock.locked = false;
    lock.locked_amount = 0;
    
    emit!(LiquidityUnlocked {
        lp_mint: lock.lp_mint,
        amount: unlocked_amount,
        unlocked_at: clock.unix_timestamp,
    });
    
    msg!("Liquidity unlocked: {} LP tokens", unlocked_amount);
    Ok(())
}

/// Check if liquidity is locked
pub fn is_liquidity_locked(ctx: Context<CheckLiquidityLock>) -> Result<bool> {
    let lock = &ctx.accounts.lock;
    let clock = Clock::get()?;
    
    Ok(lock.locked && clock.unix_timestamp < lock.unlock_timestamp)
}

#[derive(Accounts)]
pub struct LockLiquidity<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + LiquidityLock::LEN,
        seeds = [b"liquidity_lock"],
        bump
    )]
    pub lock: Account<'info, LiquidityLock>,
    
    // Authority's LP token account (source)
    #[account(mut)]
    pub authority_lp_account: Account<'info, TokenAccount>,
    
    // Lock vault (destination) - PDA-owned token account
    #[account(
        init_if_needed,
        payer = authority,
        token::mint = authority_lp_account.mint,
        token::authority = lock,
        seeds = [b"lock_lp_vault"],
        bump
    )]
    pub lock_lp_vault: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct UnlockLiquidity<'info> {
    #[account(
        mut,
        seeds = [b"liquidity_lock"],
        bump,
        has_one = authority @ VERIDICUSError::Unauthorized // Validate authority
    )]
    pub lock: Account<'info, LiquidityLock>,
    
    // Lock vault (source)
    #[account(
        mut,
        seeds = [b"lock_lp_vault"],
        bump
    )]
    pub lock_lp_vault: Account<'info, TokenAccount>,
    
    // Authority's LP token account (destination)
    #[account(mut)]
    pub authority_lp_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct CheckLiquidityLock<'info> {
    #[account(seeds = [b"liquidity_lock"], bump)]
    pub lock: Account<'info, LiquidityLock>,
}

#[account]
pub struct LiquidityLock {
    pub lp_mint: Pubkey,      // Which LP token mint
    pub locked_amount: u64,   // How many LP tokens locked
    pub unlock_timestamp: i64,
    pub locked: bool,
    pub authority: Pubkey,
}

impl LiquidityLock {
    pub const LEN: usize = 32 + 8 + 8 + 1 + 32; // lp_mint + locked_amount + timestamp + locked + authority
}

#[event]
pub struct LiquidityLocked {
    pub lp_mint: Pubkey,
    pub amount: u64,
    pub unlock_timestamp: i64,
    pub locked_by: Pubkey,
}

#[event]
pub struct LiquidityUnlocked {
    pub lp_mint: Pubkey,
    pub amount: u64,
    pub unlocked_at: i64,
}

