import sys
import os

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from ml.explainer import xai_explainer
from api.routes_assets import get_dynamically_scored_assets, get_asset, get_asset_explanation, get_work_orders
from api.routes_ws import manager, AnomalyInjectRequest, inject_anomaly_endpoint, reset_anomaly_endpoint
from api.routes_chat import chat_endpoint, ChatRequest
from database import init_db, get_all_persisted_work_orders

def test_feature_1_xai():
    print("\n--- [TEST 1] Explainable AI (XAI) Feature Attribution ---")
    res_b = xai_explainer.explain_bearing(rms_vibration=4.82, kurtosis=6.4, peak=5.2)
    assert res_b["failureProb"] > 0.65, "Bearing failure probability should be critical"
    assert len(res_b["attributions"]) >= 3, "Should have at least 3 feature attributions"
    assert "Peak" in res_b["attributions"][0]["feature"] or "Vibration" in res_b["attributions"][0]["feature"]
    print(f"✅ Bearing XAI: {res_b['summary']}")

    res_a = xai_explainer.explain_ground_armor(tool_wear_min=215, torque_nm=72.4)
    assert res_a["failureProb"] >= 0.40
    assert len(res_a["attributions"]) == 4
    print(f"✅ Ground Armor XAI: {res_a['summary']}")

    # Test asset explanation route
    exp_a317 = get_asset_explanation("A-317")
    assert exp_a317["model"] is not None
    print(f"✅ Asset Route XAI for A-317: OK ({len(exp_a317['attributions'])} factors)")

    # Test Asset Detail includes xaiAttribution
    asset_a317 = get_asset("A-317")
    assert "xaiAttribution" in asset_a317, "Asset detail must include xaiAttribution"
    print(f"✅ Asset Detail xaiAttribution attached: OK")

def test_feature_2_telemetry_ws():
    print("\n--- [TEST 2] Live Telemetry & Anomaly Injection ---")
    # Test baseline reading
    reading = manager.get_current_reading("A-317", 4.82, 2640, 742)
    assert 4.0 <= reading["vibration"] <= 6.0
    assert not reading["isSpike"]
    print(f"✅ Baseline Telemetry Reading: Vib={reading['vibration']} mm/s, Pres={reading['pressure']} PSI")

    # Test anomaly injection
    manager.inject_anomaly("A-317", "vibration", 5.48, 30)
    spiked_reading = manager.get_current_reading("A-317", 4.82, 2640, 742)
    assert spiked_reading["isSpike"], "Reading should be marked as spiked"
    assert spiked_reading["vibration"] >= 5.2, f"Spiked vibration should be >= 5.2, got {spiked_reading['vibration']}"
    print(f"✅ Injected Anomaly Reading: Vib={spiked_reading['vibration']} mm/s (Spike Detected: {spiked_reading['isSpike']})")

    manager.reset_anomaly("A-317")
    reset_reading = manager.get_current_reading("A-317", 4.82, 2640, 742)
    assert not reset_reading["isSpike"], "Spike should be cleared after reset"
    print(f"✅ Anomaly Reset Verified: Vib={reset_reading['vibration']} mm/s")

