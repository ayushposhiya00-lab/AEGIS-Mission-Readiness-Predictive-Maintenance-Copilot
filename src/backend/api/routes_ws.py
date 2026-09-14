import asyncio
import json
import time
import random
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from pydantic import BaseModel

from ml.predictor import model_registry
from ml.explainer import xai_explainer

router = APIRouter(tags=["telemetry_stream"])

class AnomalyInjectRequest(BaseModel):
    asset_id: str = "A-317"
    sensor: str = "vibration"
    spike_value: float = 5.45
    duration_seconds: int = 45

# Comprehensive Fleet Monitored Platforms Definitions (All 26 Defense Platforms)
INITIAL_FLEET_BASELINES = {
    # Combat Aircraft
    "A-317": { "name": "Sukhoi Su-30MKI Multi-Role Fighter", "type": "Aircraft", "category": "Combat Aircraft", "model": "bearing", "base_vib": 4.82, "base_pres": 2640, "base_temp": 742 },
    "A-108": { "name": "Dassault Rafale DH Twin-Seat Fighter", "type": "Aircraft", "category": "Combat Aircraft", "model": "turbofan", "base_vib": 0.92, "base_pres": 3020, "base_temp": 685 },
    "A-205": { "name": "HAL Tejas LCA Mk-1A Light Fighter", "type": "Aircraft", "category": "Combat Aircraft", "model": "turbofan", "base_vib": 2.45, "base_pres": 2810, "base_temp": 718 },
    "A-412": { "name": "Dassault Mirage 2000-5 Tactical Fighter", "type": "Aircraft", "category": "Combat Aircraft", "model": "turbofan", "base_vib": 1.65, "base_pres": 2780, "base_temp": 705 },
    "A-502": { "name": "SEPECAT Jaguar IM Maritime Strike", "type": "Aircraft", "category": "Combat Aircraft", "model": "turbofan", "base_vib": 1.20, "base_pres": 2990, "base_temp": 655 },
    "A-711": { "name": "AH-64E Apache Guardian Attack Helicopter", "type": "Aircraft", "category": "Combat Aircraft", "model": "bearing", "base_vib": 4.95, "base_pres": 2580, "base_temp": 720 },
    "A-720": { "name": "Mi-17V5 Tactical Transport Helicopter", "type": "Aircraft", "category": "Combat Aircraft", "model": "bearing", "base_vib": 1.70, "base_pres": 2950, "base_temp": 660 },

    # Ground Armored Fleet
    "V-102": { "name": "Arjun Mk-II Main Battle Tank", "type": "Ground Armor", "category": "Ground Armored Fleet", "model": "armor", "base_vib": 3.10, "base_pres": 2610, "base_temp": 318, "rpm": 2050, "torque": 72.4, "wear": 215 },
    "V-108": { "name": "T-90 Bhishma Main Battle Tank", "type": "Ground Armor", "category": "Ground Armored Fleet", "model": "armor", "base_vib": 1.40, "base_pres": 2990, "base_temp": 305, "rpm": 1500, "torque": 42.0, "wear": 65 },
    "V-210": { "name": "Autonomous Combat UGV 'Sentinel'", "type": "Ground Armor", "category": "Ground Armored Fleet", "model": "armor", "base_vib": 3.80, "base_pres": 2550, "base_temp": 322, "rpm": 2950, "torque": 82.0, "wear": 240 },
    "V-305": { "name": "K9 Vajra-T Self-Propelled Howitzer", "type": "Ground Armor", "category": "Ground Armored Fleet", "model": "armor", "base_vib": 2.20, "base_pres": 2780, "base_temp": 312, "rpm": 2200, "torque": 58.0, "wear": 160 },
    "V-440": { "name": "BMP-2 Sarath Infantry Combat Vehicle", "type": "Ground Armor", "category": "Ground Armored Fleet", "model": "armor", "base_vib": 1.60, "base_pres": 2950, "base_temp": 306, "rpm": 1650, "torque": 44.0, "wear": 75 },
    "V-512": { "name": "NAMICA Tank Destroyer Missile Carrier", "type": "Ground Armor", "category": "Ground Armored Fleet", "model": "armor", "base_vib": 1.85, "base_pres": 2910, "base_temp": 308, "rpm": 1700, "torque": 46.0, "wear": 90 },
    "V-620": { "name": "WhAP 8x8 Armored Amphibious Vehicle", "type": "Ground Armor", "category": "Ground Armored Fleet", "model": "armor", "base_vib": 2.30, "base_pres": 2840, "base_temp": 314, "rpm": 1950, "torque": 53.0, "wear": 135 },
    "V-801": { "name": "Bridge Layer Tank (BLT) Kartik", "type": "Ground Armor", "category": "Ground Armored Fleet", "model": "armor", "base_vib": 1.50, "base_pres": 2980, "base_temp": 304, "rpm": 1550, "torque": 41.0, "wear": 70 },

    # Naval Strike Group
    "N-089": { "name": "INS Mormugao Stealth Guided Destroyer", "type": "Naval", "category": "Naval Strike Group", "model": "bearing", "base_vib": 1.30, "base_pres": 3010, "base_temp": 665 },
    "N-011": { "name": "INS Vikrant Aircraft Carrier (IAC-1)", "type": "Naval", "category": "Naval Strike Group", "model": "bearing", "base_vib": 2.85, "base_pres": 2980, "base_temp": 680 },
    "N-045": { "name": "INS Kolkata Guided Missile Destroyer", "type": "Naval", "category": "Naval Strike Group", "model": "turbofan", "base_vib": 1.45, "base_pres": 2990, "base_temp": 672 },
    "N-072": { "name": "INS Arihant Ballistic Submarine", "type": "Naval", "category": "Naval Strike Group", "model": "bearing", "base_vib": 0.90, "base_pres": 3050, "base_temp": 640 },
    "N-105": { "name": "INS Talwar Guided Missile Frigate", "type": "Naval", "category": "Naval Strike Group", "model": "bearing", "base_vib": 2.40, "base_pres": 2860, "base_temp": 690 },
    "N-220": { "name": "INS Kalvari Scorpene Submarine", "type": "Naval", "category": "Naval Strike Group", "model": "bearing", "base_vib": 1.10, "base_pres": 3020, "base_temp": 650 },

    # Air & Missile Defense
    "D-204": { "name": "S-400 Triumf Air Defense Battery", "type": "Air Defense", "category": "Air & Missile Defense", "model": "bearing", "base_vib": 1.05, "base_pres": 3040, "base_temp": 655 },
    "D-118": { "name": "Akash Prime SAM Missile System", "type": "Air Defense", "category": "Air & Missile Defense", "model": "bearing", "base_vib": 3.80, "base_pres": 2720, "base_temp": 695 },
    "D-309": { "name": "MRSAM (Barak-8) Air Defense Battery", "type": "Air Defense", "category": "Air & Missile Defense", "model": "bearing", "base_vib": 0.85, "base_pres": 3050, "base_temp": 645 },
    "D-401": { "name": "Pinaka Multi-Barrel Rocket Launcher", "type": "Air Defense", "category": "Air & Missile Defense", "model": "bearing", "base_vib": 2.30, "base_pres": 2820, "base_temp": 675 },
    "E-045": { "name": "Aux Gas Turbine Generator AGT-1500", "type": "Air Defense", "category": "Air & Missile Defense", "model": "turbofan", "base_vib": 2.30, "base_pres": 2850, "base_temp": 812 }
}

