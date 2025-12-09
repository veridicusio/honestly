# Phase 4 Token Economics - Current vs Options

## 🎯 Current Design: **LINK-Only Staking**

**We're hosting stakes for everyone using LINK** - no native token minting.

### Current Model
- **Staking Token**: LINK (Chainlink token)
- **Rewards**: Paid in LINK from slash pool
- **Slashing**: LINK burned/slashed
- **No Native Token**: We don't mint anything

### Pros of LINK-Only
✅ **Liquidity**: LINK is already liquid, no new token needed  
✅ **Trust**: Established token, people trust it  
✅ **Integration**: Works with Chainlink oracles natively  
✅ **Karak Restaking**: LINK can be restaked for yield  
✅ **No Token Launch**: No regulatory/legal complexity  

### Cons of LINK-Only
❌ **No Protocol Value Capture**: We don't benefit from token appreciation  
❌ **Dependency**: Tied to LINK price volatility  
❌ **No Governance**: Can't use token for voting/DAO  
❌ **Limited Incentives**: Can't airdrop or reward early users with protocol tokens  

---

## 💡 Option: Add Native Token (HONESTLY Token)

We could add a native `HONESTLY` token for protocol value capture while keeping LINK for staking.

### Hybrid Model (Recommended)

```
┌─────────────────────────────────────────────────┐
│         DUAL TOKEN MODEL                        │
├─────────────────────────────────────────────────┤
│                                                 │
│  LINK (Staking)                                 │
│  ├─ Staking deposits (100-2000 LINK)            │
│  ├─ Slashing (30-50% of stake)                  │
│  ├─ Rewards (10% from slash pool)               │
│  └─ Dispute bonds (5% of stake at risk)         │
│                                                 │
│  HONESTLY (Protocol Token)                      │
│  ├─ Governance (voting on parameters)           │
│  ├─ Fee discounts (lower staking requirements)  │
│  ├─ Protocol revenue share (from slash pool)    │
│  ├─ Early adopter rewards (airdrops)            │
│  └─ Oracle node rewards (bonus for validators)  │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Implementation Options

#### Option A: Governance Token Only
- **HONESTLY** token for voting on:
  - Staking thresholds
  - Slash percentages
  - Oracle quorum size
  - New chain additions
- **No staking in HONESTLY** - still use LINK

#### Option B: Fee Token
- **HONESTLY** used for:
  - Protocol fees (discounts for HONESTLY holders)
  - Revenue sharing (X% of slash pool to HONESTLY stakers)
  - Early adopter rewards
- **LINK still required** for anomaly reporting stakes

#### Option C: Full Dual Token
- **LINK**: Staking, slashing, rewards (as now)
- **HONESTLY**: Governance + revenue share + fee discounts
- **Hybrid staking**: Can stake LINK + HONESTLY for tier bonuses

---

## 🚀 Recommendation: **Start LINK-Only, Add HONESTLY Later**

### Phase 4.0 (Now): LINK-Only
- Keep current design
- Focus on getting system working
- Build user base
- Prove the model

### Phase 4.5 (Later): Add HONESTLY Governance Token
- Launch HONESTLY token
- Use for governance only (no staking)
- Airdrop to early reporters
- Revenue share from protocol fees

### Phase 5.0 (Future): Full Dual Token
- HONESTLY staking for protocol benefits
- LINK still required for anomaly reporting
- Revenue sharing model

---

## 💰 If We Add HONESTLY Token

### Token Distribution (Example)

```
Total Supply: 1,000,000,000 HONESTLY

├─ 40% Community Rewards (400M)
│  ├─ Early reporters (100M)
│  ├─ Oracle nodes (100M)
│  ├─ Protocol contributors (100M)
│  └─ Future airdrops (100M)
│
├─ 30% Protocol Treasury (300M)
│  ├─ Development (100M)
│  ├─ Marketing (50M)
│  ├─ Partnerships (50M)
│  └─ Reserve (100M)
│
├─ 20% Team & Advisors (200M)
│  ├─ 4-year vesting
│  └─ 1-year cliff
│
└─ 10% Public Sale (100M)
   └─ Fair launch / IDO
```

### Use Cases

1. **Governance**
   - Vote on staking parameters
   - Vote on new chain additions
   - Vote on oracle upgrades

2. **Fee Discounts**
   - Hold 10K HONESTLY → 10% discount on staking requirements
   - Hold 50K HONESTLY → 25% discount
   - Hold 200K HONESTLY → 50% discount (Gold tier at Silver price)

3. **Revenue Share**
   - Stake HONESTLY → earn % of protocol fees
   - From slash pool, dispute bonds, etc.

4. **Oracle Rewards**
   - Oracle nodes earn HONESTLY for accurate validations
   - Bonus for high uptime

---

## 🤔 What Do You Want?

**Option 1: Keep LINK-Only (Current)**
- ✅ Simple, proven model
- ✅ No token launch complexity
- ✅ Focus on tech first

**Option 2: Add HONESTLY Governance Token**
- ✅ Protocol value capture
- ✅ Community ownership
- ✅ Future revenue sharing

**Option 3: Full Dual Token Model**
- ✅ Maximum flexibility
- ✅ More complex
- ✅ Best long-term value

---

## 📝 If We Add Token, Here's What We'd Build

### New Contract: `HonestlyToken.sol`
```solidity
contract HonestlyToken is ERC20, ERC20Votes {
    // Governance token with voting
    // Revenue sharing
    // Fee discounts
}
```

### Updated: `AnomalyStaking.sol`
```solidity
// Add HONESTLY staking for tier bonuses
mapping(address => uint256) public honestlyStaked;
uint256 public constant HONESTLY_DISCOUNT = 10; // 10% per 10K tokens
```

### New: `Governance.sol`
```solidity
// DAO for protocol parameters
// Voting on changes
// Treasury management
```

---

**What's your call?** Keep it simple with LINK-only, or add HONESTLY token for protocol value capture?

