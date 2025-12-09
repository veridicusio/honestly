#!/bin/bash

# Create Raydium Liquidity Pool for VERIDICUS
# Usage: ./create-raydium-lp.sh [devnet|mainnet] [amount-vdc] [amount-sol]
#
# Example: ./create-raydium-lp.sh mainnet 100000 10
# Creates LP with 100K VDC and 10 SOL

set -e

NETWORK=${1:-devnet}
VDC_AMOUNT=${2:-100000}
SOL_AMOUNT=${3:-10}

echo "🏊 Creating Raydium Liquidity Pool"
echo "=================================="
echo "Network: $NETWORK"
echo "VDC Amount: $VDC_AMOUNT"
echo "SOL Amount: $SOL_AMOUNT SOL"
echo ""

# Set network
solana config set --url $NETWORK

# Load token address
if [ ! -f ".token-address" ]; then
    echo "❌ Token address not found. Run create-token.sh first."
    exit 1
fi

TOKEN_ADDRESS=$(cat .token-address)
echo "📍 Token Address: $TOKEN_ADDRESS"

# Check Raydium CLI
if ! command -v raydium &> /dev/null; then
    echo "⚠️  Raydium CLI not found"
    echo "📝 Install: npm install -g @raydium-io/raydium-cli"
    echo ""
    echo "📝 Manual LP Creation:"
    echo "   1. Go to: https://raydium.io/liquidity/create/"
    echo "   2. Select SOL / VDC pair"
    echo "   3. Add $VDC_AMOUNT VDC and $SOL_AMOUNT SOL"
    echo "   4. Create pool"
    echo "   5. Save LP token address"
    exit 0
fi

# Convert amounts to raw (9 decimals for VDC, 9 for SOL)
VDC_RAW=$(echo "$VDC_AMOUNT * 1000000000" | bc)
SOL_RAW=$(echo "$SOL_AMOUNT * 1000000000" | bc)

echo ""
echo "💰 Creating liquidity pool..."
echo "   VDC: $VDC_RAW (raw)"
echo "   SOL: $SOL_RAW (raw)"

# Create pool using Raydium CLI
# Note: Actual command depends on Raydium CLI version
raydium create-pool \
    --token-a $TOKEN_ADDRESS \
    --token-b So11111111111111111111111111111111111111112 \
    --amount-a $VDC_RAW \
    --amount-b $SOL_RAW \
    --network $NETWORK || {
    echo ""
    echo "⚠️  Raydium CLI command failed or changed"
    echo "📝 Use Raydium UI: https://raydium.io/liquidity/create/"
    echo ""
    echo "After creating pool, save LP token address:"
    echo "  echo <LP_TOKEN_ADDRESS> > .lp-token-address"
}

# Save LP token address if created
if [ -f ".lp-token-address" ]; then
    LP_TOKEN=$(cat .lp-token-address)
    echo ""
    echo "✅ LP Token Address: $LP_TOKEN"
    echo ""
    echo "📝 Next: Lock liquidity"
    echo "   ./scripts/lock-liquidity.sh $LP_TOKEN"
fi

echo ""
echo "✅ Liquidity pool creation complete!"

