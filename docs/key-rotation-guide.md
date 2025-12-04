# Key Rotation Guide

**Version:** 1.0  
**Last Updated:** December 4, 2024

## Overview

This guide explains how to use the encryption key rotation system in the Honestly Personal Proof Vault. Key rotation is a critical security practice that limits the exposure window of any single encryption key.

---

## Quick Start

### Running the Demo

The easiest way to see key rotation in action is to run the demo script:

```bash
cd backend-python
python demo_key_rotation.py
```

The demo will:
1. Create a vault with an initial encryption key
2. Upload test documents for multiple users
3. Rotate the encryption key
4. Verify all documents can still be decrypted
5. Perform multiple rotations to show it works repeatedly

---

## Using Key Rotation in Code

### Basic Usage

```python
from vault.storage import VaultStorage

# Initialize vault
vault = VaultStorage(storage_path="vault_storage")

# Upload documents
doc = vault.upload_document(
    user_id="alice@example.com",
    document_data=b"Confidential document content",
    document_type=DocumentType.IDENTITY
)

# Rotate the key
result = vault.rotate_key()

print(f"Rotated from version {result['old_version']} to {result['new_version']}")
print(f"Re-encrypted {result['documents_re_encrypted']} documents")
print(f"Duration: {result['duration']} seconds")

# Documents are still accessible with the new key
decrypted = vault.download_document("alice@example.com", doc.id)
```

### Rotation with Custom Key

```python
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

# Generate a new key externally (e.g., from HSM)
new_key = AESGCM.generate_key(bit_length=256)

# Rotate to the specific key
result = vault.rotate_key(new_key=new_key)

# Save the new key securely
import base64
new_key_b64 = base64.b64encode(new_key).decode()
# Store new_key_b64 in secure key management system
```

---

## When to Rotate Keys

### Mandatory Rotation Triggers

Immediately rotate keys when:

1. **Key Compromise Suspected**
   - Unauthorized access detected
   - Key exposed in logs or code
   - System breach

2. **Personnel Changes**
   - Employee with key access leaves
   - Role changes affecting key access

3. **Security Incidents**
   - Data breach
   - Failed attack detected
   - Vulnerability discovered

### Recommended Schedule

- **Standard Security:** Every 90 days (quarterly)
- **High Security:** Every 30 days (monthly)
- **Compliance-Driven:** As required by regulations

---

## Rotation Process Details

### What Happens During Rotation

1. **Pre-Rotation**
   - Current key version recorded (e.g., version 1)
   - New key generated or accepted

2. **Re-Encryption Phase**
   - For each document:
     - Decrypt with old key
     - Encrypt with new key
     - Update metadata with new key version
     - Verify integrity

3. **Metadata Update**
   - Key version incremented (e.g., 1 → 2)
   - Rotation timestamp recorded
   - History updated

4. **Verification**
   - All documents tested for accessibility
   - Error log checked
   - Statistics reported

### Performance Considerations

- **Time:** ~0.05-0.1 seconds per document
- **Memory:** Processes one document at a time
- **Storage:** Temporarily needs space for both encrypted versions
- **Downtime:** Optional - can run during low-traffic periods

Example: 1,000 documents = ~60-100 seconds

---

## Monitoring Key Rotation

### Check Current Key Version

```python
current_version = vault.key_version
print(f"Current key version: {current_version}")
```

### View Rotation History

```python
history = vault.get_key_rotation_history()
for entry in history:
    print(f"Version: {entry['current_version']}")
    print(f"Last rotation: {entry['last_rotation']}")
    print(f"Total rotations: {entry['rotation_count']}")
```

### Check Document Key Version

```python
metadata = vault.get_document_metadata(document_id)
print(f"Document encrypted with key version: {metadata['key_version']}")
print(f"Last rotation: {metadata['last_key_rotation']}")
```

---

## Error Handling

### Handling Rotation Errors

