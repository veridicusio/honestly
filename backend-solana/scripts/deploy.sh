#!/bin/bash

# Deploy VERIDICUS program to Solana
# Usage: ./deploy.sh [devnet|mainnet]

NETWORK=${1:-devnet}
PROGRAM_ID="VERIDICUS1111111111111111111111111111111111111"

echo "🚀 Deploying VERIDICUS to $NETWORK..."

# Set network
solana config set --url $NETWORK

# Build
echo "Building program..."
anchor build

# Get program keypair
PROGRAM_KEYPAIR="target/deploy/veridicus-keypair.json"

if [ ! -f "$PROGRAM_KEYPAIR" ]; then
    echo "❌ Error: Program keypair not found"
    exit 1
fi

# Deploy
echo "Deploying program..."
anchor deploy --provider.cluster $NETWORK

# Get program ID
DEPLOYED_ID=$(solana address -k $PROGRAM_KEYPAIR)
echo "✅ Program deployed: $DEPLOYED_ID"

# Save deployment info
echo "Network: $NETWORK" > .deployment
echo "Program ID: $DEPLOYED_ID" >> .deployment
echo "Deployed at: $(date)" >> .deployment
echo "Deployed by: $(solana address)" >> .deployment

echo ""
echo "✅ Deployment complete!"
echo "📍 Program ID: $DEPLOYED_ID"
echo "📄 Deployment info saved to: .deployment"

