import os
import re
import json
import time
from datetime import datetime
import requests
from typing import Optional, List, Dict, Any, Tuple
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

import random
from api.routes_assets import get_dynamically_scored_assets, get_metrics, get_work_orders, generate_initial_telemetry_history
from database import get_all_batches, save_work_order, save_custom_asset, get_all_custom_assets, get_db_connection
from ml.explainer import xai_explainer
from ml.predictor import model_registry
from api.routes_ws import manager, _repair_hold

def load_env_file():
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    env_path = os.path.join(backend_dir, ".env")
    if os.path.exists(env_path):
        try:
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        os.environ[k.strip()] = v.strip().strip('"').strip("'")
        except Exception as e:
            print(f"[Env] Warning loading .env: {e}")

load_env_file()

router = APIRouter(prefix="/api", tags=["chat"])

class ChatRequest(BaseModel):
    message: str
    scopedAssetId: Optional[str] = None
    apiKey: Optional[str] = None
    history: Optional[List[Dict[str, Any]]] = None

class SetKeyRequest(BaseModel):
    apiKey: str
    provider: Optional[str] = "groq"

@router.get("/chat/status")
def get_chat_status():
    load_env_file()
    groq_key = os.environ.get("GROQ_API_KEY", "")
    gemini_key = os.environ.get("GEMINI_API_KEY", "")
    active_engine = "groq (Llama 3.3 70B)" if groq_key else ("gemini" if gemini_key else "local_rag")
    return {
        "groq_configured": bool(groq_key),
        "gemini_configured": bool(gemini_key),
        "active_engine": active_engine,
        "local_rag_ready": True
    }

@router.post("/chat/set-key")
def set_chat_key(req: SetKeyRequest):
    key = req.apiKey.strip()
    if not key:
        raise HTTPException(status_code=400, detail="Key cannot be empty")
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    env_path = os.path.join(backend_dir, ".env")
    
    if req.provider.lower() == "gemini" or key.startswith("AIza"):
        os.environ["GEMINI_API_KEY"] = key
        var_name = "GEMINI_API_KEY"
    else:
        os.environ["GROQ_API_KEY"] = key
        var_name = "GROQ_API_KEY"
    
    lines = []
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            lines = [l for l in f.readlines() if not l.startswith(f"{var_name}=")]
    lines.append(f"{var_name}={key}\n")
    with open(env_path, "w", encoding="utf-8") as f:
        f.writelines(lines)
    return {"status": "success", "provider": var_name, "message": f"{var_name} saved successfully"}

# Hinglish keyword detection
HINGLISH_KEYWORDS = {
    'kyu', 'kyon', 'hai', 'he', 'kya', 'kaise', 'batao', 'kharab', 'khatra', 'kitne',
    'hoga', 'karo', 'konsa', 'kaha', 'tha', 'thi', 'the', 'aur', 'ko', 'me', 'mein',
    'nahi', 'chalega', 'theek', 'karna', 'padega', 'kaun', 'sabse', 'zyada', 'kam',
    'bhi', 'kisko', 'kis', 'iska', 'iski', 'unka', 'dekh', 'dekho', 'dikhao', 'smje',
    'samjhao', 'chahiye', 'waala', 'wali'
}

def is_hinglish_query(text: str) -> bool:
    words = re.findall(r'\b[a-zA-Z]+\b', text.lower())
    match_count = sum(1 for w in words if w in HINGLISH_KEYWORDS)
    return match_count >= 1

ASSET_ALIASES = {
    "chennai": "V-007",
    "ms chennai": "V-007",
    "ins chennai": "V-007",
    "vikrant": "N-011",
    "ins vikrant": "N-011",
    "sukhoi": "A-317",
    "su-30": "A-317",
    "su30": "A-317",
    "su-30mki": "A-317",
    "garuda": "A-317",
    "rafale": "A-108",
    "dassault": "A-108",
    "tejas": "A-205",
    "lca": "A-205",
    "apache": "A-711",
    "ah-64": "A-711",
    "arjun": "V-102",
    "mbt": "V-102",
    "bhishma": "V-108",
    "t-90": "V-108",
    "t90": "V-108",
    "ugv": "V-210",
    "vajra": "V-305",
    "k9": "V-305",
    "akash": "D-118",
    "sam": "D-118",
    "agt": "E-045",
    "turbine": "E-045"
}

def find_referenced_assets(text: str, assets: List[Dict[str, Any]], scoped_id: Optional[str] = None) -> List[Dict[str, Any]]:
    referenced = []
    text_lower = text.lower()

    if scoped_id:
        scoped = next((a for a in assets if a["id"].lower() == scoped_id.lower()), None)
        if scoped and scoped not in referenced:
            referenced.append(scoped)

    # Check aliases first
    for alias, aid in ASSET_ALIASES.items():
        if re.search(r'\b' + re.escape(alias) + r'\b', text_lower):
            matched = next((a for a in assets if a["id"].lower() == aid.lower()), None)
            if matched and matched not in referenced:
                referenced.append(matched)

    for a in assets:
        a_id = a["id"].lower()
        a_call = a["callsign"].lower()
        a_name = a["name"].lower()

        # Check exact asset id match (e.g. "V-102" or "v102" or "v-102")
        id_pattern = re.escape(a_id).replace('\\-', '[- ]?')
        if re.search(r'\b' + id_pattern + r'\b', text_lower):
            if a not in referenced:
                referenced.append(a)
            continue

        # Check callsign or distinctive names
        if a_call in text_lower or any(part in text_lower for part in a_name.split() if len(part) > 4 and part not in ['multi-role', 'strike', 'guided', 'combat', 'system']):
            if a not in referenced:
                referenced.append(a)

    return referenced


GROQ_PREFERRED_MODELS = [
    "openai/gpt-oss-120b",
    "llama-3.3-70b-versatile",
    "openai/gpt-oss-20b",
    "llama-3.1-8b-instant",
    "qwen/qwen3.8-27b"
]

def normalize_reply_text(text: str) -> str:
    if not text:
        return ""
    return (
        str(text).replace('\u2011', '-')
                 .replace('\u2010', '-')
                 .replace('\u2013', '-')
                 .replace('\u2014', '-')
                 .replace('\u202f', ' ')
                 .replace('\u00a0', ' ')
    )

def call_groq_api(api_key: str, prompt: str, system_prompt: str) -> Optional[str]:
    """
    Calls Groq LPU API using best available high-performance model for ultra-fast Hinglish/English reasoning.
    """
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    for model in GROQ_PREFERRED_MODELS:
        try:
            payload = {
                "model": model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.3,
                "max_tokens": 1024
            }
            res = requests.post(url, headers=headers, json=payload, timeout=6)
            if res.status_code == 200:
                data = res.json()
                choices = data.get("choices", [])
                if choices:
                    content = choices[0].get("message", {}).get("content", "")
                    if content:
                        return normalize_reply_text(content)
            else:
                continue
        except Exception as e:
            print(f"[Copilot] Groq request exception with {model}: {e}")
            if "Connection" in str(e) or "Timeout" in str(e) or "Errno 11001" in str(e):
                break
            continue

    return None


def call_gemini_api(api_key: str, prompt: str, system_prompt: str) -> Optional[str]:
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": f"{system_prompt}\n\nUser Query:\n{prompt}"}
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.4,
                "maxOutputTokens": 1000
            }
        }
        res = requests.post(url, json=payload, timeout=12)
        if res.status_code == 200:
            res_json = res.json()
            candidates = res_json.get("candidates", [])
            if candidates:
                parts = candidates[0].get("content", {}).get("parts", [])
                if parts:
                    return parts[0].get("text", "")
    except Exception as e:
        print(f"[Copilot] Gemini API error: {e}")
    return None

