# VERITAS Solana Development Setup Script
# Run this to set up the development environment

Write-Host "🚀 Setting up VERITAS Solana development environment..." -ForegroundColor Cyan

# Check if Solana CLI is installed
if (-not (Get-Command solana -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Solana CLI..." -ForegroundColor Yellow
    # Install Solana CLI (Windows)
    Invoke-WebRequest https://release.solana.com/stable/install -OutFile solana-install.exe
    .\solana-install.exe
    Remove-Item solana-install.exe
}

# Check if Rust is installed
if (-not (Get-Command rustc -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Rust..." -ForegroundColor Yellow
    Invoke-WebRequest https://win.rustup.rs/x86_64 -OutFile rustup-init.exe
    .\rustup-init.exe -y
    Remove-Item rustup-init.exe
}

# Check if Anchor is installed
if (-not (Get-Command anchor -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Anchor..." -ForegroundColor Yellow
    cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
    avm install latest
    avm use latest
}

# Generate keypair if it doesn't exist
if (-not (Test-Path "$env:USERPROFILE\.config\solana\id.json")) {
    Write-Host "Generating Solana keypair..." -ForegroundColor Yellow
    solana-keygen new
}

# Set to devnet
Write-Host "Setting to devnet..." -ForegroundColor Yellow
solana config set --url devnet

# Airdrop SOL
Write-Host "Requesting SOL airdrop..." -ForegroundColor Yellow
solana airdrop 2

# Build project
Write-Host "Building Anchor project..." -ForegroundColor Yellow
anchor build

Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Run: anchor test" -ForegroundColor White
Write-Host "  2. Run: anchor deploy" -ForegroundColor White
Write-Host "  3. Create token: .\scripts\create-token.sh devnet" -ForegroundColor White

