# Security Update Procedures

This document provides procedures for handling security updates in the Honestly platform.

## Quick Reference

### Dependency Security Check

```bash
# Check for vulnerabilities in all components
cd /path/to/honestly

# ConductMe (Next.js)
cd conductme && npm audit

# CLI
cd ../cli && npm audit

# ZKP Circuits  
cd ../backend-python/zkp && npm audit

# Solana Program
cd ../backend-solana && npm audit

# Python Backend
cd ../backend-python && pip-audit  # if available
```

### Update Next.js

**Current Status**: conductme uses Next.js 14.2.35 (stable)

```bash
cd conductme

# Check current version
npm list next

# Update to latest 14.x (stable)
npm update next@14

# Or upgrade to 15.x (major version - requires testing)
npm install next@15.5.9  # Use latest patched version

# Verify
npm audit
npm run build
```

### React Server Components (CVE-2025-66478)

**Status**: NOT AFFECTED (using Next.js 14.2.35 stable)

- **Affected**: Next.js 14.3.0-canary.77+, 15.x, 16.x with App Router
- **Not Affected**: Next.js 14.x stable, 13.x, Pages Router, Edge Runtime
- **Documentation**: See `SECURITY-CVE-2025-66478.md`

## Security Checklist

When a security advisory is announced:

1. **Assess Impact**
   - [ ] Identify affected packages and versions
   - [ ] Check if Honestly uses affected versions
   - [ ] Determine severity (CVSS score)
   - [ ] Review affected components

2. **Verify Current Versions**
   ```bash
   # JavaScript/TypeScript
   npm list <package-name>
   
   # Python
   pip show <package-name>
   ```

3. **Update if Affected**
   - [ ] Read upgrade guide for breaking changes
   - [ ] Update package.json or requirements.txt
   - [ ] Run `npm install` or `pip install`
   - [ ] Run tests: `npm test` or `pytest`
   - [ ] Run build: `npm run build`
   - [ ] Run security audit: `npm audit` or `pip-audit`

4. **Document the Fix**
   - [ ] Create security advisory document (SECURITY-CVE-XXXXX.md)
   - [ ] Update CHANGELOG.md
   - [ ] Add notes to DEPENDENCY-INSTALL-STATUS.md
   - [ ] Document any version changes

5. **Verify and Deploy**
   - [ ] Run full test suite
   - [ ] Verify no new vulnerabilities introduced
   - [ ] Test in staging environment
   - [ ] Deploy to production
   - [ ] Monitor for issues

## Component Dependency Matrix

| Component | Primary Dependencies | Security-Critical |
|-----------|---------------------|-------------------|
| **conductme** | Next.js 14.2.35, React 18.3.1 | ✅ Yes |
| **frontend-app** | React 18.2.0, Vite | ✅ Yes |
| **backend-graphql** | Apollo Server, Express | ✅ Yes |
| **backend-python** | FastAPI, Neo4j | ✅ Yes |
| **cli** | commander, snarkjs | ⚠️ Medium |
| **backend-python/zkp** | circom, snarkjs | ⚠️ Medium |
| **backend-solana** | Anchor, Solana | ✅ Yes |

## Common Vulnerability Types

### Next.js / React

- Remote Code Execution (RCE)
- Server-Side Request Forgery (SSRF)
- Cross-Site Scripting (XSS)
- Prototype Pollution

**Monitor**: 
- https://github.com/vercel/next.js/security/advisories
- https://github.com/facebook/react/security/advisories

### FastAPI / Python

- SQL Injection
- Command Injection
- Path Traversal
- Deserialization Attacks

**Monitor**:
- https://github.com/tiangolo/fastapi/security/advisories
- https://www.cve.org/

### Solana / Anchor

- Re-entrancy Attacks
- Integer Overflow
- Access Control Issues
- Signature Verification

**Monitor**:
- https://github.com/coral-xyz/anchor/security/advisories
- https://github.com/solana-labs/solana/security/advisories

## Emergency Response

If a critical vulnerability (CVSS 9.0+) is announced:

1. **Immediate Assessment** (within 1 hour)
   - Verify if affected
   - Determine exploit complexity
   - Assess current exposure

2. **Rapid Patching** (within 24 hours if affected)
   - Apply patches to all affected components
   - Run security scans
   - Deploy to production immediately

3. **Post-Incident** (within 48 hours)
   - Document incident
   - Review security practices
   - Update monitoring
   - Communicate to stakeholders

## Security Tools

### JavaScript/TypeScript
```bash
npm audit                    # Built-in vulnerability scanner
npm audit fix               # Auto-fix known issues
npm audit fix --force       # Force fixes (may break things)
npm outdated                # Check for updates
```

### Python
```bash
pip-audit                   # Vulnerability scanner
safety check                # Alternative scanner
pip list --outdated         # Check for updates
```

### Comprehensive
```bash
# Snyk (install separately)
snyk test                   # Scan for vulnerabilities
snyk monitor                # Continuous monitoring

# OWASP Dependency Check
dependency-check --project honestly --scan .
```

## Contact

- **Security Email**: security@veridicus.io
- **GitHub Security Advisories**: https://github.com/veridicusio/honestly/security/advisories

---

**Last Updated**: December 12, 2024  
**Maintained By**: Honestly Platform Team
