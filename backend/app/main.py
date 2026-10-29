from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.router import api_router
from app.core.config import settings
from app.core.errors import (
    LedgerException,
    generic_exception_handler,
    ledger_exception_handler,
    validation_exception_handler,
)
from app.db.session import Base, engine, SessionLocal
from app.models import Account, Transaction, Transfer


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure tables exist on startup
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description=(
        "Production-grade financial transaction management API with mathematical integrity guarantees, "
        "atomic balance updates, immutable transaction ledger records, row-level locking, "
        "and real-time balance reconciliation."
    ),
    openapi_tags=[
        {"name": "Accounts", "description": "Account provisioning and account-scoped transaction histories."},
        {"name": "Transactions", "description": "Immutable ledger creation and paginated queries."},
        {"name": "Transfers", "description": "Atomic two-legged money transfers between accounts."},
        {"name": "Integrity", "description": "Real-time mathematical ledger reconciliation and audit reporting."},
        {"name": "Analytics", "description": "Command Center live liquidity and volume diagnostics."},
    ],
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permits local Vite dev server and production clients
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register custom exception handlers for uniform error envelope
app.add_exception_handler(LedgerException, ledger_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)

# Include v1 routes
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/", tags=["System"])
def root_status():
    return {
        "system": "LEDGER//ONE",
        "tagline": "Every balance has a reason.",
        "version": settings.PROJECT_VERSION,
        "status": "OPERATIONAL",
        "documentation": "/docs",
        "api_v1_base": settings.API_V1_PREFIX,
    }
