from fastapi import APIRouter
from app.api.v1.accounts import router as accounts_router
from app.api.v1.transactions import router as transactions_router
from app.api.v1.transfers import router as transfers_router
from app.api.v1.integrity import router as integrity_router
from app.api.v1.analytics import router as analytics_router

api_router = APIRouter()
api_router.include_router(accounts_router)
api_router.include_router(transactions_router)
api_router.include_router(transfers_router)
api_router.include_router(integrity_router)
api_router.include_router(analytics_router)