```python
result = vault.rotate_key()

if result['errors']:
    print(f"⚠️ {len(result['errors'])} errors occurred:")
    for error in result['errors']:
        print(f"  - {error}")
    
    # Investigate and retry if needed
    # Old key is preserved for recovery
else:
    print("✅ Rotation completed successfully")
```

### Common Issues

**Issue:** Document fails to re-encrypt

**Causes:**
- Corrupted encrypted file
- Missing metadata
- Disk space exhausted

**Resolution:**
- Check error log for specific document ID
- Verify document integrity before rotation
- Ensure adequate disk space

**Issue:** Rotation takes too long

**Causes:**
- Large number of documents
- Large file sizes
- I/O bottleneck

**Resolution:**
- Schedule during maintenance window
- Consider batch rotation for large datasets
- Upgrade storage I/O capacity

---

## Best Practices

### 1. Test Before Production

```python
# Test rotation in development environment first
test_vault = VaultStorage(storage_path="test_vault")
# Upload test documents
# Perform rotation
# Verify results
```

### 2. Backup Before Rotation

```bash
# Backup vault storage directory
cp -r vault_storage vault_storage_backup_$(date +%Y%m%d_%H%M%S)
```

### 3. Schedule Appropriately

- Rotate during low-traffic periods
- Coordinate with team
- Plan for potential rollback

### 4. Monitor and Alert

```python
import logging

# Log rotation events
logger.info(f"Key rotation started: version {vault.key_version}")
result = vault.rotate_key()
logger.info(f"Key rotation completed: {result['documents_re_encrypted']} docs")

# Alert if errors
if result['errors']:
    logger.error(f"Rotation errors: {result['errors']}")
    # Send alert to security team
```

### 5. Document Rotations

Keep a log of all rotations:
- Date and time
- Key version changes
- Person/system who initiated
- Reason for rotation
- Results and any issues

---

## Integration with Key Management Systems

### Using AWS KMS

```python
import boto3

# Initialize KMS client
kms = boto3.client('kms')

# Generate new key from KMS
response = kms.generate_data_key(
    KeyId='your-kms-key-id',
    KeySpec='AES_256'
)
new_key = response['Plaintext']

# Rotate vault
vault.rotate_key(new_key=new_key)

# Store encrypted key in KMS
encrypted_key = response['CiphertextBlob']
# Save encrypted_key for future use
```

### Using HashiCorp Vault

```python
import hvac

# Initialize Vault client
client = hvac.Client(url='https://vault.example.com')

# Generate new key from Vault transit engine
response = client.secrets.transit.generate_data_key(
    name='vault-encryption',
    key_type='aes256-gcm96'
)
new_key = base64.b64decode(response['data']['plaintext'])

# Rotate vault
vault.rotate_key(new_key=new_key)
```

---

## Automation

### Scheduled Rotation Script

```python
#!/usr/bin/env python3
"""
Automated key rotation script.
Run via cron: 0 2 1 * * /path/to/rotate_keys.py
"""
import sys
from datetime import datetime
from vault.storage import VaultStorage

def rotate_vault_keys():
    try:
        vault = VaultStorage()
        
        print(f"[{datetime.now()}] Starting key rotation...")
        result = vault.rotate_key()
        
        print(f"✅ Rotation successful:")
        print(f"  - Old version: {result['old_version']}")
        print(f"  - New version: {result['new_version']}")
        print(f"  - Documents: {result['documents_re_encrypted']}")
        print(f"  - Duration: {result.get('duration', 'N/A')}")
        
        if result['errors']:
            print(f"⚠️ Errors: {len(result['errors'])}")
            for error in result['errors']:
                print(f"  - {error}")
            return 1
        
        return 0
        
    except Exception as e:
        print(f"❌ Rotation failed: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    sys.exit(rotate_vault_keys())
```

### Cron Schedule

```bash
# Quarterly rotation (1st of Jan, Apr, Jul, Oct at 2 AM)
0 2 1 1,4,7,10 * /usr/bin/python3 /opt/honestly/rotate_keys.py

# Monthly rotation (1st of every month at 2 AM)
0 2 1 * * /usr/bin/python3 /opt/honestly/rotate_keys.py
```

