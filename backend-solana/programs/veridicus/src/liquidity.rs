use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

use crate::state::VERIDICUSError;

/// Lock liquidity pool tokens to prevent rug pulls
pub fn lock_liquidity(
    ctx: Context<LockLiquidity>,
    unlock_timestamp: i64,
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
    
    lock.lp_tokens = ctx.accounts.lp_token_account.key();
    lock.unlock_timestamp = unlock_timestamp;
    lock.locked = true;
    lock.authority = ctx.accounts.authority.key();
    
    emit!(LiquidityLocked {
        lp_tokens: lock.lp_tokens,
        unlock_timestamp,
        locked_by: ctx.accounts.authority.key(),
    });
    
    msg!("Liquidity locked until {}", unlock_timestamp);
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
    
    // Transfer LP tokens back to authority
    let seeds = &[
        b"liquidity_lock",
        &[ctx.bumps.lock],
    ];
    let signer = &[&seeds[..]];
    
    let cpi_accounts = Transfer {
        from: ctx.accounts.lp_token_account.to_account_info(),
        to: ctx.accounts.authority_token_account.to_account_info(),
        authority: ctx.accounts.lock.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
    token::transfer(cpi_ctx, ctx.accounts.lp_token_account.amount)?;
    
    lock.locked = false;
    
    emit!(LiquidityUnlocked {
        lp_tokens: lock.lp_tokens,
        unlocked_at: clock.unix_timestamp,
    });
    
    msg!("Liquidity unlocked");
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
    
    #[account(mut)]
    pub lp_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UnlockLiquidity<'info> {
    #[account(
        mut,
        seeds = [b"liquidity_lock"],
        bump
    )]
    pub lock: Account<'info, LiquidityLock>,
    
    #[account(mut)]
    pub lp_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub authority_token_account: Account<'info, TokenAccount>,
    
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
    pub lp_tokens: Pubkey,
    pub unlock_timestamp: i64,
    pub locked: bool,
    pub authority: Pubkey,
}

impl LiquidityLock {
    pub const LEN: usize = 32 + 8 + 1 + 32; // lp_tokens + timestamp + locked + authority
}

#[event]
pub struct LiquidityLocked {
    pub lp_tokens: Pubkey,
    pub unlock_timestamp: i64,
    pub locked_by: Pubkey,
}

#[event]
pub struct LiquidityUnlocked {
    pub lp_tokens: Pubkey,
    pub unlocked_at: i64,
}

