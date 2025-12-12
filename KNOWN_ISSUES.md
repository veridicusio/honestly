# Known Issues and Considerations

This document tracks known issues, limitations, and areas for future improvement in the Honestly codebase.

## 📦 Dependency Deprecation Warnings

### npm Deprecations
The following packages show deprecation warnings but are transitive dependencies:
- `rimraf@3.0.2` - Used by dependencies, no direct impact
- `inflight@1.0.6` - Memory leak in legacy code, consider lru-cache alternative
- `glob@7.2.3` - Used by dependencies, upgrade to v9 if directly used
- `@humanwhocodes/*` - ESLint internal dependencies, will be updated with ESLint upgrade

## 🏗️ Infrastructure & Setup

### ConductMe Dependencies
- **Issue**: `conductme/` and `conductme/core/` directories don't have `node_modules` tracked
- **Status**: ✅ Fixed - Installation instructions added to README.md
- **Solution**: Run `cd conductme && npm install && cd core && npm install` (Documented in main README)

### Docker Compose Files
- **Available Files**:
  - `docker-compose.yml` - Main orchestration
  - `docker-compose.dev.yml` - Development setup
  - `docker-compose.min.yml` - Minimal stack
  - `docker-compose.monitoring.yml` - Monitoring stack

## 🧪 Testing Infrastructure

### Python Backend Tests (inc. GraphQL)
- **Status**: ✅ Tests exist and functional
- **Location**: `backend-python/tests/`
- **Coverage**: Good coverage across API, vault, identity, ZKP, and GraphQL endpoints (Ariadne)

### Frontend Tests
- **Status**: ⚠️ Missing (Previous E2E tests removed with legacy frontend-app)
- **Location**: N/A
- **Next Steps**: Implement Playwright E2E tests for `conductme` (Next.js)

## 🔐 Security Considerations

### Production Hardening Checklist
All security checks have been reviewed and are properly implemented:
- ✅ No hardcoded credentials found
- ✅ No unsafe eval/exec usage
- ✅ Proper error handling in place
- ✅ Environment variable validation
- ✅ Rate limiting configured
- ✅ Input sanitization implemented
- ✅ Path traversal prevention
- ✅ ZKP circuit integrity checks

### Debug Logging
- Print statements in `backend-python/api/security_checks.py` are intentional for security reports
- Warning in `backend-python/api/app.py` is intentional for missing optional dependencies

## 📝 Code Quality Notes

### Abstract Methods with `pass`
Multiple files contain `pass` statements that are intentional:
- **Abstract base classes**: `identity/cross_chain_bridge.py`
- **Custom exceptions**: `api/cache.py`
- **Intentional silent failures**: `api/vault_routes.py` (JSON parsing fallback)

These are not bugs but proper Python patterns.

### Empty Implementations
Some functions have minimal implementations marked with `pass`:
- These are primarily placeholder methods in abstract classes
- No incomplete feature implementations were found

## 🚀 Future Improvements

### High Priority
1. Expand GraphQL integration tests coverage
2. Add comprehensive documentation for ConductMe components
3. Implement E2E tests for ConductMe frontend

### Medium Priority
1. Add React component unit tests
2. Review and update npm package versions

### Low Priority
1. Consider TypeScript migration for better type safety (where not already used)
2. Evaluate replacing deprecated transitive dependencies
3. Performance profiling and optimization

## 📊 Test Coverage

### Current Status
- **Root Level**: Jest with path utilities tests ✅
- **Backend Python**: pytest with good coverage (REST & GraphQL) ✅
- **Frontend**: ⚠️ Tests needed

### Target Goals
- Maintain >80% code coverage across all modules
- Expand E2E test scenarios

## 🔄 CI/CD Status

All CI workflows are functional:
- ✅ Python lint and test
- ✅ Frontend build
- ✅ ConductMe build
- ✅ ZKP integrity checks
- ✅ Docker build
- ✅ Security scanning

## 📚 Documentation

### Well Documented
- Architecture (ARCHITECTURE.md)
- Security (SECURITY.md)
- Setup (SETUP.md)
- API documentation (docs/)
- Vault quickstart (docs/vault-quickstart.md)

### Areas for Improvement
- ConductMe-specific documentation details
- Troubleshooting guide

---

**Last Updated**: 2025-12-12
**Review Frequency**: Quarterly or when major changes occur
