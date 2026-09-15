import os
import sqlite3
import json
from datetime import datetime

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BACKEND_DIR, "data")
UPLOADS_DIR = os.path.join(DATA_DIR, "uploads")
SCORED_DIR = os.path.join(DATA_DIR, "scored_batches")
DB_PATH = os.path.join(DATA_DIR, "defense_telemetry.db")

# Ensure storage directories exist
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(UPLOADS_DIR, exist_ok=True)
os.makedirs(SCORED_DIR, exist_ok=True)

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Custom Registered Assets
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS custom_assets (
        id TEXT PRIMARY KEY,
        callsign TEXT,
        name TEXT,
        type TEXT,
        category TEXT,
        status TEXT,
        readiness_score INTEGER,
        predicted_rul INTEGER,
        operational_base TEXT,
        crew_assigned TEXT,
        last_service_date TEXT,
        next_scheduled_service TEXT,
        flight_hours INTEGER,
        ml_model_applied TEXT,
        failure_risk_description TEXT,
        copilot_analysis TEXT,
        contributing_sensors_json TEXT,
        action_plan_json TEXT,
        service_history_json TEXT,
        telemetry_history_json TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 2. Telemetry Batch Ingestion Runs
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS telemetry_batches (
        id TEXT PRIMARY KEY,
        filename TEXT,
        model_type TEXT,
        row_count INTEGER,
        critical_count INTEGER,
        watch_count INTEGER,
        ready_count INTEGER,
        avg_readiness REAL,
        avg_rul REAL,
        execution_time_ms REAL,
        raw_file_path TEXT,
        scored_file_path TEXT,
        graph_summary_json TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 3. Dispatched Maintenance Work Orders
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS work_orders (
        id TEXT PRIMARY KEY,
        asset_id TEXT,
        asset_name TEXT,
        task TEXT,
        priority TEXT,
        due_in_hours INTEGER,
        assigned_crew TEXT,
        parts_status TEXT,
        status TEXT,
        estimated_downtime TEXT,
        impact TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    conn.commit()
    conn.close()
    print(f"[Database] SQLite telemetry store initialized at {DB_PATH}")

# Ensure tables exist on load
init_db()

def save_custom_asset(asset_dict):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT OR REPLACE INTO custom_assets (
        id, callsign, name, type, category, status, readiness_score, predicted_rul,
        operational_base, crew_assigned, last_service_date, next_scheduled_service,
        flight_hours, ml_model_applied, failure_risk_description, copilot_analysis,
        contributing_sensors_json, action_plan_json, service_history_json,
        telemetry_history_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        asset_dict.get("id"),
        asset_dict.get("callsign"),
        asset_dict.get("name"),
        asset_dict.get("type"),
        asset_dict.get("category"),
        asset_dict.get("status"),
        int(asset_dict.get("readinessScore", 85)),
        int(asset_dict.get("predictedRUL", 30)),
        asset_dict.get("operationalBase"),
        asset_dict.get("crewAssigned"),
        asset_dict.get("lastServiceDate"),
        asset_dict.get("nextScheduledService"),
        int(asset_dict.get("flightHours", 100)),
        asset_dict.get("mlModelApplied"),
        asset_dict.get("failureRiskDescription"),
        asset_dict.get("copilotAnalysis"),
        json.dumps(asset_dict.get("contributingSensors", [])),
        json.dumps(asset_dict.get("actionPlan", [])),
        json.dumps(asset_dict.get("serviceHistory", [])),
        json.dumps(asset_dict.get("telemetryHistory", []))
    ))
    conn.commit()
    conn.close()

def get_all_custom_assets():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM custom_assets ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()

    assets = []
    for r in rows:
        assets.append({
            "id": r["id"],
            "callsign": r["callsign"],
            "name": r["name"],
            "type": r["type"],
            "category": r["category"],
            "status": r["status"],
            "readinessScore": r["readiness_score"],
            "predictedRUL": r["predicted_rul"],
            "operationalBase": r["operational_base"],
            "crewAssigned": r["crew_assigned"],
            "lastServiceDate": r["last_service_date"],
            "nextScheduledService": r["next_scheduled_service"],
            "flightHours": r["flight_hours"],
            "mlModelApplied": r["ml_model_applied"],
            "failureRiskDescription": r["failure_risk_description"],
            "copilotAnalysis": r["copilot_analysis"],
            "contributingSensors": json.loads(r["contributing_sensors_json"] or "[]"),
            "actionPlan": json.loads(r["action_plan_json"] or "[]"),
            "serviceHistory": json.loads(r["service_history_json"] or "[]"),
            "telemetryHistory": json.loads(r["telemetry_history_json"] or "[]"),
        })
    return assets

def save_batch_run(batch_dict):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT OR REPLACE INTO telemetry_batches (
        id, filename, model_type, row_count, critical_count, watch_count,
        ready_count, avg_readiness, avg_rul, execution_time_ms, raw_file_path,
        scored_file_path, graph_summary_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        batch_dict["id"],
        batch_dict["filename"],
        batch_dict["model_type"],
        batch_dict["row_count"],
        batch_dict["critical_count"],
        batch_dict["watch_count"],
        batch_dict["ready_count"],
        batch_dict["avg_readiness"],
        batch_dict["avg_rul"],
        batch_dict["execution_time_ms"],
        batch_dict["raw_file_path"],
        batch_dict["scored_file_path"],
        json.dumps(batch_dict.get("graph_summary", {}))
    ))
    conn.commit()
    conn.close()

def get_all_batches():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM telemetry_batches ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()

    batches = []
    for r in rows:
        batches.append({
            "id": r["id"],
            "filename": r["filename"],
            "model_type": r["model_type"],
            "row_count": r["row_count"],
            "critical_count": r["critical_count"],
            "watch_count": r["watch_count"],
            "ready_count": r["ready_count"],
            "avg_readiness": r["avg_readiness"],
            "avg_rul": r["avg_rul"],
            "execution_time_ms": r["execution_time_ms"],
            "raw_file_path": r["raw_file_path"],
            "scored_file_path": r["scored_file_path"],
            "created_at": r["created_at"]
        })
    return batches

def get_batch_by_id(batch_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM telemetry_batches WHERE id = ?", (batch_id,))
    r = cursor.fetchone()
    conn.close()

    if not r:
        return None

    return {
        "id": r["id"],
        "filename": r["filename"],
        "model_type": r["model_type"],
        "row_count": r["row_count"],
        "critical_count": r["critical_count"],
        "watch_count": r["watch_count"],
        "ready_count": r["ready_count"],
        "avg_readiness": r["avg_readiness"],
        "avg_rul": r["avg_rul"],
        "execution_time_ms": r["execution_time_ms"],
        "raw_file_path": r["raw_file_path"],
        "scored_file_path": r["scored_file_path"],
        "graph_summary": json.loads(r["graph_summary_json"] or "{}"),
        "created_at": r["created_at"]
    }

def save_work_order(order):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT OR REPLACE INTO work_orders (
        id, asset_id, asset_name, task, priority, due_in_hours,
        assigned_crew, parts_status, status, estimated_downtime, impact
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        order.get("id"),
        order.get("assetId") or order.get("asset_id"),
        order.get("assetName") or order.get("asset_name"),
        order.get("task"),
        order.get("priority", "high"),
        int(order.get("dueInHours") or order.get("due_in_hours") or 24),
        order.get("assignedCrew") or order.get("assigned_crew") or "Central Defense Depot Unit",
        order.get("partsStatus") or order.get("parts_status") or "Reserved In Stock",
        order.get("status") or "Dispatched to Depot",
        order.get("estimatedDowntime") or order.get("estimated_downtime") or "8 hrs",
        order.get("impact") or "High (Sortie Clearance Hold)"
    ))
    conn.commit()
    conn.close()

def get_all_persisted_work_orders():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM work_orders ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()

    orders = []
    for r in rows:
        orders.append({
            "id": r["id"],
            "assetId": r["asset_id"],
            "assetName": r["asset_name"],
            "task": r["task"],
            "priority": r["priority"],
            "dueInHours": r["due_in_hours"],
            "assignedCrew": r["assigned_crew"],
            "partsStatus": r["parts_status"],
            "status": r["status"],
            "estimatedDowntime": r["estimated_downtime"],
            "impact": r["impact"],
            "isPersisted": True,
            "created_at": r["created_at"]
        })
    return orders

