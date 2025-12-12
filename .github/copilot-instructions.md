# Honestly Copilot Agent Instructions

This guide enables AI coding agents to be productive in the Honestly codebase. It summarizes architecture, workflows, and project-specific conventions. For details, see `README.md`, `ARCHITECTURE.md`, and `backend-python/README.md`.

## 🏛️ Architecture Overview

- **ConductMe**: `conductme/` (Next.js 14, React, Tailwind, AI Orchestration)
- **Python Backend**: `backend-python/` (FastAPI, Neo4j, ZKPs, Redis, Kafka, Fabric)
- **Solana/Quantum**: `backend-solana/` (Anchor, Rust, VERIDICUS)
- **Docs**: `docs/`, `ARCHITECTURE.md`, `SECURITY.md`

**Key Flows:**
- User/agent → ConductMe → Python API (vault, ZK proofs, AAIP) → Neo4j/Redis/Blockchain
- ZK circuits: `backend-python/zkp/` (Groth16, Circom, snarkjs)
- AI agent registration & proof: `backend-python/identity/`

## 🛠️ Dev Workflows

- **Install**: `make install` (all), or per-component (`npm install`, `pip install -r requirements.txt`)
- **Run stack**: `make up` (Docker), or manual: start Neo4j, then backend/ConductMe
- **Test**: `make test` (all), or `pytest`, `npm run lint`, `anchor test`
- **ZK build**: `cd backend-python/zkp && npm run build:*` (see ZKP README)
- **Lint**: `npm run lint` (ConductMe)
- **Rebuild ZK**: `make zkp-rebuild` (wasm/zkey/vkey)

## 🔑 Project Patterns & Conventions

- **Python**: FastAPI, Pydantic, async/await, type hints, modular routes (`api/`), ZK logic in `zkp/`, agent logic in `identity/`
- **ConductMe**: Next.js 14, functional React, hooks, Tailwind, modular components
- **ZK Proofs**: Use Groth16, nullifier tracking, C++ witness for large circuits, see `zkp/README.md`
- **Security**: Never touch `.env`, secrets, or key material. All input validated. Rate limiting, audit logging, and security headers enforced.
- **Testing**: Unit/integration tests in `tests/`, ZK property tests with `ZK_TESTS=1 pytest ...`

## 🧩 Integration Points

- **Neo4j**: Graph DB for claims/provenance (see Cypher in `ARCHITECTURE.md`)
- **Redis**: Caching, nullifier tracking (optional, fallback to memory)
- **Kafka/FAISS/Fabric**: Optional, disable via env flags
- **Solana**: Quantum/VERIDICUS program, see `backend-solana/README.md`

## 🚦 Agent-Specific Guidance

- **Good agent tasks**: Add endpoints, ZK circuits, tests, doc updates, bugfixes, modular refactors
- **Require human review**: Auth logic, encryption/keys, blockchain integration, schema migrations, infra/CI
- **Never**: Touch secrets, production DB, or bypass security checks

## 📚 Key References

- `README.md`, `ARCHITECTURE.md`, `backend-python/README.md`, `backend-python/zkp/README.md`
- API: `backend-python/api/`, ZK: `backend-python/zkp/`, Identity: `backend-python/identity/`
- Tests: `tests/`, ZK tests: `tests/test_zk_properties.py`

---
**For unclear patterns or missing info, ask for feedback or check referenced docs.**

## 📝 Coding Standards & Conventions

### General Guidelines
- Write clear, self-documenting code
- Follow existing code style in each component
- Keep functions small and focused
- Use meaningful variable and function names
- Add comments only when necessary to explain complex logic

### ConductMe (Next.js/React/TypeScript)
- Use functional components with hooks
- Follow React best practices
- Use ES6+ features (arrow functions, destructuring, async/await)
- Component files should use TSX extension
- Style with TailwindCSS utility classes
- Keep components modular and reusable

**Example:**
```typescript
// conductme/src/components/ui/AppCard.tsx
import React from 'react';

interface AppCardProps {
  name: string;
  platform: string;
  score: number;
  grade: string;
}

const AppCard: React.FC<AppCardProps> = ({ name, platform, score, grade }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold">{name}</h3>
      <p className="text-gray-600">{platform}</p>
      <div className="mt-4">
        <span className="text-2xl font-bold">{score}</span>
        <span className="ml-2 text-lg">Grade: {grade}</span>
      </div>
    </div>
  );
};

export default AppCard;
```

### Backend Python (FastAPI)
- Follow PEP 8 style guide
- Use type hints for all function parameters and return values
- Implement proper error handling with FastAPI exceptions
- Use Pydantic models for request/response validation
- Keep routes organized in separate modules
- Use async/await for I/O operations

