#!/bin/bash

# Create VERIDICUS Token-2022 token on Solana with metadata
# Usage: ./create-token.sh [devnet|mainnet] [logo-uri]

NETWORK=${1:-devnet}
LOGO_URI=${2:-"https://veridicus.quantum/logo.png"}

echo "🚀 Creating VERIDICUS token on $NETWORK..."

# Set network
solana config set --url $NETWORK

# Create token
echo "📝 Creating token..."
TOKEN=$(spl-token create-token --decimals 9 --token-2022 2>&1 | grep -oP 'Creating token \K[^\s]+')

if [ -z "$TOKEN" ]; then
    echo "❌ Error: Failed to create token"
    exit 1
fi

echo "✅ Token created: $TOKEN"

# Create metadata JSON
echo "📝 Creating metadata..."
METADATA_JSON=$(cat <<EOF
{
  "name": "VERIDICUS",
  "symbol": "VDC",
  "description": "VERIDICUS - Quantum Access Token. Democratizing quantum computing access through tokenized payments.",
  "image": "$LOGO_URI",
  "external_url": "https://veridicus.quantum",
  "attributes": [
    {
      "trait_type": "Token Standard",
      "value": "SPL Token-2022"
    },
    {
      "trait_type": "Total Supply",
      "value": "1,000,000 VDC"
    },
    {
      "trait_type": "Utility",
      "value": "Quantum Computing Access"
    }
  ]
}
EOF
)

echo "$METADATA_JSON" > token-metadata.json
echo "✅ Metadata JSON created: token-metadata.json"

# Upload metadata to Arweave (if arweave CLI is available)
if command -v arweave &> /dev/null; then
    echo "📤 Uploading metadata to Arweave..."
    ARWEAVE_TX=$(arweave upload token-metadata.json 2>&1 | tail -1)
    if [ ! -z "$ARWEAVE_TX" ]; then
        METADATA_URI="https://arweave.net/$ARWEAVE_TX"
        echo "✅ Metadata uploaded: $METADATA_URI"
    else
        METADATA_URI="https://veridicus.quantum/metadata.json"
        echo "⚠️  Arweave upload failed, using default URI: $METADATA_URI"
    fi
else
    METADATA_URI="https://veridicus.quantum/metadata.json"
    echo "⚠️  Arweave CLI not found, using default URI: $METADATA_URI"
    echo "📝 To upload to Arweave:"
    echo "   1. Install: npm install -g arweave"
    echo "   2. Upload: arweave upload token-metadata.json"
    echo "   3. Update metadata URI in program"
fi

# Create metadata account using Metaplex (if available)
if command -v metaplex &> /dev/null; then
    echo "📝 Creating on-chain metadata account..."
    metaplex create-metadata \
        --mint "$TOKEN" \
        --name "VERIDICUS" \
        --symbol "VDC" \
        --uri "$METADATA_URI" \
        --update-authority "$(solana address)" \
        --network "$NETWORK" || echo "⚠️  Metaplex CLI not configured, skipping on-chain metadata"
else
    echo "⚠️  Metaplex CLI not found"
    echo "📝 To create on-chain metadata:"
    echo "   1. Install: npm install -g @metaplex-foundation/metaplex-cli"
    echo "   2. Run: metaplex create-metadata --mint $TOKEN --name VERIDICUS --symbol VDC --uri $METADATA_URI"
fi

# Save token address and metadata
echo "$TOKEN" > .token-address
echo "$METADATA_URI" > .metadata-uri

echo ""
echo "✅ VERIDICUS token created successfully!"
echo "📍 Token address: $TOKEN"
echo "📄 Metadata URI: $METADATA_URI"
echo "💾 Token address saved to: .token-address"
echo "💾 Metadata URI saved to: .metadata-uri"
echo ""
echo "📝 Next steps:"
echo "   1. Upload logo.png to: $LOGO_URI"
echo "   2. Upload token-metadata.json to: $METADATA_URI"
echo "   3. Create on-chain metadata using Metaplex (if not done automatically)"
echo "   4. Verify token appears in wallets (Phantom, Solflare)"