# Track assets currently in post-repair "nominal hold" before drift resumes
# key = asset_id, value = expiry timestamp
_repair_hold: Dict[str, float] = {}

class TelemetryEngine:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.active_anomalies: Dict[str, Dict[str, Any]] = {}
        self.fleet_state: Dict[str, Dict[str, Any]] = {}
        self.latest_metrics: Dict[str, Any] = {}
        self.init_fleet_state()

    def init_fleet_state(self):
        for aid, meta in INITIAL_FLEET_BASELINES.items():
            self.fleet_state[aid] = {
                "id": aid,
                "name": meta["name"],
                "type": meta["type"],
                "category": meta["category"],
                "model_type": meta["model"],
                "vibration": meta["base_vib"],
                "pressure": meta["base_pres"],
                "temp": meta["base_temp"],
                "rpm": meta.get("rpm", 1800),
                "torque": meta.get("torque", 50.0),
                "wear": meta.get("wear", 100),
                "readinessScore": 85,
                "predictedRUL": 30,
                "status": "ready",
                "failureProb": 0.15,
                "isSpike": False,
                "lastUpdated": datetime.utcnow().strftime("%H:%M:%S")
            }
        self.update_tick()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"[WebSocket] Client connected. Total active: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            print(f"[WebSocket] Client disconnected. Total active: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        dead = []
        for conn in self.active_connections:
            try:
                await conn.send_json(message)
            except Exception:
                dead.append(conn)
        for d in dead:
            self.disconnect(d)

    def get_current_reading(self, asset_id: str, base_vib: Optional[float] = None, base_pres: Optional[float] = None, base_temp: Optional[float] = None) -> Dict[str, Any]:
        aid = asset_id.upper()
        if aid in self.fleet_state:
            return self.fleet_state[aid]
        return {
            "id": aid,
            "vibration": base_vib or 1.8,
            "pressure": base_pres or 3000,
            "temp": base_temp or 680,
            "isSpike": False
        }

    def inject_anomaly(self, asset_id: str, sensor: str, spike_value: float, duration_seconds: int = 45):
        aid = asset_id.upper()
        expires_at = time.time() + duration_seconds
        name = INITIAL_FLEET_BASELINES.get(aid, {}).get("name", aid)
        self.active_anomalies[aid] = {
            "asset_id": aid,
            "asset_name": name,
            "sensor": sensor,
            "spike_value": spike_value,
            "expires_at": expires_at,
            "duration": duration_seconds,
            "injected_at": datetime.utcnow().isoformat()
        }
        if aid in self.fleet_state:
            self.fleet_state[aid][sensor] = spike_value
            self.fleet_state[aid]["isSpike"] = True
            self.update_tick()
        return self.active_anomalies[aid]

    def reset_anomaly(self, asset_id: Optional[str] = None):
        if asset_id:
            aid = asset_id.upper()
            self.active_anomalies.pop(aid, None)
            if aid in self.fleet_state and aid in INITIAL_FLEET_BASELINES:
                self.fleet_state[aid]["isSpike"] = False
                self.fleet_state[aid]["vibration"] = INITIAL_FLEET_BASELINES[aid]["base_vib"]
                self.fleet_state[aid]["pressure"] = INITIAL_FLEET_BASELINES[aid]["base_pres"]
                self.fleet_state[aid]["temp"] = INITIAL_FLEET_BASELINES[aid]["base_temp"]
        else:
            self.active_anomalies.clear()
            for aid, meta in INITIAL_FLEET_BASELINES.items():
                if aid in self.fleet_state:
                    self.fleet_state[aid]["isSpike"] = False
                    self.fleet_state[aid]["vibration"] = meta["base_vib"]
                    self.fleet_state[aid]["pressure"] = meta["base_pres"]
                    self.fleet_state[aid]["temp"] = meta["base_temp"]
        self.update_tick()

    def update_tick(self) -> Tuple[Dict[str, Any], List[Dict[str, Any]]]:
        """
        Runs live IoT sensor drift, genuine ML predictions, and authentic XAI attributions on every 1.25s tick.
        """
        now = time.time()
        anomaly_alerts = []

        for aid, meta in INITIAL_FLEET_BASELINES.items():
            curr = self.fleet_state[aid]
            active_anom = self.active_anomalies.get(aid)
            is_spiked = False

            # Check if active anomaly applies
            if active_anom:
                if now < active_anom["expires_at"]:
                    is_spiked = True
                    s_type = active_anom["sensor"]
                    if s_type == "vibration":
                        curr["vibration"] = round(active_anom["spike_value"] + random.uniform(-0.05, 0.05), 2)
                    elif s_type == "pressure":
                        curr["pressure"] = round(active_anom["spike_value"] + random.uniform(-15, 15), 0)
                    elif s_type == "temp":
                        curr["temp"] = round(active_anom["spike_value"] + random.uniform(-4, 4), 1)
                    elif s_type == "torque":
                        curr["torque"] = round(active_anom["spike_value"] + random.uniform(-1.5, 1.5), 1)
                else:
                    self.active_anomalies.pop(aid, None)
                    curr["isSpike"] = False

            curr["isSpike"] = is_spiked

            # Post-repair hold: suppress drift for 10-13s after engineer confirmation
            in_repair_hold = aid in _repair_hold and now < _repair_hold[aid]
            if in_repair_hold and not is_spiked:
                # Keep values frozen at nominal during hold window; clean up when expired
                curr["isSpike"] = False
                pass  # Skip all drift this tick
            elif aid in _repair_hold and now >= _repair_hold[aid]:
                # Hold expired — remove and let drift resume naturally
                del _repair_hold[aid]

            # Natural dynamic sensor micro-drift
            if not is_spiked and not in_repair_hold:
                # Vibration drift with authentic momentum
                vib_drift = random.uniform(-0.075, 0.075)
                new_vib = round(max(0.4, curr["vibration"] + vib_drift), 2)
                if abs(new_vib - meta["base_vib"]) > 0.55:
                    new_vib = round(meta["base_vib"] + random.uniform(-0.15, 0.15), 2)
                curr["vibration"] = new_vib

                # Pressure drift
                pres_drift = random.uniform(-16.0, 16.0)
                new_pres = round(curr["pressure"] + pres_drift, 0)
                if abs(new_pres - meta["base_pres"]) > 85:
                    new_pres = round(meta["base_pres"] + random.uniform(-25, 25), 0)
                curr["pressure"] = new_pres

                # Temperature drift
                temp_drift = random.uniform(-1.8, 1.8)
                new_temp = round(curr["temp"] + temp_drift, 1)
                if abs(new_temp - meta["base_temp"]) > 16:
                    new_temp = round(meta["base_temp"] + random.uniform(-3, 3), 1)
                curr["temp"] = new_temp

                # Mechanical params for ground vehicles
                if meta["model"] == "armor":
                    rpm_drift = random.uniform(-15, 15)
                    curr["rpm"] = round(max(1000, curr["rpm"] + rpm_drift), 0)
                    torq_drift = random.uniform(-0.5, 0.5)
                    curr["torque"] = round(max(30.0, curr["torque"] + torq_drift), 1)
                    curr["wear"] = round(min(260.0, curr["wear"] + 0.02), 2)

            # Authentic ML Prediction for each platform model type
            m_type = meta["model"]
            if m_type == "bearing":
                res = model_registry.predict_bearing(rms_vibration=curr["vibration"])
                fail_prob = res["failure_prob"]
                base_rul_span = 45
            elif m_type == "armor":
                res = model_registry.predict_ground_armor(
                    air_temp_k=300.0,
                    process_temp_k=curr["temp"] if curr["temp"] > 250 else curr["temp"] + 273.15,
                    speed_rpm=curr.get("rpm", 1800),
                    torque_nm=curr.get("torque", 50),
                    tool_wear_min=curr.get("wear", 100)
                )
                fail_prob = res["failure_prob"]
                base_rul_span = 55
            else:
                # Turbofan thermodynamic cycle
                hpc_ratio = round(1.45 * (curr["pressure"] / 3000.0), 2)
                fail_prob = min(0.95, max(0.04, 0.04 + max(0.0, (curr["temp"] - 680.0)/110.0 * 0.42) + max(0.0, (1.45 - hpc_ratio) * 1.8 * 0.38) + max(0.0, (curr["vibration"] - 1.2)/1.6 * 0.3)))
                base_rul_span = 65

            # Dynamic readiness and RUL
            readiness = max(12, min(99, int((1.0 - fail_prob) * 100)))
            rul = max(2, int((1.0 - fail_prob) * base_rul_span))
            status = "critical" if fail_prob >= 0.58 else ("watch" if fail_prob >= 0.28 else "ready")

            curr["failureProb"] = round(fail_prob, 4)
            curr["readinessScore"] = readiness
            curr["predictedRUL"] = rul
            curr["status"] = status
            curr["lastUpdated"] = datetime.utcnow().strftime("%H:%M:%S")

            # Compute real-time counterfactual XAI attributions for this platform
            try:
                curr["xaiAttribution"] = xai_explainer.explain_asset(curr)
            except Exception as xerr:
                pass

        # Calculate fleet-wide metrics and category breakdown dynamically
        assets_list = list(self.fleet_state.values())
        crit_count = sum(1 for a in assets_list if a["status"] == "critical")
        watch_count = sum(1 for a in assets_list if a["status"] == "watch")
        ready_count = sum(1 for a in assets_list if a["status"] == "ready")
        total = len(assets_list)
        ready_pct = round((ready_count / max(1, total)) * 100, 1)

        # Dynamic Combat Branch Readiness Breakdown
        categories = ["Combat Aircraft", "Ground Armored Fleet", "Naval Strike Group", "Air & Missile Defense"]
        readiness_by_cat = []
        for cat in categories:
            cat_assets = [a for a in assets_list if a.get("category") == cat]
            c_ready = sum(1 for a in cat_assets if a["status"] == "ready")
            c_watch = sum(1 for a in cat_assets if a["status"] == "watch")
            c_crit = sum(1 for a in cat_assets if a["status"] == "critical")
            c_total = len(cat_assets)
            rate = round((c_ready / c_total * 100), 1) if c_total > 0 else 100.0
            readiness_by_cat.append({
                "category": cat,
                "ready": c_ready,
                "watch": c_watch,
                "critical": c_crit,
                "total": c_total,
                "rate": rate
            })

        self.latest_metrics = {
            "totalAssets": total,
            "missionReady": ready_count,
            "readyPercentage": ready_pct,
            "watchAlerts": watch_count,
            "watchPercentage": round((watch_count / max(1, total)) * 100, 1),
            "criticalNonReady": crit_count,
            "criticalPercentage": round((crit_count / max(1, total)) * 100, 1),
            "meanTimeBetweenFailures": "418 hrs",
            "mtbfDelta": "+14.2%",
            "downtimeSaved": "142 hrs",
            "readinessByCategory": readiness_by_cat
        }

        return self.fleet_state, anomaly_alerts

