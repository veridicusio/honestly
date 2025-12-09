#!/bin/bash
# Build zkML Anomaly Threshold Circuit for Phase 4
# This compiles the circuit and generates the Solidity verifier

set -e

CIRCUIT_DIR="circuits/zkml"
ARTIFACT_DIR="artifacts/zkml_anomaly"
CIRCUIT_NAME="anomaly_threshold"

echo "=== Building zkML Anomaly Threshold Circuit ==="
echo ""

# Create artifact directory
mkdir -p "$ARTIFACT_DIR"
mkdir -p artifacts/common

# Check if Powers of Tau exists
if [ ! -f "artifacts/common/pot16_final.ptau" ]; then
    echo "Downloading Powers of Tau..."
    curl -L https://storage.googleapis.com/zkevm/ptau/powersOfTau28_hez_final_16.ptau \
        -o artifacts/common/pot16_final.ptau
fi

# Step 1: Compile circuit
echo "Step 1: Compiling circuit..."
circom "$CIRCUIT_DIR/$CIRCUIT_NAME.circom" \
    --r1cs \
    --wasm \
    --sym \
    -o "$ARTIFACT_DIR" \
    -l node_modules

if [ $? -ne 0 ]; then
    echo "❌ Circuit compilation failed"
    exit 1
fi

echo "✓ Circuit compiled: $ARTIFACT_DIR/$CIRCUIT_NAME.r1cs"
echo ""

# Step 2: Setup (generate initial zkey)
echo "Step 2: Setting up (generating zkey)..."
snarkjs groth16 setup \
    "$ARTIFACT_DIR/$CIRCUIT_NAME.r1cs" \
    artifacts/common/pot16_final.ptau \
    "$ARTIFACT_DIR/${CIRCUIT_NAME}_0000.zkey"

if [ $? -ne 0 ]; then
    echo "❌ Setup failed"
    exit 1
fi

echo "✓ Initial zkey created"
echo ""

# Step 3: Contribute (create final zkey)
echo "Step 3: Contributing to zkey..."
snarkjs zkey contribute \
    "$ARTIFACT_DIR/${CIRCUIT_NAME}_0000.zkey" \
    "$ARTIFACT_DIR/${CIRCUIT_NAME}_final.zkey" \
    -n "phase4-anomaly"

if [ $? -ne 0 ]; then
    echo "❌ Contribution failed"
    exit 1
fi

echo "✓ Final zkey created"
echo ""

# Step 4: Export verification key
echo "Step 4: Exporting verification key..."
snarkjs zkey export verificationkey \
    "$ARTIFACT_DIR/${CIRCUIT_NAME}_final.zkey" \
    "$ARTIFACT_DIR/verification_key.json"

if [ $? -ne 0 ]; then
    echo "❌ Verification key export failed"
    exit 1
fi

echo "✓ Verification key exported"
echo ""

# Step 5: Export Solidity verifier
echo "Step 5: Exporting Solidity verifier..."
snarkjs zkey export solidityverifier \
    "$ARTIFACT_DIR/${CIRCUIT_NAME}_final.zkey" \
    "$ARTIFACT_DIR/Verifier.sol"

if [ $? -ne 0 ]; then
    echo "❌ Solidity verifier export failed"
    exit 1
fi

echo "✓ Solidity verifier exported: $ARTIFACT_DIR/Verifier.sol"
echo ""

echo "=== Build Complete ==="
echo ""
echo "Next steps:"
echo "1. Copy $ARTIFACT_DIR/Verifier.sol to backend-python/blockchain/contracts/ZkMLVerifier.sol"
echo "2. Update ZkMLVerifier.sol to use the exported verifier"
echo "3. Deploy the verifier contract"
echo "4. Update AnomalyStaking with verifier address"

