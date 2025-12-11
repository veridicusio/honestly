# Testing Guide

**Comprehensive testing guide for the Honestly Truth Engine**

---

## 📋 Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Test Types](#test-types)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Test Coverage](#test-coverage)
- [CI/CD Integration](#cicd-integration)
- [Best Practices](#best-practices)

---

## Overview

Honestly uses a comprehensive testing strategy across all components:

| Component | Framework | Coverage Target | Status |
|-----------|-----------|-----------------|--------|
| **Python Backend** | pytest | 85%+ | ✅ 85% |
| **Frontend** | Vitest | 70%+ | ✅ 72% |
| **E2E Tests** | Playwright | Critical paths | ✅ Complete |
| **Solana Program** | Anchor | 95%+ | ✅ 95% |
| **ZKP Circuits** | Custom | Property tests | ✅ Complete |

---

## Quick Start

### Run All Tests

```bash
# From repository root
make test

# Or run individually
make test-backend
make test-frontend
make test-e2e
make test-solana
```

### Run Specific Test Suites

```bash
# Python backend tests
cd backend-python
pytest tests/ -v --cov

# Frontend tests
cd frontend-app
npm test

# E2E tests
cd frontend-app
npm run test:e2e

# Solana program tests
cd backend-solana
anchor test
```

---

## Test Types

### 1. Unit Tests

Test individual functions and components in isolation.

**Python Example:**
```python
# tests/test_vault.py
def test_document_encryption():
    """Test AES-256-GCM encryption."""
    plaintext = b"sensitive data"
    key = generate_key()
    
    encrypted = encrypt_document(plaintext, key)
    decrypted = decrypt_document(encrypted, key)
    
    assert decrypted == plaintext
    assert encrypted != plaintext
```

**JavaScript Example:**
```javascript
// frontend-app/src/components/__tests__/DocumentCard.test.jsx
import { render, screen } from '@testing-library/react';
import DocumentCard from '../DocumentCard';

test('renders document information', () => {
  const doc = { id: '123', type: 'passport' };
  render(<DocumentCard document={doc} />);
  
  expect(screen.getByText('passport')).toBeInTheDocument();
});
```

---

### 2. Integration Tests

Test interactions between components and services.

**API Integration Test:**
```python
# tests/test_api_integration.py
async def test_upload_and_retrieve(client):
    """Test full upload and retrieve flow."""
    # Upload document
    upload_response = await client.post(
        "/vault/upload",
        json={"type": "passport", "data": "encrypted"}
    )
    assert upload_response.status_code == 200
    doc_id = upload_response.json()["id"]
    
    # Retrieve document
    get_response = await client.get(f"/vault/document/{doc_id}")
    assert get_response.status_code == 200
    assert get_response.json()["id"] == doc_id
```

---

### 3. End-to-End Tests

Test complete user workflows from frontend to backend.

**Playwright E2E Test:**
```javascript
// frontend-app/e2e/vault.spec.js
import { test, expect } from '@playwright/test';

test('upload and verify document', async ({ page }) => {
  await page.goto('http://localhost:3000');
  
  // Upload document
  await page.click('#upload-button');
  await page.fill('#document-type', 'passport');
  await page.click('#submit-upload');
  
  // Verify upload succeeded
  await expect(page.locator('.success-message')).toBeVisible();
  
  // Verify document appears in list
  await expect(page.locator('.document-list')).toContainText('passport');
});
```

---

### 4. ZKP Property Tests

Test zero-knowledge proof circuits for correctness and security.

**ZK Property Test:**
```python
# tests/test_zk_properties.py
import pytest

@pytest.mark.zk
def test_age_proof_soundness():
    """Test age proof rejects invalid inputs."""
    # Should reject: birth_ts after reference_ts
    with pytest.raises(ProofGenerationError):
        generate_age_proof(
            birth_ts=1733443200,
            reference_ts=1700000000,  # Earlier than birth
            min_age=18
        )

@pytest.mark.zk
def test_nullifier_uniqueness():
    """Test nullifiers are unique per proof."""
    proof1 = generate_level3_proof(user_id=1, value=50)
    proof2 = generate_level3_proof(user_id=1, value=50)
    
    # Same inputs should generate different nullifiers
    assert proof1["nullifier"] != proof2["nullifier"]
```

---

### 5. Security Tests

Test security features and vulnerability protection.

**Security Test:**
```python
# tests/security/test_input_validation.py
def test_xss_protection():
    """Test XSS attack prevention."""
    malicious_input = "<script>alert('xss')</script>"
    
    sanitized = sanitize_input(malicious_input)
    
    assert "<script>" not in sanitized
    assert "alert" not in sanitized

def test_sql_injection_protection():
    """Test SQL injection prevention."""
    malicious_query = "'; DROP TABLE users; --"
    
    with pytest.raises(ValidationError):
        validate_query_parameter(malicious_query)
```

---

### 6. Performance Tests

Test system performance and load handling.

**Load Test (k6):**
```javascript
// tests/load/vault-load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  vus: 50,
  duration: '30s',
};

export default function() {
  let response = http.get('http://localhost:8000/vault/share/hns_test/bundle');
  
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
  });
  
  sleep(1);
}
```

---

### 7. Chaos Tests

Test system resilience under failure conditions.

**Chaos Test:**
```python
# tests/chaos/network_partition_test.py
async def test_neo4j_recovery():
    """Test system recovers from Neo4j disconnection."""
    # System should be healthy initially
    assert await health_check()
    
    # Simulate Neo4j failure
    await stop_neo4j()
    
    # System should detect unhealthy state
    assert not await health_check()
    
    # Restart Neo4j
    await start_neo4j()
    
    # System should recover
    await asyncio.sleep(5)
    assert await health_check()
```

---

## Running Tests

### Python Backend

```bash
cd backend-python

# Run all tests
pytest tests/ -v

# Run with coverage
pytest tests/ -v --cov --cov-report=html

# Run specific test file
pytest tests/test_vault.py -v

# Run specific test
pytest tests/test_vault.py::test_document_encryption -v

# Run tests matching pattern
pytest tests/ -k "encryption" -v

# Run ZKP property tests
ZK_TESTS=1 pytest tests/test_zk_properties.py -v

# Run with specific markers
pytest -m "slow" tests/
pytest -m "not slow" tests/
```

**Pytest Markers:**
- `@pytest.mark.slow` — Slow-running tests
- `@pytest.mark.zk` — ZK proof tests (requires circuits)
- `@pytest.mark.integration` — Integration tests
- `@pytest.mark.security` — Security tests

---

### Frontend

```bash
cd frontend-app

# Run unit tests
npm test

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch

# Run specific test file
npm test -- DocumentCard.test.jsx
```

---

### E2E Tests

```bash
cd frontend-app

# Install Playwright browsers (first time only)
npx playwright install

# Run E2E tests headless
npm run test:e2e

# Run with browser UI
npm run test:e2e:headed

# Run in interactive mode
npm run test:e2e:ui

# Run specific test
npx playwright test e2e/vault.spec.js

# Debug test
npx playwright test --debug
```

---

### Solana Program

```bash
cd backend-solana

# Run all tests
anchor test

# Run with coverage
anchor test --coverage

# Run specific test
anchor test --test veridicus

# Skip build (if already built)
anchor test --skip-build
```

---

### Performance Tests

```bash
# Install k6
brew install k6  # macOS
# or: https://k6.io/docs/getting-started/installation/

# Run load test
cd tests/load
k6 run vault-load-test.js

# Run with custom parameters
k6 run --vus 100 --duration 60s vault-load-test.js

# Generate HTML report
k6 run --out json=results.json vault-load-test.js
```

---

## Writing Tests

### Test Structure

Follow the **Arrange-Act-Assert** pattern:

```python
def test_example():
    # Arrange: Set up test data and preconditions
    user = create_test_user()
    document = create_test_document()
    
    # Act: Execute the code being tested
    result = upload_document(user, document)
    
    # Assert: Verify the expected outcome
    assert result["status"] == "success"
    assert result["id"] is not None
```

---

### Fixtures

Use fixtures to share test setup:

```python
# conftest.py
import pytest

@pytest.fixture
async def test_client():
    """Provide test client for API tests."""
    async with TestClient(app) as client:
        yield client

@pytest.fixture
def sample_document():
    """Provide sample document for tests."""
    return {
        "type": "passport",
        "data": "encrypted_data",
        "metadata": {"country": "US"}
    }

# tests/test_api.py
async def test_upload(test_client, sample_document):
    """Test using fixtures."""
    response = await test_client.post("/vault/upload", json=sample_document)
    assert response.status_code == 200
```

---

### Mocking

Mock external dependencies to isolate tests:

```python
from unittest.mock import AsyncMock, patch

@patch('api.vault.neo4j_driver')
async def test_with_mock_neo4j(mock_driver):
    """Test with mocked Neo4j."""
    mock_driver.session.return_value = AsyncMock()
    
    result = await store_document({"type": "passport"})
    
    assert result["status"] == "success"
    mock_driver.session.assert_called_once()
```

---

### Parametrized Tests

Test multiple inputs efficiently:

```python
@pytest.mark.parametrize("age,expected", [
    (17, False),  # Under 18
    (18, True),   # Exactly 18
    (25, True),   # Over 18
    (150, False), # Invalid age
])
def test_age_validation(age, expected):
    """Test age validation with multiple inputs."""
    result = validate_age(age)
    assert result == expected
```

---

## Test Coverage

### View Coverage Reports

**Python:**
```bash
cd backend-python
pytest tests/ --cov --cov-report=html
open htmlcov/index.html  # macOS
# or: xdg-open htmlcov/index.html  # Linux
```

**Frontend:**
```bash
cd frontend-app
npm test -- --coverage
open coverage/index.html
```

---

### Coverage Requirements

| Component | Minimum | Target | Current |
|-----------|---------|--------|---------|
| Python Backend | 80% | 85% | 85% |
| Frontend | 70% | 75% | 72% |
| Solana Program | 90% | 95% | 95% |

---

### Excluding Files from Coverage

**Python (`.coveragerc`):**
```ini
[run]
omit =
    */tests/*
    */migrations/*
    */venv/*

[report]
exclude_lines =
    pragma: no cover
    def __repr__
    raise AssertionError
    raise NotImplementedError
```

**JavaScript (`package.json`):**
```json
{
  "jest": {
    "coveragePathIgnorePatterns": [
      "/node_modules/",
      "/tests/",
      "/__tests__/"
    ]
  }
}
```

---

## CI/CD Integration

### GitHub Actions

Tests run automatically on pull requests:

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: |
          cd backend-python
          pip install -r requirements.txt
      - name: Run tests
        run: |
          cd backend-python
          pytest tests/ -v --cov
```

---

### Local Pre-commit Hooks

```bash
# Install pre-commit
pip install pre-commit

# Set up hooks
pre-commit install

# Run manually
pre-commit run --all-files
```

**`.pre-commit-config.yaml`:**
```yaml
repos:
  - repo: local
    hooks:
      - id: pytest
        name: pytest
        entry: bash -c 'cd backend-python && pytest tests/'
        language: system
        pass_filenames: false
```

---

## Best Practices

### 1. Test Naming

Use descriptive test names that explain what is being tested:

```python
# Good
def test_age_proof_rejects_future_birth_date():
    """Test age proof validation rejects birth dates in the future."""
    pass

# Bad
def test_age():
    """Test age."""
    pass
```

---

### 2. Independent Tests

Each test should be independent and not rely on other tests:

```python
# Good - Independent
def test_upload_document():
    doc = create_document()
    result = upload(doc)
    assert result["status"] == "success"

# Bad - Depends on previous test
doc_id = None

def test_upload_document():
    global doc_id
    result = upload(create_document())
    doc_id = result["id"]

def test_retrieve_document():
    result = retrieve(doc_id)  # Depends on previous test!
```

---

### 3. Test One Thing

Each test should verify one specific behavior:

```python
# Good - Tests one thing
def test_upload_validates_document_type():
    with pytest.raises(ValidationError):
        upload({"type": "invalid"})

def test_upload_requires_auth():
    with pytest.raises(AuthError):
        upload({"type": "passport"}, auth=None)

# Bad - Tests multiple things
def test_upload():
    # Tests validation AND auth AND success case
    pass
```

---

### 4. Use Clear Assertions

Write assertions that provide helpful error messages:

```python
# Good
assert response.status_code == 200, f"Expected 200, got {response.status_code}"
assert "id" in result, "Response missing 'id' field"

# Bad
assert response.status_code == 200
assert "id" in result
```

---

### 5. Clean Up Resources

Always clean up test resources:

```python
import pytest
import tempfile

@pytest.fixture
def temp_file():
    """Create temporary file for testing."""
    f = tempfile.NamedTemporaryFile(delete=False)
    yield f.name
    # Cleanup after test
    os.unlink(f.name)
```

---

## Troubleshooting

### Tests Failing Locally

```bash
# Clean up test artifacts
rm -rf __pycache__ .pytest_cache .coverage
rm -rf node_modules coverage

# Reinstall dependencies
pip install -r requirements.txt
npm install

# Run tests in verbose mode
pytest tests/ -vv
npm test -- --verbose
```

---

### Slow Tests

```bash
# Find slowest tests
pytest tests/ --durations=10

# Skip slow tests during development
pytest tests/ -m "not slow"
```

---

### Flaky Tests

If tests fail intermittently:

1. **Add retries** for external dependencies
2. **Increase timeouts** for async operations
3. **Use fixtures** to ensure clean state
4. **Mock external services** to reduce flakiness

```python
@pytest.mark.flaky(reruns=3)
async def test_external_api():
    """Test with automatic retries."""
    result = await call_external_api()
    assert result is not None
```

---

## Additional Resources

- [pytest Documentation](https://docs.pytest.org/)
- [Playwright Documentation](https://playwright.dev/)
- [Vitest Documentation](https://vitest.dev/)
- [k6 Documentation](https://k6.io/docs/)
- [Anchor Testing Guide](https://www.anchor-lang.com/docs/testing)

---

<div align="center">

**Questions?**

[Open an Issue](https://github.com/veridicusio/honestly/issues) • [Documentation Index](DOCUMENTATION_INDEX.md) • [Contributing Guide](CONTRIBUTING.md)

</div>
