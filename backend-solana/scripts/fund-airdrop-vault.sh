#!/bin/bash

# Fund VERIDICUS airdrop vault
# Usage: ./fund-airdrop-vault.sh [amount] [network]
#
# Example: ./fund-airdrop-vault.sh 600000 devnet
# Funds airdrop vault with 600K VDC

set -e

AMOUNT=${1:-600000}
NETWORK=${2:-devnet}

echo "💰 Funding VERIDICUS Airdrop Vault"
echo "==================================="
echo "Amount: $AMOUNT VDC"
echo "Network: $NETWORK"
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

# Get airdrop vault PDA
# This requires Anchor to compute the PDA
echo "📝 Airdrop vault PDA: [b\"airdrop_vault\"]"
echo ""
echo "💡 To fund the vault:"
echo ""
echo "1. Get vault address using Anchor:"
echo "   const [vault] = PublicKey.findProgramAddressSync("
echo "     [Buffer.from(\"airdrop_vault\")],"
echo "     program.programId"
echo "   );"
echo ""
echo "2. Transfer tokens to vault:"
AMOUNT_RAW=$(echo "$AMOUNT * 1000000000" | bc)
echo "   spl-token transfer $TOKEN_ADDRESS $AMOUNT_RAW <VAULT_ADDRESS> \\"
echo "     --owner <AUTHORITY_KEYPAIR>"
echo ""
echo "Or use Anchor client:"
echo "   await program.methods"
echo "     .fundAirdropVault(new anchor.BN($AMOUNT_RAW))"
echo "     .accounts({"
echo "       airdropVault: vault,"
echo "       authority: authority.publicKey,"
echo "     })"
echo "     .rpc();"

echo ""
echo "✅ Funding instructions prepared!"

