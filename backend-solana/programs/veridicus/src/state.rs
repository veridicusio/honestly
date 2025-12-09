use anchor_lang::prelude::*;

#[account]
pub struct VERIDICUSState {
    pub authority: Pubkey,
    pub pending_authority: Option<Pubkey>, // Pending authority transfer (for timelock)
    pub authority_transfer_timestamp: Option<i64>, // When authority transfer was initiated
    pub total_supply: u64,
    pub total_burned: u64,
    pub total_jobs: u64,
    pub paused: bool, // Emergency pause flag
}

impl VERIDICUSState {
    // authority (32) + pending_authority Option<Pubkey> (1 + 32) + authority_transfer_timestamp Option<i64> (1 + 8) + 3 u64s (24) + paused bool (1)
    pub const LEN: usize = 32 + (1 + 32) + (1 + 8) + 8 + 8 + 8 + 1;
    
    // 7 days in seconds (7 * 24 * 60 * 60)
    pub const AUTHORITY_TRANSFER_DELAY: i64 = 604800;
    
    // Oracle-based burn rates (USD values)
    pub const BASE_BURN_USD: u64 = 5_000_000; // $5.00 (scaled by 1M for precision)
    pub const QUANTUM_JOB_MULTIPLIER_USD: u64 = 1_000_000; // $1.00 per qubit tier
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

/// Per-user state for rate limiting
#[account]
pub struct UserState {
    pub user: Pubkey,
    pub last_job_timestamp: i64,
    pub jobs_last_hour: u8,      // Jobs executed in the last hour
    pub hour_start_timestamp: i64, // When the current hour window started
}

impl UserState {
    pub const LEN: usize = 32 + 8 + 1 + 8; // user + last_job_timestamp + jobs_last_hour + hour_start_timestamp
    
    // Rate limits
    pub const MIN_COOLDOWN_SECONDS: i64 = 60; // 1 minute cooldown between jobs
    pub const MAX_JOBS_PER_HOUR: u8 = 10;     // Max 10 jobs per hour per user
    pub const HOUR_IN_SECONDS: i64 = 3600;    // 1 hour in seconds
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
    #[msg("Authority transfer already pending")]
    AuthorityTransferPending,
    #[msg("Authority transfer not pending")]
    NoAuthorityTransferPending,
    #[msg("Authority transfer timelock not expired")]
    AuthorityTransferTimelockNotExpired,
    #[msg("Invalid new authority")]
    InvalidNewAuthority,
    #[msg("Invalid price feed or price too old")]
    InvalidPriceFeed,
    #[msg("Arithmetic overflow")]
    ArithmeticOverflow,
    #[msg("Already voted on this proposal")]
    AlreadyVoted,
}

