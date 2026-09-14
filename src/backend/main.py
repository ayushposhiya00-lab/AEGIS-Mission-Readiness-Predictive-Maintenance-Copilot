import os
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from api.routes_assets import router as assets_router
from api.routes_predict import router as predict_router
from api.routes_batch import router as batch_router
from api.routes_chat import router as chat_router
from api.routes_ws import router as ws_router, telemetry_stream_worker
from database import init_db
from ml.predictor import model_registry
import asyncio

# Initialize local SQLite telemetry database and folders
init_db()

app = FastAPI(
    title="Mission Readiness & Predictive Maintenance Copilot Backend",
    description="Defense AI Telemetry API powered by IMS Bearing, N-CMAPSS, and AI4I 2020 ML Models",
    version="1.0.0"
)

# Enable CORS for frontend Vite dev server (port 5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Start background WebSocket telemetry stream generator
@app.on_event("startup")
async def startup_event():
    asyncio.create_task(telemetry_stream_worker())

# Mount API Routers
app.include_router(assets_router)
app.include_router(predict_router)
app.include_router(batch_router)
app.include_router(chat_router)
app.include_router(ws_router)

@app.get("/")
def root():
    return {
        "status": "online",
        "system": "AEGIS-DEFENSE PREDICTIVE MAINTENANCE PLATFORM",
        "models_loaded": {
            "ai4i_ground_armor": model_registry.ai4i_model is not None,
            "ims_bearing_rotary": model_registry.bearing_model is not None,
            "ncmapss_turbofan_failure": model_registry.failure_model is not None,
        },
        "endpoints": [
            "/api/assets",
            "/api/assets/{id}",
            "/api/metrics",
            "/api/work-orders",
            "/api/predict/bearing",
            "/api/predict/armor",
            "/api/predict/turbofan"
        ],
        "docs_url": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