---

## Compliance

### NIST Guidelines

Key rotation complies with:
- NIST SP 800-57: Key Management Recommendations
- NIST SP 800-175B: Guideline for Using Cryptographic Standards

### GDPR Article 32

Key rotation supports:
- Security of processing
- Ability to restore availability and access to personal data
- Regular testing and evaluation of security measures

### PCI-DSS Requirement 3.6

- Key rotation at least annually (we support quarterly/monthly)
- Secure key generation and management
- Key version tracking for audit

---

## Troubleshooting

### Q: Can I revert to an old key version?

**A:** Not directly. The old key is used only for decryption during rotation. To "revert," you would need to:
1. Have the old key stored securely
2. Create a new vault instance with the old key
3. Manually re-upload documents

Prevention: Always test rotation in development first.

### Q: What if rotation fails mid-process?

**A:** The rotation is atomic per document:
- Successfully re-encrypted documents use new key
- Failed documents remain with old key
- Check error log to identify problematic documents
- Re-run rotation to complete

### Q: How do I rotate keys in a clustered environment?

**A:** 
1. Stop all write operations to vault
2. Perform rotation on primary instance
3. Sync new key to all replicas
4. Update key version on all instances
5. Resume operations

Consider using distributed lock to coordinate.

### Q: Can users still access documents during rotation?

**A:** Yes, but with caveats:
- Documents already re-encrypted: Use new key
- Documents not yet re-encrypted: Use old key
- For zero-downtime: Schedule rotation during maintenance window

---

## Testing

### Running Tests

```bash
cd backend-python
python -m pytest tests/test_key_rotation.py -v
```

### Test Coverage

- ✅ Basic rotation (no documents)
- ✅ Rotation with documents
- ✅ Data integrity preservation
- ✅ Multiple sequential rotations
- ✅ Multi-user scenarios
- ✅ Large documents
- ✅ Binary data
- ✅ Metadata preservation
- ✅ Error handling (corrupted files, missing metadata)
- ✅ Custom key usage

---

## Security Considerations

### Key Storage

- **Development:** Environment variable
- **Production:** HSM or KMS (Hardware Security Module / Key Management Service)
- **Never:** Version control, logs, or code

### Key Backup

- Encrypt backup keys
- Store in separate secure location
- Document recovery procedures
- Test recovery regularly

### Access Control

- Limit who can trigger rotation
- Require MFA for manual rotation
- Audit all rotation events
- Alert on unexpected rotations

### Post-Rotation

- Securely archive old key (may be needed for audit)
- Set destruction schedule for old keys
- Update documentation
- Notify relevant stakeholders

---

## FAQ

**Q: How long does rotation take?**
A: ~0.05-0.1 seconds per document. 1,000 documents ≈ 60-100 seconds.

**Q: Does rotation affect performance?**
A: Only during the rotation process. No impact on normal operations.

**Q: What happens to old keys?**
A: Stored in key history for potential audit/recovery. Should be securely destroyed after retention period.

**Q: Can I rotate to a key from a different source?**
A: Yes! Use `rotate_key(new_key=your_key)` to specify the new key.

**Q: Is rotation reversible?**
A: Not automatically. You'd need the old key and manual re-upload. Test in dev first!

**Q: How often should I rotate?**
A: Standard: 90 days. High security: 30 days. Mandatory: On suspected compromise.

---

## Support

For issues or questions:
- Check error logs: Review rotation result errors
- Run tests: `pytest tests/test_key_rotation.py -v`
- Review docs: See [Encryption Security Standards](encryption-security-standards.md)
- Contact: Security team or open GitHub issue

---

## References

- [NIST SP 800-57: Key Management](https://csrc.nist.gov/publications/detail/sp/800-57-part-1/rev-5/final)
- [Encryption Security Standards](encryption-security-standards.md)
- [GDPR Compliance Checklist](gdpr-compliance-checklist.md)
- Demo script: `backend-python/demo_key_rotation.py`
- Tests: `backend-python/tests/test_key_rotation.py`