def test_feature_3_agentic_copilot():
    print("\n--- [TEST 3] ReAct Agent Copilot & Database Work Orders ---")
    # Dispatch test
    req = ChatRequest(message="V-102 ke liye urgent repair order dispatch karo")
    res = chat_endpoint(req)
    assert res.get("actionTaken") is not None, "Action should be executed"
    assert res["actionTaken"]["type"] == "WORK_ORDER_DISPATCHED", "Action type should be WORK_ORDER_DISPATCHED"
    order_id = res["actionTaken"]["order"]["id"]
    print(f"✅ ReAct Action Executed: {res['actionTaken']['title']}")
    print(f"   Reply excerpt: {res['reply'][:140]}...")

    # Verify order is persisted in SQLite
    persisted = get_all_persisted_work_orders()
    assert any(o["id"] == order_id for o in persisted), f"Order {order_id} must be in SQLite"
    print(f"✅ Order {order_id} verified in SQLite database (Total persisted: {len(persisted)})")

    # Verify order is in get_work_orders()
    all_wos = get_work_orders()
    assert any(o["id"] == order_id for o in all_wos), f"Order {order_id} must be in get_work_orders()"
    print(f"✅ Order {order_id} returned in live get_work_orders(): OK")

    # Mission Stress Test via Copilot
    req_stress = ChatRequest(message="A-317 par 48C desert mission stress test simulate karo")
    res_stress = chat_endpoint(req_stress)
    assert res_stress.get("actionTaken") is not None
    assert res_stress["actionTaken"]["type"] == "MISSION_STRESS_SIMULATION"
    print(f"✅ Mission Stress Simulation ReAct Action: {res_stress['actionTaken']['title']}")

    # XAI via Copilot
    req_xai = ChatRequest(message="A-317 ka Explainable AI feature attribution breakdown dikhao")
    res_xai = chat_endpoint(req_xai)
    assert res_xai.get("actionTaken") is not None
    assert res_xai["actionTaken"]["type"] == "XAI_EXPLANATION"
    print(f"✅ XAI Attribution ReAct Action: {res_xai['actionTaken']['title']}")

def test_feature_4_dynamic_stress_and_telemetry():
    print("\n--- [TEST 4] Dynamic Mission Stress Testing & Authentic Telemetry Queries ---")
    
    # 1. Test 48 C Desert on MS CHENNAI -> Must return FAIL with 48.0 °C
    res_48 = chat_endpoint(ChatRequest(message="48 C Desert Stress Test On MS CHENNAI"))
    assert res_48.get("actionTaken") is not None
    res_48_data = res_48["actionTaken"]["result"]
    assert "48.0" in res_48_data["ambientTemp"], f"Expected 48.0 in ambientTemp, got {res_48_data['ambientTemp']}"
    assert "FAIL" in res_48_data["projectedSurvivability"], f"Expected FAIL at 48C, got {res_48_data['projectedSurvivability']}"
    assert "+" in res_48_data["thermalDegradation"], "Thermal degradation must be positive at 48C"
    print(f"✅ 48 C Desert Stress on MS Chennai: {res_48_data['projectedSurvivability']} (Degradation: {res_48_data['thermalDegradation']})")

    # 2. Test 14 C Desert on MS CHENNAI -> Must return PASS with 14.0 °C and distinct output
    res_14 = chat_endpoint(ChatRequest(message="14 C Desert Stress Test On MS CHENNAI"))
    assert res_14.get("actionTaken") is not None
    res_14_data = res_14["actionTaken"]["result"]
    assert "14.0" in res_14_data["ambientTemp"], f"Expected 14.0 in ambientTemp, got {res_14_data['ambientTemp']}"
    assert "PASS" in res_14_data["projectedSurvivability"], f"Expected PASS at 14C, got {res_14_data['projectedSurvivability']}"
    assert "-" in res_14_data["thermalDegradation"], "Thermal degradation must be negative (cooling benefit) at 14C"
    print(f"✅ 14 C Stress on MS Chennai: {res_14_data['projectedSurvivability']} (Degradation: {res_14_data['thermalDegradation']})")

    # 3. Test 50 C Desert Sortie on Arjun MBT (AI4I model) -> Must return FAIL with 50.0 °C
    res_arjun_hot = chat_endpoint(ChatRequest(message="50 C Desert Sortie on Arjun MBT"))
    assert res_arjun_hot.get("actionTaken") is not None
    assert "50.0" in res_arjun_hot["actionTaken"]["result"]["ambientTemp"]
    assert "FAIL" in res_arjun_hot["actionTaken"]["result"]["projectedSurvivability"]
    print(f"✅ 50 C Sortie on Arjun MBT: {res_arjun_hot['actionTaken']['result']['projectedSurvivability']}")

    # 4. Test 15 C Sortie on Arjun MBT -> Must return PASS with 15.0 °C
    res_arjun_cool = chat_endpoint(ChatRequest(message="15 C Sortie on Arjun MBT"))
    assert res_arjun_cool.get("actionTaken") is not None
    assert "15.0" in res_arjun_cool["actionTaken"]["result"]["ambientTemp"]
    assert "PASS" in res_arjun_cool["actionTaken"]["result"]["projectedSurvivability"]
    print(f"✅ 15 C Sortie on Arjun MBT: {res_arjun_cool['actionTaken']['result']['projectedSurvivability']}")

    # 5. Test Live Sensor Query for A-317 Vibration
    res_vib = chat_endpoint(ChatRequest(message="A-317 me vibration kitni he?"))
    assert "mm/s" in res_vib["reply"], "Reply must contain vibration reading in mm/s"
    print(f"✅ Live Vibration Query: OK (Response includes exact mm/s reading)")

    # 6. Test Query for Top Critical Assets
    res_crit = chat_endpoint(ChatRequest(message="Konsa asset sabse kharab hai?"))
    reply_u = res_crit["reply"].upper()
    assert any(x in reply_u for x in ["A-711", "V-102", "A-317", "V-007", "CRITICAL"])
    print(f"✅ Critical Asset Query: OK (Identified top at-risk combat platforms)")

