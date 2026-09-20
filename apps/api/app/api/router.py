from fastapi import APIRouter

from app.api.v1 import admin, auth, dashboard, map as map_api, reports, routes

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth.router)
api_router.include_router(reports.router)
api_router.include_router(map_api.router)
api_router.include_router(dashboard.router)
api_router.include_router(routes.router)
api_router.include_router(admin.router)
