# Build zkML Anomaly Threshold Circuit for Phase 4
# This compiles the circuit and generates the Solidity verifier

$ErrorActionPreference = "Stop"

$CIRCUIT_DIR = "circuits/zkml"
$ARTIFACT_DIR = "artifacts/zkml_anomaly"
$CIRCUIT_NAME = "anomaly_threshold"

Write-Host "=== Building zkML Anomaly Threshold Circuit ===" -ForegroundColor Cyan
Write-Host ""

# Create artifact directory
New-Item -ItemType Directory -Force -Path $ARTIFACT_DIR | Out-Null
New-Item -ItemType Directory -Force -Path "artifacts/common" | Out-Null

# Check if Powers of Tau exists
if (-not (Test-Path "artifacts/common/pot16_final.ptau")) {
    Write-Host "Downloading Powers of Tau..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri "https://storage.googleapis.com/zkevm/ptau/powersOfTau28_hez_final_16.ptau" `
        -OutFile "artifacts/common/pot16_final.ptau"
}

# Step 1: Compile circuit
Write-Host "Step 1: Compiling circuit..." -ForegroundColor Yellow
circom "$CIRCUIT_DIR/$CIRCUIT_NAME.circom" `
    --r1cs `
    --wasm `
    --sym `
    -o $ARTIFACT_DIR `
    -l node_modules

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Circuit compilation failed" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Circuit compiled: $ARTIFACT_DIR/$CIRCUIT_NAME.r1cs" -ForegroundColor Green
Write-Host ""

# Step 2: Setup (generate initial zkey)
Write-Host "Step 2: Setting up (generating zkey)..." -ForegroundColor Yellow
snarkjs groth16 setup `
    "$ARTIFACT_DIR/$CIRCUIT_NAME.r1cs" `
    "artifacts/common/pot16_final.ptau" `
    "$ARTIFACT_DIR/${CIRCUIT_NAME}_0000.zkey"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Setup failed" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Initial zkey created" -ForegroundColor Green
Write-Host ""

# Step 3: Contribute (create final zkey)
Write-Host "Step 3: Contributing to zkey..." -ForegroundColor Yellow
snarkjs zkey contribute `
    "$ARTIFACT_DIR/${CIRCUIT_NAME}_0000.zkey" `
    "$ARTIFACT_DIR/${CIRCUIT_NAME}_final.zkey" `
    -n "phase4-anomaly"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Contribution failed" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Final zkey created" -ForegroundColor Green
Write-Host ""

# Step 4: Export verification key
Write-Host "Step 4: Exporting verification key..." -ForegroundColor Yellow
snarkjs zkey export verificationkey `
    "$ARTIFACT_DIR/${CIRCUIT_NAME}_final.zkey" `
    "$ARTIFACT_DIR/verification_key.json"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Verification key export failed" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Verification key exported" -ForegroundColor Green
Write-Host ""

# Step 5: Export Solidity verifier
Write-Host "Step 5: Exporting Solidity verifier..." -ForegroundColor Yellow
snarkjs zkey export solidityverifier `
    "$ARTIFACT_DIR/${CIRCUIT_NAME}_final.zkey" `
    "$ARTIFACT_DIR/Verifier.sol"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Solidity verifier export failed" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Solidity verifier exported: $ARTIFACT_DIR/Verifier.sol" -ForegroundColor Green
Write-Host ""

Write-Host "=== Build Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Copy $ARTIFACT_DIR/Verifier.sol to backend-python/blockchain/contracts/ZkMLVerifier.sol"
Write-Host "2. Update ZkMLVerifier.sol to use the exported verifier"
Write-Host "3. Deploy the verifier contract"
Write-Host "4. Update AnomalyStaking with verifier address"

