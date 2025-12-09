use anchor_lang::prelude::*;

#[account]
pub struct VERIDICUSState {
    pub authority: Pubkey,
    pub total_supply: u64,
    pub total_burned: u64,
    pub total_jobs: u64,
    pub paused: bool, // Emergency pause flag
}

impl VERIDICUSState {
    pub const LEN: usize = 32 + 8 + 8 + 8 + 1; // authority + 3 u64s + paused bool
}

#[account]
pub struct Staking {
    pub user: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

impl Staking {
    pub const LEN: usize = 32 + 8 + 8; // user + amount + timestamp
}

#[error_code]
pub enum VERIDICUSError {
    #[msg("Insufficient stake")]
    InsufficientStake,
    #[msg("Invalid Merkle proof")]
    InvalidProof,
    #[msg("Already claimed")]
    AlreadyClaimed,
    #[msg("Milestone not reached")]
    MilestoneNotReached,
    #[msg("Invalid milestone")]
    InvalidMilestone,
    #[msg("Already unlocked")]
    AlreadyUnlocked,
    #[msg("Proposal not active")]
    ProposalNotActive,
    #[msg("No votes cast")]
    NoVotes,
    #[msg("Invalid proposal type")]
    InvalidProposalType,
    #[msg("Invalid unlock time")]
    InvalidUnlockTime,
    #[msg("Lock period too short")]
    LockPeriodTooShort,
    #[msg("Liquidity still locked")]
    LiquidityStillLocked,
    #[msg("Liquidity not locked")]
    LiquidityNotLocked,
    #[msg("Program paused")]
    ProgramPaused,
    #[msg("Rate limit exceeded")]
    RateLimitExceeded,
    #[msg("Unauthorized")]
    Unauthorized,
}

