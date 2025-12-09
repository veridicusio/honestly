#!/bin/bash
# Quick compilation check script
# Run this after npm install completes

echo "=== Phase 4 Contracts Compilation Check ==="
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "❌ node_modules not found. Run 'npm install' first."
    exit 1
fi

echo "✓ Dependencies installed"
echo ""

# Try to compile
echo "Compiling contracts..."
npx hardhat compile

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Compilation successful!"
    echo ""
    echo "Next steps:"
    echo "1. Review compilation output above"
    echo "2. Check for any warnings"
    echo "3. Run tests: npm test"
    echo "4. Deploy to testnet: npm run deploy:phase4 --network sepolia"
else
    echo ""
    echo "❌ Compilation failed. Review errors above."
    exit 1
fi

