# VERITAS Solana Integration Guide

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Anchor
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest
```

### 2. Set Up Project

```bash
cd backend-solana
npm install
anchor build
```

### 3. Deploy to Devnet

```bash
# Set to devnet
solana config set --url devnet

# Airdrop SOL
solana airdrop 2

# Deploy program
./scripts/deploy.sh devnet
```

---

## 📚 Program Structure

### Main Program (`lib.rs`)

**Functions**:
- `initialize()` - Initialize VERITAS program
- `execute_quantum_job()` - Execute job and burn tokens
- `stake_veritas()` - Stake tokens for discounts
- `unstake_veritas()` - Unstake tokens
- `get_fee_discount()` - Get discount based on stake

### Airdrop Program (`airdrop.rs`)

**Functions**:
- `claim_airdrop()` - Claim airdrop via Merkle proof
- `unlock_vested()` - Unlock vested tokens at milestones

### Governance Program (`governance.rs`)

**Functions**:
- `create_proposal()` - Create governance proposal
- `vote()` - Vote on proposal (quadratic)
- `execute_proposal()` - Execute passed proposal

---

## 🔧 Integration Examples

### Execute Quantum Job

```typescript
import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

async function executeJob(
  program: Program<Veritas>,
  user: Keypair,
  qubits: number,
  jobType: number
) {
  const [state] = PublicKey.findProgramAddressSync(
    [Buffer.from("veritas_state")],
    program.programId
  );

  await program.methods
    .executeQuantumJob(new BN(qubits), new BN(jobType))
    .accounts({
      state: state,
      user: user.publicKey,
      mint: VERITAS_MINT,
      userTokenAccount: userTokenAccount,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .signers([user])
    .rpc();
}
```

### Claim Airdrop

```typescript
async function claimAirdrop(
  program: Program<Veritas>,
  user: Keypair,
  proof: string[],
  amount: number
) {
  const [airdrop] = PublicKey.findProgramAddressSync(
    [Buffer.from("airdrop")],
    program.programId
  );

  await program.methods
    .claimAirdrop(proof, new BN(amount), leaf)
    .accounts({
      airdrop: airdrop,
      user: user.publicKey,
      userTokenAccount: userTokenAccount,
      // ... other accounts
    })
    .signers([user])
    .rpc();
}
```

### Stake for Discounts

```typescript
async function stakeForDiscount(
  program: Program<Veritas>,
  user: Keypair,
  amount: number
) {
  const [staking] = PublicKey.findProgramAddressSync(
    [Buffer.from("staking"), user.publicKey.toBuffer()],
    program.programId
  );

  await program.methods
    .stakeVeritas(new BN(amount))
    .accounts({
      staking: staking,
      user: user.publicKey,
      // ... other accounts
    })
    .signers([user])
    .rpc();
}
```

---

## 🧪 Testing

```bash
# Run tests
anchor test

# Test specific function
anchor test -- --grep "execute_quantum_job"
```

---

## 📊 Program IDs

**Devnet**:
- Program: `VERITAS1111111111111111111111111111111111111`
- Token: (Create with `create-token.sh`)

**Mainnet**:
- Program: (Deploy to get ID)
- Token: (Create with `create-token.sh mainnet`)

---

## 🔐 Security

- ✅ All accounts use PDAs (Program Derived Addresses)
- ✅ Signer checks on all sensitive operations
- ✅ Overflow protection with checked math
- ✅ Access control via authority checks

---

## 📝 Next Steps

1. **Deploy to devnet** - Test all functions
2. **Security audit** - External review
3. **Mainnet deployment** - Production launch
4. **Integration** - Connect to quantum gateway

---

**Status**: ✅ Ready for integration!

