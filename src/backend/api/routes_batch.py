import os
import time
import io
import json
import uuid
import pandas as pd
import numpy as np
from datetime import datetime
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse, StreamingResponse

from ml.predictor import model_registry
from database import (
    UPLOADS_DIR,
    SCORED_DIR,
    save_batch_run,
    get_all_batches,
    get_batch_by_id
)

router = APIRouter(prefix="/api", tags=["batch"])

@router.post("/upload-csv")
async def upload_csv(
    file: UploadFile = File(...),
    model_type: str = Form("auto")
):
    """
    High-speed vectorized batch inference on uploaded telemetry CSV.
    Scores up to 5,000+ rows in < 1 second.
    Persists raw upload + scored CSV to disk & logs metadata to SQLite.
    """
    t_start = time.time()
    
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported (.csv)")

    try:
        content = await file.read()
        # Parse CSV into pandas dataframe
        df = pd.read_csv(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV file: {str(e)}")

    row_count = len(df)
    if row_count == 0:
        raise HTTPException(status_code=400, detail="CSV file is empty")

    # Run Vectorized ML Batch Prediction
    batch_result = model_registry.predict_batch(df, model_type=model_type)

    fail_probs = batch_result["failure_probabilities"]
    readiness_scores = batch_result["readiness_scores"]
    predicted_ruls = batch_result["predicted_ruls"]
    statuses = batch_result["statuses"]
    applied_model = batch_result["model_applied"]

    # Append prediction columns to dataframe
    df_scored = df.copy()
    df_scored["ml_failure_prob"] = np.round(fail_probs, 4)
    df_scored["readiness_score"] = readiness_scores
    df_scored["predicted_rul_days"] = predicted_ruls
    df_scored["status"] = statuses
    df_scored["ml_model_applied"] = applied_model

    t_end = time.time()
    execution_time_ms = round((t_end - t_start) * 1000, 2)

    # Counts and aggregations
    critical_count = statuses.count("critical")
    watch_count = statuses.count("watch")
    ready_count = statuses.count("ready")
    avg_readiness = round(float(np.mean(readiness_scores)), 1)
    avg_rul = round(float(np.mean(predicted_ruls)), 1)

    # Save to disk folders
    batch_id = f"BATCH-{int(time.time())}-{uuid.uuid4().hex[:6].upper()}"
    timestamp_str = datetime.now().strftime("%Y%m%d_%H%M%S")
    safe_filename = file.filename.replace(" ", "_").replace(".csv", "")
    
    raw_save_path = os.path.join(UPLOADS_DIR, f"{timestamp_str}_{safe_filename}.csv")
    scored_save_path = os.path.join(SCORED_DIR, f"{timestamp_str}_scored_{safe_filename}.csv")

    with open(raw_save_path, "wb") as f_raw:
        f_raw.write(content)

    df_scored.to_csv(scored_save_path, index=False)

    # Prepare sampled telemetry time points for frontend visual rendering (up to 30 points)
    sample_stride = max(1, row_count // 30)
    sampled_indices = list(range(0, row_count, sample_stride))[:30]
    
    trend_points = []
    for idx in sampled_indices:
        row = df_scored.iloc[idx]
        trend_points.append({
            "index": int(idx),
            "readiness": int(row["readiness_score"]),
            "failure_prob": float(row["ml_failure_prob"]),
            "rul": int(row["predicted_rul_days"]),
            "status": str(row["status"])
        })

    # High risk assets summary (top 10 lowest readiness / highest risk)
    high_risk_df = df_scored.sort_values(by="ml_failure_prob", ascending=False).head(10)
    high_risk_list = []
    for _, r in high_risk_df.iterrows():
        high_risk_list.append({
            "row_index": int(r.name),
            "readiness": int(r["readiness_score"]),
            "failure_prob": float(r["ml_failure_prob"]),
            "rul": int(r["predicted_rul_days"]),
            "status": str(r["status"])
        })

    graph_summary = {
        "trend_points": trend_points,
        "high_risk_alerts": high_risk_list,
        "model_applied": applied_model
    }

    # Save metadata to SQLite Database
    batch_record = {
        "id": batch_id,
        "filename": file.filename,
        "model_type": batch_result["model_type"],
        "row_count": row_count,
        "critical_count": critical_count,
        "watch_count": watch_count,
        "ready_count": ready_count,
        "avg_readiness": avg_readiness,
        "avg_rul": avg_rul,
        "execution_time_ms": execution_time_ms,
        "raw_file_path": raw_save_path,
        "scored_file_path": scored_save_path,
        "graph_summary": graph_summary
    }
    save_batch_run(batch_record)

    return {
        "success": True,
        "batch_id": batch_id,
        "filename": file.filename,
        "row_count": row_count,
        "execution_time_ms": execution_time_ms,
        "execution_time_seconds": round(execution_time_ms / 1000, 3),
        "model_applied": applied_model,
        "critical_count": critical_count,
        "watch_count": watch_count,
        "ready_count": ready_count,
        "avg_readiness": avg_readiness,
        "avg_rul": avg_rul,
        "saved_to_laptop": {
            "raw_file": raw_save_path,
            "scored_file": scored_save_path,
            "database": "src/backend/data/defense_telemetry.db"
        },
        "graph_summary": graph_summary
    }

@router.get("/batches")
def list_batches():
    """Returns list of historical uploaded telemetry batches from SQLite."""
    return get_all_batches()

@router.get("/batches/{batch_id}")
def get_batch(batch_id: str):
    """Returns details of a specific batch run."""
    batch = get_batch_by_id(batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    return batch

@router.get("/batches/{batch_id}/download")
def download_scored_csv(batch_id: str):
    """Downloads the scored CSV file from disk."""
    batch = get_batch_by_id(batch_id)
    if not batch or not os.path.exists(batch["scored_file_path"]):
        raise HTTPException(status_code=404, detail="Scored CSV file not found on disk")
    return FileResponse(
        batch["scored_file_path"],
        media_type="text/csv",
        filename=os.path.basename(batch["scored_file_path"])
    )

@router.get("/sample-csv")
def get_sample_csv(rows: int = 5000, model: str = "armor"):
    """
    Generates an instant 5,000-row realistic telemetry CSV for demonstration/benchmarking.
    """
    rows = min(10000, max(10, rows))
    np.random.seed(42)

    if model == "bearing":
        n_ready = int(rows * 0.70)
        n_watch = int(rows * 0.15)
        n_crit = rows - n_ready - n_watch

        vibs = np.concatenate([
            np.random.uniform(0.04, 0.08, n_ready),   # Healthy: nominal baseline RMS
            np.random.uniform(0.12, 0.22, n_watch),   # Watchlist: mild vibration escalation
            np.random.uniform(0.40, 1.80, n_crit)    # Critical: severe bearing fault
        ])
        np.random.shuffle(vibs)

        df = pd.DataFrame({
            "asset_id": [f"AST-BRG-{i:05d}" for i in range(1, rows + 1)],
            "vibration_g_rms": np.round(vibs, 4),
            "bearing_temp_c": np.round(np.random.uniform(35.0, 95.0, rows), 1),
            "shaft_rpm": np.random.randint(1200, 3600, rows),
            "kurtosis": np.round(3.0 + vibs * 2.5 + np.random.uniform(-0.2, 0.4, rows), 2)
        })
    elif model == "turbofan":
        df = pd.DataFrame({
            "engine_id": [f"ENG-TURBO-{i:05d}" for i in range(1, rows + 1)],
            "altitude_ft": np.random.uniform(10000, 35000, rows),
            "mach_number": np.random.uniform(0.4, 0.95, rows),
            "total_temp_k": np.random.uniform(500, 650, rows),
            "combustor_pres_psi": np.random.uniform(300, 550, rows),
            "bleed_enthalpy": np.random.uniform(380, 420, rows),
            "bypass_ratio": np.random.uniform(5.5, 8.5, rows)
        })
    else: # armor / ai4i
        df = pd.DataFrame({
            "vehicle_id": [f"ARMOR-T90-{i:05d}" for i in range(1, rows + 1)],
            "Air temperature [K]": np.round(np.random.uniform(295.0, 308.0, rows), 1),
            "Process temperature [K]": np.round(np.random.uniform(305.0, 318.0, rows), 1),
            "Rotational speed [rpm]": np.random.randint(1200, 2800, rows),
            "Torque [Nm]": np.round(np.random.uniform(15.0, 85.0, rows), 1),
            "Tool wear [min]": np.random.randint(0, 250, rows)
        })

    buffer = io.StringIO()
    df.to_csv(buffer, index=False)
    buffer.seek(0)

    filename = f"sample_telemetry_{model}_{rows}rows.csv"
    return StreamingResponse(
        io.BytesIO(buffer.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