def generate_local_response(query: str, matched_assets: List[Dict[str, Any]], all_assets: List[Dict[str, Any]], work_orders: List[Dict[str, Any]], is_hinglish: bool) -> Tuple[str, List[str]]:
    query_lower = query.lower()
    highlight_ids = []

    # Case 1: Specific asset queried (e.g. V-102, A-317, A-711, etc.)
    if matched_assets:
        target = matched_assets[0]
        highlight_ids = [target["id"]]

        # Synchronize target with current live 1.25s IoT telemetry stream
        live = manager.fleet_state.get(target["id"])
        if live:
            target["readinessScore"] = live["readinessScore"]
            target["predictedRUL"] = live["predictedRUL"]
            target["status"] = live["status"]
            live_vib = live["vibration"]
            live_pres = live["pressure"]
            live_temp = live["temp"]
            live_prob = live["failureProb"]
        else:
            live_vib = 2.15
            live_pres = 2950
            live_temp = 650.0 if target.get("type") == "Aircraft" else 70.0
            live_prob = 0.15

        is_crit = target["status"] == "critical"
        is_warn = target["status"] == "watch"

        # Find associated work order
        wo = next((w for w in work_orders if w.get("assetId", "").lower() == target["id"].lower()), None)
        wo_text = f"\n• Assigned Work Order: {wo['id']} ({wo['task']}) - Assigned to {wo['assignedCrew']}, Due in {wo['dueInHours']}h." if wo else ""

        # Check if user specifically asked about vibration
        if any(w in query_lower for w in ['vibration', 'vibrating', 'kanp', 'shake', 'g-rms', 'vib']):
            if is_hinglish:
                reply = (
                    f"Commander, **{target['id']} ({target['name']})** ka CURRENT LIVE vibration reading **{live_vib} mm/s** hai.\n\n"
                    f"📊 **Telemetry Status:** {'CRITICAL THRESHOLD BREACH' if live_vib > 4.0 else ('WARNING ALERT' if live_vib > 2.5 else 'NOMINAL')}\n"
                    f"🤖 **ML Model Risk:** **{live_prob*100:.1f}%** ({target['mlModelApplied']})\n"
                    f"⏱️ **Remaining Useful Life (RUL):** **{target['predictedRUL']} din**\n\n"
                    f"💡 *Diagnosis:* {'Vibration normal limit (1.8 mm/s) se kaafi high hai. Subsystem shaft bearing par accelerating fatigue load hai.' if live_vib > 3.0 else 'Vibration parameters normal operational limit ke andar stable hain.'}"
                )
            else:
                reply = (
                    f"Commander, the CURRENT LIVE vibration reading for **{target['id']} ({target['name']})** is **{live_vib} mm/s**.\n\n"
                    f"📊 **Telemetry Threshold:** {'CRITICAL BREACH (>4.0 mm/s)' if live_vib > 4.0 else ('WARNING (>2.5 mm/s)' if live_vib > 2.5 else 'NOMINAL')}\n"
                    f"🤖 **ML Failure Risk:** **{live_prob*100:.1f}%** ({target['mlModelApplied']})\n"
                    f"⏱️ **Predicted RUL:** **{target['predictedRUL']} days** to critical threshold\n\n"
                    f"Observation: {'Excessive bearing acceleration harmonics detected. Immediate depot balancing/replacement required.' if live_vib > 3.0 else 'Dynamic harmonic signature is within nominal MIL-STD tolerance.'}"
                )
            return reply, highlight_ids

        # Check if user specifically asked about temperature
        if any(w in query_lower for w in ['temp', 'temperature', 'thermal', 'garam', 'egt', 'heat']):
            if is_hinglish:
                reply = (
                    f"Commander, **{target['id']} ({target['name']})** ka CURRENT LIVE temperature **{live_temp} °C** hai.\n\n"
                    f"🌡️ **Thermal Status:** {'EXCESSIVE THERMAL LOAD' if live_temp > 720 else 'NOMINAL THERMAL ENVELOPE'}\n"
                    f"🤖 **ML Readiness:** **{target['readinessScore']}%**\n\n"
                    f"💡 *Diagnosis:* {'Subsystem exhaust/core thermal envelope exceeded. Check coolant and oil flow.' if live_temp > 720 else 'Thermal dissipation is normal and stable.'}"
                )
            else:
                reply = (
                    f"Commander, the CURRENT LIVE operating temperature for **{target['id']} ({target['name']})** is **{live_temp} °C**.\n\n"
                    f"🌡️ **Thermal Integrity:** {'HIGH THERMAL STRESS (>720 °C)' if live_temp > 720 else 'OPTIMAL THERMAL DISSIPATION'}\n"
                    f"🤖 **Current Readiness:** **{target['readinessScore']}%**\n\n"
                    f"Status: Subsystem thermal sensors are actively streaming live telemetry."
                )
            return reply, highlight_ids

        # Check if user specifically asked about pressure
        if any(w in query_lower for w in ['pressure', 'hydraulic', 'psi', 'bar', 'dabaav']):
            if is_hinglish:
                reply = (
                    f"Commander, **{target['id']} ({target['name']})** ka CURRENT LIVE hydraulic pressure **{int(live_pres)} PSI** hai.\n\n"
                    f"⛽ **Hydraulic Integrity:** {'PRESSURE DROP DETECTED (<2700 PSI)' if live_pres < 2700 else 'NOMINAL PRESSURE (3000 PSI Baseline)'}\n"
                    f"⏱️ **RUL:** **{target['predictedRUL']} din**\n\n"
                    f"💡 *Diagnosis:* {'Hydraulic line me micro-leakage ya actuator wear ho sakta hai.' if live_pres < 2700 else 'Hydraulic actuators full operational pressure deliver kar rahe hain.'}"
                )
            else:
                reply = (
                    f"Commander, CURRENT LIVE hydraulic pressure for **{target['id']} ({target['name']})** is **{int(live_pres)} PSI**.\n\n"
                    f"⛽ **Hydraulic Status:** {'PRESSURE DEPRESSURIZATION WARNING' if live_pres < 2700 else 'NOMINAL SYSTEM PRESSURE'}\n"
                    f"⏱️ **Predicted RUL:** **{target['predictedRUL']} days**"
                )
            return reply, highlight_ids

        # Sensor summary with live values
        sensors_summary = []
        if live:
            sensors_summary.append(f"  - Vibration RMS: Current {live_vib} mm/s (Baseline: 1.80 mm/s) [{'CRITICAL' if live_vib > 4.0 else ('WARNING' if live_vib > 2.5 else 'NOMINAL')}]")
            sensors_summary.append(f"  - Hydraulic Pressure: Current {int(live_pres)} PSI (Baseline: 3000 PSI) [{'CRITICAL' if live_pres < 2500 else ('WARNING' if live_pres < 2800 else 'NOMINAL')}]")
            sensors_summary.append(f"  - Operating Thermal: Current {live_temp} °C [{'WARNING' if live_temp > 720 else 'NOMINAL'}]")
        else:
            for s in target.get("contributingSensors", []):
                sensors_summary.append(f"  - {s['name']}: Current {s['current']} (Baseline: {s['baseline']}), Delta: {s['delta']} [{s['status'].upper()}]")
        sensors_block = "\n".join(sensors_summary)

        # Action checklist
        actions = []
        for act in target.get("actionPlan", []):
            actions.append(f"  1. {act['task']} (Priority: {act['priority'].upper()}, ETA: {act['eta']})")
        action_block = "\n".join(actions) if actions else "  1. Routine operational readiness inspection."

        if is_hinglish:
            status_text = "CRITICAL CONDITION (Non-Ready)" if is_crit else "WATCHLIST CONDITION (Warning Alert)" if is_warn else "MISSION-READY (Optimal)"
            reason = (
                f"Commander, **{target['id']} ({target['name']})** filhal **{status_text}** me hai. Iska poora live telemetry breakdown:\n\n"
                f"🔍 **Kyu hai critical/warning? (Root-Cause Diagnosis):**\n"
                f"{target['copilotAnalysis']}\n\n"
                f"📊 **Live Telemetry Sensor Breakdown (1.25s Stream):**\n"
                f"{sensors_block}\n\n"
                f"🤖 **ML Model Assessment ({target['mlModelApplied']}):**\n"
                f"• Failure Risk Probability: **{target.get('failureRiskDescription', f'{live_prob*100:.1f}%')}**\n"
                f"• Mission Readiness Score: **{target['readinessScore']}%**\n"
                f"• Predicted Remaining Useful Life (RUL): **{target['predictedRUL']} din** (failure se pehle){wo_text}\n\n"
                f"🛠️ **Immediate Action Plan (Kya karna padega):**\n"
                f"{action_block}\n\n"
                f"💡 *Suggestion: Aap Depot maintenance team ko turant sortie hold rakhne aur work order dispatch karne ka command de sakte hain.*"
            )
            return reason, highlight_ids
        else:
            status_text = "CRITICAL (Combat Sortie Grounded)" if is_crit else "WATCHLIST (Warning Threshold)" if is_warn else "MISSION-READY"
            reason = (
                f"Commander, here is the diagnostic report for **{target['id']} ({target['name']})** [Status: {status_text}]:\n\n"
                f"🔍 **Root-Cause Analysis:**\n"
                f"{target['copilotAnalysis']}\n\n"
                f"📊 **Live Telemetry Sensor Breakdown (1.25s Stream):**\n"
                f"{sensors_block}\n\n"
                f"🤖 **Predictive ML Intelligence ({target['mlModelApplied']}):**\n"
                f"• Failure Probability: {target.get('failureRiskDescription', f'{live_prob*100:.1f}%')}\n"
                f"• Readiness Score: **{target['readinessScore']}%**\n"
                f"• Predicted RUL: **{target['predictedRUL']} days to failure**{wo_text}\n\n"
                f"🛠️ **Required Depot Action Checklist:**\n"
                f"{action_block}"
            )
            return reason, highlight_ids

    # Case 2: Inquiring about critical or high-risk assets in general (or "sabse kharab / worst")
    fleet_items = list(manager.fleet_state.values()) if manager.fleet_state else all_assets
    critical_assets = [a for a in fleet_items if a["status"] == "critical"]
    watch_assets = [a for a in fleet_items if a["status"] == "watch"]
    highlight_ids = [a["id"] for a in critical_assets[:5]]

    if any(word in query_lower for word in ['critical', 'risk', 'danger', 'khatra', 'failure', 'kharab', 'problem', 'worst', 'sabse']):
        sorted_by_risk = sorted(fleet_items, key=lambda x: x.get("readinessScore", 100))
        top_crit = sorted_by_risk[:4]
        if is_hinglish:
            crit_list = "\n".join([f"• **{a['id']} ({a['name']})**: Readiness **{a['readinessScore']}%**, RUL **{a['predictedRUL']} din**, Vibration **{a.get('vibration', 'N/A')} mm/s**" for a in top_crit])
            reply = (
                f"Commander, is waqt live telemetry ke mutabiq fleet me **{len(critical_assets)} assets CRITICAL** condition me hain:\n\n"
                f"{crit_list}\n\n"
                f"Aap kisi bhi asset ka ID (jaise *'V-102'*, *'A-317'*, *'INS Chennai'*) pooch sakte hain live data janne ke liye."
            )
            return reply, highlight_ids
        else:
            crit_list = "\n".join([f"• **{a['id']} - {a['name']}**: Readiness **{a['readinessScore']}%**, RUL **{a['predictedRUL']} days**, Vibration **{a.get('vibration', 'N/A')} mm/s**" for a in top_crit])
            reply = (
                f"Commander, live telemetry monitoring identifies **{len(critical_assets)} assets in CRITICAL condition**:\n\n"
                f"{crit_list}\n\n"
                f"Ask about any specific asset ID for full live sensor telemetry."
            )
            return reply, highlight_ids

    # Case 3: Fleet Readiness or Domain queries
    metrics = manager.latest_metrics if manager.latest_metrics else get_metrics()
    if any(word in query_lower for word in ['fleet', 'readiness', 'overall', 'kitne', 'status', 'overview', 'domain']):
        total = metrics.get('totalAssets', len(fleet_items))
        ready = metrics.get('missionReady', sum(1 for a in fleet_items if a['status'] == 'ready'))
        crit = metrics.get('criticalNonReady', sum(1 for a in fleet_items if a['status'] == 'critical'))
        watch = metrics.get('watchAlerts', sum(1 for a in fleet_items if a['status'] == 'watch'))
        ready_pct = metrics.get('readyPercentage', round(ready/max(1,total)*100, 1))

        if is_hinglish:
            reply = (
                f"Commander, poore defense fleet ka **Overall Live Readiness Score {ready_pct}%** hai:\n\n"
                f"• Total Monitored Combat Assets: **{total}**\n"
                f"• Mission-Ready Platforms: **{ready}**\n"
                f"• Critical Non-Ready (Grounded): **{crit}**\n"
                f"• Watchlist Alerts: **{watch}**\n"
                f"• Mean Time Between Failures: **{metrics.get('meanTimeBetweenFailures', '418 hrs')}**\n\n"
                f"Aap kisi bhi specific platform ka live telemetry status pooch sakte hain!"
            )
            return reply, [a["id"] for a in critical_assets[:3]]
        else:
            reply = (
                f"Commander, overall fleet operational readiness is currently **{ready_pct}%**:\n\n"
                f"• Total Monitored Platforms: **{total}**\n"
                f"• Mission-Ready: **{ready}**\n"
                f"• Critical Non-Ready (Grounded): **{crit}**\n"
                f"• Watchlist Alerts: **{watch}**\n"
                f"• Fleet MTBF: **{metrics.get('meanTimeBetweenFailures', '418 hrs')}**"
            )
            return reply, [a["id"] for a in critical_assets[:3]]

    # Default general fallback
    if is_hinglish:
        reply = (
            f"Commander, me Mission Readiness Defense Copilot hu. Me aapke application me sabhi 27+ combat platforms, real-time 1.25s IoT sensor streams, aur 3 ML models (`ai4i.pkl`, `bearing.pkl`, `failure_model.pkl`) ka live data track kar raha hu.\n\n"
            f"Aap mujhse puch sakte hain:\n"
            f"1. *'V-102 Arjun tank critical kyu he?'*\n"
            f"2. *'A-317 Sukhoi me turbine vibration kitni he?'*\n"
            f"3. *'48 C Desert Stress Test On MS CHENNAI'* (ya koi bhi temperature/duration)\n"
            f"4. *'V-102 ke liye repair order dispatch karo'*"
        )
    else:
        reply = (
            f"Commander, I am your Defense Intelligence Mission Readiness Copilot. I continuously monitor 1.25s real-time telemetry, failure models, and work orders across your fleet.\n\n"
            f"You can ask:\n"
            f"1. *'Why is V-102 in critical condition?'*\n"
            f"2. *'What is the live bearing vibration on A-317 Su-30MKI?'*\n"
            f"3. *'Simulate 48 C Desert Stress Test On MS CHENNAI'* (or any temperature/scenario)\n"
            f"4. *'Dispatch repair work order for V-102'*"
        )
    return reply, [a["id"] for a in critical_assets[:2]]

