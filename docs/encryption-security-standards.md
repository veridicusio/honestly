# Encryption & Security Standards

**Document Version:** 1.0  
**Last Updated:** December 4, 2024  
**Status:** Active

## Executive Summary

This document defines the encryption and security standards for the Honestly Truth Engine platform. It covers encryption algorithms, key management, rotation procedures, and security best practices.

---

## 1. Encryption Standards

### 1.1 Symmetric Encryption

**Primary Algorithm:** AES-256-GCM (Advanced Encryption Standard, 256-bit keys, Galois/Counter Mode)

**Rationale:**
- Industry standard for data-at-rest encryption
- NIST approved (FIPS 197)
- Authenticated encryption (provides both confidentiality and integrity)
- Resistant to known cryptographic attacks
- Hardware acceleration available on modern processors

**Implementation:**
```python
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

# Key generation
key = AESGCM.generate_key(bit_length=256)  # 32 bytes

# Encryption
aesgcm = AESGCM(key)
nonce = os.urandom(12)  # 96-bit nonce for GCM mode
ciphertext = aesgcm.encrypt(nonce, plaintext, associated_data=None)
```

**Key Properties:**
- Key size: 256 bits (32 bytes)
- Nonce size: 96 bits (12 bytes) - must be unique per encryption
- Authentication tag: 128 bits (16 bytes) - automatically included
- No padding required (stream cipher mode)

### 1.2 Key Derivation

**Algorithm:** PBKDF2-HMAC-SHA256

**Parameters:**
- Iterations: 100,000 (minimum recommended by OWASP 2023)
- Salt: User ID (unique per user)
- Hash function: SHA-256
- Output length: 256 bits (32 bytes)

**Implementation:**
```python
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes

kdf = PBKDF2HMAC(
    algorithm=hashes.SHA256(),
    length=32,
    salt=user_id.encode('utf-8'),
    iterations=100000
)
user_key = kdf.derive(master_key)
```

**Rationale:**
- Derives user-specific keys from master key
- Prevents cross-user decryption
- Adds computational cost to brute force attacks
- Allows independent user key revocation

### 1.3 Hashing

**Algorithm:** SHA-256

**Use Cases:**
- Document integrity verification
- Commitment schemes for zero-knowledge proofs
- Merkle tree construction for blockchain attestations

**Properties:**
- Output size: 256 bits (32 bytes)
- Collision resistant
- Pre-image resistant
- Avalanche effect (small input change = large output change)

### 1.4 Transport Layer Security

**Protocol:** TLS 1.3 (mandatory for production)

**Requirements:**
- Minimum TLS version: 1.3
- Cipher suites (in order of preference):
  1. TLS_AES_256_GCM_SHA384
  2. TLS_CHACHA20_POLY1305_SHA256
  3. TLS_AES_128_GCM_SHA256
- Certificate validation: Required
- Certificate pinning: Recommended for mobile apps
- HSTS (HTTP Strict Transport Security): Enabled

---

## 2. Key Management

### 2.1 Master Key

**Generation:**
- Cryptographically secure random number generator (CSPRNG)
- Operating system entropy source: `/dev/urandom` or `secrets` module
- Key length: 256 bits (32 bytes)

**Storage:**
- Production: Hardware Security Module (HSM) or Key Management Service (KMS)
- Development: Environment variable `VAULT_ENCRYPTION_KEY` (base64-encoded)
- Never stored in code or version control
- Access restricted to minimal required services

**Lifecycle:**
1. Generation → 2. Storage → 3. Use → 4. Rotation → 5. Archival → 6. Destruction

### 2.2 Key Hierarchy

```
Master Key (Level 0)
    ├── User Key (Alice) = PBKDF2(Master Key, "alice@example.com")
    │       ├── Document 1
    │       └── Document 2
    ├── User Key (Bob) = PBKDF2(Master Key, "bob@example.com")
    │       └── Document 3
    └── ...
```

