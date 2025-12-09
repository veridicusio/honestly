#!/bin/bash

# Lock VERIDICUS liquidity pool tokens
# Usage: ./lock-liquidity.sh [lp-token-address] [unlock-months]
#
# Example: ./lock-liquidity.sh <LP_TOKEN> 12
# Locks LP tokens for 12 months

set -e

LP_TOKEN=${1:-$(cat .lp-token-address 2>/dev/null)}
UNLOCK_MONTHS=${2:-12}

if [ -z "$LP_TOKEN" ]; then
    echo "❌ LP token address required"
    echo "Usage: ./lock-liquidity.sh <LP_TOKEN_ADDRESS> [months]"
    exit 1
fi

echo "🔒 Locking VERIDICUS Liquidity"
echo "=============================="
echo "LP Token: $LP_TOKEN"
echo "Lock Period: $UNLOCK_MONTHS months"
echo ""

# Calculate unlock timestamp
CURRENT_TIME=$(date +%s)
UNLOCK_TIME=$((CURRENT_TIME + (UNLOCK_MONTHS * 30 * 24 * 60 * 60)))
UNLOCK_DATE=$(date -d "@$UNLOCK_TIME" 2>/dev/null || date -r $UNLOCK_TIME 2>/dev/null)

echo "🔓 Unlock Date: $UNLOCK_DATE"
echo ""

read -p "✅ Lock liquidity for $UNLOCK_MONTHS months? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "❌ Lock cancelled"
    exit 1
fi

# Load program and network from deployment
if [ ! -f ".deployment-mainnet" ] && [ ! -f ".deployment" ]; then
    echo "❌ Deployment info not found. Deploy program first."
    exit 1
fi

NETWORK=$(grep "^Network:" .deployment-mainnet 2>/dev/null | cut -d' ' -f2 || grep "^Network:" .deployment 2>/dev/null | cut -d' ' -f2 || echo "devnet")
PROGRAM_ID=$(grep "^Program ID:" .deployment-mainnet 2>/dev/null | cut -d' ' -f3 || grep "^Program ID:" .deployment 2>/dev/null | cut -d' ' -f3)

if [ -z "$PROGRAM_ID" ]; then
    echo "❌ Program ID not found in deployment info"
    exit 1
fi

echo "📡 Network: $NETWORK"
echo "📍 Program ID: $PROGRAM_ID"
echo ""

# Call lock_liquidity instruction
# This requires Anchor client setup
echo "🔒 Locking liquidity..."
echo ""
echo "📝 Run this command with Anchor:"
echo ""
echo "anchor run lock-liquidity \\"
echo "  --lp-token $LP_TOKEN \\"
echo "  --unlock-time $UNLOCK_TIME \\"
echo "  --program-id $PROGRAM_ID \\"
echo "  --network $NETWORK"
echo ""
echo "Or use the Anchor client directly:"
echo ""
echo "const unlockTime = new anchor.BN($UNLOCK_TIME);"
echo "await program.methods"
echo "  .lockLiquidity(unlockTime)"
echo "  .accounts({"
echo "    lock: lockPda,"
echo "    lpTokenAccount: lpTokenAccount,"
echo "    authority: authority.publicKey,"
echo "  })"
echo "  .rpc();"

echo ""
echo "✅ Lock instruction prepared!"
echo "📄 Unlock timestamp: $UNLOCK_TIME"
echo "📅 Unlock date: $UNLOCK_DATE"