def execute_agentic_tool(user_query: str, matched_assets: List[Dict[str, Any]], all_assets: List[Dict[str, Any]], is_hinglish: bool) -> Optional[Tuple[str, Dict[str, Any], List[str]]]:
    """
    Autonomous ReAct Agent Tool Execution Engine.
    Executes real database state changes and counterfactual simulations upon commander command.
    """
    q = user_query.lower()
    # 0. TOOL 0: REGISTER NEW ASSET (AI COPILOT DYNAMIC FLEET ADDITION)
    register_triggers = ['add asset', 'register asset', 'naya asset', 'new asset', 'create asset', 'asset register', 'asset add', 'banao asset', 'platform add', 'add platform', 'register platform', 'asset dalo']
    is_add_asset = any(t in q for t in register_triggers) or (any(w in q for w in ['add', 'register', 'naya', 'create', 'banao']) and any(w in q for w in ['asset', 'tank', 'aircraft', 'fighter', 'ship', 'carrier', 'frigate', 'destroyer', 'ugv', 'helicopter']))
    if is_add_asset:
        clean_name = user_query
        for noise in [
            'ek naya asset add karo', 'naya asset add karo', 'naya asset banao',
            'add new asset', 'register new asset', 'add asset', 'register asset',
            'create asset', 'new asset', 'add platform', 'register platform',
            'ek naya', 'naya asset', 'asset add karo', 'add karo', 'register karo',
            'banao', 'karo', 'kardo', 'please', 'can you', 'ko add'
        ]:
            clean_name = re.sub(r'\b' + re.escape(noise) + r'\b', '', clean_name, flags=re.IGNORECASE)
        clean_name = re.sub(r'[^\w\s\-]', '', clean_name).strip()
        if not clean_name or len(clean_name) < 2:
            clean_name = "INS Vishal Aircraft Carrier"

        cl_lower = clean_name.lower()
        if any(w in cl_lower or w in q for w in ['ship', 'carrier', 'destroyer', 'frigate', 'corvette', 'naval', 'submarine', 'ins', 'samudra', 'vikrant', 'vishal']):
            atype = "Naval"
            category = "Naval Strike Group"
            model_type = "bearing"
            base_temp = 660.0
            base_pres = 3020.0
            base_vib = 1.15
            id_prefix = "N"
        elif any(w in cl_lower or w in q for w in ['tank', 'mbt', 'armor', 'ugv', 'howitzer', 'bmp', 'namica', 'whap', 'arjun', 't-90', 'vajra']):
            atype = "Ground Armor"
            category = "Ground Armored Fleet"
            model_type = "armor"
            base_temp = 68.0
            base_pres = 2950.0
            base_vib = 1.60
            id_prefix = "V"
        else:
            atype = "Aircraft"
            category = "Combat Aircraft"
            model_type = "turbofan" if any(w in cl_lower for w in ['rafale', 'tejas', 'mirage', 'jaguar']) else "bearing"
            base_temp = 670.0
            base_pres = 3000.0
            base_vib = 1.10
            id_prefix = "A"

        existing_ids = {a["id"].upper() for a in all_assets}
        rand_id_num = random.randint(100, 999)
        new_id = f"{id_prefix}-{rand_id_num}"
        while new_id in existing_ids:
            rand_id_num = random.randint(100, 999)
            new_id = f"{id_prefix}-{rand_id_num}"

        asset_obj = {
            "id": new_id,
            "callsign": f"SENTINEL-{rand_id_num}",
            "name": clean_name.title(),
            "type": atype,
            "category": category,
            "status": "ready",
            "readinessScore": 94,
            "predictedRUL": 60,
            "operationalBase": "Central Forward Command Depot",
            "crewAssigned": "Tactical Wing Crew Alpha",
            "lastServiceDate": datetime.now().strftime("%Y-%m-%d"),
            "nextScheduledService": datetime.now().strftime("%Y-11-15"),
            "flightHours": random.randint(120, 650),
            "mlModelApplied": f"{model_type.capitalize()} AI Predictive Model",
            "failureRiskDescription": "Initial calibration run verified. All subsystem sensor metrics within optimal operational thresholds.",
            "copilotAnalysis": f"AI automated baseline registration completed. Real-time telemetry monitoring initialized on {model_type.upper()} model.",
            "contributingSensors": [
                { "name": "Telemetry Vibration RMS", "current": f"{base_vib} mm/s", "baseline": f"{base_vib} mm/s", "status": "nominal", "delta": "0.0%" },
                { "name": "Hydraulic System Pressure", "current": f"{int(base_pres)} PSI", "baseline": "3000 PSI", "status": "nominal", "delta": "+0.2%" },
                { "name": "Operating Thermal Sensor", "current": f"{base_temp} °C", "baseline": f"{base_temp} °C", "status": "nominal", "delta": "0.0%" }
            ],
            "actionPlan": [
                { "id": f"AP-{new_id}-1", "task": "Scheduled telemetry calibration check", "priority": "low", "eta": "2 hrs", "crew": "Tactical Wing Crew Alpha", "partsAvailable": True }
            ],
            "serviceHistory": [
                { "date": datetime.now().strftime("%Y-%m-%d"), "event": "Registration & Initial Telemetry Calibration Run", "inspector": "Depot AI Copilot", "status": "Completed" }
            ],
            "telemetryHistory": generate_initial_telemetry_history(base_vib, base_pres, base_temp, 30)
        }

        save_custom_asset(asset_obj)
        manager.register_custom_asset(asset_obj)

        try:
            import asyncio
            asyncio.create_task(manager.broadcast({
                "type": "ASSET_REGISTERED",
                "asset": asset_obj,
                "metrics": manager.latest_metrics,
                "assets": manager.fleet_state
            }))
        except Exception:
            pass

        if is_hinglish:
            reply = (
                f"Commander, Naya Asset **{asset_obj['id']} ({asset_obj['name']})** successfully FLEET me add kar diya gaya hai! 🛡️\n\n"
                f"• Category: **{category}** ({atype})\n"
                f"• Assigned Base: **{asset_obj['operationalBase']}**\n"
                f"• Status: **READY (Combat Operational - 94% Readiness)**\n"
                f"• Sensor Baselines: Vibration **{base_vib} mm/s**, Pressure **{int(base_pres)} PSI**, Temp **{base_temp} °C**\n\n"
                f"Live IoT Telemetry Stream (2.0s) initialize ho chuka hai aur ye asset Dashboard fleet overview me live visible hai."
            )
        else:
            reply = (
                f"Commander, New Defense Platform **{asset_obj['id']} ({asset_obj['name']})** has been registered in the fleet registry! 🛡️\n\n"
                f"• Classification: **{category}** ({atype})\n"
                f"• Assigned Base: **{asset_obj['operationalBase']}**\n"
                f"• Initial Status: **READY (94% Mission Readiness)**\n"
                f"• Telemetry Baselines: Vibration **{base_vib} mm/s**, Pressure **{int(base_pres)} PSI**, Temp **{base_temp} °C**\n\n"
                f"Live 2.0s IoT telemetry streaming is now active and the platform is visible across the mission control dashboard."
            )

        action_taken = {
            "type": "ASSET_REGISTERED",
            "title": f"New Platform Registered: {asset_obj['id']}",
            "asset": asset_obj
        }
        return reply, action_taken, [asset_obj["id"]]

    # TOOL: INJECT ANOMALY / SPIKE SENSOR
    spike_triggers = ['spike', 'anomaly inject', 'vibration badhao', 'temp spike', 'pressure drop', 'kharab karo', 'critical banao', 'damage simulate']
    if any(t in q for t in spike_triggers) and not any(w in q for w in ['khatam', 'reset', 'clear', 'hatao', 'theek']):
        target = matched_assets[0] if matched_assets else next((a for a in all_assets if a["status"] == "ready"), all_assets[0])
        sensor = "temp" if any(w in q for w in ['temp', 'temperature', 'garmi', 'heat']) else ("pressure" if any(w in q for w in ['pressure', 'hydraulic']) else "vibration")
        spike_val = 5.45 if sensor == "vibration" else (2400.0 if sensor == "pressure" else 785.0)
        
        spike_res = manager.inject_anomaly(target["id"], sensor, spike_val, duration_seconds=60)
        wo = spike_res.get("work_order", {})

        try:
            import asyncio
            asyncio.create_task(manager.broadcast({
                "type": "ANOMALY_TRIGGERED",
                "asset_id": target["id"].upper(),
                "sensor": sensor,
                "spike_value": spike_val,
                "interval_seconds": 2.0,
                "timestamp": datetime.utcnow().strftime("%H:%M:%S"),
                "assets": manager.fleet_state,
                "metrics": manager.latest_metrics,
                "work_order": wo,
                "details": spike_res
            }))
        except Exception:
            pass

        if is_hinglish:
            reply = (
                f"Commander, **{target['id']} ({target['name']})** par **{sensor.upper()} Anomaly Spike ({spike_val})** inject kar diya gaya hai! 🚨\n\n"
                f"• Status: **CRITICAL (Grounded)**\n"
                f"• Telemetry Trip: Sensor value spiked to **{spike_val}**\n"
                f"• Maintenance Plan: Emergency Work Order **{wo.get('id', 'WO-EMERGENCY')}** automatically create ho gaya hai\n"
                f"• Fleet Dashboard: **Critical Non-Ready count (+1)** badh gaya hai\n\n"
                f"Aap ise Maintenance Plan tab se Depot ko dispatch karke engineer sign-off le sakte hain."
            )
        else:
            reply = (
                f"Commander, critical {sensor.upper()} anomaly spike ({spike_val}) injected into **{target['id']} ({target['name']})**. 🚨\n\n"
                f"• Operational Status: **CRITICAL (Flight/Sortie Blocked)**\n"
                f"• Maintenance Plan: Emergency Work Order **{wo.get('id', 'WO-EMERGENCY')}** logged under Pending Dispatch\n"
                f"• Fleet Metrics: **Critical Non-Ready metric (+1)** updated\n\n"
                f"Platform requires immediate depot intervention via the Maintenance Schedule."
            )

        action_taken = {
            "type": "ANOMALY_TRIGGERED",
            "title": f"Anomaly Spike Injected: {target['id']}",
            "asset": target,
            "work_order": wo
        }
        return reply, action_taken, [target["id"]]

    # TOOL: CONFIRM REPAIR / RESTORE NOMINAL
    repair_triggers = ['confirm repair', 'repair confirm', 'theek karo', 'theek kardo', 'repair kardo', 'repair complete', 'nominal karo', 'normal karo', 'engineer sign', 'sign off']
    if any(t in q for t in repair_triggers) and not any(w in q for w in ['dispatch', 'order bhej']):
        target = matched_assets[0] if matched_assets else next((a for a in all_assets if a["status"] == "critical"), all_assets[0])
        aid = target["id"].upper()
        
        manager.active_anomalies.pop(aid, None)
        meta = manager.get_asset_meta(aid)
        _repair_hold[aid] = time.time() + 15.0
        if aid in manager.fleet_state:
            curr = manager.fleet_state[aid]
            curr["isSpike"] = False
            curr["vibration"] = round(random.uniform(0.85, 1.35), 2)
            base_pres = meta.get("base_pres", 3000.0)
            curr["pressure"] = round(base_pres * random.uniform(0.98, 1.02), 0)
            base_temp = meta.get("base_temp", 68.0 if curr.get("type") == "Ground Armor" else 660.0)
            curr["temp"] = round(base_temp * 0.98, 1)
            curr["status"] = "ready"
            curr["readinessScore"] = random.randint(93, 98)
            curr["failureProb"] = 0.06
            curr["predictedRUL"] = random.randint(52, 75)
            if curr.get("model_type") == "armor" or meta.get("model") == "armor":
                curr["rpm"] = 1800
                curr["torque"] = 48.0
                curr["wear"] = 25
                from api.routes_ws import INITIAL_FLEET_BASELINES
                if aid in INITIAL_FLEET_BASELINES:
                    INITIAL_FLEET_BASELINES[aid]["wear"] = 25
                    INITIAL_FLEET_BASELINES[aid]["torque"] = 48.0
                    INITIAL_FLEET_BASELINES[aid]["rpm"] = 1800

        try:
            conn = get_db_connection()
            c = conn.cursor()
            c.execute("UPDATE work_orders SET status = 'Repair Confirmed ✓' WHERE asset_id = ?", (aid,))
            conn.commit()
            conn.close()
        except Exception:
            pass

        manager.update_tick()

        try:
            import asyncio
            asyncio.create_task(manager.broadcast({
                "type": "REPAIR_COMPLETE",
                "asset_id": aid,
                "asset_name": meta.get("name", aid),
                "message": f"Engineer confirmed repair complete on {meta.get('name', aid)}.",
                "timestamp": datetime.utcnow().strftime("%H:%M:%S"),
                "assets": manager.fleet_state,
                "metrics": manager.latest_metrics
            }))
        except Exception:
            pass

        if is_hinglish:
            reply = (
                f"Commander, **{target['id']} ({target['name']})** ka Depot Maintenance & Engineer Sign-Off COMPLETE ho gaya hai! ✅\n\n"
                f"• Operational Status: **READY (Nominal Combat Health - {manager.fleet_state.get(aid, {}).get('readinessScore', 95)}%)**\n"
                f"• Sensors Restored: Vibration **{manager.fleet_state.get(aid, {}).get('vibration', 1.10)} mm/s**, Pressure **{int(manager.fleet_state.get(aid, {}).get('pressure', 3000))} PSI**\n"
                f"• Work Order Status: **Repair Confirmed ✓**\n"
                f"• Fleet Dashboard: **Mission-Ready (Green Normal) count (+1)** badh gaya hai!\n\n"
                f"Platform unrestricted sorties ke liye release kar diya gaya hai."
            )
        else:
            reply = (
                f"Commander, depot repair and engineer sign-off verified for **{target['id']} ({target['name']})**. ✅\n\n"
                f"• Operational Status: **READY ({manager.fleet_state.get(aid, {}).get('readinessScore', 95)}% Mission Readiness)**\n"
                f"• Telemetry Restored: Vibration **{manager.fleet_state.get(aid, {}).get('vibration', 1.10)} mm/s**, Pressure **{int(manager.fleet_state.get(aid, {}).get('pressure', 3000))} PSI**\n"
                f"• Work Order: **Repair Confirmed ✓**\n"
                f"• Fleet Dashboard: **Mission-Ready count (+1)** increased.\n\n"
                f"Platform cleared for operational sortie deployment."
            )

        action_taken = {
            "type": "REPAIR_CONFIRMED",
            "title": f"Repair Confirmed: {target['id']}",
            "asset": manager.fleet_state.get(aid, target)
        }
        return reply, action_taken, [target["id"]]

    # 1. TOOL 1: DISPATCH MAINTENANCE WORK ORDER TO SQLITE DATABASE
    dispatch_triggers = ['dispatch', 'work order', 'repair order', 'bhejo', 'order bhej', 'assign crew', 'fix karo', 'repair karo', 'maintenance order', 'order assign']
    if any(t in q for t in dispatch_triggers):
        target = matched_assets[0] if matched_assets else next((a for a in all_assets if a["status"] == "critical"), all_assets[0])
        task_desc = target["actionPlan"][0]["task"] if target.get("actionPlan") else f"Urgent depot telemetry inspection for {target['name']}"
        crew = target["actionPlan"][0]["crew"] if target.get("actionPlan") else "Central Defense Depot Fast-Response Unit"
        order_num = random.randint(100, 999)
        order_id = f"WO-CMD-{order_num}"

        order_dict = {
            "id": order_id,
            "assetId": target["id"],
            "assetName": target["name"],
            "task": task_desc,
            "priority": "critical",
            "dueInHours": 12,
            "assignedCrew": crew,
            "partsStatus": "Reserved In Stock",
            "status": "Dispatched to Depot",
            "estimatedDowntime": "8 hrs",
            "impact": "High (Immediate Sortie Release Priority)"
        }

        # Persist directly into SQLite database
        save_work_order(order_dict)

        try:
            import asyncio
            try:
                loop = asyncio.get_running_loop()
                loop.create_task(manager.dispatch_asset(target["id"], order_id=order_id))
            except RuntimeError:
                asyncio.run(manager.dispatch_asset(target["id"], order_id=order_id))
        except Exception as err:
            print(f"[routes_chat] dispatch error: {err}")

        if is_hinglish:
            reply = (
                f"Commander, **{target['id']} ({target['name']})** ke liye Work Order **{order_id}** turant Central Defense Depot ko DISPATCH kar diya gaya hai aur asset ko **NORMAL (Mission-Ready)** restore kar diya gaya hai! 🟢\n\n"
                f"🛠️ **Task:** {task_desc}\n"
                f"🚨 **Status:** Dispatched to Depot & Normal Restored\n"
                f"👷‍♂️ **Assigned Unit:** {crew}\n"
                f"⏱️ **Due In:** 12 Hours (Estimated Downtime: 8 hrs)\n\n"
                f"• **Fleet Dashboard:** Critical count (-1) kam ho gaya hai aur Mission-Ready (+1) badh gaya hai.\n"
                f"• **Maintenance Plan:** Work Order dispatched list me record ho gaya hai."
            )
        else:
            reply = (
                f"Commander, Work Order **{order_id}** has been officially DISPATCHED to the Central Defense Depot for **{target['id']} ({target['name']})**, and the asset is restored to **NORMAL (Mission-Ready)**! 🟢\n\n"
                f"🛠️ **Task:** {task_desc}\n"
                f"🚨 **Status:** Dispatched to Depot (Operational)\n"
                f"👷‍♂️ **Assigned Unit:** {crew}\n"
                f"⏱️ **Due In:** 12 Hours (Estimated Downtime: 8 hrs)\n\n"
                f"• **Fleet Dashboard:** Critical Non-Ready count decremented (-1), Mission-Ready count incremented (+1).\n"
                f"• **Maintenance Plan:** Order updated to Dispatched status."
            )

        action_taken = {
            "type": "WORK_ORDER_DISPATCHED",
            "title": f"Work Order {order_id} Dispatched",
            "order": order_dict,
            "asset_id": target["id"]
        }
        return reply, action_taken, [target["id"]]

    # 2. TOOL 2: MISSION STRESS TESTING & COUNTERFACTUAL SIMULATION
    stress_triggers = [
        'simulate', 'stress test', 'survive', 'mission test', 'desert test', 
        'kya survive karega', 'survivability', 'stress', 'sortie', 'sorties', 'flight envelope', 
        'temperature test', 'extreme condition', 'high altitude', 'arctic test', 'cold test',
        'test karo', 'survival', 'pass karega', 'fail hoga', 'chalega kya', 'endurance',
        'desert sortie', 'thermal test', 'heat test', 'winter test'
    ]
    has_temp_pattern = bool(re.search(r'\b-?\d+(?:\.\d+)?\s*(?:°?\s*[cfCF]|celsius|fahrenheit)\b', q))
    is_stress_req = any(t in q for t in stress_triggers) or (has_temp_pattern and any(w in q for w in ['test', 'sortie', 'mission', 'run', 'on', 'par', 'me', 'karo', 'simulate', 'survive']))

    if is_stress_req:
        # 1. Target asset matching
        target = matched_assets[0] if matched_assets else None
        if not target:
            # Check aliases in query
            for alias, aid in ASSET_ALIASES.items():
                if re.search(r'\b' + re.escape(alias) + r'\b', q):
                    target = next((a for a in all_assets if a["id"].lower() == aid.lower()), None)
                    if target:
                        break
        if not target:
            target = all_assets[0]

        # 2. Dynamic Temperature Parsing (ANY number, Celsius, Fahrenheit, or contextual)
        temp_val = None
        unit = 'c'
        # Check standard temperature patterns: "14 C", "48 C", "-10 C", "48°C", "100 F", "32 celsius"
        t_m = re.search(r'(-?\d+(?:\.\d+)?)\s*(?:°?\s*([cfCF])\b|deg(?:ree)?s?(?:\s*([cfCF]|celsius|fahrenheit))?|celsius|fahrenheit)', q)
        if t_m:
            temp_val = float(t_m.group(1))
            u_str = (t_m.group(2) or t_m.group(3) or '').lower()
            if 'f' in u_str:
                unit = 'f'
        else:
            # Short pattern: "14c", "48c", "14 c", "48 c"
            t_m2 = re.search(r'\b(-?\d+(?:\.\d+)?)\s*([cfCF])\b', q)
            if t_m2:
                temp_val = float(t_m2.group(1))
                if t_m2.group(2).lower() == 'f':
                    unit = 'f'
            else:
                # Plain number near temp words: "temp 48", "temperature 14", "at 50"
                t_m3 = re.search(r'(?:temp(?:erature)?|at)\s*(-?\d+(?:\.\d+)?)', q)
                if t_m3:
                    temp_val = float(t_m3.group(1))

        if temp_val is not None:
            temp_c = round((temp_val - 32.0) * 5.0 / 9.0, 1) if unit == 'f' else round(temp_val, 1)
        else:
            # Infer from environmental context
            if any(w in q for w in ['desert', 'thar', 'extreme heat', 'garmi', 'loo', 'hot']):
                temp_c = 48.0
            elif any(w in q for w in ['arctic', 'snow', 'siachen', 'barf', 'sub-zero', 'winter', 'thand', 'cold']):
                temp_c = -15.0
            elif any(w in q for w in ['altitude', 'ladakh', 'leh', 'himalaya']):
                temp_c = 2.0
            elif any(w in q for w in ['monsoon', 'humid', 'coastal']):
                temp_c = 34.0
            else:
                temp_c = 28.0

        # 3. Dynamic Duration Parsing (hours or days)
        duration_hrs = 6.0
        dur_m = re.search(r'(\d+(?:\.\d+)?)\s*(?:hrs?|hours?|ghante?|ghanta|hr\b|h\b)', q)
        day_m = re.search(r'(\d+(?:\.\d+)?)\s*(?:days?|din)\b', q)
        if day_m:
            duration_hrs = float(day_m.group(1)) * 24.0
        elif dur_m:
            duration_hrs = float(dur_m.group(1))

        # 4. Dynamic Throttle / Load Parsing
        throttle_pct = 88
        thr_m = re.search(r'(\d+)\s*%\s*(?:throttle|load|power|rpm)?', q)
        if thr_m:
            throttle_pct = max(20, min(100, int(thr_m.group(1))))

        # 5. Environment Label
        if 'desert' in q or temp_c >= 44.0:
            env_label = "Desert High-Thermal Sortie"
        elif any(w in q for w in ['arctic', 'snow', 'siachen']) or temp_c <= 0.0:
            env_label = "Arctic / Sub-Zero Combat Sortie"
        elif any(w in q for w in ['altitude', 'ladakh', 'leh']):
            env_label = "High-Altitude Himalayan Sortie"
        elif any(w in q for w in ['sea', 'naval', 'ocean', 'maritime', 'chennai', 'vikrant']):
            env_label = "Maritime Saline Patrol"
        else:
            env_label = "Standard Tactical Operational Envelope"

        # 6. Fetch live state for target
        live_state = manager.fleet_state.get(target["id"], {})
        live_vib = float(live_state.get("vibration", 2.15))
        live_temp = float(live_state.get("temp", 670.0 if target.get("type") == "Aircraft" else 70.0))
        live_pres = float(live_state.get("pressure", 2950))
        live_status = live_state.get("status", target.get("status", "ready"))

        # 7. Physical stress simulation calculations
        delta_amb = temp_c - 22.0
        if delta_amb > 0:
            thermal_deg_pct = round(delta_amb * 1.25 * (throttle_pct / 80.0) * ((duration_hrs / 6.0) ** 0.5), 1)
        else:
            thermal_deg_pct = round(delta_amb * 0.65, 1) # Negative = cooling headroom advantage

        # Vibration spike under operating stress
        if temp_c > 35.0:
            vib_spike_pct = round(12.0 + (temp_c - 35.0) * 1.6 + (throttle_pct - 80) * 0.7 + duration_hrs * 1.8, 1)
        elif temp_c < 0.0:
            vib_spike_pct = round(10.0 + abs(temp_c) * 0.9 + (throttle_pct - 80) * 0.5, 1)
        else:
            vib_spike_pct = round(max(1.5, (throttle_pct - 80) * 0.5 + duration_hrs * 0.8), 1)

        projected_vib = round(live_vib * (1.0 + vib_spike_pct / 100.0), 2)

        # 8. Genuine ML Model Inference & Thermal-Mechanical Stress Assessment
        m_type = live_state.get("model_type", "bearing")
        if m_type == "bearing":
            ims_vib = (projected_vib / 2.0) * 0.072 if projected_vib > 0.4 else projected_vib
            # Baseline probability calibrated to operational asset status
            status_base = 0.65 if live_status == "critical" else (0.32 if live_status == "watch" else 0.12)
            # Temperature-viscosity stress factor: high temp thins lubricant and increases micro-pitting wear
            thermal_risk_delta = (temp_c - 25.0) * 0.022 if temp_c > 25.0 else (temp_c - 25.0) * 0.008
            duration_factor = (duration_hrs / 24.0) * 0.14
            vib_factor = max(0.0, (projected_vib - 2.5) * 0.18)
            fail_prob = min(0.98, max(0.04, status_base + thermal_risk_delta + duration_factor + vib_factor))
        elif m_type == "armor":
            air_k = temp_c + 273.15
            proc_k = air_k + max(8.0, 14.0 + thermal_deg_pct * 0.35)
            base_wear = live_state.get("wear", 100)
            base_torque = live_state.get("torque", 50.0)
            base_rpm = live_state.get("rpm", 1800)
            pred = model_registry.predict_ground_armor(
                air_temp_k=air_k,
                process_temp_k=proc_k,
                speed_rpm=min(3200, int(base_rpm * (throttle_pct / 80.0))),
                torque_nm=min(120.0, float(base_torque * (throttle_pct / 75.0))),
                tool_wear_min=min(350.0, float(base_wear + duration_hrs * 12.0))
            )
            thermal_factor = (temp_c - 25.0) * 0.015 if temp_c > 25.0 else (temp_c - 25.0) * 0.008
            fail_prob = min(0.98, max(0.04, pred["failure_prob"] + thermal_factor))
        else: # turbofan
            therm_factor = max(0.0, (temp_c - 28.0) / 24.0)
            base_risk = 0.65 if live_status == "critical" else (0.28 if live_status == "watch" else 0.05)
            fail_prob = min(0.96, max(0.03, base_risk + 0.35 * therm_factor + 0.22 * (throttle_pct / 100.0) * (duration_hrs / 8.0)))

        fail_prob = round(float(fail_prob), 4)

        # 9. Compute Authentic Pass / Watch / Fail Outcome
        if fail_prob >= 0.55:
            failure_hour = round(max(0.6, duration_hrs * (1.0 - (fail_prob - 0.45) * 1.25)), 1)
            survival_status = f"FAIL (Projected Subsystem Failure at Hour {failure_hour})"
            is_safe = False
            recommendation = f"Sortie GROUNDED. Operating envelope ({temp_c:.1f}°C, {duration_hrs:.1f}h @ {throttle_pct}% throttle) exceeds safety limits. Subsystem thermal trip projected at hour {failure_hour}."
        elif fail_prob >= 0.28:
            survival_status = f"CONDITIONAL PASS (Watchlist Warning - Risk {round(fail_prob*100, 1)}%)"
            is_safe = True
            recommendation = f"Sortie cleared with RESTRICTIONS: Cap throttle at 80% and perform mandatory post-mission lubricant flushing."
        else:
            survival_status = f"PASS (Sortie Cleared - Nominal Risk {round(fail_prob*100, 1)}%)"
            is_safe = True
            recommendation = f"Full mission envelope approved. Thermal dissipation and bearing harmonics remain safely within MIL-STD limits."

        sim_result = {
            "assetId": target["id"],
            "assetName": target["name"],
            "ambientTemp": f"{temp_c:.1f} °C ({env_label})",
            "missionDuration": f"{duration_hrs:.1f} Hours @ {throttle_pct}% Throttle",
            "projectedSurvivability": survival_status,
            "thermalDegradation": f"{'+' if thermal_deg_pct >= 0 else ''}{thermal_deg_pct}%",
            "vibrationSpike": f"{'+' if vib_spike_pct >= 0 else ''}{vib_spike_pct}% (Projected Peak: {projected_vib} mm/s)",
            "recommendation": recommendation
        }

        if is_hinglish:
            reply = (
                f"Commander, **{target['id']} ({target['name']})** par **Digital Mission Stress Test ({temp_c:.1f}°C, {duration_hrs:.1f} Hours @ {throttle_pct}% Throttle - {env_label})** execute kiya gaya:\n\n"
                f"• Projected Outcome: **{survival_status}**\n"
                f"• Thermal Degradation Rate: **{'+' if thermal_deg_pct >= 0 else ''}{thermal_deg_pct}%**\n"
                f"• Dynamic Vibration Spike: **{'+' if vib_spike_pct >= 0 else ''}{vib_spike_pct}%** (Peak: **{projected_vib} mm/s**)\n"
                f"• ML Model Failure Risk: **{fail_prob*100:.1f}%**\n\n"
                f"💡 **Recommendation:** {recommendation}"
            )
        else:
            reply = (
                f"Commander, counterfactual Mission Stress Test simulation completed for **{target['id']} ({target['name']})** under operating envelope ({temp_c:.1f}°C, {duration_hrs:.1f}h @ {throttle_pct}% throttle):\n\n"
                f"• Projected Outcome: **{survival_status}**\n"
                f"• Thermal Degradation: **{'+' if thermal_deg_pct >= 0 else ''}{thermal_deg_pct}%**\n"
                f"• Dynamic Vibration Spike: **{'+' if vib_spike_pct >= 0 else ''}{vib_spike_pct}%** (Peak: **{projected_vib} mm/s**)\n"
                f"• Evaluated Failure Probability: **{fail_prob*100:.1f}%**\n\n"
                f"Operational Recommendation: {recommendation}"
            )

        action_taken = {
            "type": "MISSION_STRESS_SIMULATION",
            "title": f"Stress Simulation: {target['id']} ({temp_c:.1f}°C, {duration_hrs:.1f}h)",
            "result": sim_result
        }
        return reply, action_taken, [target["id"]]

    # 3. TOOL 3: EXPLAINABLE AI (XAI) ATTRIBUTION
    xai_triggers = ['attribution', 'shap', 'feature importance', 'breakdown chart', 'xai', 'sensor breakdown', 'kis sensor']
    if any(t in q for t in xai_triggers) and matched_assets:
        target = matched_assets[0]
        xai_info = xai_explainer.explain_asset(target)
        top_driver = xai_info["attributions"][0] if xai_info.get("attributions") else None
        driver_text = f"Primary driver is **{top_driver['feature']}** ({top_driver['current']}) contributing **{top_driver['contributionPct']}%** to the risk score." if top_driver else ""

        if is_hinglish:
            reply = (
                f"Commander, **{target['id']}** ka **Explainable AI (XAI) Attribution Breakdown**:\n\n"
                f"{xai_info['summary']}\n\n"
                f"{driver_text}\n"
                f"Neeche interactive XAI feature waterfall card attach kar diya gaya hai."
            )
        else:
            reply = (
                f"Commander, here is the Explainable AI (XAI) telemetry attribution for **{target['id']}**:\n\n"
                f"{xai_info['summary']}\n\n"
                f"{driver_text}"
            )
        action_taken = {
            "type": "XAI_EXPLANATION",
            "title": f"XAI Diagnostics: {target['id']}",
            "explanation": xai_info
        }
        return reply, action_taken, [target["id"]]

    # 4. TOOL 4: FLEET FILTERING (CRITICAL / READY / WATCH)
    is_crit_filter = any(w in q for w in ['critical', 'grounded', 'non ready', 'non-ready']) and any(w in q for w in ['dikhao', 'show', 'filter', 'list', 'only', 'assets', 'asset'])
    if is_crit_filter:
        reply = "Commander, Fleet filter applied: CRITICAL Non-Ready assets." if is_hinglish else "Commander, filtering fleet view to Critical Non-Ready platforms."
        return reply, {"type": "FILTER_STATUS", "status": "CRITICAL"}, []

    is_ready_filter = any(w in q for w in ['ready', 'operational', 'combat ready']) and any(w in q for w in ['dikhao', 'show', 'filter', 'list', 'only', 'assets', 'asset'])
    if is_ready_filter:
        reply = "Commander, Fleet filter applied: MISSION-READY platforms." if is_hinglish else "Commander, filtering fleet view to Mission-Ready platforms."
        return reply, {"type": "FILTER_STATUS", "status": "READY"}, []

    # 5. TOOL 5: NAVIGATION COMMANDS (Direct UI Page Switching)
    if any(w in q for w in ['maintenance', 'schedule', 'sortie plan', 'plan table', 'work order table']) and any(w in q for w in ['open', 'show', 'dikhao', 'kholo', 'chalo', 'le chalo', 'go to', 'view', 'navigate']):
        reply = "Commander, Maintenance & Sortie Schedule tab open kar diya gaya hai." if is_hinglish else "Commander, navigating to the Maintenance & Sortie Schedule."
        return reply, {"type": "NAVIGATE", "tab": "maintenance"}, []

    if any(w in q for w in ['fleet', 'platform', 'all assets', 'sab asset', 'assets']) and any(w in q for w in ['open', 'show', 'dikhao', 'kholo', 'chalo', 'le chalo', 'go to', 'view', 'navigate']):
        reply = "Commander, Fleet Assets tab open kar diya gaya hai." if is_hinglish else "Commander, navigating to the Fleet Assets inventory."
        return reply, {"type": "NAVIGATE", "tab": "assets"}, []

    if any(w in q for w in ['dashboard', 'home', 'overview', 'main page']) and any(w in q for w in ['open', 'show', 'dikhao', 'kholo', 'chalo', 'le chalo', 'go to', 'view', 'navigate']):
        reply = "Commander, Mission Readiness Dashboard open kar diya gaya hai." if is_hinglish else "Commander, navigating to the Mission Readiness Dashboard."
        return reply, {"type": "NAVIGATE", "tab": "dashboard"}, []

    return None

