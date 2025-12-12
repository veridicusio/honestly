"""
Honestly API - Cloud Run Edition
Lightweight version that starts without external dependencies
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Honestly API",
    description="Privacy-preserving identity verification with zero-knowledge proofs",
    version="1.0.0",
)

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {
        "service": "Honestly API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
        "features": [
            "Zero-knowledge proofs",
            "Privacy-preserving identity",
            "Blockchain anchoring",
        ],
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}


@app.get("/health/live")
async def health_live():
    return {"status": "ok"}


@app.get("/health/ready")
async def health_ready():
    return {"status": "ok", "mode": "cloud-run"}


@app.get("/api/info")
async def api_info():
    return {
        "name": "Honestly",
        "description": "Privacy-preserving identity verification",
        "capabilities": [
            "age_verification",
            "document_authenticity",
            "identity_proofs",
        ],
        "proof_types": ["groth16", "plonk"],
        "blockchain": ["solana", "base", "arbitrum"],
    }


# Import vault routes if available
try:
    from api.vault_routes import router as vault_router
    app.include_router(vault_router)
except ImportError:
    pass

# Import monitoring routes if available  
try:
    from api.monitoring import router as monitoring_router
    app.include_router(monitoring_router)
except ImportError:
    pass
