#!/bin/bash

# Create VERITAS Token-2022 token on Solana
# Usage: ./create-token.sh [devnet|mainnet]

NETWORK=${1:-devnet}

echo "Creating VERITAS token on $NETWORK..."

# Set network
solana config set --url $NETWORK

# Create token
TOKEN=$(spl-token create-token --decimals 9 --token-2022 2>&1 | grep -oP 'Creating token \K[^\s]+')

if [ -z "$TOKEN" ]; then
    echo "Error: Failed to create token"
    exit 1
fi

echo "Token created: $TOKEN"

# Create metadata account (requires Metaplex)
echo "Creating metadata account..."
echo "Token address: $TOKEN"
echo "Name: VERITAS"
echo "Symbol: VTS"
echo "URI: https://veritas.quantum/metadata.json"

# Save token address
echo "$TOKEN" > .token-address

echo "✅ VERITAS token created successfully!"
echo "Token address saved to .token-address"