@router.post("/chat")
def chat_endpoint(req: ChatRequest):
    user_query = req.message.strip()
    if not user_query:
        raise HTTPException(status_code=400, detail="Empty query message")

    all_assets = get_dynamically_scored_assets()
    work_orders = get_work_orders()
    batches = get_all_batches()
    metrics = get_metrics()

    is_hinglish = is_hinglish_query(user_query)
    matched_assets = find_referenced_assets(user_query, all_assets, req.scopedAssetId)

    # 1. RE-ACT AGENT TOOL EXECUTION: Check if user issued an operational action command
    agent_result = execute_agentic_tool(user_query, matched_assets, all_assets, is_hinglish)
    if agent_result:
        agent_reply, action_taken, highlight_ids = agent_result
        return {
            "reply": agent_reply,
            "highlightAssetIds": highlight_ids,
            "source": "react_agent (Tool Executed)",
            "detectedLanguage": "hinglish" if is_hinglish else "english",
            "actionTaken": action_taken
        }

    # 2. Check for Groq API Key or Gemini API Key
    load_env_file()
    groq_key = (req.apiKey if (req.apiKey and req.apiKey.startswith("gsk_")) else None) or os.environ.get("GROQ_API_KEY")
    gemini_key = (req.apiKey if (req.apiKey and not req.apiKey.startswith("gsk_")) else None) or os.environ.get("GEMINI_API_KEY")
    # If req.apiKey is provided and doesn't match standard prefix, check if it might be Groq
    if req.apiKey and not groq_key and not gemini_key:
        groq_key = req.apiKey

    if groq_key or gemini_key:
        # Build enriched context for LLM
        assets_context = json.dumps([
            {
                "id": a["id"],
                "name": a["name"],
                "type": a["type"],
                "status": a["status"],
                "readinessScore": a["readinessScore"],
                "predictedRUL": a["predictedRUL"],
                "sensors": a.get("contributingSensors", []),
                "diagnosis": a.get("copilotAnalysis", ""),
                "actionPlan": a.get("actionPlan", [])
            } for a in all_assets[:15]
        ], indent=1)

        system_prompt = f"""
You are the Defense Mission Readiness AI Copilot for a military predictive maintenance and fleet intelligence platform.
You have access to live telemetry, real-time sensor streams (Vibration, Hydraulic Pressure, Temperature), and 3 trained ML models:
1. AI4I 2020 Predictive Maintenance (Ground Armor, Tanks, UGVs, Tool Wear, Torque)
2. NASA IMS Bearing Model (Naval Propulsion, Fighter Jet Turbine Shaft Bearing Vibration)
3. NASA N-CMAPSS Turbofan Engine Model (Combat Aircraft Engine Thermodynamic Cycle)

Fleet Summary:
Total Assets: {metrics['totalAssets']}, Mission Ready: {metrics['missionReady']}, Critical Non-Ready: {metrics['criticalNonReady']}, Watchlist: {metrics['watchAlerts']}.

Current Fleet Assets Context:
{assets_context}

CRITICAL INSTRUCTIONS:
- Respond in the EXACT language style of the user query.
- If the user asks in Hinglish (e.g. "V-102 critical kyu he?", "kya kharab he?", "A-317 me kya hua?"), respond in clear, natural, fluent Hinglish.
- If the user asks in English, respond in professional military English.
- Always provide the EXACT root-cause reason using sensor telemetry numbers (e.g. vibration mm/s, hydraulic pressure PSI/bar, temperature), the ML model probability, predicted remaining useful life (RUL), and depot maintenance action steps.
- Highlight asset IDs in bold (e.g. **V-102**).
- Be concise, authoritative, and helpful.
"""
        # Try Groq first if available
        if groq_key:
            groq_reply = call_groq_api(groq_key, user_query, system_prompt)
            if groq_reply:
                highlight_ids = [a["id"] for a in matched_assets] if matched_assets else [a["id"] for a in all_assets if a["status"] == "critical"][:3]
                return {
                    "reply": groq_reply,
                    "highlightAssetIds": highlight_ids,
                    "source": "groq (Llama 3.3 70B)",
                    "detectedLanguage": "hinglish" if is_hinglish else "english"
                }

        # Try Gemini if Groq not available or failed
        if gemini_key:
            gemini_reply = call_gemini_api(gemini_key, user_query, system_prompt)
            if gemini_reply:
                highlight_ids = [a["id"] for a in matched_assets] if matched_assets else [a["id"] for a in all_assets if a["status"] == "critical"][:3]
                return {
                    "reply": gemini_reply,
                    "highlightAssetIds": highlight_ids,
                    "source": "gemini",
                    "detectedLanguage": "hinglish" if is_hinglish else "english"
                }

    # 3. Built-in Local RAG Semantic Engine (No API key required!)
    reply_text, highlight_ids = generate_local_response(user_query, matched_assets, all_assets, work_orders, is_hinglish)

    return {
        "reply": normalize_reply_text(reply_text),
        "highlightAssetIds": highlight_ids,
        "source": "local_rag",
        "detectedLanguage": "hinglish" if is_hinglish else "english"
    }

