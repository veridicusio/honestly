#!/bin/bash

# Deploy VERIDICUS to Mainnet
# Usage: ./deploy-mainnet.sh
# 
# Prerequisites:
# - Mainnet keypair configured
# - Sufficient SOL for deployment
# - Multisig address ready
# - Airdrop vault funded

set -e

NETWORK="mainnet"
PROGRAM_ID="VERIDICUS1111111111111111111111111111111111111"

echo "🚀 VERIDICUS Mainnet Deployment"
echo "================================"
echo ""

# Confirm mainnet deployment
read -p "⚠️  Are you deploying to MAINNET? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

# Set network
echo "📡 Setting network to mainnet..."
solana config set --url mainnet

# Check balance
BALANCE=$(solana balance | grep -oP '\K[0-9.]+')
echo "💰 Current balance: $BALANCE SOL"

if (( $(echo "$BALANCE < 5" | bc -l) )); then
    echo "❌ Insufficient SOL balance. Need at least 5 SOL for deployment."
    exit 1
fi

# Build program
echo ""
echo "🔨 Building program..."
anchor build

# Verify build
if [ ! -f "target/deploy/veridicus-keypair.json" ]; then
    echo "❌ Build failed - keypair not found"
    exit 1
fi

# Get program keypair
PROGRAM_KEYPAIR="target/deploy/veridicus-keypair.json"
DEPLOYED_ID=$(solana address -k $PROGRAM_KEYPAIR)

echo ""
echo "📋 Deployment Details:"
echo "  Program ID: $DEPLOYED_ID"
echo "  Network: $NETWORK"
echo ""

read -p "✅ Proceed with deployment? (yes/no): " proceed
if [ "$proceed" != "yes" ]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

# Deploy program
echo ""
echo "🚀 Deploying program..."
anchor deploy --provider.cluster mainnet

# Verify deployment
echo ""
echo "🔍 Verifying deployment..."
DEPLOYED_INFO=$(solana program show $DEPLOYED_ID)
if [ -z "$DEPLOYED_INFO" ]; then
    echo "❌ Deployment verification failed"
    exit 1
fi

echo "✅ Program deployed successfully!"

# Initialize program
echo ""
echo "🔧 Initializing program..."
# Note: This requires the initialize instruction to be called
# Implementation depends on your setup

# Save deployment info
echo "Network: $NETWORK" > .deployment-mainnet
echo "Program ID: $DEPLOYED_ID" >> .deployment-mainnet
echo "Deployed at: $(date)" >> .deployment-mainnet
echo "Deployed by: $(solana address)" >> .deployment-mainnet

echo ""
echo "✅ Mainnet deployment complete!"
echo ""
echo "📝 Next Steps:"
echo "  1. Transfer authority to multisig:"
echo "     anchor run transfer-authority --new-authority <MULTISIG_ADDRESS>"
echo ""
echo "  2. Create token:"
echo "     ./scripts/create-token.sh mainnet"
echo ""
echo "  3. Lock liquidity:"
echo "     ./scripts/lock-liquidity.sh"
echo ""
echo "  4. Fund airdrop vault:"
echo "     ./scripts/fund-airdrop-vault.sh"
echo ""
echo "📄 Deployment info saved to: .deployment-mainnet"

