# VERITAS Solana Implementation

## 🎯 Quick Start

### Prerequisites
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

### Setup
```bash
# Generate keypair
solana-keygen new

# Set to devnet
solana config set --url devnet

# Airdrop SOL (devnet)
solana airdrop 2
```

## 📁 Project Structure

```
backend-solana/
├── programs/
│   └── veritas/
│       ├── src/
│       │   └── lib.rs          # Main Anchor program
│       └── Cargo.toml
├── tests/
│   └── veritas.ts              # Anchor tests
├── migrations/
│   └── deploy.ts               # Deployment script
└── Anchor.toml                 # Anchor config
```

## 🚀 Development

```bash
# Build
anchor build

# Test
anchor test

# Deploy to devnet
anchor deploy
```

## 📚 Resources

- [Solana Cookbook](https://solanacookbook.com/)
- [Anchor Book](https://www.anchor-lang.com/)
- [Solana Docs](https://docs.solana.com/)

