# Phase 4 Contracts Compilation Check
# Run this after npm install completes

Write-Host "=== Phase 4 Contracts Compilation Check ===" -ForegroundColor Cyan
Write-Host ""

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "❌ node_modules not found. Run 'npm install' first." -ForegroundColor Red
    exit 1
}

Write-Host "✓ Dependencies installed" -ForegroundColor Green
Write-Host ""

# Try to compile
Write-Host "Compiling contracts..." -ForegroundColor Yellow
npx hardhat compile

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Compilation successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:"
    Write-Host "1. Review compilation output above"
    Write-Host "2. Check for any warnings"
    Write-Host "3. Run tests: npm test"
    Write-Host "4. Deploy to testnet: npm run deploy:phase4 --network sepolia"
} else {
    Write-Host ""
    Write-Host "❌ Compilation failed. Review errors above." -ForegroundColor Red
    exit 1
}

