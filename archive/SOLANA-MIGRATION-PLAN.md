# VERITAS: EVM → Solana Migration Plan

## 🎯 Current State vs. Target State

### Current (EVM)
- **Chain**: Base/Arbitrum (EVM)
- **Token**: ERC20 (1M supply)
- **Language**: Solidity
- **Framework**: Hardhat
- **Status**: Contracts written, not deployed

### Target (Solana)
- **Chain**: Solana
- **Token**: SPL Token (1M supply)
- **Language**: Rust
- **Framework**: Anchor
- **Status**: Need to build

---

## 📋 Migration Checklist

### Step 1: Core Concept ✅
- [x] Whitepaper V2 written
- [x] Tokenomics refined (1M supply)
- [x] Distribution model defined

### Step 2: Tech Setup
- [ ] Install Solana CLI
- [ ] Install Rust
- [ ] Install Anchor framework
- [ ] Set up Phantom/Solflare wallet
- [ ] Fund with 2-5 SOL

### Step 3: Token Creation
- [ ] Create SPL token
- [ ] Set metadata (VERITAS, VTS)
- [ ] Configure supply (1M)
- [ ] Set up distribution wallets

### Step 4: Smart Contracts (Anchor)
- [ ] Quantum Gateway program
- [ ] Payment/burn mechanism
- [ ] Job queue system
- [ ] Oracle integration (Switchboard)
- [ ] zkML verification hooks

### Step 5: Testing
- [ ] Deploy to devnet
- [ ] Test token minting
- [ ] Test burn mechanism
- [ ] Test job queue
- [ ] Simulate 100 jobs
- [ ] Security audit (self)

### Step 6: Launch Prep
- [ ] Liquidity pool setup (Raydium/Jupiter)
- [ ] LP locking (12 months)
- [ ] Airdrop preparation (Merkle proofs)
- [ ] Marketing materials
- [ ] Legal disclaimers

### Step 7: Launch
- [ ] Mainnet deployment
- [ ] Liquidity seeding
- [ ] Airdrop execution
- [ ] Marketing push
- [ ] Community engagement

---

## 🔄 Key Differences: EVM vs. Solana

### Token Supply
- **EVM**: 1M VERITAS
- **Solana**: 1M VERITAS (same supply)

### Distribution
- **EVM**: 60% community, 30% treasury, 10% team
- **Solana**: 60% community, 30% treasury, 10% team (same distribution)

### Burn Mechanism
- **EVM**: Fixed burn per job type
- **Solana**: Dynamic 1-5% based on complexity

### Technology Stack
- **EVM**: Solidity, Hardhat, Web3.py
- **Solana**: Rust, Anchor, Solana CLI

---

## 🚀 Implementation Priority

### Immediate (Step 1) ✅
- Whitepaper V2: Done
- Tokenomics: Refined
- Core concept: Locked

### Next (Step 2-3)
1. Set up Solana development environment
2. Create SPL token
3. Build Anchor programs

### Then (Step 4-5)
4. Integrate quantum gateway
5. Test on devnet
6. Security audit

### Finally (Step 6-7)
7. Launch preparation
8. Mainnet deployment
9. Community growth

---

## 📝 Notes

- **Keep EVM version**: Can run both in parallel
- **Solana focus**: Primary launch on Solana
- **Migration path**: Gradual transition
- **Community**: Communicate changes clearly

---

## 🎯 Timeline

- **Today**: Step 1 complete ✅
- **Day 1-2**: Tech setup
- **Day 3-5**: Token minting & testing
- **Week 2**: Launch preparation
- **End of Month**: MVP launch

**Status**: On track for end-of-month MVP