manager = TelemetryEngine()

# Background generator loop: exactly 2.0 seconds duration
async def telemetry_stream_worker():
    print("[TelemetryEngine] Starting 2.0s Real-Time IoT Telemetry Stream Generator...")

    while True:
        try:
            fleet_state, _ = manager.update_tick()

            if manager.active_connections:
                payload = {
                    "type": "TELEMETRY_FULL_TICK",
                    "interval_seconds": 2.0,
                    "timestamp": datetime.utcnow().strftime("%H:%M:%S"),
                    "assets": fleet_state,
                    "metrics": manager.latest_metrics
                }
                await manager.broadcast(payload)

            await asyncio.sleep(2.0)
        except Exception as e:
            print(f"[TelemetryEngine] Worker tick error: {e}")
            await asyncio.sleep(2.0)

@router.websocket("/ws/telemetry")
async def websocket_telemetry_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # Initial sync frame with full current live fleet state
        await websocket.send_json({
            "type": "STREAM_ESTABLISHED",
            "message": "AEGIS Real-time 2.0s IoT Telemetry Connected",
            "interval_seconds": 2.0,
            "assets": manager.fleet_state,
            "metrics": manager.latest_metrics,
            "timestamp": datetime.utcnow().isoformat()
        })
        while True:
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                if msg.get("action") == "inject":
                    manager.inject_anomaly(
                        asset_id=msg.get("asset_id", "A-317"),
                        sensor=msg.get("sensor", "vibration"),
                        spike_value=float(msg.get("spike_value", 5.4)),
                        duration_seconds=int(msg.get("duration_seconds", 45))
                    )
                elif msg.get("action") == "reset":
                    manager.reset_anomaly()
            except Exception:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        manager.disconnect(websocket)

