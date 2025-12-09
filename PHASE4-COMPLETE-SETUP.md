# Phase 4 Complete Setup Guide

## 🎯 Overview

This guide walks through the complete setup for Phase 4: Cross-Chain Anomaly Federation, from contract compilation to zkML circuit building.

## 📋 Prerequisites

- Node.js 22.x LTS (or 25.x with warnings)
- npm installed
- circom compiler installed (`npm install -g circom`)
- snarkjs installed (`npm install -g snarkjs`)

## 🔧 Step 1: Install Contract Dependencies

```powershell
cd backend-python/blockchain/contracts
npm install
```

**Expected time**: 2-5 minutes

## 🔨 Step 2: Compile Solidity Contracts

```powershell
# After dependencies install
npx hardhat compile
```

**If errors occur**, check:
- OpenZeppelin version compatibility
- Chainlink CCIP import paths
- Solidity version (should be 0.8.19)

**Fix common issues**:
- If CCIP imports fail, check `@chainlink/contracts-ccip` version
- If OpenZeppelin fails, ensure version ^5.0.0

## ⚡ Step 3: Build zkML Circuit

### Option A: Using PowerShell Script (Windows)

```powershell
cd backend-python/zkp
npm install  # If not already done
.\scripts\build-zkml-anomaly.ps1
```

### Option B: Using Bash Script (Linux/Mac)

```bash
cd backend-python/zkp
npm install  # If not already done
bash scripts/build-zkml-anomaly.sh
```

### Option C: Manual Steps

```bash
cd backend-python/zkp

# 1. Compile circuit
circom circuits/zkml/anomaly_threshold.circom \
    --r1cs --wasm --sym \
    -o artifacts/zkml_anomaly \
    -l node_modules

# 2. Setup (download ptau if needed)
mkdir -p artifacts/common
# Download: https://storage.googleapis.com/zkevm/ptau/powersOfTau28_hez_final_16.ptau
snarkjs groth16 setup \
    artifacts/zkml_anomaly/anomaly_threshold.r1cs \
    artifacts/common/pot16_final.ptau \
    artifacts/zkml_anomaly/anomaly_threshold_0000.zkey

# 3. Contribute
snarkjs zkey contribute \
    artifacts/zkml_anomaly/anomaly_threshold_0000.zkey \
    artifacts/zkml_anomaly/anomaly_threshold_final.zkey \
    -n "phase4"

# 4. Export verification key
snarkjs zkey export verificationkey \
    artifacts/zkml_anomaly/anomaly_threshold_final.zkey \
    artifacts/zkml_anomaly/verification_key.json

# 5. Export Solidity verifier
snarkjs zkey export solidityverifier \
    artifacts/zkml_anomaly/anomaly_threshold_final.zkey \
    artifacts/zkml_anomaly/Verifier.sol
```

**Expected time**: 5-10 minutes (depends on circuit complexity)

## 🔄 Step 4: Update ZkMLVerifier Contract

After building the circuit, copy the generated verifier:

```powershell
# Copy generated verifier to contracts
Copy-Item backend-python/zkp/artifacts/zkml_anomaly/Verifier.sol `
    backend-python/blockchain/contracts/ZkMLVerifier.sol
```

Then update `ZkMLVerifier.sol` to use the actual verifier contract instead of the placeholder.

## ✅ Step 5: Verify Everything

### Check Contract Compilation

```powershell
cd backend-python/blockchain/contracts
npx hardhat compile
```

Should see:
```
Compiled 5 Solidity files successfully
```

### Check Circuit Build

```powershell
cd backend-python/zkp
# Verify files exist
Test-Path artifacts/zkml_anomaly/Verifier.sol
Test-Path artifacts/zkml_anomaly/verification_key.json
```

## 🚀 Step 6: Deploy to Testnet

```powershell
cd backend-python/blockchain/contracts

# Set environment variables
$env:PRIVATE_KEY = "your_private_key"
$env:SEPOLIA_RPC_URL = "https://rpc.sepolia.org"

# Deploy
npx hardhat run scripts/deploy-phase4.js --network sepolia
```

## 📊 Expected Output

### Contract Deployment
```
=== Deploying Phase 4 Contracts ===

1. Deploying LocalDetector...
   LocalDetector deployed to: 0x...

2. Deploying AnomalyRegistry...
   AnomalyRegistry deployed to: 0x...

3. Deploying zkMLVerifier...
   zkMLVerifier deployed to: 0x...

4. Deploying AnomalyOracle...
   AnomalyOracle deployed to: 0x...

5. Deploying AnomalyStaking...
   AnomalyStaking deployed to: 0x...

=== Deployment Summary ===
...
```

### Circuit Build
```
=== Building zkML Anomaly Threshold Circuit ===

Step 1: Compiling circuit...
✓ Circuit compiled

Step 2: Setting up...
✓ Initial zkey created

Step 3: Contributing...
✓ Final zkey created

Step 4: Exporting verification key...
✓ Verification key exported

Step 5: Exporting Solidity verifier...
✓ Solidity verifier exported

=== Build Complete ===
```

## 🐛 Troubleshooting

### Contract Compilation Errors

**Error**: `Cannot find module '@chainlink/contracts-ccip'`
- **Fix**: `npm install @chainlink/contracts-ccip@latest`

**Error**: `SPDX license identifier not provided`
- **Fix**: Ensure all contracts have `// SPDX-License-Identifier: MIT` at top

**Error**: `Function state mutability can be restricted to view`
- **Fix**: Add `view` or `pure` keyword where appropriate

### Circuit Build Errors

**Error**: `circom: command not found`
- **Fix**: `npm install -g circom`

**Error**: `snarkjs: command not found`
- **Fix**: `npm install -g snarkjs`

**Error**: `Cannot find module 'circomlib'`
- **Fix**: `cd backend-python/zkp && npm install`

**Error**: Out of memory during compilation
- **Fix**: Increase Node memory: `$env:NODE_OPTIONS="--max-old-space-size=8192"`

## 📝 Next Steps After Setup

1. **Write Tests**: Create test suite for contracts
2. **Integration Testing**: Test end-to-end flow
3. **Security Audit**: Review contracts before mainnet
4. **Frontend Integration**: Build UI for staking/disputes
5. **Monitoring**: Set up alerts and dashboards

## 🎉 Success Criteria

- ✅ All 5 contracts compile without errors
- ✅ zkML circuit builds successfully
- ✅ Solidity verifier generated
- ✅ Contracts deploy to testnet
- ✅ Basic functionality tested

---

**Status**: Ready for testnet deployment once setup complete!