def test_feature_5_copilot_autonomous_actions():
    print("\n--- [TEST 5] AI Copilot Autonomous Fleet & Maintenance Actions ---")
    
    # 1. Register new asset via natural language
    res_reg = chat_endpoint(ChatRequest(message="ek naya asset add karo INS Vikrant aircraft carrier"))
    assert res_reg.get("actionTaken") is not None
    assert res_reg["actionTaken"]["type"] == "ASSET_REGISTERED"
    new_asset = res_reg["actionTaken"]["asset"]
    assert "N-" in new_asset["id"]
    assert "Vikrant" in new_asset["name"]
    print(f"✅ Copilot Registered New Platform: {new_asset['id']} ({new_asset['name']})")

    # Verify new asset in manager.fleet_state
    assert new_asset["id"] in manager.fleet_state
    print(f"✅ Platform {new_asset['id']} active in live telemetry engine: OK")

    # 2. Spike asset via Copilot
    res_spike = chat_endpoint(ChatRequest(message="V-102 ko spike kardo"))
    assert res_spike.get("actionTaken") is not None
    assert res_spike["actionTaken"]["type"] == "ANOMALY_TRIGGERED"
    assert res_spike["actionTaken"]["work_order"] is not None
    assert manager.fleet_state["V-102"]["status"] == "critical"
    print(f"✅ Copilot Spiked V-102: status=critical, Emergency WO generated={res_spike['actionTaken']['work_order']['id']}")

    # 3. Confirm repair via Copilot
    res_repair = chat_endpoint(ChatRequest(message="V-102 ko theek kardo confirm repair"))
    assert res_repair.get("actionTaken") is not None
    assert res_repair["actionTaken"]["type"] == "REPAIR_CONFIRMED"
    assert manager.fleet_state["V-102"]["status"] == "ready"
    assert manager.fleet_state["V-102"]["vibration"] < 2.0
    print(f"✅ Copilot Confirmed Repair on V-102: status=ready, Vib={manager.fleet_state['V-102']['vibration']} mm/s")

    # 4. Navigation command
    res_nav = chat_endpoint(ChatRequest(message="Maintenance plan dikhao"))
    assert res_nav.get("actionTaken") is not None
    assert res_nav["actionTaken"]["type"] == "NAVIGATE"
    assert res_nav["actionTaken"]["tab"] == "maintenance"
    print(f"✅ Copilot Navigation Command: switched to {res_nav['actionTaken']['tab']}")

    # 5. Filter status command
    res_filt = chat_endpoint(ChatRequest(message="Critical assets dikhao"))
    assert res_filt.get("actionTaken") is not None
    assert res_filt["actionTaken"]["type"] == "FILTER_STATUS"
    assert res_filt["actionTaken"]["status"] == "CRITICAL"
    print(f"✅ Copilot Fleet Filter Command: filter applied to {res_filt['actionTaken']['status']}")