**Example:**
```python
# backend-python/api/routes/vault.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class DocumentUpload(BaseModel):
    type: str
    data: str
    metadata: Optional[dict] = None

@router.post("/vault/upload")
async def upload_document(doc: DocumentUpload):
    try:
        # Process document upload
        result = await vault_service.store_document(doc)
        return {"id": result.id, "status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

### Database
- **Neo4j**: Use parameterized queries to prevent injection
- Always use transactions for multi-step operations
- Add proper indexes for frequently queried fields

## 🔐 Security Boundaries & Sensitive Areas

### ⚠️ NEVER MODIFY OR TOUCH:
- `.env` files or environment variables (read-only)
- Docker secrets and credentials
- Private keys or cryptographic material
- Hyperledger Fabric network configuration
- Production database connection strings

### 🔒 SECURITY REQUIREMENTS:
- Always validate and sanitize user input
- Use parameterized queries for all database operations
- Implement proper authentication checks (when adding auth)
- Never log sensitive data (passwords, tokens, keys)
- Use HTTPS/TLS for all external communications
- Implement rate limiting on public endpoints
- Follow OWASP security best practices

### 📌 Encryption & ZK Proofs:
- Personal documents use AES-256-GCM encryption
- ZK proofs enable selective disclosure without revealing underlying data
- Never bypass encryption for convenience
- Always verify proof validity before trusting claims

## 🧪 Testing Guidelines

### ConductMe Tests
- Write unit tests for utility functions
- Test component rendering with React Testing Library
- Test user interactions and state changes
- Run `npm run lint` for linting

### Python Tests
- Use pytest for all tests
- Mock external dependencies (Neo4j, Kafka, Fabric)
- Test both success and failure paths
- Include async test cases
- Aim for >80% code coverage

## 🎯 Task Guidance

### Good Tasks for Copilot:
- Adding new API endpoints
- Creating new React components
- Writing tests for existing code
- Fixing bugs with clear reproduction steps
- Updating documentation
- Improving error handling
- Adding input validation
- Refactoring small, isolated functions

### Tasks Requiring Human Review:
- Changes to authentication/authorization logic
- Modifying encryption or ZK proof implementation
- Altering blockchain integration
- Database schema migrations
- Infrastructure changes (Docker, CI/CD)
- Security-critical code
- Complex refactoring across multiple components

## 📚 Key Dependencies & Technologies

### ConductMe
- **Next.js 14** - React framework
- **React 18** - UI library
- **TailwindCSS** - Styling
- **TypeScript** - Type safety
- **Radix UI** - Component primitives
- **React Flow** - Workflow visualization

### Python Backend
- **FastAPI** - Web framework
- **Neo4j** - Graph database
- **Kafka** - Event streaming
- **FAISS** - Vector search
- **Hyperledger Fabric** - Blockchain
- **Pydantic** - Data validation

## 🚀 Git Workflow

### Branch Naming
- Feature branches: `feature/description`
- Bug fixes: `fix/description`
- Documentation: `docs/description`
- Copilot branches: `copilot/task-description`

### Commit Messages
- Use conventional commit format
- Be descriptive but concise
- Examples:
  - `feat: add document encryption endpoint`
  - `fix: resolve Neo4j connection timeout`
  - `docs: update API documentation`
  - `test: add tests for vault service`

## 📖 Additional Resources

- [Architecture Documentation](/ARCHITECTURE.md)
- [Setup Guide](/SETUP.md)
- [Vault API Documentation](/docs/vault-api.md)
- [Vault Quick Start](/docs/vault-quickstart.md)
- [ConductMe README](/conductme/README.md)

## ⚡ Performance Considerations

- ConductMe: Lazy load components, optimize bundle size
- Python: Use async operations for I/O-bound tasks
- Database: Add indexes for frequently queried fields
- Cache responses where appropriate

## 🐛 Common Issues & Solutions

### Port Already in Use
```bash
# Check what's using the port
lsof -i :3001  # ConductMe
lsof -i :8000  # Python
```

### Docker Services Not Starting
```bash
make down && make up
docker-compose logs
```

### Neo4j Connection Issues
```bash
docker ps | grep neo4j
docker logs honestly-neo4j
```

## 💡 Best Practices

1. **Always run tests** after making code changes
2. **Use the existing code style** in each component
3. **Keep changes minimal** and focused on the task
4. **Document complex logic** with clear comments
5. **Validate input** at API boundaries
6. **Handle errors gracefully** with meaningful messages
7. **Use type safety** (TypeScript types, Python type hints, Pydantic models)
8. **Follow the DRY principle** - avoid code duplication
9. **Write self-documenting code** with clear naming
10. **Test edge cases** and error conditions

## 🎓 Learning Resources

- **Next.js**: https://nextjs.org/docs
- **FastAPI**: https://fastapi.tiangolo.com/
- **Neo4j Cypher**: https://neo4j.com/developer/cypher/
- **React**: https://react.dev/
- **Hyperledger Fabric**: https://hyperledger-fabric.readthedocs.io/

---

**Remember**: This is a development MVP. Production deployment requires additional security hardening, proper authentication, production-grade blockchain network, and comprehensive monitoring.
