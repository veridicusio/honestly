# Naming Convention

## Protocol vs Token

### Protocol Name: *Veridicus"
- The overall project/platform name
- Used in:
  - Documentation
  - GitHub repos
  - Website/branding
  - API endpoints
  - Contract comments

### Token Name: **VERIDICUS** (Future)
- The governance/value capture token (when we launch it)
- Used in:
  - Token contract: `VeridicusToken.sol`
  - Token symbol: `VERIDICUS`
  - Governance contracts
  - Revenue sharing

### Current Staking Token: **LINK**
- Chainlink token
- Used for:
  - Anomaly reporting stakes
  - Slashing/rewards
  - Dispute bonds

## Examples

✅ **Correct**:
- "Honestly protocol" (project name)
- "veridicus token" (future governance token)
- "LINK staking" (current staking token)
- `VeridicusToken.sol` (future contract)
- `HonestlyStaking.sol` (current - uses LINK)

❌ **Incorrect**:
- "Honestly token" (should be VERIDICUS)
- `HonestlyToken.sol` (should be VeridicusToken.sol)

## File Naming

### Current Contracts (Phase 4)
- `AnomalyStaking.sol` - Uses LINK
- `AnomalyOracle.sol` - Uses LINK
- `AnomalyRegistry.sol` - No token
- `LocalDetector.sol` - No token
- `ZkMLVerifier.sol` - No token

### Future Contracts (Phase 4.5+)
- `VeritasToken.sol` - VERIDICUS ERC20 token
- `VeritasGovernance.sol` - DAO governance
- `VeritasStaking.sol` - VERIDICUS staking for bonuses

## Branding

**Protocol**: Honestly  
**Tagline**: "Verifiable AI Agent Identity Protocol"  
**Token**: VERIDICUS (when launched)  
**Token Symbol**: `VERIDICUS` or `VTS`

---

**Status**: ✅ Naming convention established

