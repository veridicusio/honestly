# Complete Compilation Guide

## Contracts to Compile

### Phase 4 Contracts (5)
1. ✅ `LocalDetector.sol` - Chain-native anomaly detector
2. ✅ `AnomalyRegistry.sol` - Immutable anomaly records
3. ✅ `AnomalyStaking.sol` - Economic incentives with Karak restaking
4. ✅ `AnomalyOracle.sol` - Chainlink CCIP + Wormhole VAA validator
5. ✅ `ZkMLVerifier.sol` - Placeholder Groth16 verifier

### VERITAS Token (1)
6. ✅ `VeritasToken.sol` - ERC20 with governance + quantum utility

**Total: 6 contracts**

## Dependencies

```json
{
  "@openzeppelin/contracts": "^5.0.0",
  "@chainlink/contracts-ccip": "^1.0.0"
}
```

## Compilation Command

```bash
cd backend-python/blockchain/contracts
npm install
npx hardhat compile
```

## Expected Output

```
Compiling 6 files with 0.8.19
Compiler run successful
```

## Known Issues & Fixes

### VeritasToken.sol
- ✅ Uses `Nonces` from OpenZeppelin (correct)
- ✅ Inherits from `ERC20, ERC20Votes, ERC20Permit, Nonces, Ownable`
- ✅ Overrides `nonces()` correctly

### AnomalyStaking.sol
- ✅ Uses `IZkMLVerifier` interface (defined in contract)
- ✅ All imports correct

### AnomalyOracle.sol
- ✅ Uses `IWormhole` interface (defined in contract)
- ✅ CCIP imports correct

## Post-Compilation

1. Check for warnings
2. Verify artifacts generated
3. Test deployment scripts
4. Update deployment addresses

## Status

**Ready to compile!** 🚀

