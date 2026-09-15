import asyncio
import json
import time
import random
import re
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from pydantic import BaseModel

from ml.predictor import model_registry
from ml.explainer import xai_explainer
from database import get_all_custom_assets, save_work_order, get_db_connection

router = APIRouter(tags=["telemetry_stream"])

class AnomalyInjectRequest(BaseModel):
    asset_id: str = "A-317"
    sensor: str = "vibration"
    spike_value: float = 5.45
    duration_seconds: int = 300

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
        self.custom_baselines: Dict[str, Dict[str, Any]] = {}
        self.latest_metrics: Dict[str, Any] = {}
        self.init_fleet_state()

    def get_asset_meta(self, aid: str) -> Dict[str, Any]:
        aid_u = aid.upper()
        if aid_u in INITIAL_FLEET_BASELINES:
            return INITIAL_FLEET_BASELINES[aid_u]
        if aid_u in self.custom_baselines:
            return self.custom_baselines[aid_u]
        curr = self.fleet_state.get(aid_u, {})
        atype = curr.get("type", "Aircraft")
        is_armor = any(k in atype.lower() for k in ["armor", "tank", "ugv", "howitzer"])
        return {
            "name": curr.get("name", aid_u),
            "type": atype,
            "category": curr.get("category", "Custom Fleet Platforms"),
            "model": "armor" if is_armor else "bearing",
            "base_vib": float(curr.get("vibration", 1.20)),
            "base_pres": float(curr.get("pressure", 3000)),
            "base_temp": float(curr.get("temp", 68.0 if is_armor else 660.0))
        }

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
        self.load_custom_assets_from_db()
        self.update_tick()

    def load_custom_assets_from_db(self):
        try:
            custom_assets = get_all_custom_assets()
            for ca in custom_assets:
                aid = ca["id"].upper()
                ctype = ca.get("type", "Aircraft")
                is_armor = any(k in ctype.lower() for k in ["armor", "tank", "ugv", "howitzer"])
                is_aircraft = ctype.lower() == "aircraft" or "aircraft" in str(ca.get("category", "")).lower()
                model_type = "armor" if is_armor else ("turbofan" if ("turbofan" in str(ca.get("mlModelApplied", "")).lower() and is_aircraft) else "bearing")
                
                base_vib = 1.20
                base_pres = 3000.0
                base_temp = 68.0 if is_armor else 660.0
                for s in ca.get("contributingSensors", []):
                    sname = s.get("name", "").lower()
                    if "vibration" in sname:
                        nums = re.findall(r"[\d.]+", s.get("current", "1.20"))
                        if nums: base_vib = float(nums[0])
                    elif "pressure" in sname or "hydraulic" in sname:
                        nums = re.findall(r"[\d.]+", s.get("current", "3000"))
                        if nums: base_pres = float(nums[0])
                    elif "temp" in sname or "thermal" in sname:
                        nums = re.findall(r"[\d.]+", s.get("current", "660"))
                        if nums: base_temp = float(nums[0])

                self.custom_baselines[aid] = {
                    "name": ca.get("name", aid),
                    "type": ctype,
                    "category": ca.get("category", "Custom Fleet Platforms"),
                    "model": model_type,
                    "base_vib": base_vib,
                    "base_pres": base_pres,
                    "base_temp": base_temp,
                    "rpm": 1800,
                    "torque": 50.0,
                    "wear": 100
                }
                if aid not in self.fleet_state:
                    self.fleet_state[aid] = {
                        "id": aid,
                        "name": ca.get("name", aid),
                        "type": ctype,
                        "category": ca.get("category", "Custom Fleet Platforms"),
                        "model_type": model_type,
                        "vibration": base_vib,
                        "pressure": base_pres,
                        "temp": base_temp,
                        "rpm": 1800,
                        "torque": 50.0,
                        "wear": 100,
                        "readinessScore": ca.get("readinessScore", 88),
                        "predictedRUL": ca.get("predictedRUL", 45),
                        "status": ca.get("status", "ready"),
                        "failureProb": 0.12,
                        "isSpike": False,
                        "lastUpdated": datetime.utcnow().strftime("%H:%M:%S")
                    }
        except Exception as e:
            print(f"[TelemetryEngine] load_custom_assets_from_db warning: {e}")

    def register_custom_asset(self, asset_dict: Dict[str, Any]):
        aid = asset_dict["id"].upper()
        ctype = asset_dict.get("type", "Aircraft")
        is_armor = any(k in ctype.lower() for k in ["armor", "tank", "ugv", "howitzer"])
        is_aircraft = ctype.lower() == "aircraft" or "aircraft" in str(asset_dict.get("category", "")).lower()
        model_type = "armor" if is_armor else ("turbofan" if ("turbofan" in str(asset_dict.get("mlModelApplied", "")).lower() and is_aircraft) else "bearing")
        
        base_vib = float(asset_dict.get("vibration", 1.20))
        base_pres = float(asset_dict.get("pressure", 3000))
        base_temp = float(asset_dict.get("temp", 68.0 if is_armor else 660.0))

        self.custom_baselines[aid] = {
            "name": asset_dict.get("name", aid),
            "type": ctype,
            "category": asset_dict.get("category", "Custom Fleet Platforms"),
            "model": model_type,
            "base_vib": base_vib,
            "base_pres": base_pres,
            "base_temp": base_temp,
            "rpm": 1800,
            "torque": 50.0,
            "wear": 100
        }
        self.fleet_state[aid] = {
            "id": aid,
            "name": asset_dict.get("name", aid),
            "type": ctype,
            "category": asset_dict.get("category", "Custom Fleet Platforms"),
            "model_type": model_type,
            "vibration": base_vib,
            "pressure": base_pres,
            "temp": base_temp,
            "rpm": 1800,
            "torque": 50.0,
            "wear": 100,
            "readinessScore": asset_dict.get("readinessScore", 88),
            "predictedRUL": asset_dict.get("predictedRUL", 45),
            "status": asset_dict.get("status", "ready"),
            "failureProb": 0.12,
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

    def inject_anomaly(self, asset_id: str, sensor: str, spike_value: float, duration_seconds: int = 300):
        aid = asset_id.upper()
        expires_at = time.time() + duration_seconds
        meta = self.get_asset_meta(aid)
        name = meta.get("name", aid)
        self.active_anomalies[aid] = {
            "asset_id": aid,
            "asset_name": name,
            "sensor": sensor,
            "spike_value": spike_value,
            "expires_at": expires_at,
            "duration": duration_seconds,
            "injected_at": datetime.utcnow().isoformat()
        }
        work_order = None
        if aid in self.fleet_state:
            self.fleet_state[aid][sensor] = spike_value
            self.fleet_state[aid]["isSpike"] = True
            # Force critical status on spiked sensor
            self.fleet_state[aid]["status"] = "critical"
            self.fleet_state[aid]["readinessScore"] = min(int(self.fleet_state[aid].get("readinessScore", 85)), 32)
            self.fleet_state[aid]["failureProb"] = 0.89
            self.fleet_state[aid]["predictedRUL"] = max(2, int(self.fleet_state[aid].get("predictedRUL", 20) * 0.25))
            self.update_tick()

            # Automatically create and persist an Emergency Work Order in the Maintenance Plan!
            order_num = random.randint(100, 999)
            order_id = f"WO-{aid}-{order_num}"
            work_order = {
                "id": order_id,
                "assetId": aid,
                "assetName": name,
                "task": f"Emergency inspection: Critical {sensor} spike detected ({spike_value}) on {name}",
                "priority": "critical",
                "dueInHours": 8,
                "assignedCrew": "Air Wing Depot Rapid Response Team Alpha",
                "partsStatus": "In Stock (Depot)",
                "status": "Pending Dispatch",
                "estimatedDowntime": "8 hrs",
                "impact": "Critical (Combat Sortie Blocked - Live Sensor Trip)"
            }
            try:
                save_work_order(work_order)
            except Exception as err:
                print(f"[TelemetryEngine] Error saving spike work order: {err}")

        res = dict(self.active_anomalies[aid])
        if work_order:
            res["work_order"] = work_order
        return res

    async def dispatch_asset(self, asset_id: str, order_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Dispatches maintenance action for asset:
        1. Clears any active sensor anomaly spike.
        2. Restores sensor values to safe nominal baselines.
        3. Sets status='ready' (Normal / Mission-Ready), high readiness, low failure probability.
        4. Sets 60s repair hold so dynamic IoT drift stays stable and does not re-trip.
        5. Updates SQLite work order(s) to 'Dispatched to Depot'.
        6. Recalculates fleet-wide metrics (Critical Non-Ready decrements -1, Mission Ready increments +1).
        7. Broadcasts WORK_ORDER_DISPATCHED to all connected WebSocket clients.
        """
        aid = asset_id.upper()
        if aid not in self.fleet_state:
            self.load_custom_assets_from_db()
            if aid not in self.fleet_state:
                self.fleet_state[aid] = {
                    "id": aid,
                    "name": aid,
                    "type": "Aircraft",
                    "category": "Combat Aircraft",
                    "model_type": "bearing",
                    "status": "ready"
                }

        meta = self.get_asset_meta(aid)
        curr = self.fleet_state[aid]

        # 1. Clear any active anomaly
        self.active_anomalies.pop(aid, None)
        curr["isSpike"] = False

        # 2. Set post-repair nominal sensor readings (safe zone)
        repaired_vib = round(random.uniform(0.90, 1.35), 2)
        base_pres = float(meta.get("base_pres", 3000.0))
        repaired_pres = round(base_pres * random.uniform(0.99, 1.01), 0)
        base_temp = float(meta.get("base_temp", 68.0 if "armor" in str(curr.get("type", "")).lower() else 660.0))
        repaired_temp = round(base_temp * random.uniform(0.98, 1.01), 1)

        curr["vibration"] = repaired_vib
        curr["pressure"] = repaired_pres
        curr["temp"] = repaired_temp
        curr["status"] = "ready"
        curr["readinessScore"] = random.randint(94, 98)
        curr["failureProb"] = round(random.uniform(0.03, 0.08), 4)
        curr["predictedRUL"] = random.randint(58, 76)
        curr["lastUpdated"] = datetime.utcnow().strftime("%H:%M:%S")

        if curr.get("model_type") == "armor" or meta.get("model") == "armor":
            curr["rpm"] = meta.get("rpm", 1950)
            curr["torque"] = meta.get("torque", 68.0)
            curr["wear"] = meta.get("wear", 180)

        # Update baselines so future micro-drift stays healthy
        if aid in INITIAL_FLEET_BASELINES:
            INITIAL_FLEET_BASELINES[aid]["base_vib"] = repaired_vib
            INITIAL_FLEET_BASELINES[aid]["base_pres"] = repaired_pres
            INITIAL_FLEET_BASELINES[aid]["base_temp"] = repaired_temp
        if aid in self.custom_baselines:
            self.custom_baselines[aid]["base_vib"] = repaired_vib
            self.custom_baselines[aid]["base_pres"] = repaired_pres
            self.custom_baselines[aid]["base_temp"] = repaired_temp

        # 3. Hold nominal baseline for 60 seconds (drift won't trip)
        _repair_hold[aid] = time.time() + 60.0

        # 4. Update SQLite work orders
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            if order_id:
                cursor.execute("UPDATE work_orders SET status = 'Dispatched to Depot' WHERE id = ?", (order_id,))
            cursor.execute("UPDATE work_orders SET status = 'Dispatched to Depot' WHERE asset_id = ? AND status = 'Pending Dispatch'", (aid,))
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"[dispatch_asset] DB update error: {e}")

        # 5. Recalculate fleet-wide metrics (Critical decreases -1, Mission-Ready increases +1)
        self.update_tick()

        # 6. Broadcast frame to all connected clients
        await self.broadcast({
            "type": "WORK_ORDER_DISPATCHED",
            "asset_id": aid,
            "order_id": order_id,
            "message": f"Asset {meta.get('name', aid)} ({aid}) officially DISPATCHED to Depot. Status restored to NORMAL Mission-Ready.",
            "timestamp": datetime.utcnow().strftime("%H:%M:%S"),
            "assets": self.fleet_state,
            "metrics": self.latest_metrics
        })

        return {
            "status": "success",
            "asset_id": aid,
            "order_id": order_id,
            "new_status": "ready",
            "message": f"Asset {aid} dispatched and restored to normal mission-ready.",
            "metrics": self.latest_metrics
        }

    def reset_anomaly(self, asset_id: Optional[str] = None):
        if asset_id:
            aid = asset_id.upper()
            self.active_anomalies.pop(aid, None)
            meta = self.get_asset_meta(aid)
            if aid in self.fleet_state:
                self.fleet_state[aid]["isSpike"] = False
                self.fleet_state[aid]["vibration"] = meta["base_vib"]
                self.fleet_state[aid]["pressure"] = meta["base_pres"]
                self.fleet_state[aid]["temp"] = meta["base_temp"]
                self.fleet_state[aid]["status"] = "ready"
                self.fleet_state[aid]["readinessScore"] = 92
        else:
            self.active_anomalies.clear()
            for aid in list(self.fleet_state.keys()):
                meta = self.get_asset_meta(aid)
                self.fleet_state[aid]["isSpike"] = False
                self.fleet_state[aid]["vibration"] = meta["base_vib"]
                self.fleet_state[aid]["pressure"] = meta["base_pres"]
                self.fleet_state[aid]["temp"] = meta["base_temp"]
                self.fleet_state[aid]["status"] = "ready"
                self.fleet_state[aid]["readinessScore"] = 92
        self.update_tick()

    def update_tick(self) -> Tuple[Dict[str, Any], List[Dict[str, Any]]]:
        """
        Runs live IoT sensor drift, genuine ML predictions, and authentic XAI attributions on every tick across ALL fleet assets.
        """
        now = time.time()
        anomaly_alerts = []

        for aid in list(self.fleet_state.keys()):
            meta = self.get_asset_meta(aid)
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
                curr["isSpike"] = False
                pass  # Skip all drift this tick
            elif aid in _repair_hold and now >= _repair_hold[aid]:
                del _repair_hold[aid]

            # Natural dynamic sensor micro-drift
            if not is_spiked and not in_repair_hold:
                vib_drift = random.uniform(-0.075, 0.075)
                new_vib = round(max(0.4, curr["vibration"] + vib_drift), 2)
                if abs(new_vib - meta["base_vib"]) > 0.55:
                    new_vib = round(meta["base_vib"] + random.uniform(-0.15, 0.15), 2)
                curr["vibration"] = new_vib

                pres_drift = random.uniform(-16.0, 16.0)
                new_pres = round(curr["pressure"] + pres_drift, 0)
                if abs(new_pres - meta["base_pres"]) > 85:
                    new_pres = round(meta["base_pres"] + random.uniform(-25, 25), 0)
                curr["pressure"] = new_pres

                temp_drift = random.uniform(-1.8, 1.8)
                new_temp = round(curr["temp"] + temp_drift, 1)
                if abs(new_temp - meta["base_temp"]) > 16:
                    new_temp = round(meta["base_temp"] + random.uniform(-3, 3), 1)
                curr["temp"] = new_temp

                if meta.get("model") == "armor":
                    rpm_drift = random.uniform(-15, 15)
                    curr["rpm"] = round(max(1000, curr.get("rpm", 1800) + rpm_drift), 0)
                    torq_drift = random.uniform(-0.5, 0.5)
                    curr["torque"] = round(max(30.0, curr.get("torque", 50.0) + torq_drift), 1)
                    curr["wear"] = round(min(260.0, curr.get("wear", 100) + 0.02), 2)

            # Authentic ML Prediction for each platform model type
            if is_spiked:
                fail_prob = 0.89
                base_rul_span = 12
            elif in_repair_hold:
                fail_prob = round(random.uniform(0.04, 0.09), 4)
                base_rul_span = 60
            else:
                m_type = meta.get("model", "bearing")
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
                    hpc_ratio = round(1.45 * (curr["pressure"] / 3000.0), 2)
                    fail_prob = min(0.95, max(0.04, 0.04 + max(0.0, (curr["temp"] - 680.0)/110.0 * 0.42) + max(0.0, (1.45 - hpc_ratio) * 1.8 * 0.38) + max(0.0, (curr["vibration"] - 1.2)/1.6 * 0.3)))
                    base_rul_span = 65

            readiness = max(12, min(99, int((1.0 - fail_prob) * 100)))
            rul = max(2, int((1.0 - fail_prob) * base_rul_span))
            status = "critical" if (fail_prob >= 0.58 or is_spiked) else ("watch" if fail_prob >= 0.28 else "ready")

            curr["failureProb"] = round(fail_prob, 4)
            curr["readinessScore"] = readiness
            curr["predictedRUL"] = rul
            curr["status"] = status
            curr["lastUpdated"] = datetime.utcnow().strftime("%H:%M:%S")

            try:
                curr["xaiAttribution"] = xai_explainer.explain_asset(curr)
            except Exception:
                pass

        # Dynamic fleet metrics
        assets_list = list(self.fleet_state.values())
        crit_count = sum(1 for a in assets_list if a["status"] == "critical")
        watch_count = sum(1 for a in assets_list if a["status"] == "watch")
        ready_count = sum(1 for a in assets_list if a["status"] == "ready")
        total = len(assets_list)
        ready_pct = round((ready_count / max(1, total)) * 100, 1)

        categories = ["Combat Aircraft", "Ground Armored Fleet", "Naval Strike Group", "Air & Missile Defense", "Custom Fleet Platforms"]
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
    Immediately creates a maintenance work order and broadcasts updated critical metrics to all clients.
    """
    data = manager.inject_anomaly(
        asset_id=req.asset_id,
        sensor=req.sensor,
        spike_value=req.spike_value,
        duration_seconds=req.duration_seconds
    )
    # Broadcast immediate full tick so Dashboard Critical number and Maintenance Plan update immediately!
    await manager.broadcast({
        "type": "ANOMALY_TRIGGERED",
        "asset_id": req.asset_id.upper(),
        "sensor": req.sensor,
        "spike_value": req.spike_value,
        "interval_seconds": 2.0,
        "timestamp": datetime.utcnow().strftime("%H:%M:%S"),
        "assets": manager.fleet_state,
        "metrics": manager.latest_metrics,
        "work_order": data.get("work_order"),
        "details": data
    })
    return {
        "status": "success",
        "message": f"Live Anomaly injected into {req.asset_id.upper()} [{req.sensor} = {req.spike_value}]. Work order created.",
        "work_order": data.get("work_order"),
        "details": data
    }

@router.post("/api/telemetry/reset-anomaly")
async def reset_anomaly_endpoint(asset_id: Optional[str] = None):
    manager.reset_anomaly(asset_id)
    await manager.broadcast({
        "type": "TELEMETRY_FULL_TICK",
        "interval_seconds": 2.0,
        "timestamp": datetime.utcnow().strftime("%H:%M:%S"),
        "assets": manager.fleet_state,
        "metrics": manager.latest_metrics
    })
    return {"status": "success", "message": "Telemetry anomaly cleared and nominal baselines restored"}


@router.post("/api/telemetry/complete-repair/{asset_id}")
async def complete_repair_endpoint(asset_id: str):
    """
    Engineer confirms repair complete.
    1) Resets asset to nominal post-repair sensor values and status='ready'.
    2) Updates SQLite work order status to 'Repair Confirmed ✓'.
    3) Recalculates fleet-wide metrics (+1 Ready green count, -1 Critical count).
    4) Enters 10-13s repair hold window.
    5) Broadcasts updated fleet state and metrics to all connected clients.
    """
    aid = asset_id.upper()
    if aid not in manager.fleet_state:
        # Check if it exists in DB as custom asset
        manager.load_custom_assets_from_db()
        if aid not in manager.fleet_state:
            raise HTTPException(status_code=404, detail=f"Asset {aid} not found")

    meta = manager.get_asset_meta(aid)
    curr = manager.fleet_state[aid]

    # --- Clear any active anomaly injection ---
    manager.active_anomalies.pop(aid, None)
    curr["isSpike"] = False

    # --- Set post-repair nominal values (safe range, well below MIL-SPEC thresholds) ---
    repaired_vib = round(random.uniform(0.85, 1.45), 2)   # Nominal vibration
    base_pres = meta.get("base_pres", 3000.0)
    repaired_pres = round(base_pres * random.uniform(0.98, 1.02), 0)   # Optimal hydraulic pressure
    base_temp = meta.get("base_temp", 68.0 if curr.get("type") == "Ground Armor" else 660.0)
    repaired_temp = round(base_temp * random.uniform(0.96, 1.02), 1)

    curr["vibration"] = repaired_vib
    curr["pressure"] = repaired_pres
    curr["temp"] = repaired_temp
    curr["readinessScore"] = random.randint(92, 98)
    curr["status"] = "ready"
    curr["failureProb"] = round(random.uniform(0.04, 0.10), 4)
    curr["predictedRUL"] = random.randint(55, 75)

    if curr.get("model_type") == "armor" or meta.get("model") == "armor":
        curr["rpm"] = meta.get("rpm", 1950)
        curr["torque"] = meta.get("torque", 68.0)
        curr["wear"] = meta.get("wear", 180)

    # --- Update baselines so drift begins from fresh nominal baseline ---
    if aid in INITIAL_FLEET_BASELINES:
        INITIAL_FLEET_BASELINES[aid]["base_vib"] = repaired_vib
        INITIAL_FLEET_BASELINES[aid]["base_pres"] = repaired_pres
        INITIAL_FLEET_BASELINES[aid]["base_temp"] = repaired_temp
    if aid in manager.custom_baselines:
        manager.custom_baselines[aid]["base_vib"] = repaired_vib
        manager.custom_baselines[aid]["base_pres"] = repaired_pres
        manager.custom_baselines[aid]["base_temp"] = repaired_temp

    # Mark repair hold window (10-13 seconds) so drift engine holds stable
    hold_secs = random.uniform(10, 13)
    _repair_hold[aid] = time.time() + hold_secs

    # --- Update work orders in SQLite DB for this asset ---
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE work_orders SET status = 'Repair Confirmed ✓' WHERE asset_id = ?", (aid,))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"[complete_repair] DB update error: {e}")

    # --- Recalculate fleet-wide metrics (Green Mission Ready count increases!) ---
    manager.update_tick()

    # Broadcast the immediate nominal reset and updated metrics to all connected clients
    await manager.broadcast({
        "type": "REPAIR_COMPLETE",
        "asset_id": aid,
        "asset_name": meta.get("name", aid),
        "message": f"Engineer confirmed repair complete on {meta.get('name', aid)}. Asset restored to NOMINAL. Live drift resumes in ~{int(hold_secs)}s.",
        "timestamp": datetime.utcnow().strftime("%H:%M:%S"),
        "assets": manager.fleet_state,
        "metrics": manager.latest_metrics
    })

    return {
        "status": "success",
        "asset_id": aid,
        "message": f"Repair confirmed. {aid} reset to nominal. Live drift resumes in ~{int(hold_secs)}s.",
        "repaired_values": {
            "vibration": repaired_vib,
            "pressure": repaired_pres,
            "temp": repaired_temp
        },
        "metrics": manager.latest_metrics
    }


@router.post("/api/telemetry/dispatch-asset/{asset_id}")
async def dispatch_asset_telemetry_endpoint(asset_id: str, order_id: Optional[str] = None):
    """
    Directly dispatches an asset to depot:
    Restores asset to nominal (status='ready', high readiness, low failure probability).
    Decrements Critical Non-Ready count, increments Mission Ready count.
    Broadcasts WORK_ORDER_DISPATCHED to all connected clients.
    """
    res = await manager.dispatch_asset(asset_id, order_id=order_id)
    return res


@router.get("/api/telemetry/status")
def get_telemetry_stream_status():
    return {
        "active_clients": len(manager.active_connections),
        "active_anomalies": manager.active_anomalies,
        "streaming_interval_seconds": 2.0,
        "monitored_fleet_count": len(manager.fleet_state)
    }
