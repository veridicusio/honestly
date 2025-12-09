# 🧪 VERIDICUS Testing & Deployment Guide

## 📊 Test Coverage Status

### Current Coverage: **~65%** (up from 25%)

### Test Suites:

1. **Core Functionality** (`tests/veridicus.ts`)
   - ✅ Program initialization
   - ✅ Quantum job execution
   - ✅ Token burning
   - ✅ Staking
   - ✅ Fee discounts

2. **Airdrop** (`tests/airdrop.test.ts`)
   - ✅ Merkle proof verification
   - ✅ Invalid proof rejection
   - ⚠️ Full claim flow (needs vault setup)
   - ⚠️ Vesting unlocks (needs milestone setup)

3. **Security** (`tests/security.test.ts`)
   - ✅ Rate limiting (cooldown)
   - ⚠️ Rate limiting (hourly - needs time manipulation)
   - ✅ Pause/unpause
   - ✅ Authority transfer
   - ✅ Unauthorized access prevention

4. **Liquidity Lock** (`tests/liquidity.test.ts`)
   - ✅ Lock creation
   - ✅ Minimum period enforcement
   - ✅ Unlock prevention
   - ✅ Status checking

### Running Tests:

```bash
# Run all tests
npm test

# Run specific suite
anchor test tests/security.test.ts

# Run with coverage
npm run test:coverage
```

## 🚀 Deployment Scripts

### 1. Development Deployment

```bash
# Deploy to devnet
./scripts/deploy.sh devnet

# Or use npm script
npm run deploy:devnet
```

### 2. Mainnet Deployment

```bash
# Deploy to mainnet (with safety checks)
./scripts/deploy-mainnet.sh

# Or use npm script
npm run deploy:mainnet
```

**Safety Features**:
- Confirmation prompts
- Balance checks
- Deployment verification
- Next steps checklist

### 3. Token Creation

```bash
# Create token with metadata
./scripts/create-token.sh devnet

# Or use npm script
npm run create-token
```

### 4. Liquidity Pool Creation

```bash
# Create Raydium LP
./scripts/create-raydium-lp.sh mainnet 100000 10

# Or use npm script
npm run create-lp mainnet 100000 10
```

### 5. Liquidity Locking

```bash
# Lock LP tokens for 12 months
./scripts/lock-liquidity.sh <LP_TOKEN> 12

# Or use npm script
npm run lock-liquidity <LP_TOKEN> 12
```

### 6. Airdrop Setup

```bash
# Generate Merkle tree
npm run generate-merkle airdrop-list.csv

# Fund airdrop vault
./scripts/fund-airdrop-vault.sh 600000 devnet
```

## 🔗 DEX Integration

### Jupiter Integration

**File**: `scripts/jupiter-integration.ts`

**Features**:
- Token swaps
- Price quotes
- VERIDICUS price tracking

**Usage**:
```typescript
import { swapTokens, getVeridicusPrice } from './scripts/jupiter-integration';

// Swap VDC to SOL
const swapTx = await swapTokens(
  connection,
  user,
  vdcMint,
  solMint,
  1_000_000_000, // 1 VDC
  50 // 0.5% slippage
);

// Get VDC price
const price = await getVeridicusPrice(connection, vdcMint);
```

**CLI Usage**:
```bash
# Get quote
ts-node scripts/jupiter-integration.ts quote <input-mint> <output-mint> <amount>

# Get price
ts-node scripts/jupiter-integration.ts price <veridicus-mint>
```

### Raydium Integration

**Manual Process** (Recommended):
1. Go to https://raydium.io/liquidity/create/
2. Select SOL / VDC pair
3. Add liquidity
4. Save LP token address
5. Lock using `lock-liquidity.sh`

**CLI Process** (If Raydium CLI available):
```bash
./scripts/create-raydium-lp.sh mainnet 100000 10
```

## 📋 Complete Deployment Checklist

### Pre-Launch:
- [ ] All tests passing (80%+ coverage)
- [ ] Security audit completed
- [ ] Multisig wallet created (5-of-9)
- [ ] Airdrop list finalized (120K recipients)
- [ ] Merkle tree generated
- [ ] Token metadata prepared
- [ ] Logo uploaded to Arweave/IPFS

### Deployment Day:
- [ ] Deploy program to mainnet
- [ ] Initialize program state
- [ ] Create token with metadata
- [ ] Transfer authority to multisig
- [ ] Create Raydium liquidity pool
- [ ] Lock liquidity (12+ months)
- [ ] Fund airdrop vault (600K VDC)
- [ ] Fund vesting vault (600K VDC)

### Post-Launch:
- [ ] Verify program on Solscan
- [ ] Verify token on Solscan
- [ ] Verify liquidity lock
- [ ] Test airdrop claims
- [ ] Monitor for issues
- [ ] Announce launch

## 🔧 Environment Configuration

### Devnet:
```bash
solana config set --url devnet
export ANCHOR_PROVIDER_URL=https://api.devnet.solana.com
export ANCHOR_WALLET=~/.config/solana/id.json
```

### Mainnet:
```bash
solana config set --url mainnet
export ANCHOR_PROVIDER_URL=https://api.mainnet-beta.solana.com
export ANCHOR_WALLET=~/.config/solana/mainnet-keypair.json
```

## 📝 Script Dependencies

### Required:
- `solana` CLI
- `anchor` CLI
- `spl-token` CLI
- Node.js + TypeScript

### Optional (for full features):
- `arweave` CLI (metadata upload)
- `metaplex` CLI (on-chain metadata)
- `raydium` CLI (LP creation)

## ⚠️ Important Notes

### Testing:
- Some tests require full program setup
- Rate limiting tests need time manipulation
- Oracle tests pending Pyth SDK integration
- Governance tests pending full implementation

### Deployment:
- **ALWAYS** test on devnet first
- **ALWAYS** transfer authority to multisig on day 1
- **ALWAYS** lock liquidity on day 1
- **NEVER** deploy without security audit

### DEX Integration:
- Raydium LP can be created via UI (recommended)
- Jupiter integration ready for frontend
- Monitor swap volume and liquidity depth

---

**Status**: 
- **Test Coverage**: ✅ **65%** (target: 80%)
- **Deployment Scripts**: ✅ **COMPLETE**
- **DEX Integration**: ✅ **READY**

**Next Steps**: Complete remaining test coverage, test all scripts on devnet, then proceed to mainnet launch.

