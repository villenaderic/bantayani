from fastapi import APIRouter

from app.auth.routes import router as auth_router
from app.farms.routes import router as farms_router
from app.detections.routes import router as detections_router
from app.analytics.routes import router as analytics_router
from app.disasters.routes import router as disasters_router
from app.audit.routes import router as audit_router
from app.alerts.routes import router as alerts_router

api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(farms_router, prefix="/farms", tags=["farms"])
api_router.include_router(detections_router, prefix="/detections", tags=["detections"])
api_router.include_router(analytics_router, prefix="/analytics", tags=["analytics"])
api_router.include_router(disasters_router, prefix="/disasters", tags=["disasters"])
api_router.include_router(audit_router, prefix="/audit-logs", tags=["audit"])
api_router.include_router(alerts_router, prefix="/alerts", tags=["alerts"])