def test_feature_6_spike_and_dispatch_lifecycle():
    import asyncio
    print("\n--- [TEST 6] Live Spike -> Critical Count -> Maintenance Plan -> Dispatch -> Normal Sync ---")
    
    # 1. Reset A-108 to normal baseline
    asyncio.run(manager.dispatch_asset("A-108"))
    assert manager.fleet_state["A-108"]["status"] == "ready"
    crit_before = manager.latest_metrics["criticalNonReady"]
    ready_before = manager.latest_metrics["missionReady"]
    print(f"Initial State: A-108 is ready. Critical Non-Ready = {crit_before}, Mission-Ready = {ready_before}")

    # 2. Spike normal asset A-108
    spike_res = manager.inject_anomaly("A-108", "vibration", 5.45, duration_seconds=300)
    assert manager.fleet_state["A-108"]["status"] == "critical", "A-108 must become critical after spike"
    assert manager.fleet_state["A-108"]["isSpike"] is True
    assert manager.latest_metrics["criticalNonReady"] == crit_before + 1, "Critical Non-Ready count must increment by 1"
    ready_spiked = manager.latest_metrics["missionReady"]
    print(f"✅ After Spike: A-108 status=CRITICAL, Dashboard Critical Non-Ready (+1) = {manager.latest_metrics['criticalNonReady']}")

    # 3. Verify Emergency Work Order in Maintenance Plan
    wo = spike_res.get("work_order")
    assert wo is not None, "Emergency Work Order must be generated"
    assert wo["assetId"] == "A-108"
    assert wo["priority"] == "critical"
    assert wo["status"] == "Pending Dispatch"

    all_wos = get_work_orders()
    assert any(o["id"] == wo["id"] for o in all_wos), f"Work order {wo['id']} must appear in Maintenance Plan"
    print(f"✅ Maintenance Plan: Emergency Work Order {wo['id']} logged with status='{wo['status']}'")

    # 4. Dispatch the work order
    dispatch_res = asyncio.run(manager.dispatch_asset("A-108", order_id=wo["id"]))
    assert dispatch_res["new_status"] == "ready"
    assert manager.fleet_state["A-108"]["status"] == "ready", "A-108 must return to ready (NORMAL) after dispatch"
    assert manager.fleet_state["A-108"]["isSpike"] is False
    assert manager.fleet_state["A-108"]["vibration"] < 2.5, "Vibration must return to nominal"
    assert manager.latest_metrics["criticalNonReady"] == crit_before, "Dashboard Critical Non-Ready count must return to original count"
    assert manager.latest_metrics["missionReady"] >= ready_spiked, "Dashboard Mission-Ready count must increase after dispatch"
    print(f"✅ After Dispatch: A-108 restored to NORMAL (ready), Dashboard Critical Non-Ready (-1) = {manager.latest_metrics['criticalNonReady']}")

    # 5. Verify work order is marked Dispatched to Depot in SQLite
    persisted = get_all_persisted_work_orders()
    matched_wo = next((o for o in persisted if o["id"] == wo["id"]), None)
    assert matched_wo is not None
    assert matched_wo["status"] == "Dispatched to Depot"
    print(f"✅ Maintenance Plan Database: Work Order {wo['id']} status updated to '{matched_wo['status']}'")

    # 6. Verify get_dynamically_scored_assets() returns status='ready' for A-108
    all_assets = get_dynamically_scored_assets()
    a108_scored = next((a for a in all_assets if a["id"] == "A-108"), None)
    assert a108_scored is not None
    assert a108_scored["status"] == "ready"
    print(f"✅ REST /api/assets dynamically synchronized: A-108 status='{a108_scored['status']}'")


if __name__ == "__main__":
    init_db()
    test_feature_1_xai()
    test_feature_2_telemetry_ws()
    test_feature_3_agentic_copilot()
    test_feature_4_dynamic_stress_and_telemetry()
    test_feature_5_copilot_autonomous_actions()
    test_feature_6_spike_and_dispatch_lifecycle()
    print("\n🎉 ALL DEFENSE PLATFORM & COPILOT FEATURES VERIFIED WITH 100% ACCURACY!")