@router.post("/api/telemetry/inject-anomaly")
async def inject_anomaly_endpoint(req: AnomalyInjectRequest):
    """
    Triggers dynamic anomaly injection (e.g. vibration spike) on a combat asset.
    """
    data = manager.inject_anomaly(
        asset_id=req.asset_id,
        sensor=req.sensor,
        spike_value=req.spike_value,
        duration_seconds=req.duration_seconds
    )
    return {
        "status": "success",
        "message": f"Live Anomaly injected into {req.asset_id.upper()} [{req.sensor} = {req.spike_value}]",
        "details": data
    }

@router.post("/api/telemetry/reset-anomaly")
async def reset_anomaly_endpoint(asset_id: Optional[str] = None):
    manager.reset_anomaly(asset_id)
    return {"status": "success", "message": "Telemetry anomaly cleared and nominal baselines restored"}


@router.post("/api/telemetry/complete-repair/{asset_id}")
async def complete_repair_endpoint(asset_id: str):
    """
    Engineer confirms repair complete.
    1) Immediately resets asset to safe, nominal post-repair sensor values.
    2) For 10-13 seconds the asset stays stable at nominal.
    3) After that, the normal 2.0s random drift engine resumes from new low baseline,
       so status (critical / watch / ready) evolves naturally from fresh start.
    """
    aid = asset_id.upper()
    if aid not in manager.fleet_state:
        raise HTTPException(status_code=404, detail=f"Asset {aid} not found")

    meta = INITIAL_FLEET_BASELINES.get(aid, {})
    curr = manager.fleet_state[aid]

    # --- Clear any active anomaly injection ---
    manager.active_anomalies.pop(aid, None)
    curr["isSpike"] = False

    # --- Set post-repair nominal values (safe range, well below MIL-SPEC thresholds) ---
    repaired_vib  = round(random.uniform(1.10, 2.10), 2)   # Well below 3.50 mm/s threshold
    repaired_pres = round(random.uniform(2930, 3060), 0)    # Healthy pressure
    base_temp     = meta.get("base_temp", 680)
    repaired_temp = round(random.uniform(base_temp * 0.91, base_temp * 0.96), 1)

    curr["vibration"] = repaired_vib
    curr["pressure"]  = repaired_pres
    curr["temp"]      = repaired_temp
    curr["readinessScore"] = random.randint(78, 96)
    curr["status"]    = "ready"
    curr["failureProb"] = round(random.uniform(0.04, 0.18), 4)
    curr["predictedRUL"] = random.randint(38, 65)

    # --- Temporarily rebase the drift engine to the repaired values ---
    # The drift loop will now drift from these new lows, not the original worn baselines.
    INITIAL_FLEET_BASELINES[aid]["base_vib"]  = repaired_vib
    INITIAL_FLEET_BASELINES[aid]["base_pres"] = repaired_pres
    INITIAL_FLEET_BASELINES[aid]["base_temp"] = repaired_temp

    # Mark repair hold window (10-13 seconds) so drift engine holds stable
    hold_secs = random.uniform(10, 13)
    _repair_hold[aid] = time.time() + hold_secs

    # Broadcast the immediate nominal reset to all connected clients
    await manager.broadcast({
        "type": "REPAIR_COMPLETE",
        "asset_id": aid,
        "asset_name": meta.get("name", aid),
        "message": f"Engineer confirmed repair complete on {meta.get('name', aid)}. Asset restored to nominal. Drift resumes in ~{int(hold_secs)}s.",
        "timestamp": datetime.utcnow().strftime("%H:%M:%S"),
        "assets": {aid: curr}
    })

    return {
        "status": "success",
        "asset_id": aid,
        "message": f"Repair confirmed. {aid} reset to nominal. Live drift resumes in ~{int(hold_secs)}s.",
        "repaired_values": {
            "vibration": repaired_vib,
            "pressure": repaired_pres,
            "temp": repaired_temp
        }
    }


@router.get("/api/telemetry/status")
def get_telemetry_stream_status():
    return {
        "active_clients": len(manager.active_connections),
        "active_anomalies": manager.active_anomalies,
        "streaming_interval_seconds": 2.0,
        "monitored_fleet_count": len(manager.fleet_state)
    }
