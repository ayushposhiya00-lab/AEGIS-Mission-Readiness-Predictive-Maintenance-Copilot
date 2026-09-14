from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
from ml.predictor import model_registry

router = APIRouter(prefix="/api/predict", tags=["prediction"])

class BearingPredictRequest(BaseModel):
    rms_vibration: float = 2.4
    kurtosis: float = 3.5
    peak: float = 3.0

class ArmorPredictRequest(BaseModel):
    air_temp_k: float = 300.0
    process_temp_k: float = 310.0
    speed_rpm: float = 1500.0
    torque_nm: float = 40.0
    tool_wear_min: float = 100.0

class TurbofanPredictRequest(BaseModel):
    sensor_vector: Optional[List[float]] = None

@router.post("/bearing")
def predict_bearing_endpoint(req: BearingPredictRequest):
    """Run inference with IMS Bearing ML Model"""
    result = model_registry.predict_bearing(
        rms_vibration=req.rms_vibration,
        kurtosis=req.kurtosis,
        peak=req.peak
    )
    return {
        "model": "IMS Bearing Dataset (NASA / UC)",
        "input": req.dict(),
        "prediction": result
    }

@router.post("/armor")
def predict_armor_endpoint(req: ArmorPredictRequest):
    """Run inference with AI4I 2020 Predictive Maintenance Model"""
    result = model_registry.predict_ground_armor(
        air_temp_k=req.air_temp_k,
        process_temp_k=req.process_temp_k,
        speed_rpm=req.speed_rpm,
        torque_nm=req.torque_nm,
        tool_wear_min=req.tool_wear_min
    )
    return {
        "model": "AI4I 2020 Predictive Maintenance (UCI ML)",
        "input": req.dict(),
        "prediction": result
    }

@router.post("/turbofan")
def predict_turbofan_endpoint(req: TurbofanPredictRequest):
    """Run inference with N-CMAPSS Turbofan Failure Model"""
    result = model_registry.predict_engine_turbofan(sensor_vector=req.sensor_vector)
    return {
        "model": "N-CMAPSS Turbofan Engine RUL (NASA)",
        "prediction": result
    }