**Benefits:**
- Single master key to protect
- User isolation (compromise of one user key doesn't affect others)
- Efficient key rotation (re-derive user keys from new master key)
- Scalable to millions of users

### 2.3 Key Versioning

**Schema:**
- Key version: Integer, starts at 1, increments on rotation
- Stored in: `key_metadata.json` file
- Referenced in: Document metadata

**Format:**
```json
{
  "current_version": 2,
  "last_rotation": "2024-12-04T12:00:00Z",
  "rotation_count": 1
}
```

**Document Metadata:**
```json
{
  "id": "doc_user1_123456789",
  "key_version": 2,
  "last_key_rotation": "2024-12-04T12:00:00Z"
}
```

---

## 3. Key Rotation

### 3.1 Rotation Policy

**Mandatory Rotation Triggers:**
1. Suspected key compromise
2. Security incident or breach
3. Employee departure (if employee had key access)
4. Regulatory requirement

**Recommended Rotation Schedule:**
- Routine rotation: Every 90 days (quarterly)
- High-security environments: Every 30 days (monthly)
- Compliance-driven: As required by regulations (e.g., PCI-DSS)

### 3.2 Rotation Process

**Steps:**

1. **Pre-Rotation Checks:**
   - Verify backup of current key
   - Ensure all documents are accessible
   - Check storage space for re-encryption
   - Schedule maintenance window (if needed)

2. **Key Generation:**
   ```python
   new_key = AESGCM.generate_key(bit_length=256)
   ```

3. **Re-Encryption:**
   - Decrypt each document with old key
   - Encrypt with new key
   - Update document metadata with new key version
   - Verify data integrity

4. **Key Version Update:**
   - Increment key version
   - Store new key in key history
   - Update key metadata file

5. **Post-Rotation Verification:**
   - Verify all documents accessible with new key
   - Check error logs
   - Validate rotation statistics

6. **Old Key Archival:**
   - Archive old key (may be needed for audit/recovery)
   - Restrict access to archived keys
   - Set destruction schedule (e.g., 90 days after rotation)

### 3.3 Rotation Implementation

**API:**
```python
result = vault.rotate_key(new_key=None)  # Auto-generates key if None

# Returns:
{
    'old_version': 1,
    'new_version': 2,
    'documents_re_encrypted': 42,
    'errors': [],
    'start_time': '2024-12-04T12:00:00Z',
    'end_time': '2024-12-04T12:00:15Z',
    'new_key_b64': 'base64_encoded_key'
}
```

**Monitoring:**
- Log rotation start/end times
- Track documents re-encrypted
- Alert on errors during rotation
- Monitor rotation duration

### 3.4 Emergency Key Rotation

**Triggered by:**
- Key compromise detected
- Security breach
- Insider threat

**Immediate Actions:**
1. Initiate emergency rotation (no scheduled maintenance window)
2. Rotate key within 1 hour
3. Audit all recent key access
4. Invalidate potentially compromised sessions
5. Notify security team and affected users
6. Document incident

---

## 4. Zero-Knowledge Proofs

### 4.1 Purpose

Enable selective disclosure of credentials without revealing underlying data.

**Use Cases:**
- Age verification without revealing birthdate
- Document authenticity without revealing content
- Credential verification without full disclosure

### 4.2 Implementation

**Current (MVP):** Simplified cryptographic commitments

**Commitment Scheme:**
```python
commitment = SHA256(secret_data + document_hash)
```

**Future (Production):** ZK-SNARK circuits using libraries like:
- zkpy (Python bindings for libsnark)
- circom (circuit compiler)
- snarkjs (JavaScript ZK library)

### 4.3 Security Properties

- **Zero-knowledge:** Verifier learns nothing except validity of statement
- **Soundness:** Cannot prove false statements
- **Completeness:** Valid statements can be proven
- **Non-interactivity:** Proof can be verified without prover interaction

---

## 5. Differential Privacy

### 5.1 Purpose

Protect individual privacy in aggregate data and analytics while maintaining data utility.

### 5.2 Privacy Mechanisms

**Laplace Mechanism:**
- Use case: Count queries, sums
- Noise distribution: Laplace(sensitivity/epsilon)
- Provides pure (epsilon)-differential privacy

**Gaussian Mechanism:**
- Use case: Large datasets, better utility
- Noise distribution: Gaussian(sigma)
- Provides (epsilon, delta)-differential privacy

**Exponential Mechanism:**
- Use case: Selecting best option from discrete set
- Probability proportional to utility function
- Provides (epsilon)-differential privacy

### 5.3 Privacy Budget

**Parameters:**
- **Epsilon (ε):** Privacy loss parameter
  - Lower = more private
  - Typical range: 0.1 to 1.0
  - Default: 1.0
- **Delta (δ):** Failure probability
  - Typical range: 1e-5 to 1e-10
  - Default: 1e-5

**Budget Management:**
- Track epsilon spent across queries
- Prevent budget exhaustion
- Reset budget periodically (with caution)
- Log all privacy budget usage

### 5.4 Implementation

```python
from vault.differential_privacy import DifferentialPrivacy

dp = DifferentialPrivacy(epsilon=1.0, delta=1e-5)

# Private count
noisy_count = dp.private_count(true_count=100)

# Private mean
noisy_mean = dp.private_mean(
    true_mean=50.0,
    count=100,
    max_value=100.0
)

# Check budget
status = dp.get_privacy_budget_status()
```

---

## 6. Security Best Practices

### 6.1 Development Practices

1. **Never hardcode secrets:**
   - ❌ `key = "hardcoded_key_123"`
   - ✅ `key = os.getenv('VAULT_ENCRYPTION_KEY')`

2. **Use secure random sources:**
   - ❌ `random.randint()`
   - ✅ `secrets.token_bytes(32)`

3. **Validate all inputs:**
   - Check key lengths
   - Validate user IDs
   - Sanitize file paths

4. **Use constant-time operations:**
   - For key comparison
   - For MAC verification
   - To prevent timing attacks

5. **Clear sensitive data from memory:**
   ```python
   key = get_encryption_key()
   # ... use key ...
   del key  # Clear reference
   ```

### 6.2 Operational Security

1. **Access Control:**
   - Principle of least privilege
   - Role-based access control (RBAC)
   - Multi-factor authentication (MFA)
   - Audit all key access

2. **Monitoring:**
   - Log all encryption/decryption operations
   - Alert on failed decryption attempts
   - Monitor key rotation status
   - Track privacy budget usage

3. **Incident Response:**
   - Documented response procedures
   - Emergency key rotation capability
   - Breach notification process
   - Regular incident drills

4. **Backups:**
   - Encrypted backups of keys (separate from data)
   - Test backup restoration
   - Secure backup storage
   - Regular backup verification

### 6.3 Code Review Checklist

- [ ] No hardcoded secrets
- [ ] Proper key length validation
- [ ] Secure random number generation
- [ ] Proper nonce/IV generation (unique per encryption)
- [ ] Authenticated encryption used
- [ ] Error handling doesn't leak information
- [ ] Sensitive data cleared from memory
- [ ] Input validation implemented
- [ ] Audit logging in place
- [ ] Security headers configured

---

## 7. Compliance Mappings

### 7.1 GDPR (Article 32)

**Security of Processing:**
- ✅ Encryption of personal data (AES-256-GCM)
- ✅ Ability to restore data (backup and recovery)
- ✅ Regular testing (automated test suite)
- ✅ Pseudonymization (user-specific key derivation)

### 7.2 PCI-DSS

**Requirements:**
- ✅ Requirement 3: Protect stored cardholder data (encryption)
- ✅ Requirement 4: Encrypt transmission (TLS 1.3)
- ✅ Requirement 8: Identify and authenticate access (MFA recommended)
- ⚠️ Requirement 3.6: Key management (partial - HSM needed for full compliance)

### 7.3 HIPAA

**Security Rule:**
- ✅ Encryption (addressable, implemented)
- ✅ Access controls (RBAC)
- ✅ Audit controls (logging)
- ✅ Integrity controls (authenticated encryption)

### 7.4 SOC 2

**Trust Service Criteria:**
- ✅ CC6.1: Logical access (key management)
- ✅ CC6.6: Encryption (AES-256-GCM)
- ✅ CC6.7: Key management (rotation capability)
- ✅ CC7.2: Monitoring (logging and alerts)

---

## 8. Threat Model

### 8.1 Threats and Mitigations

| Threat | Mitigation | Status |
|--------|-----------|--------|
| Key compromise | Key rotation, HSM storage | ✅ Implemented |
| Brute force | Strong keys (256-bit), PBKDF2 | ✅ Implemented |
| Man-in-the-middle | TLS 1.3, certificate pinning | ⚠️ TLS required |
| Insider threat | Access controls, audit logging | ⚠️ Partial |
| Data breach | Encryption at rest | ✅ Implemented |
| Side-channel | Constant-time operations | ⚠️ Review needed |
| Replay attack | Nonce uniqueness, timestamps | ✅ Implemented |
| Privacy violation | Differential privacy | ✅ Implemented |

### 8.2 Attack Scenarios

**Scenario 1: Stolen Database**
- Attacker gains access to database dump
- **Mitigation:** All data encrypted, keys not in database
- **Result:** Data unreadable without keys

**Scenario 2: Compromised API Key**
- Attacker obtains API authentication token
- **Mitigation:** User-specific keys, per-document access control
- **Result:** Limited to authorized user's documents

**Scenario 3: Insider Access**
- Malicious employee with system access
- **Mitigation:** Audit logging, key access controls, need-to-know
- **Result:** Actions logged, limited access, detection possible

**Scenario 4: Side-Channel Attack**
- Attacker analyzes timing, power consumption, or cache
- **Mitigation:** Constant-time operations, secure hardware (HSM)
- **Result:** Attack difficulty increased significantly

---

## 9. Testing and Validation

### 9.1 Security Testing

**Unit Tests:**
- Encryption/decryption correctness
- Key rotation data integrity
- Differential privacy guarantees
- Edge cases and error handling

**Integration Tests:**
- End-to-end encryption flow
- Multi-user scenarios
- Key rotation under load
- Privacy budget enforcement

**Security Tests:**
- Penetration testing (annual)
- Vulnerability scanning (continuous)
- Code review (all changes)
- Dependency auditing (automated)

### 9.2 Test Coverage Requirements

- Minimum code coverage: 80%
- Critical paths: 100% coverage
- Security-critical code: 100% coverage + manual review
- Differential privacy: Statistical tests for guarantees

---

## 10. Incident Response

### 10.1 Security Incident Categories

**Severity Levels:**
1. **Critical:** Key compromise, data breach
2. **High:** Unauthorized access, failed attack
3. **Medium:** Suspicious activity, policy violation
4. **Low:** Configuration issue, minor vulnerability

### 10.2 Response Procedures

**Critical Incident (Key Compromise):**
1. Isolate affected systems (< 15 minutes)
2. Initiate emergency key rotation (< 1 hour)
3. Audit key access logs
4. Notify security team and stakeholders
5. Investigate root cause
6. Implement additional controls
7. Document incident and lessons learned

**High Incident (Unauthorized Access):**
1. Revoke compromised credentials (< 30 minutes)
2. Review access logs
3. Assess data accessed
4. Notify affected users if required
5. Strengthen access controls
6. Monitor for further attempts

---

## 11. Audit and Compliance

### 11.1 Regular Audits

- **Monthly:** Key rotation status check
- **Quarterly:** Security configuration review
- **Annually:** Full security audit, penetration test

### 11.2 Audit Logs

**Required Information:**
- Timestamp (ISO 8601, UTC)
- User/service identity
- Action performed
- Resource accessed
- Result (success/failure)
- IP address / source

**Retention:**
- Production: 1 year minimum
- Compliance environments: As required (may be 7+ years)

---

## 12. Updates and Maintenance

### 12.1 Document Updates

- Review frequency: Quarterly
- Update triggers: New threats, regulatory changes, technology updates
- Approval required: Security team, compliance officer

### 12.2 Technology Updates

- Monitor NIST guidelines
- Track cryptographic library updates
- Review academic research
- Assess new attack vectors

---

## References

1. NIST Special Publication 800-57: Key Management
2. NIST Special Publication 800-175B: Guideline for Using Cryptographic Standards
3. OWASP Cryptographic Storage Cheat Sheet
4. RFC 5869: HMAC-based Key Derivation Function (HKDF)
5. RFC 8446: Transport Layer Security (TLS) 1.3
6. Dwork, C., & Roth, A. (2014). The Algorithmic Foundations of Differential Privacy

---

**Document Approval:**

✅ Security Team Review  
✅ Compliance Officer Review  
✅ Privacy-Enforcer Signoff  

**Next Review Date:** March 4, 2025
