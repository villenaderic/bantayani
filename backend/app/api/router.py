from fastapi import APIRouter

from app.auth.routes import router as auth_router
from app.farms.routes import router as farms_router
from app.detections.routes import router as detections_router
from app.analytics.routes import router as analytics_router

api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(farms_router, prefix="/farms", tags=["farms"])
api_router.include_router(detections_router, prefix="/detections", tags=["detections"])
api_router.include_router(analytics_router, prefix="/analytics", tags=["analytics"])
