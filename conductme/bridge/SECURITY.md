# Security Advisory: Privacy-Preserving Identity Registration

## Issue: Server-Side Identity Derivation Vulnerability

**Severity**: High  
**Status**: Fixed  
**Date**: December 2024

### The Problem

The original implementation of `deriveFromHonestlyProof()` had a critical privacy vulnerability:

```typescript
// VULNERABLE - DO NOT USE
const identity = deriveFromHonestlyProof(honestlyProofCommitment, salt);
```

**Why this is dangerous:**

1. **Salt Exposure**: If the `salt` is sent to the server, the server can:
   - Log the mapping between `honestlyProofCommitment` ↔ Semaphore identity
   - Link all future Semaphore actions back to the original Honestly proof
   - Brute-force weak salts to discover the link

2. **Deterministic Derivation**: The identity is deterministically derived from public inputs, making it reversible if the server knows the salt.

3. **Privacy Violation**: The entire point of Semaphore is unlinkability. If the server can link identities, the privacy guarantees are broken.

### The Fix

Identity generation now happens **exclusively client-side**:

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SECURE FLOW (v2)                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   CLIENT (Browser)                    SERVER                         │
│   ────────────────                    ──────                         │
│                                                                      │
│   1. Get Honestly proof                                              │
│      (proofCommitment, nullifier)                                    │
│                                                                      │
│   2. Generate Semaphore identity                                     │
│      LOCALLY with secure random      ───────────────────────────►    │
│      entropy (NEVER sent to server)                                  │
│                                                                      │
│   3. Create binding commitment                                       │
│      H(honestly || semaphore || secret)                              │
│      (secret NEVER sent to server)                                   │
│                                                                      │
│   4. Send to server:                  5. Server receives:            │
│      • semaphoreCommitment ──────────►   • semaphoreCommitment       │
│      • bindingCommitment ────────────►   • bindingCommitment         │
│      • honestlyNullifier ────────────►   • honestlyNullifier         │
│      • honestlyProof ────────────────►   • honestlyProof             │
│                                                                      │
│      NEVER SENT:                      6. Server verifies:            │
│      ✗ salt                              • Honestly proof is valid   │
│      ✗ trapdoor                          • Nullifier not used        │
│      ✗ nullifier (semaphore)             • Adds commitment to group  │
│      ✗ clientSecret                                                  │
│                                       7. Server CANNOT:              │
│                                          • Link identities           │
│                                          • Brute-force the mapping   │
│                                          • Deanonymize users         │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Migration Guide

#### Old Code (Vulnerable)
```typescript
// ❌ INSECURE - salt sent to server
const response = await fetch('/api/identity/prove', {
  body: JSON.stringify({
    honestlyProofCommitment,
    salt: 'my-salt',  // PRIVACY LEAK!
  })
});
```

#### New Code (Secure)
```typescript
// ✅ SECURE - identity generated client-side
import { 
  getOrCreateIdentity, 
  prepareRegistration,
  register 
} from '@conductme/trust-bridge';

// Option 1: Full flow
const identity = await getOrCreateIdentity();  // Generated locally
const result = await register(
  honestlyProofCommitment,
  honestlyNullifier,
  honestlyProof
);

// Option 2: Manual control
import { 
  generateClientIdentity,
  createBindingCommitment,
} from '@conductme/trust-bridge';

const identity = generateClientIdentity();  // All secrets stay local
const { bindingCommitment } = createBindingCommitment(
  honestlyProofCommitment,
  identity.commitment
);

// Send ONLY public data to server
await fetch('/api/identity/register', {
  body: JSON.stringify({
    semaphoreCommitment: identity.commitment,
    bindingCommitment,
    honestlyNullifier,
    honestlyProof,
    // NO salt, NO trapdoor, NO nullifier
  })
});
```

### API Changes

| Endpoint | Status | Notes |
|----------|--------|-------|
| `POST /api/identity/prove` | Deprecated | Rejects requests with `salt` parameter |
| `POST /api/identity/register` | **New** | Privacy-preserving registration |
| `GET /api/identity/register` | **New** | Check registration status |

### Server Enforcement

The server now actively rejects attempts to send sensitive data:

```typescript
// Server rejects salt in request body
if ('salt' in body) {
  return { error: 'Invalid request: salt should not be sent to server' };
}
```

### What the Server Stores

The server only stores:
- `semaphoreCommitment`: Public identity commitment
- `bindingCommitment`: Cryptographic proof that links Honestly ↔ Semaphore WITHOUT revealing the link
- `honestlyNullifier`: To prevent double-registration

The server NEVER sees or stores:
- Salt
- Trapdoor
- Nullifier (Semaphore)
- Client secret
- Any way to reverse the identity link

### Cryptographic Guarantee

The binding commitment is:
```
bindingCommitment = H(honestlyProofCommitment || semaphoreCommitment || clientSecret)
```

Without `clientSecret` (which never leaves the browser), the server cannot:
1. Verify which Honestly proof maps to which Semaphore identity
2. Brute-force the link (256-bit secret space)
3. Correlate future actions

### Audit Checklist

- [ ] No `salt` parameter in API requests
- [ ] No `deriveFromHonestlyProof()` calls on server
- [ ] Identity generation happens in browser only
- [ ] `clientSecret` never transmitted
- [ ] Server stores only commitments, not secrets
- [ ] Honestly nullifiers tracked to prevent double-registration

### References

- [Semaphore Protocol](https://semaphore.pse.dev/)
- [WorldID Privacy Design](https://docs.worldcoin.org/privacy)
- [ZK Identity Best Practices](https://zkproof.org/2021/04/14/privacy-preserving-identity/)

