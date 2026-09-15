import random
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from ml.predictor import model_registry
from ml.explainer import xai_explainer
from database import save_custom_asset, get_all_custom_assets, get_all_persisted_work_orders

router = APIRouter(prefix="/api", tags=["assets"])

def generate_initial_telemetry_history(base_vib: float, base_pres: float, base_temp: float, count: int = 30) -> List[Dict[str, Any]]:
    now = datetime.now()
    history = []
    for i in range(count):
        step_time = now - timedelta(seconds=(count - 1 - i) * 2)
        vib = round(max(0.35, base_vib + random.uniform(-0.06, 0.06)), 2)
        pres = int(base_pres + random.uniform(-15, 15))
        temp = round(base_temp + random.uniform(-1.5, 1.5), 1)
        history.append({
            "t": step_time.strftime("%H:%M:%S"),
            "vibration": vib,
            "pressure": pres,
            "temp": temp
        })
    return history

def get_dynamically_scored_assets():
    # Live ML Model Inferences
    # 1. IMS Bearing model on A-317 (Su-30MKI)
    bearing_a317 = model_registry.predict_bearing(rms_vibration=4.82, kurtosis=6.4, peak=5.2)
    a317_score = max(20, int(100 - bearing_a317["failure_prob"] * 100))
    a317_rul = max(3, int(20 * (1.0 - bearing_a317["failure_prob"])))

    # 2. IMS Bearing model on A-711 (Apache Helicopter)
    bearing_a711 = model_registry.predict_bearing(rms_vibration=4.95, kurtosis=6.8, peak=5.6)
    a711_score = max(18, int(100 - bearing_a711["failure_prob"] * 100))
    a711_rul = max(2, int(15 * (1.0 - bearing_a711["failure_prob"])))

    # 3. IMS Bearing model on N-011 (INS Vikrant Port Shaft)
    bearing_n011 = model_registry.predict_bearing(rms_vibration=2.85, kurtosis=3.9, peak=3.4)
    n011_score = max(50, int(100 - bearing_n011["failure_prob"] * 100))
    n011_rul = max(14, int(45 * (1.0 - bearing_n011["failure_prob"])))

    # 4. AI4I model on V-102 (Arjun Mk-II MBT)
    armor_v102 = model_registry.predict_ground_armor(
        air_temp_k=308.2, process_temp_k=318.5, speed_rpm=2050.0, torque_nm=72.4, tool_wear_min=215.0
    )
    v102_score = max(25, int(100 - armor_v102["failure_prob"] * 100))
    v102_rul = armor_v102.get("calculated_rul_days", 4)

    # 5. AI4I model on V-108 (T-90 Bhishma MBT)
    armor_v108 = model_registry.predict_ground_armor(
        air_temp_k=298.0, process_temp_k=305.0, speed_rpm=1500.0, torque_nm=42.0, tool_wear_min=65.0
    )
    v108_score = max(75, int(100 - armor_v108["failure_prob"] * 100))
    v108_rul = armor_v108.get("calculated_rul_days", 48)

    # 6. AI4I model on V-210 (Autonomous UGV)
    armor_v210 = model_registry.predict_ground_armor(
        air_temp_k=312.0, process_temp_k=322.0, speed_rpm=2950.0, torque_nm=82.0, tool_wear_min=240.0
    )
    v210_score = max(28, int(100 - armor_v210["failure_prob"] * 100))
    v210_rul = armor_v210.get("calculated_rul_days", 5)

    # 7. AI4I model on V-305 (K9 Vajra-T Howitzer)
    armor_v305 = model_registry.predict_ground_armor(
        air_temp_k=304.5, process_temp_k=312.0, speed_rpm=2200.0, torque_nm=58.0, tool_wear_min=160.0
    )
    v305_score = max(65, int(100 - armor_v305["failure_prob"] * 100))
    v305_rul = armor_v305.get("calculated_rul_days", 19)

    base_assets = [
        # ==========================================
        # COMBAT AIRCRAFT (AIR FORCE & NAVAL AVIATION)
        # ==========================================
        {
            "id": "A-317",
            "callsign": "GARUDA-01",
            "name": "Sukhoi Su-30MKI Multi-Role Fighter",
            "type": "Aircraft",
            "category": "Combat Aircraft",
            "status": "critical",
            "readinessScore": a317_score,
            "predictedRUL": a317_rul,
            "operationalBase": "Ambala Air Force Station",
            "crewAssigned": "Squadron 220 'Desert Tigers'",
            "lastServiceDate": "2026-08-18",
            "nextScheduledService": "2026-09-20",
            "flightHours": 1842,
            "mlModelApplied": "IMS Bearing RandomForest (NASA/UC)",
            "failureRiskDescription": f"Bearing vibration acceleration exceeds tolerance (ML Failure Probability: {bearing_a317['failure_prob']*100:.1f}%). High likelihood of turbine shaft fatigue within {a317_rul * 24} flight-hours.",
            "contributingSensors": [
                { "name": "HPT Bearing Vibration", "current": "4.82 mm/s", "baseline": "1.80 mm/s", "status": "critical", "delta": "+167%" },
                { "name": "Hydraulic System Pressure", "current": "2640 PSI", "baseline": "3000 PSI", "status": "warning", "delta": "-12%" },
                { "name": "Exhaust Gas Temp (EGT)", "current": "742 °C", "baseline": "680 °C", "status": "warning", "delta": "+9.1%" },
                { "name": "Oil Particle Density", "current": "82 ppm", "baseline": "20 ppm", "status": "critical", "delta": "+310%" }
            ],
            "copilotAnalysis": f"Real-time inference on the IMS Bearing model flags a {bearing_a317['failure_prob']*100:.1f}% failure probability on High-Pressure Turbine (HPT) roller bearing assembly #3. Rate of vibration increase accelerated by 34% over prior cycles. Immediate depot replacement recommended.",
            "actionPlan": [
                { "id": "AP-317-1", "task": "Replace HPT Roller Bearing Assembly #3", "priority": "critical", "eta": "24 hrs", "crew": "Air Wing Depot Team A", "partsAvailable": True },
                { "id": "AP-317-2", "task": "Flush & replenish synthetic turbine lubricant", "priority": "high", "eta": "6 hrs", "crew": "Tech Crew 4", "partsAvailable": True },
                { "id": "AP-317-3", "task": "Perform full engine run-up test & sensor recalibration", "priority": "medium", "eta": "8 hrs", "crew": "Avionics Flight Lead", "partsAvailable": True }
            ],
            "serviceHistory": [
                { "date": "2026-08-18", "event": "Standard 100-Hour Phase Inspection", "inspector": "Chief Tech R. Sharma", "status": "Completed" },
                { "date": "2026-07-02", "event": "Hydraulic Actuator O-ring replacement", "inspector": "Senior Tech V. Nair", "status": "Completed" }
            ],
            "telemetryHistory": [
                { "t": "-28d", "vibration": 1.8, "pressure": 3010, "temp": 678 },
                { "t": "-24d", "vibration": 1.9, "pressure": 2990, "temp": 681 },
                { "t": "-20d", "vibration": 2.1, "pressure": 2980, "temp": 685 },
                { "t": "-16d", "vibration": 2.4, "pressure": 2950, "temp": 692 },
                { "t": "-12d", "vibration": 2.9, "pressure": 2890, "temp": 704 },
                { "t": "-8d",  "vibration": 3.5, "pressure": 2810, "temp": 718 },
                { "t": "-4d",  "vibration": 4.1, "pressure": 2720, "temp": 730 },
                { "t": "Now",  "vibration": 4.8, "pressure": 2640, "temp": 742 }
            ]
        },
        {
            "id": "A-108",
            "callsign": "GOLDEN-ARROWS-02",
            "name": "Dassault Rafale DH Twin-Seat Fighter",
            "type": "Aircraft",
            "category": "Combat Aircraft",
            "status": "ready",
            "readinessScore": 96,
            "predictedRUL": 82,
            "operationalBase": "Hasimara Air Force Station",
            "crewAssigned": "101 Squadron 'Falcons of Chamb'",
            "lastServiceDate": "2026-09-02",
            "nextScheduledService": "2026-11-10",
            "flightHours": 640,
            "mlModelApplied": "N-CMAPSS Turbofan Engine RUL Model",
            "failureRiskDescription": "M88-4E turbofan engines operating with optimal thermodynamic parameters and negligible turbine blade creep.",
            "contributingSensors": [
                { "name": "Fan Core Vibration", "current": "0.92 mm/s", "baseline": "0.90 mm/s", "status": "nominal", "delta": "+2.2%" },
                { "name": "Hydraulic Brake Pressure", "current": "3020 PSI", "baseline": "3000 PSI", "status": "nominal", "delta": "+0.6%" },
                { "name": "Turbine Inlet Temp (TIT)", "current": "985 °C", "baseline": "980 °C", "status": "nominal", "delta": "+0.5%" }
            ],
            "copilotAnalysis": "Turbofan cycle model indicates asset is in peak operational health. Mission readiness cleared for unrestricted tactical sorties.",
            "actionPlan": [
                { "id": "AP-108-1", "task": "Scheduled pre-sortie avionics self-test", "priority": "low", "eta": "1 hr", "crew": "Flight Line Avionics", "partsAvailable": True }
            ],
            "serviceHistory": [
                { "date": "2026-09-02", "event": "50-Hour Airframe Check", "inspector": "Junior Warrant Officer K. Roy", "status": "Completed" }
            ],
            "telemetryHistory": [
                { "t": "-28d", "vibration": 0.9, "pressure": 3010, "temp": 980 },
                { "t": "Now",  "vibration": 0.9, "pressure": 3020, "temp": 985 }
            ]
        },
        {
            "id": "A-205",
            "callsign": "FLYING-DAGGERS-08",
            "name": "HAL Tejas LCA Mk-1A Light Combat Fighter",
            "type": "Aircraft",
            "category": "Combat Aircraft",
            "status": "watch",
            "readinessScore": 73,
            "predictedRUL": 16,
            "operationalBase": "Sulur Air Force Station",
            "crewAssigned": "45 Squadron 'Flying Daggers'",
            "lastServiceDate": "2026-08-22",
            "nextScheduledService": "2026-09-26",
            "flightHours": 980,
            "mlModelApplied": "N-CMAPSS Turbofan Engine Model",
            "failureRiskDescription": "GE F404-IN20 afterburner fuel metering valve showing minor hysteresis; pressure fluctuation of 4.2% observed during transonic climb.",
            "contributingSensors": [
                { "name": "Fuel Metering Valve Delta", "current": "4.2%", "baseline": "0.5%", "status": "warning", "delta": "+740%" },
                { "name": "Turbine Exhaust Temp", "current": "710 °C", "baseline": "675 °C", "status": "warning", "delta": "+5.2%" },
                { "name": "Flight Control Actuator Amp", "current": "12.4 A", "baseline": "12.0 A", "status": "nominal", "delta": "+3.3%" }
            ],
            "copilotAnalysis": "Fuel valve solenoid feedback response has degraded slightly. Recommend ultrasonic valve cleaning and pressure bench test within 16 days.",
            "actionPlan": [
                { "id": "AP-205-1", "task": "Inspect & flush F404 Afterburner Fuel Valve Solenoid", "priority": "medium", "eta": "5 hrs", "crew": "Engine Bay Crew C", "partsAvailable": True }
            ],
            "serviceHistory": [
                { "date": "2026-08-22", "event": "Scheduled 100h Engine Borescope Inspection", "inspector": "Sgt. P. Verma", "status": "Completed" }
            ],
            "telemetryHistory": [
                { "t": "-28d", "vibration": 1.2, "pressure": 2980, "temp": 675 },
                { "t": "Now",  "vibration": 1.5, "pressure": 2910, "temp": 710 }
            ]
        },
        {
            "id": "A-412",
            "callsign": "BATTLEAXE-04",
            "name": "Dassault Mirage 2000-5 Tactical Fighter",
            "type": "Aircraft",
            "category": "Combat Aircraft",
            "status": "watch",
            "readinessScore": 69,
            "predictedRUL": 14,
            "operationalBase": "Gwalior Air Force Station",
            "crewAssigned": "7 Squadron 'Battleaxes'",
            "lastServiceDate": "2026-08-11",
            "nextScheduledService": "2026-09-22",
            "flightHours": 3120,
            "mlModelApplied": "Fleet Baseline Telemetry",
            "failureRiskDescription": "Starboard elevon servo actuator seal showing trace micro-leakage; hydraulic return line pressure fluctuating.",
            "contributingSensors": [
                { "name": "Starboard Elevon Servo Pressure", "current": "2780 PSI", "baseline": "3000 PSI", "status": "warning", "delta": "-7.3%" },
                { "name": "Engine Core Vibration", "current": "1.65 mm/s", "baseline": "1.30 mm/s", "status": "warning", "delta": "+26.9%" }
            ],
            "copilotAnalysis": "Secondary hydraulic seal ring on servo cylinder 2 is nearing wear threshold. Replace during scheduled depot rotation.",
            "actionPlan": [
                { "id": "AP-412-1", "task": "Replace Elevon Hydraulic Actuator Seal Kit", "priority": "medium", "eta": "8 hrs", "crew": "Depot Hydraulics Wing", "partsAvailable": True }
            ],
            "serviceHistory": [
                { "date": "2026-08-11", "event": "Fly-by-wire computer calibration", "inspector": "Master Warrant Officer T. Singh", "status": "Completed" }
            ],
            "telemetryHistory": [
                { "t": "-28d", "vibration": 1.3, "pressure": 2990, "temp": 690 },
                { "t": "Now",  "vibration": 1.6, "pressure": 2780, "temp": 705 }
            ]
        },
        {
            "id": "A-502",
            "callsign": "SEA-STRIKER-01",
            "name": "SEPECAT Jaguar IM Maritime Strike Aircraft",
            "type": "Aircraft",
            "category": "Combat Aircraft",
            "status": "ready",
            "readinessScore": 88,
            "predictedRUL": 42,
            "operationalBase": "Jamnagar Air Force Station",
            "crewAssigned": "6 Squadron 'Dragons'",
            "lastServiceDate": "2026-08-29",
            "nextScheduledService": "2026-10-18",
            "flightHours": 4200,
            "mlModelApplied": "Fleet Baseline Telemetry",
            "failureRiskDescription": "Adour Mk 811 twin engines operating within standard maritime low-altitude parameters.",
            "contributingSensors": [
                { "name": "Turbine RPM Telemetry", "current": "12,100 RPM", "baseline": "12,000 RPM", "status": "nominal", "delta": "+0.8%" },
                { "name": "Avionics Nav Radar Temp", "current": "42 °C", "baseline": "40 °C", "status": "nominal", "delta": "+5.0%" }
            ],
            "copilotAnalysis": "Aircraft is cleared for maritime patrol and anti-shipping strike missions.",
            "actionPlan": [
                { "id": "AP-502-1", "task": "Sea-spray anti-corrosion washdown routine", "priority": "low", "eta": "2 hrs", "crew": "Base Wash Team", "partsAvailable": True }
            ],
            "serviceHistory": [
                { "date": "2026-08-29", "event": "Anti-corrosion inspection & airframe seal refresh", "inspector": "Junior Tech D. Das", "status": "Completed" }
            ],
            "telemetryHistory": [
                { "t": "-28d", "vibration": 1.1, "pressure": 3000, "temp": 650 },
                { "t": "Now",  "vibration": 1.2, "pressure": 2990, "temp": 655 }
            ]
        },
        {
            "id": "A-711",
            "callsign": "GLADIATOR-07",
            "name": "AH-64E Apache Guardian Attack Helicopter",
            "type": "Aircraft",
            "category": "Combat Aircraft",
            "status": "critical",
            "readinessScore": a711_score,
            "predictedRUL": a711_rul,
            "operationalBase": "Pathankot Air Base",
            "crewAssigned": "125 Helicopter Squadron 'Gladiators'",
            "lastServiceDate": "2026-08-05",
            "nextScheduledService": "2026-09-14",
            "flightHours": 1420,
            "mlModelApplied": "IMS Bearing RandomForest (NASA/UC)",
            "failureRiskDescription": f"Tail rotor intermediate gearbox bearing flaking detected (ML Failure Risk: {bearing_a711['failure_prob']*100:.1f}%). High risk of rotor seizure during high-g yaw maneuvering.",
            "contributingSensors": [
                { "name": "Tail Gearbox Vibration", "current": "4.95 mm/s", "baseline": "1.50 mm/s", "status": "critical", "delta": "+230%" },
                { "name": "Gearbox Oil Temp", "current": "112 °C", "baseline": "85 °C", "status": "critical", "delta": "+31.8%" },
                { "name": "Main Rotor Swashplate Force", "current": "4.2 kN", "baseline": "4.0 kN", "status": "nominal", "delta": "+5.0%" }
            ],
            "copilotAnalysis": f"IMS Bearing classifier detected harmonic vibration patterns matching outer ring raceway micro-pitting on the tail rotor intermediate drive. Urgent replacement required before sortie release.",
            "actionPlan": [
                { "id": "AP-711-1", "task": "Replace Tail Rotor 42-degree Gearbox Bearing Assembly", "priority": "critical", "eta": "16 hrs", "crew": "Helicopter Heavy Maintenance Bay", "partsAvailable": True },
                { "id": "AP-711-2", "task": "Drain and flush metallic debris from gearbox casing", "priority": "high", "eta": "4 hrs", "crew": "Lube Team 2", "partsAvailable": True }
            ],
            "serviceHistory": [
                { "date": "2026-08-05", "event": "Swashplate bearing lubricator overhaul", "inspector": "Chief Tech N. Yadav", "status": "Completed" }
            ],
            "telemetryHistory": [
                { "t": "-28d", "vibration": 1.5, "pressure": 2900, "temp": 85 },
                { "t": "-14d", "vibration": 2.8, "pressure": 2850, "temp": 96 },
                { "t": "Now",  "vibration": 4.95, "pressure": 2720, "temp": 112 }
            ]
        },
        {
            "id": "A-720",
            "callsign": "PRACHAND-03",
            "name": "HAL Prachand LCH Light Combat Helicopter",
            "type": "Aircraft",
            "category": "Combat Aircraft",
            "status": "ready",
            "readinessScore": 92,
            "predictedRUL": 56,
            "operationalBase": "Leh High-Altitude Forward Operating Base",
            "crewAssigned": "No. 143 Helicopter Unit 'Dhanush'",
            "lastServiceDate": "2026-08-27",
            "nextScheduledService": "2026-10-25",
            "flightHours": 510,
            "mlModelApplied": "Fleet Baseline Telemetry",
            "failureRiskDescription": "Shakti turboshaft engines and dual-redundant FADEC operating with nominal high-altitude cold temperature tolerances.",
            "contributingSensors": [
                { "name": "Engine Core Vane Angle", "current": "22.1 deg", "baseline": "22.0 deg", "status": "nominal", "delta": "+0.5%" },
                { "name": "Transmission Lube Pressure", "current": "62 PSI", "baseline": "60 PSI", "status": "nominal", "delta": "+3.3%" }
            ],
            "copilotAnalysis": "Asset maintains optimal readiness for high-altitude strike and reconnaissance deployment in Siachen and Ladakh sectors.",
            "actionPlan": [
                { "id": "AP-720-1", "task": "Check de-icing thermal boots on rotor blades", "priority": "low", "eta": "1.5 hrs", "crew": "Forward Winter Maintenance", "partsAvailable": True }
            ],
            "serviceHistory": [
                { "date": "2026-08-27", "event": "High Altitude 50h Cold Soak Inspection", "inspector": "Havildar M. Pillai", "status": "Completed" }
            ],
            "telemetryHistory": [
                { "t": "-28d", "vibration": 1.0, "pressure": 60, "temp": 540 },
                { "t": "Now",  "vibration": 1.1, "pressure": 62, "temp": 545 }
            ]
        },

        # ==========================================
        # GROUND ARMORED FLEET (ARMY CORPS)
        # ==========================================
        {
            "id": "V-102",
            "callsign": "THUNDER-09",
            "name": "Arjun Mk-II Main Battle Tank",
            "type": "Ground Armor",
            "category": "Ground Armored Fleet",
            "status": "critical",
            "readinessScore": v102_score,
            "predictedRUL": v102_rul,
            "operationalBase": "Jaisalmer Forward Armor Depot",
            "crewAssigned": "14th Cavalry Regiment",
            "lastServiceDate": "2026-08-10",
            "nextScheduledService": "2026-09-15",
            "flightHours": 3410,
            "mlModelApplied": "AI4I 2020 Predictive Maintenance (UCI ML)",
            "failureRiskDescription": f"Recoil hydraulic pressure dropped to 142 bar (ML Overstrain/Thermal Risk: {armor_v102['failure_prob']*100:.1f}%). Safe combat firing disabled.",
            "contributingSensors": [
                { "name": "Turret Hydraulic Pressure", "current": "142 bar", "baseline": "195 bar", "status": "critical", "delta": "-27.2%" },
                { "name": "Transmission Fluid Heat", "current": "118 °C", "baseline": "92 °C", "status": "warning", "delta": "+28.2%" },
                { "name": "Track Tension Telemetry", "current": "88 kN", "baseline": "95 kN", "status": "nominal", "delta": "-7.3%" }
            ],
            "copilotAnalysis": f"AI4I 2020 multi-parameter model classifies primary recoil hydraulic accumulator seal as degraded. Pressure drop across high-torque traverse maneuvers indicates accumulator bladder failure within {v102_rul} days.",
            "actionPlan": [
                { "id": "AP-102-1", "task": "Replace Hydraulic Accumulator Bladder Assembly", "priority": "critical", "eta": "12 hrs", "crew": "Armor Field Recovery Team B", "partsAvailable": True },
                { "id": "AP-102-2", "task": "Pressure test turret elevation servo valves", "priority": "high", "eta": "4 hrs", "crew": "Armament Tech Group", "partsAvailable": True }
            ],
            "serviceHistory": [
                { "date": "2026-08-10", "event": "Desert Exercise Track Overhaul", "inspector": "Subedar Major M. Singh", "status": "Completed" }
            ],
            "telemetryHistory": [
                { "t": "-28d", "vibration": 1.2, "pressure": 195, "temp": 92 },
                { "t": "-20d", "vibration": 1.3, "pressure": 192, "temp": 95 },
                { "t": "-12d", "vibration": 1.6, "pressure": 175, "temp": 104 },
                { "t": "-4d",  "vibration": 2.1, "pressure": 151, "temp": 114 },
                { "t": "Now",  "vibration": 2.4, "pressure": 142, "temp": 118 }
            ]
        },
        {
            "id": "V-108",
            "callsign": "BHISHMA-12",
            "name": "T-90S Bhishma Main Battle Tank",
            "type": "Ground Armor",
            "category": "Ground Armored Fleet",
            "status": "ready",
            "readinessScore": v108_score,
            "predictedRUL": v108_rul,
            "operationalBase": "Bikaner Strike Division",
            "crewAssigned": "4th Armoured Brigade",
            "lastServiceDate": "2026-08-28",
            "nextScheduledService": "2026-10-30",
            "flightHours": 2180,
            "mlModelApplied": "AI4I 2020 Predictive Maintenance (UCI ML)",
            "failureRiskDescription": "V-92S2 high-performance diesel engine and automatic transmission clutch operating within normal thermal envelope.",
            "contributingSensors": [
                { "name": "Engine Torque Loading", "current": "42.0 Nm", "baseline": "45.0 Nm", "status": "nominal", "delta": "-6.7%" },
                { "name": "Transmission Fluid Temp", "current": "88 °C", "baseline": "90 °C", "status": "nominal", "delta": "-2.2%" },
                { "name": "Track Drive Sprocket Wear", "current": "65 min", "baseline": "60 min", "status": "nominal", "delta": "+8.3%" }
            ],
            "copilotAnalysis": "AI4I inference confirms nominal health with zero predictive tool wear warnings. Asset is 100% mission deployable.",
            "actionPlan": [
                { "id": "AP-108-1", "task": "Standard grease gun application to road wheels", "priority": "low", "eta": "2 hrs", "crew": "Tank Crew Maintenance", "partsAvailable": True }
            ],
            "serviceHistory": [
                { "date": "2026-08-28", "event": "Quarterly transmission flush", "inspector": "Daffadar S. Gill", "status": "Completed" }
            ],
            "telemetryHistory": [
                { "t": "-28d", "vibration": 0.8, "pressure": 180, "temp": 86 },
                { "t": "Now",  "vibration": 0.9, "pressure": 182, "temp": 88 }
            ]
        },
        {
            "id": "V-210",
            "callsign": "VIPER-06",
            "name": "Autonomous Combat Recon UGV",
            "type": "Ground Armor",
            "category": "Ground Armored Fleet",
            "status": "critical",
            "readinessScore": v210_score,
            "predictedRUL": v210_rul,
            "operationalBase": "Forward Testing Grounds",
            "crewAssigned": "Robotics Operations Unit 9",
            "lastServiceDate": "2026-08-14",
            "nextScheduledService": "2026-09-12",
            "flightHours": 720,
            "mlModelApplied": "AI4I 2020 Predictive Maintenance (UCI ML)",
            "failureRiskDescription": "Lidar optical flux sensor degradation causing 38% blind spot. Autonomous navigation disabled.",
            "contributingSensors": [
                { "name": "Lidar Optical Sensor Flux", "current": "420 lm", "baseline": "950 lm", "status": "critical", "delta": "-55.7%" },
                { "name": "Drive Motor Current Delta", "current": "184 A", "baseline": "140 A", "status": "warning", "delta": "+31.4%" }
            ],
            "copilotAnalysis": "Optical scratch damage from desert sand coupled with thermal inverter stress. Protective sapphire lens shield replacement required.",
            "actionPlan": [
                { "id": "AP-210-1", "task": "Replace armored Lidar optical shield", "priority": "critical", "eta": "8 hrs", "crew": "Robotics Tech Unit", "partsAvailable": True }
            ],
            "serviceHistory": [
                { "date": "2026-08-14", "event": "Firmware v4.2 Navigation Mesh Update", "inspector": "Eng. M. Chawla", "status": "Completed" }
            ],
            "telemetryHistory": [
                { "t": "-28d", "vibration": 1.1, "pressure": 85, "temp": 48 },
                { "t": "Now",  "vibration": 2.2, "pressure": 72, "temp": 68 }
            ]
        },
        {
            "id": "V-305",
            "callsign": "VAJRA-04",
            "name": "K9 Vajra-T 155mm Self-Propelled Howitzer",
            "type": "Ground Armor",
            "category": "Ground Armored Fleet",
            "status": "watch",
            "readinessScore": v305_score,
            "predictedRUL": v305_rul,
            "operationalBase": "Pokhran Artillery Range",
            "crewAssigned": "Artillery Strike Regiment 311",
            "lastServiceDate": "2026-08-19",
            "nextScheduledService": "2026-09-24",
            "flightHours": 1890,
            "mlModelApplied": "AI4I 2020 Predictive Maintenance (UCI ML)",
            "failureRiskDescription": "Hydro-pneumatic suspension unit #4 gas seal leakage causing 8% tilt on uneven terrain during recoil cycle.",
            "contributingSensors": [
                { "name": "Suspension Gas Nitrogen Pressure", "current": "165 bar", "baseline": "210 bar", "status": "warning", "delta": "-21.4%" },
                { "name": "Breech Block Recoil Speed", "current": "1.9 m/s", "baseline": "1.7 m/s", "status": "warning", "delta": "+11.8%" }
            ],
            "copilotAnalysis": "AI4I model flags moderate tool/equipment strain (score 65). Hydro-pneumatic cylinder replacement is recommended prior to scheduled live firing exercise.",
            "actionPlan": [
                { "id": "AP-305-1", "task": "Recharge Nitrogen bottle & replace seal kit on suspension unit #4", "priority": "high", "eta": "8 hrs", "crew": "Artillery Workshop EME", "partsAvailable": True }
            ],
            "serviceHistory": [
                { "date": "2026-08-19", "event": "Breech obturator ring check", "inspector": "Naib Subedar B. Singh", "status": "Completed" }
            ],
            "telemetryHistory": [
                { "t": "-28d", "vibration": 1.2, "pressure": 210, "temp": 75 },
                { "t": "Now",  "vibration": 1.7, "pressure": 165, "temp": 82 }
            ]
        },
        {
            "id": "V-440",
            "callsign": "SARATH-21",
            "name": "BMP-2 Sarath Infantry Combat Vehicle",
            "type": "Ground Armor",
            "category": "Ground Armored Fleet",
            "status": "ready",
            "readinessScore": 91,
            "predictedRUL": 64,
            "operationalBase": "Fazilka Armored Brigade",
            "crewAssigned": "Mechanized Infantry Battalion 8",
            "lastServiceDate": "2026-08-26",
            "nextScheduledService": "2026-11-05",
            "flightHours": 2750,
            "mlModelApplied": "Fleet Baseline Telemetry",
            "failureRiskDescription": "Amphibious water-jet propulsion seals and 30mm 2A42 auto-cannon feeder operating nominal.",
            "contributingSensors": [
                { "name": "Water Jet Impeller RPM", "current": "2850 RPM", "baseline": "2800 RPM", "status": "nominal", "delta": "+1.8%" },
                { "name": "Bilge Pump Current", "current": "14.2 A", "baseline": "14.0 A", "status": "nominal", "delta": "+1.4%" }
            ],
            "copilotAnalysis": "Vehicle is combat ready. Amphibious flotation seals tested and certified for river crossings.",
            "actionPlan": [
                { "id": "AP-440-1", "task": "Standard road march lubrication", "priority": "low", "eta": "2 hrs", "crew": "Unit Mechanics", "partsAvailable": True }
            ],
            "serviceHistory": [
                { "date": "2026-08-26", "event": "Semi-annual water-tight integrity test", "inspector": "Capt. R. Bhatia", "status": "Completed" }
            ],
            "telemetryHistory": [
                { "t": "-28d", "vibration": 0.9, "pressure": 150, "temp": 68 },
                { "t": "Now",  "vibration": 1.0, "pressure": 149, "temp": 70 }
            ]
        },
        {
            "id": "V-512",
            "callsign": "NAMICA-02",
            "name": "NAMICA Nag Anti-Tank Guided Missile Carrier",
            "type": "Ground Armor",
            "category": "Ground Armored Fleet",
            "status": "ready",
            "readinessScore": 89,
            "predictedRUL": 52,
            "operationalBase": "Babina Military Cantonment",
            "crewAssigned": "12th Armored Anti-Tank Unit",
            "lastServiceDate": "2026-08-23",
            "nextScheduledService": "2026-10-20",
            "flightHours": 1410,
            "mlModelApplied": "Fleet Baseline Telemetry",
            "failureRiskDescription": "Missile launcher thermal sight chiller and elevation actuators responding within 40ms command cycle.",
            "contributingSensors": [
                { "name": "Thermal Sight Cryo-Chiller Temp", "current": "77.1 K", "baseline": "77.0 K", "status": "nominal", "delta": "+0.1%" },
                { "name": "Missile Retractable Mast Force", "current": "8.4 kN", "baseline": "8.5 kN", "status": "nominal", "delta": "-1.2%" }
            ],
            "copilotAnalysis": "Full missile launch sequence verified; all optics and fire-control interfaces ready for night sorties.",
            "actionPlan": [
                { "id": "AP-512-1", "task": "Thermal imaging sight nitrogen purge", "priority": "low", "eta": "1 hr", "crew": "Optronics Workshop", "partsAvailable": True }
            ],
            "serviceHistory": [
                { "date": "2026-08-23", "event": "Missile canister latch seal inspection", "inspector": "Subedar H. Rao", "status": "Completed" }
            ],
            "telemetryHistory": [
                { "t": "-28d", "vibration": 0.7, "pressure": 170, "temp": 65 },
                { "t": "Now",  "vibration": 0.8, "pressure": 170, "temp": 66 }
            ]
        },
        {
            "id": "V-620",
            "callsign": "KESTREL-05",
            "name": "Tata WhAP (Kestrel) 8x8 Armored Amphibious Carrier",
            "type": "Ground Armor",
            "category": "Ground Armored Fleet",
            "status": "watch",
            "readinessScore": 72,
            "predictedRUL": 18,
            "operationalBase": "Pune Mobility Research Depot",
            "crewAssigned": "High-Mobility Brigade 7",
            "lastServiceDate": "2026-08-17",
            "nextScheduledService": "2026-09-27",
            "flightHours": 890,
            "mlModelApplied": "Fleet Baseline Telemetry",
            "failureRiskDescription": "Central Tire Inflation System (CTIS) solenoid valve on axle 3 leaking air, causing slow re-inflation times.",
            "contributingSensors": [
                { "name": "CTIS Manifold Pressure", "current": "4.8 bar", "baseline": "6.2 bar", "status": "warning", "delta": "-22.5%" },
                { "name": "Axle 3 Hub Temperature", "current": "84 °C", "baseline": "68 °C", "status": "warning", "delta": "+23.5%" }
            ],
            "copilotAnalysis": "CTIS pressure regulator valve exhibits sticking. Clean manifold and replace solenoid seal to prevent uneven tire wear on hard tarmac.",
            "actionPlan": [
                { "id": "AP-620-1", "task": "Replace CTIS Solenoid Valve Block on Axle 3", "priority": "medium", "eta": "4 hrs", "crew": "Wheeled Vehicle Wing", "partsAvailable": True }
            ],
            "serviceHistory": [
                { "date": "2026-08-17", "event": "Run-flat tire insert inspection", "inspector": "Havildar K. Pillay", "status": "Completed" }
            ],
            "telemetryHistory": [
                { "t": "-28d", "vibration": 0.9, "pressure": 6.2, "temp": 68 },
                { "t": "Now",  "vibration": 1.4, "pressure": 4.8, "temp": 84 }
            ]
        },
        {
            "id": "V-801",
            "callsign": "ENGINEER-01",
            "name": "Combat Engineering Support Vehicle CESV-T90",
            "type": "Ground Armor",
            "category": "Ground Armored Fleet",
            "status": "ready",
            "readinessScore": 94,
            "predictedRUL": 78,
            "operationalBase": "Roorkee Sappers Depot",
            "crewAssigned": "Corps of Engineers 102",
            "lastServiceDate": "2026-08-31",
            "nextScheduledService": "2026-11-15",
            "flightHours": 1950,
            "mlModelApplied": "Fleet Baseline Telemetry",
            "failureRiskDescription": "Main dozer blade hydraulic ram and heavy winch drum operating with zero hydraulic pressure drop.",
            "contributingSensors": [
                { "name": "Winch Motor Hydraulic Bar", "current": "240 bar", "baseline": "240 bar", "status": "nominal", "delta": "0.0%" },
                { "name": "Dozer Blade Arm Stress", "current": "12 MPa", "baseline": "14 MPa", "status": "nominal", "delta": "-14.3%" }
            ],
            "copilotAnalysis": "Combat engineering asset ready for obstacle breaching and route clearance deployment.",
            "actionPlan": [
                { "id": "AP-801-1", "task": "Check winch wire-rope tension & lubricate cable drum", "priority": "low", "eta": "2 hrs", "crew": "Sappers EME", "partsAvailable": True }
            ],
            "serviceHistory": [
                { "date": "2026-08-31", "event": "Heavy hydraulic fluid change", "inspector": "Capt. A. Malhotra", "status": "Completed" }
            ],
            "telemetryHistory": [
                { "t": "-28d", "vibration": 0.7, "pressure": 240, "temp": 62 },
                { "t": "Now",  "vibration": 0.7, "pressure": 240, "temp": 63 }
            ]
        },

        # ==========================================
        # NAVAL STRIKE GROUP (INDIAN NAVY FLEET)
        # ==========================================
        {
            "id": "N-089",
            "callsign": "INS-VIKRAM",
            "name": "Visakhapatnam-Class Guided Missile Destroyer",
            "type": "Naval",
            "category": "Naval Strike Group",
            "status": "ready",
            "readinessScore": 96,
            "predictedRUL": 74,
            "operationalBase": "Western Naval Command, Mumbai",
            "crewAssigned": "Combat Fleet Taskforce 54",
            "lastServiceDate": "2026-08-30",
            "nextScheduledService": "2026-11-15",
            "flightHours": 8400,
            "mlModelApplied": "Fleet Baseline Telemetry",
            "failureRiskDescription": "All propulsion, electrical, radar, and VLS missile cells operating within optimal parameters.",
            "contributingSensors": [
                { "name": "Gas Turbine Drive Efficiency", "current": "99.4%", "baseline": "99.0%", "status": "nominal", "delta": "+0.4%" },
                { "name": "Hull Sonar Transducer Temp", "current": "18.2 °C", "baseline": "18.0 °C", "status": "nominal", "delta": "+1.1%" }
            ],
            "copilotAnalysis": "Asset is fully mission-ready for unrestricted deployment. Telemetry indicates optimal equipment health across all key systems.",
            "actionPlan": [
                { "id": "AP-089-1", "task": "Routine watermaker filter cleaning", "priority": "low", "eta": "2 hrs", "crew": "Shipboard Marine Eng", "partsAvailable": True }
            ],
            "serviceHistory": [
                { "date": "2026-08-30", "event": "Post-sea trials certification", "inspector": "Commander K. Sen", "status": "Completed" }
            ],
            "telemetryHistory": [
                { "t": "-28d", "vibration": 0.8, "pressure": 310, "temp": 420 },
                { "t": "Now",  "vibration": 0.8, "pressure": 310, "temp": 419 }
            ]
        },
        {
            "id": "N-011",
            "callsign": "INS-VIKRANT",
            "name": "INS Vikrant (IAC-1) Indigenous Aircraft Carrier",
            "type": "Naval",
            "category": "Naval Strike Group",
            "status": "watch",
            "readinessScore": n011_score,
            "predictedRUL": n011_rul,
            "operationalBase": "Southern Naval Command, Kochi",
            "crewAssigned": "Carrier Strike Taskforce 1",
            "lastServiceDate": "2026-08-12",
            "nextScheduledService": "2026-09-28",
            "flightHours": 9200,
            "mlModelApplied": "IMS Bearing RandomForest (NASA/UC)",
            "failureRiskDescription": f"Port propulsion LM2500 gas turbine shaft intermediate thrust bearing vibration elevated (ML Failure Risk: {bearing_n011['failure_prob']*100:.1f}%).",
            "contributingSensors": [
                { "name": "Port Shaft Thrust Bearing Vib", "current": "2.85 mm/s", "baseline": "1.20 mm/s", "status": "warning", "delta": "+137%" },
                { "name": "Lube Oil Water Saturation", "current": "140 ppm", "baseline": "50 ppm", "status": "warning", "delta": "+180%" },
                { "name": "Ski-Jump Arrestor Cable Pressure", "current": "3100 PSI", "baseline": "3100 PSI", "status": "nominal", "delta": "0.0%" }
            ],
            "copilotAnalysis": f"IMS Bearing classifier flags moderate mechanical wear in the port main reduction gearbox thrust collar. Water contamination in lube oil likely caused early lubrication breakdown. Schedule port-side lube centrifuge flush within {n011_rul} days.",
            "actionPlan": [
                { "id": "AP-011-1", "task": "Centrifuge lube oil filtration & replace coalescer elements", "priority": "high", "eta": "12 hrs", "crew": "Carrier Propulsion Division", "partsAvailable": True },
                { "id": "AP-011-2", "task": "Borescope inspection of reduction gear teeth", "priority": "medium", "eta": "6 hrs", "crew": "Naval Dockyard Techs", "partsAvailable": True }
            ],
            "serviceHistory": [
                { "date": "2026-08-12", "event": "Flight deck ski-jump safety audit", "inspector": "Commodore T. Nambiar", "status": "Completed" }
            ],
            "telemetryHistory": [
                { "t": "-28d", "vibration": 1.2, "pressure": 3100, "temp": 52 },
                { "t": "Now",  "vibration": 2.85, "pressure": 3050, "temp": 64 }
            ]
        },
        {
            "id": "N-045",
            "callsign": "INS-KOLKATA",
            "name": "INS Kolkata (D63) Stealth Guided Missile Destroyer",
            "type": "Naval",
            "category": "Naval Strike Group",
            "status": "ready",
            "readinessScore": 93,
            "predictedRUL": 65,
            "operationalBase": "Eastern Naval Command, Visakhapatnam",
            "crewAssigned": "Destroyer Squadron 15",
            "lastServiceDate": "2026-08-25",
            "nextScheduledService": "2026-11-01",
            "flightHours": 7800,
            "mlModelApplied": "Fleet Baseline Telemetry",
            "failureRiskDescription": "MF-STAR AESA radar, BrahMos supersonic cruise missile canisters, and gas turbines in prime condition.",
            "contributingSensors": [
                { "name": "MF-STAR Radar Chiller Flow", "current": "124 L/min", "baseline": "125 L/min", "status": "nominal", "delta": "-0.8%" },
                { "name": "Shaft Vibration Spectral Peak", "current": "1.05 mm/s", "baseline": "1.00 mm/s", "status": "nominal", "delta": "+5.0%" }
            ],
            "copilotAnalysis": "Destroyer is on active operational patrol. Zero anomalies logged across combat command systems.",
            "actionPlan": [
                { "id": "AP-045-1", "task": "Routine cathode protection voltage logging", "priority": "low", "eta": "1 hr", "crew": "Electrical Officers", "partsAvailable": True }
            ],
            "serviceHistory": [
                { "date": "2026-08-25", "event": "Dry dock maintenance overhaul sign-off", "inspector": "Capt. P. Goswami", "status": "Completed" }
            ],
            "telemetryHistory": [
                { "t": "-28d", "vibration": 0.9, "pressure": 315, "temp": 395 },
                { "t": "Now",  "vibration": 1.0, "pressure": 314, "temp": 398 }
            ]
        },
        {
            "id": "N-072",
            "callsign": "INS-ARIHANT",
            "name": "INS Arihant (SSBN) Nuclear-Powered Ballistic Submarine",
            "type": "Naval",
            "category": "Naval Strike Group",
            "status": "ready",
            "readinessScore": 98,
            "predictedRUL": 95,
            "operationalBase": "Secret Forward Submarine Base",
            "crewAssigned": "Strategic Forces Command Naval Wing",
            "lastServiceDate": "2026-09-01",
            "nextScheduledService": "2026-12-20",
            "flightHours": 14200,
            "mlModelApplied": "Fleet Baseline Telemetry",
            "failureRiskDescription": "Pressurized water reactor primary coolant loops, steam turbines, and silent acoustic tiles operating at ultra-high reliability.",
            "contributingSensors": [
                { "name": "Primary Coolant Pump Acoustic Level", "current": "28 dB", "baseline": "28 dB", "status": "nominal", "delta": "0.0%" },
                { "name": "Atmosphere Oxygen Reclamation", "current": "20.8%", "baseline": "20.9%", "status": "nominal", "delta": "-0.5%" }
            ],
            "copilotAnalysis": "Strategic nuclear deterrence asset maintains maximum mission readiness. Acoustic stealth profile intact.",
            "actionPlan": [
                { "id": "AP-072-1", "task": "Automated nuclear sensor diagnostic self-test", "priority": "low", "eta": "2 hrs", "crew": "Reactor Tech Team", "partsAvailable": True }
            ],
            "serviceHistory": [
                { "date": "2026-09-01", "event": "Comprehensive acoustic signature silence run", "inspector": "Rear Admiral A. Saxena", "status": "Completed" }
            ],
            "telemetryHistory": [
                { "t": "-28d", "vibration": 0.2, "pressure": 150, "temp": 280 },
                { "t": "Now",  "vibration": 0.2, "pressure": 150, "temp": 280 }
            ]
        },
        {
            "id": "N-105",
            "callsign": "TEG-01",
            "name": "Talwar-Class Frigate INS Teg",
            "type": "Naval",
            "category": "Naval Strike Group",
            "status": "watch",
            "readinessScore": 76,
            "predictedRUL": 22,
            "operationalBase": "Karwar Naval Base (Project Seabird)",
            "crewAssigned": "Frigate Squadron 11",
            "lastServiceDate": "2026-08-16",
            "nextScheduledService": "2026-10-05",
            "flightHours": 6700,
            "mlModelApplied": "IMS Bearing RandomForest (NASA/UC)",
            "failureRiskDescription": "Port gas turbine reduction gearbox input roller bearing showing minor temperature rise under full-flank speeds.",
            "contributingSensors": [
                { "name": "Reduction Gearbox Bearing Vibration", "current": "2.40 mm/s", "baseline": "1.30 mm/s", "status": "warning", "delta": "+84.6%" },
                { "name": "Turbine Exhaust Flange Temp", "current": "460 °C", "baseline": "430 °C", "status": "warning", "delta": "+7.0%" }
            ],
            "copilotAnalysis": "Bearing cage wear detected under high-torque sprint testing. Restrict continuous full-flank sprint to <4 hours until depot bearing check.",
            "actionPlan": [
                { "id": "AP-105-1", "task": "Replace roller bearing on starboard reduction pinion", "priority": "medium", "eta": "10 hrs", "crew": "Karwar Base Workshop", "partsAvailable": True }
            ],
            "serviceHistory": [
                { "date": "2026-08-16", "event": "Routine propeller shaft alignment verification", "inspector": "Lt. Cdr. S. Menon", "status": "Completed" }
            ],
            "telemetryHistory": [
                { "t": "-28d", "vibration": 1.3, "pressure": 290, "temp": 430 },
                { "t": "Now",  "vibration": 2.4, "pressure": 285, "temp": 460 }
            ]
        },
        {
            "id": "N-220",
            "callsign": "KALVARI-01",
            "name": "INS Kalvari (S21) Scorpene-Class Diesel-Electric Submarine",
            "type": "Naval",
            "category": "Naval Strike Group",
            "status": "ready",
            "readinessScore": 95,
            "predictedRUL": 72,
            "operationalBase": "Western Naval Command, Mumbai",
            "crewAssigned": "Submarine Squadron 8",
            "lastServiceDate": "2026-08-29",
            "nextScheduledService": "2026-11-20",
            "flightHours": 5400,
            "mlModelApplied": "Fleet Baseline Telemetry",
            "failureRiskDescription": "Permasyn synchronous electric motor and lead-acid battery cells maintain optimal discharge characteristics.",
            "contributingSensors": [
                { "name": "Main Electric Motor Bearing Vib", "current": "0.45 mm/s", "baseline": "0.40 mm/s", "status": "nominal", "delta": "+12.5%" },
                { "name": "Battery Cell Temp Uniformity", "current": "28.5 °C", "baseline": "28.0 °C", "status": "nominal", "delta": "+1.8%" }
            ],
            "copilotAnalysis": "Vessel is fully certified for deep sub-surface anti-submarine and sea interdiction patrol.",
            "actionPlan": [
                { "id": "AP-220-1", "task": "Top up battery demineralized electrolyte", "priority": "low", "eta": "3 hrs", "crew": "Submarine Electrical Staff", "partsAvailable": True }
            ],
            "serviceHistory": [
                { "date": "2026-08-29", "event": "Deep dive pressure hull strain gauge calibration", "inspector": "Commander R. George", "status": "Completed" }
            ],
            "telemetryHistory": [
                { "t": "-28d", "vibration": 0.4, "pressure": 120, "temp": 28 },
                { "t": "Now",  "vibration": 0.45, "pressure": 120, "temp": 28.5 }
            ]
        },

        # ==========================================
        # AIR & MISSILE DEFENSE (INTEGRATED AIR DEFENSE GRID)
        # ==========================================
        {
            "id": "D-204",
            "callsign": "SKY-SHIELD",
            "name": "S-400 Triumf Air Defense Battery",
            "type": "Air Defense",
            "category": "Air & Missile Defense",
            "status": "ready",
            "readinessScore": 93,
            "predictedRUL": 62,
            "operationalBase": "Northern Air Defense Grid",
            "crewAssigned": "Air Defense Regiment 501",
            "lastServiceDate": "2026-08-25",
            "nextScheduledService": "2026-10-30",
            "flightHours": 2900,
            "mlModelApplied": "Fleet Baseline Telemetry",
            "failureRiskDescription": "Phased array radar and missile canister seals at optimal telemetry values.",
            "contributingSensors": [
                { "name": "Radar Coolant Flow Rate", "current": "94.2 L/min", "baseline": "95.0 L/min", "status": "nominal", "delta": "-0.8%" },
                { "name": "Launcher Hydraulic Erector", "current": "220 bar", "baseline": "220 bar", "status": "nominal", "delta": "0%" }
            ],
            "copilotAnalysis": "Battery is mission-ready on 24/7 readiness alert. No anomalous degradation detected.",
            "actionPlan": [
                { "id": "AP-204-1", "task": "Scheduled antenna diagnostics check", "priority": "low", "eta": "1 hr", "crew": "EW Unit", "partsAvailable": True }
            ],
            "serviceHistory": [
                { "date": "2026-08-25", "event": "Quarterly phased array antenna diagnostics", "inspector": "Lt. Col. P. Rawat", "status": "Completed" }
            ],
            "telemetryHistory": [
                { "t": "-28d", "vibration": 0.5, "pressure": 220, "temp": 52 },
                { "t": "Now",  "vibration": 0.6, "pressure": 220, "temp": 52 }
            ]
        },
        {
            "id": "D-118",
            "callsign": "AKASH-PRIME-01",
            "name": "Akash Prime Surface-to-Air Missile System",
            "type": "Air Defense",
            "category": "Air & Missile Defense",
            "status": "critical",
            "readinessScore": 38,
            "predictedRUL": 5,
            "operationalBase": "Gurdaspur Forward Defense Sector",
            "crewAssigned": "Army Air Defense Missile Reg 48",
            "lastServiceDate": "2026-08-08",
            "nextScheduledService": "2026-09-16",
            "flightHours": 3200,
            "mlModelApplied": "Fleet Baseline Telemetry",
            "failureRiskDescription": "Rajendra Engagement Radar transmitter cooling pump cavity cavitation; thermal cutoff risk under high-density target tracking.",
            "contributingSensors": [
                { "name": "Transmitter RF Cavity Temp", "current": "94 °C", "baseline": "65 °C", "status": "critical", "delta": "+44.6%" },
                { "name": "Coolant Loop Pump Vibration", "current": "3.8 mm/s", "baseline": "1.1 mm/s", "status": "critical", "delta": "+245%" },
                { "name": "Missile Elevation Ram Pressure", "current": "190 bar", "baseline": "210 bar", "status": "warning", "delta": "-9.5%" }
            ],
            "copilotAnalysis": "Radar transmitter overheating caused by degraded impeller in secondary dielectric coolant loop. Radar shut down safeguard will trip after 18 mins of continuous high-power emission. Immediate impeller replacement required.",
            "actionPlan": [
                { "id": "AP-118-1", "task": "Replace Dielectric Coolant Pump Impeller & Motor on Rajendra Radar", "priority": "critical", "eta": "10 hrs", "crew": "Radar Depot Unit C", "partsAvailable": True },
                { "id": "AP-118-2", "task": "Pressure-test RF waveguide dielectric nitrogen envelope", "priority": "high", "eta": "3 hrs", "crew": "EW Techs", "partsAvailable": True }
            ],
            "serviceHistory": [
                { "date": "2026-08-08", "event": "Semi-annual missile battery live tracking calibration", "inspector": "Maj. V. Shekhawat", "status": "Completed" }
            ],
            "telemetryHistory": [
                { "t": "-28d", "vibration": 1.1, "pressure": 210, "temp": 65 },
                { "t": "-14d", "vibration": 2.2, "pressure": 204, "temp": 78 },
                { "t": "Now",  "vibration": 3.8, "pressure": 190, "temp": 94 }
            ]
        },
        {
            "id": "D-309",
            "callsign": "MRSAM-BARAK-02",
            "name": "MRSAM (Barak-8) Medium Range Air Defense Battery",
            "type": "Air Defense",
            "category": "Air & Missile Defense",
            "status": "ready",
            "readinessScore": 95,
            "predictedRUL": 68,
            "operationalBase": "Chandigarh Air Force Station",
            "crewAssigned": "Air Defense Squadron 28",
            "lastServiceDate": "2026-08-27",
            "nextScheduledService": "2026-11-10",
            "flightHours": 1820,
            "mlModelApplied": "Fleet Baseline Telemetry",
            "failureRiskDescription": "Multi-Function Radar (MF-STAR) and Vertical Launch Units (VLU) operating with instant reaction telemetry.",
            "contributingSensors": [
                { "name": "VLU Gas Generator Pressure", "current": "310 bar", "baseline": "310 bar", "status": "nominal", "delta": "0.0%" },
                { "name": "Radar Tracking Bus Latency", "current": "1.2 ms", "baseline": "1.2 ms", "status": "nominal", "delta": "0.0%" }
            ],
            "copilotAnalysis": "Battery is fully ready to intercept aircraft, drones, and cruise missiles within 70km envelope.",
            "actionPlan": [
                { "id": "AP-309-1", "task": "Scheduled missile canister seal nitrogen pressure log", "priority": "low", "eta": "1 hr", "crew": "Battery Launch Crew", "partsAvailable": True }
            ],
            "serviceHistory": [
                { "date": "2026-08-27", "event": "Vertical launcher canister dry run", "inspector": "Wing Commander S. Roy", "status": "Completed" }
            ],
            "telemetryHistory": [
                { "t": "-28d", "vibration": 0.4, "pressure": 310, "temp": 44 },
                { "t": "Now",  "vibration": 0.4, "pressure": 310, "temp": 44.5 }
            ]
        },
        {
            "id": "D-401",
            "callsign": "PINAKA-MBRL-06",
            "name": "Pinaka Multi-Barrel Rocket Launch System (MBRL)",
            "type": "Air Defense",
            "category": "Air & Missile Defense",
            "status": "watch",
            "readinessScore": 71,
            "predictedRUL": 17,
            "operationalBase": "Pokhran Tactical Deployment Zone",
            "crewAssigned": "Artillery Rocket Regiment 189",
            "lastServiceDate": "2026-08-15",
            "nextScheduledService": "2026-09-25",
            "flightHours": 2100,
            "mlModelApplied": "Fleet Baseline Telemetry",
            "failureRiskDescription": "Launch pod hydraulic elevation cylinder #2 seal weeping hydraulic oil; 1.5-degree traverse overshoot detected.",
            "contributingSensors": [
                { "name": "Launch Pod Hydraulic Pressure", "current": "172 bar", "baseline": "205 bar", "status": "warning", "delta": "-16.1%" },
                { "name": "Traverse Servo Backlash", "current": "1.8 deg", "baseline": "0.3 deg", "status": "warning", "delta": "+500%" }
            ],
            "copilotAnalysis": "Hydraulic elevation seal has degraded due to desert dust intrusion. Traverse overshoot may degrade long-range saturation salvo accuracy. Refit seal before next live fire.",
            "actionPlan": [
                { "id": "AP-401-1", "task": "Replace Elevation Hydraulic Cylinder Seal & Bleed Air", "priority": "medium", "eta": "6 hrs", "crew": "Artillery Workshop Team A", "partsAvailable": True }
            ],
            "serviceHistory": [
                { "date": "2026-08-15", "event": "Salvo firing electronics check", "inspector": "Maj. D. Chauhan", "status": "Completed" }
            ],
            "telemetryHistory": [
                { "t": "-28d", "vibration": 0.8, "pressure": 205, "temp": 50 },
                { "t": "Now",  "vibration": 1.4, "pressure": 172, "temp": 64 }
            ]
        },
        {
            "id": "E-045",
            "callsign": "AEGIS-PWR",
            "name": "Auxiliary Gas Turbine Generator AGT-1500",
            "type": "Air Defense",
            "category": "Air & Missile Defense",
            "status": "watch",
            "readinessScore": 68,
            "predictedRUL": 12,
            "operationalBase": "Central Logistics Depot",
            "crewAssigned": "Field Logistics Maintenance Unit",
            "lastServiceDate": "2026-07-29",
            "nextScheduledService": "2026-09-28",
            "flightHours": 5120,
            "mlModelApplied": "N-CMAPSS Turbofan Failure Model",
            "failureRiskDescription": "Thermocouple drift on Combustor Zone 3 leading to fuel injection metering anomalies.",
            "contributingSensors": [
                { "name": "Combustor Zone 3 Pyrometer", "current": "812 °C", "baseline": "750 °C", "status": "warning", "delta": "+8.2%" },
                { "name": "Vibration Sensor Peak", "current": "2.3 mm/s", "baseline": "1.4 mm/s", "status": "warning", "delta": "+64%" }
            ],
            "copilotAnalysis": "Sensor drift detected through cross-correlation with adjacent temperature probes. Mechanical core is intact, but sensor recalibration and nozzle cleaning is needed within 12 days to avoid sub-optimal fuel trim.",
            "actionPlan": [
                { "id": "AP-045-1", "task": "Recalibrate dual EGT pyrometer probe array", "priority": "medium", "eta": "6 hrs", "crew": "Instrument Calibration Lab", "partsAvailable": True }
            ],
            "serviceHistory": [
                { "date": "2026-07-29", "event": "Semi-annual fuel filtration service", "inspector": "Havildar S. Joshi", "status": "Completed" }
            ],
            "telemetryHistory": [
                { "t": "-28d", "vibration": 1.4, "pressure": 45, "temp": 752 },
                { "t": "Now",  "vibration": 2.3, "pressure": 41, "temp": 812 }
            ]
        }
    ]
    try:
        custom_assets = get_all_custom_assets()
        combined = custom_assets + base_assets
        for a in combined:
            hist = a.get("telemetryHistory") or []
            needs_gen = len(hist) < 20 or any("d" in str(pt.get("t", "")) for pt in hist)
            if needs_gen:
                vib = float(a.get("vibration", 1.20))
                pres = float(a.get("pressure", 3000))
                temp = float(a.get("temp", 68.0 if "armor" in str(a.get("type", "")).lower() else 660.0))
                a["telemetryHistory"] = generate_initial_telemetry_history(vib, pres, temp, 30)
                if hist and len(hist) > 0:
                    last = hist[-1]
                    if "vibration" in last: a["telemetryHistory"][-1]["vibration"] = last["vibration"]
                    if "pressure" in last: a["telemetryHistory"][-1]["pressure"] = last["pressure"]
                    if "temp" in last: a["telemetryHistory"][-1]["temp"] = last["temp"]

        # Synchronize ALL assets (both base and custom) with live IoT TelemetryEngine state
        from api.routes_ws import manager
        if manager.fleet_state:
            for a in combined:
                aid = a["id"].upper()
                if aid in manager.fleet_state:
                    live = manager.fleet_state[aid]
                    a["readinessScore"] = live["readinessScore"]
                    a["predictedRUL"] = live["predictedRUL"]
                    a["status"] = live["status"]
                    a["isSpike"] = live.get("isSpike", False)
                    a["vibration"] = live["vibration"]
                    a["pressure"] = live["pressure"]
                    a["temp"] = live["temp"]
                    a["xaiAttribution"] = live.get("xaiAttribution") or xai_explainer.explain_asset(a)

                    # Update sensors to reflect live values
                    for s in a.get("contributingSensors", []):
                        sname = s.get("name", "").lower()
                        if "vibration" in sname:
                            s["current"] = f"{live['vibration']} mm/s"
                            s["status"] = "critical" if live["vibration"] > 4.0 else ("warning" if live["vibration"] > 2.5 else "nominal")
                            s["delta"] = f"{((live['vibration'] - 1.8) / 1.8) * 100:+.1f}%"
                        elif "pressure" in sname or "hydraulic" in sname:
                            s["current"] = f"{int(live['pressure'])} PSI"
                            s["status"] = "critical" if live["pressure"] < 2500 else ("warning" if live["pressure"] < 2800 else "nominal")
                            s["delta"] = f"{((live['pressure'] - 3000) / 3000) * 100:+.1f}%"
                        elif "temp" in sname or "thermal" in sname or "egt" in sname or "pyrometer" in sname:
                            s["current"] = f"{live['temp']} °C"
                            s["status"] = "warning" if live["temp"] > 720 else "nominal"

                    # Update last point in telemetry history
                    if a.get("telemetryHistory"):
                        a["telemetryHistory"][-1]["vibration"] = live["vibration"]
                        a["telemetryHistory"][-1]["pressure"] = int(live["pressure"])
                        a["telemetryHistory"][-1]["temp"] = int(live["temp"])
        return combined
    except Exception as e:
        print(f"Error fetching/syncing assets: {e}")
        return base_assets


class AssetRegisterRequest(BaseModel):
    id: str
    name: str
    callsign: Optional[str] = "SENTINEL-01"
    type: str = "Aircraft"
    category: Optional[str] = None
    operationalBase: Optional[str] = "Air Force Station Hindon"
    crewAssigned: Optional[str] = "Depot Technical Unit"
    flightHours: Optional[int] = 1200
    vibration: Optional[float] = 1.8
    pressure: Optional[float] = 3000.0
    temp: Optional[float] = 680.0
    speed_rpm: Optional[float] = 1600.0
    torque_nm: Optional[float] = 45.0
    tool_wear_min: Optional[float] = 80.0

@router.post("/assets")
def register_asset(req: AssetRegisterRequest):
    # Dynamic Scoring using real ML models
    category = req.category or ("Combat Aircraft" if req.type == "Aircraft" else "Ground Armored Fleet" if req.type == "Ground Armor" else "Naval Strike Group" if req.type == "Naval" else "Air & Missile Defense")
    
    if req.type == "Aircraft":
        res = model_registry.predict_bearing(rms_vibration=req.vibration, kurtosis=req.vibration*1.4, peak=req.vibration*1.2)
        model_name = "IMS Bearing RandomForest (NASA/UC)"
    elif req.type == "Ground Armor":
        res = model_registry.predict_ground_armor(
            air_temp_k=req.temp if req.temp > 250 else req.temp + 273.15,
            process_temp_k=(req.temp + 10) if req.temp > 250 else (req.temp + 283.15),
            speed_rpm=req.speed_rpm,
            torque_nm=req.torque_nm,
            tool_wear_min=req.tool_wear_min
        )
        model_name = "AI4I 2020 Predictive Maintenance (UCI ML)"
    elif req.type == "Naval":
        res = model_registry.predict_bearing(rms_vibration=req.vibration, kurtosis=req.vibration*1.3, peak=req.vibration*1.1)
        model_name = "IMS Bearing RandomForest (NASA/UC)"
    else:
        res = model_registry.predict_engine_turbofan()
        model_name = "N-CMAPSS Turbofan Cycle Model"

    fail_prob = float(res.get("failure_prob", 0.1))
    score = max(15, min(99, int((1.0 - fail_prob) * 100)))
    rul = max(3, int((1.0 - fail_prob) * 60))
    status = "critical" if fail_prob >= 0.60 else "watch" if fail_prob >= 0.30 else "ready"

    is_crit = status == "critical"
    is_warn = status == "watch"

    asset_obj = {
        "id": req.id.upper().strip(),
        "callsign": req.callsign.upper().strip(),
        "name": req.name,
        "type": req.type,
        "category": category,
        "status": status,
        "readinessScore": score,
        "predictedRUL": rul,
        "operationalBase": req.operationalBase,
        "crewAssigned": req.crewAssigned,
        "lastServiceDate": "2026-08-28",
        "nextScheduledService": "2026-10-15",
        "flightHours": req.flightHours,
        "mlModelApplied": model_name,
        "failureRiskDescription": f"Model inference shows {fail_prob*100:.1f}% failure probability. {'Immediate depot intervention required to prevent catastrophic failure.' if is_crit else 'Sub-optimal sensor readings detected; continue close telemetry monitoring.' if is_warn else 'All subsystem sensor metrics within optimal operational thresholds.'}",
        "copilotAnalysis": f"Automated diagnosis completed using {model_name}. Evaluated Vibration ({req.vibration} G-RMS), Hydraulic Pressure ({req.pressure} PSI), and Temperature ({req.temp} °C). Current calculated RUL is {rul} days.",
        "contributingSensors": [
            { "name": "Telemetry Vibration RMS", "current": f"{req.vibration} mm/s", "baseline": "1.50 mm/s", "status": "critical" if req.vibration > 3.5 else "warning" if req.vibration > 2.2 else "nominal", "delta": f"{((req.vibration - 1.5)/1.5)*100:+.1f}%" },
            { "name": "Hydraulic System Pressure", "current": f"{req.pressure} PSI", "baseline": "3000 PSI", "status": "critical" if req.pressure < 2500 else "warning" if req.pressure < 2800 else "nominal", "delta": f"{((req.pressure - 3000)/3000)*100:+.1f}%" },
            { "name": "Operating Thermal Sensor", "current": f"{req.temp} °C", "baseline": "650 °C" if req.temp > 300 else "70 °C", "status": "warning" if req.temp > 720 else "nominal", "delta": "+5.2%" }
        ],
        "actionPlan": [
            { "id": f"AP-{req.id}-1", "task": f"Perform comprehensive {model_name} inspection and sensor recalibration", "priority": "critical" if is_crit else "medium", "eta": "12 hrs", "crew": req.crewAssigned, "partsAvailable": True },
            { "id": f"AP-{req.id}-2", "task": "Validate hydraulic seal integrity and lubricant quality", "priority": "high" if is_crit else "low", "eta": "4 hrs", "crew": "Depot Support Team", "partsAvailable": True }
        ],
        "serviceHistory": [
            { "date": "2026-08-28", "event": "Registration & Initial Telemetry Calibration Run", "inspector": "Depot AI System", "status": "Completed" }
        ],
        "telemetryHistory": generate_initial_telemetry_history(req.vibration, req.pressure, req.temp, 30)
    }

    save_custom_asset(asset_obj)
    try:
        from api.routes_ws import manager
        manager.register_custom_asset(asset_obj)
    except Exception as e:
        print(f"Error registering custom asset with manager: {e}")
    return asset_obj

@router.get("/assets")
def get_assets():
    return get_dynamically_scored_assets()

@router.get("/assets/{asset_id}")
def get_asset(asset_id: str):
    assets = get_dynamically_scored_assets()
    for a in assets:
        if a["id"].lower() == asset_id.lower():
            asset_copy = dict(a)
            asset_copy["xaiAttribution"] = xai_explainer.explain_asset(asset_copy)
            return asset_copy
    raise HTTPException(status_code=404, detail="Asset not found")

@router.get("/assets/{asset_id}/explain")
def get_asset_explanation(asset_id: str):
    assets = get_dynamically_scored_assets()
    for a in assets:
        if a["id"].lower() == asset_id.lower():
            return xai_explainer.explain_asset(a)
    raise HTTPException(status_code=404, detail="Asset not found")

@router.get("/metrics")
def get_metrics():
    assets = get_dynamically_scored_assets()
    critical_cnt = sum(1 for a in assets if a["status"] == "critical")
    watch_cnt = sum(1 for a in assets if a["status"] == "watch")
    ready_cnt = sum(1 for a in assets if a["status"] == "ready")
    total = len(assets)

    # Calculate by category
    categories = ["Combat Aircraft", "Ground Armored Fleet", "Naval Strike Group", "Air & Missile Defense"]
    readiness_by_cat = []
    for cat in categories:
        cat_assets = [a for a in assets if a.get("category") == cat]
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

    ready_pct = round((ready_cnt / total * 100), 1)
    watch_pct = round((watch_cnt / total * 100), 1)
    crit_pct = round((critical_cnt / total * 100), 1)

    return {
        "codename": "DEFENSE MISSION READINESS SYSTEM",
        "totalAssets": total,
        "missionReady": ready_cnt,
        "readyPercentage": ready_pct,
        "watchAlerts": watch_cnt,
        "watchPercentage": watch_pct,
        "criticalNonReady": critical_cnt,
        "criticalPercentage": crit_pct,
        "meanTimeBetweenFailures": "418 hrs",
        "mtbfDelta": "+14.2%",
        "downtimeSaved": "142 hrs",
        "readinessByCategory": readiness_by_cat
    }

@router.get("/work-orders")
def get_work_orders():
    persisted = get_all_persisted_work_orders()
    base_orders = [
        {
            "id": "WO-901",
            "assetId": "A-317",
            "assetName": "Sukhoi Su-30MKI",
            "task": "Replace High-Pressure Turbine Roller Bearing #3 & Flush Synthetic Lubricant",
            "priority": "critical",
            "dueInHours": 24,
            "assignedCrew": "Air Wing Depot Team A",
            "partsStatus": "In Stock (Depot B-12)",
            "status": "Pending Dispatch",
            "estimatedDowntime": "14 hrs",
            "impact": "High (Combat Sortie Blocked)"
        },
        {
            "id": "WO-902",
            "assetId": "V-102",
            "assetName": "Arjun Mk-II MBT",
            "task": "Turret Hydraulic Recuperator Bladder Replacement & Pressure Test",
            "priority": "critical",
            "dueInHours": 12,
            "assignedCrew": "14th Cavalry Heavy Armor Recovery Team B",
            "partsStatus": "In Stock (Forward Depot)",
            "status": "In Progress",
            "estimatedDowntime": "8 hrs",
            "impact": "Critical (Turret Recoil Disabled)"
        },
        {
            "id": "WO-903",
            "assetId": "V-210",
            "assetName": "Autonomous Combat UGV",
            "task": "Lidar Optical Cluster & Sapphire Lens Shield Replacement",
            "priority": "critical",
            "dueInHours": 36,
            "assignedCrew": "Robotics Unit 9",
            "partsStatus": "In Stock",
            "status": "Pending Dispatch",
            "estimatedDowntime": "6 hrs",
            "impact": "High (Autonomous Pathfinding Offline)"
        },
        {
            "id": "WO-904",
            "assetId": "A-711",
            "assetName": "AH-64E Apache Guardian",
            "task": "Replace Tail Rotor Intermediate 42-Degree Gearbox Bearing Assembly",
            "priority": "critical",
            "dueInHours": 16,
            "assignedCrew": "Helicopter Maintenance Bay Pathankot",
            "partsStatus": "In Stock",
            "status": "In Progress",
            "estimatedDowntime": "16 hrs",
            "impact": "Critical (Flight Operations Grounded)"
        },
        {
            "id": "WO-905",
            "assetId": "D-118",
            "assetName": "Akash Prime SAM System",
            "task": "Replace Dielectric Coolant Pump Impeller on Rajendra Engagement Radar",
            "priority": "critical",
            "dueInHours": 10,
            "assignedCrew": "Radar Depot Unit C Gurdaspur",
            "partsStatus": "In Stock",
            "status": "Pending Dispatch",
            "estimatedDowntime": "10 hrs",
            "impact": "High (Air Defense Sector Blindspot)"
        },
        {
            "id": "WO-906",
            "assetId": "N-011",
            "assetName": "INS Vikrant (IAC-1)",
            "task": "Centrifuge Port Shaft Lube Oil & Inspect Thrust Collar Bearing",
            "priority": "high",
            "dueInHours": 48,
            "assignedCrew": "Carrier Propulsion Division Kochi",
            "partsStatus": "In Stock",
            "status": "Scheduled",
            "estimatedDowntime": "12 hrs",
            "impact": "Moderate (Sprint Speed Limited)"
        },
        {
            "id": "WO-907",
            "assetId": "A-205",
            "assetName": "HAL Tejas LCA Mk-1A",
            "task": "Flush & Recalibrate GE F404 Afterburner Fuel Metering Valve Solenoid",
            "priority": "medium",
            "dueInHours": 72,
            "assignedCrew": "Engine Bay Crew C Sulur",
            "partsStatus": "In Stock",
            "status": "Scheduled",
            "estimatedDowntime": "5 hrs",
            "impact": "Moderate (Afterburner Transonic Hysteresis)"
        },
        {
            "id": "WO-908",
            "assetId": "V-305",
            "assetName": "K9 Vajra-T Howitzer",
            "task": "Recharge Nitrogen Bottle & Refit Suspension Unit #4 Hydro-Pneumatic Seals",
            "priority": "high",
            "dueInHours": 30,
            "assignedCrew": "Artillery Workshop EME Pokhran",
            "partsStatus": "In Stock",
            "status": "Scheduled",
            "estimatedDowntime": "8 hrs",
            "impact": "Moderate (Terrain Leveling Hysteresis)"
        },
        {
            "id": "WO-909",
            "assetId": "E-045",
            "assetName": "Aux Gas Turbine AGT-1500",
            "task": "Recalibrate Zone 3 Combustor Pyrometer & Clean Fuel Nozzle",
            "priority": "medium",
            "dueInHours": 72,
            "assignedCrew": "Instrumentation Lab Central Depot",
            "partsStatus": "In Stock",
            "status": "Scheduled",
            "estimatedDowntime": "5 hrs",
            "impact": "Low (Fuel Efficiency Drift)"
        }
    ]
    persisted_ids = {o["id"] for o in persisted}
    filtered_base = [o for o in base_orders if o["id"] not in persisted_ids]
    return persisted + filtered_base

@router.post("/work-orders/{order_id}/dispatch")
async def dispatch_work_order_endpoint(order_id: str, asset_id: Optional[str] = None):
    try:
        from database import get_db_connection, save_work_order
        from api.routes_ws import manager

        target_aid = asset_id
        conn = get_db_connection()
        cursor = conn.cursor()

        # Find asset_id if not explicitly provided
        if not target_aid:
            cursor.execute("SELECT asset_id FROM work_orders WHERE id = ?", (order_id,))
            row = cursor.fetchone()
            if row and row["asset_id"]:
                target_aid = row["asset_id"]

        # Base orders fallback check
        base_orders_map = {
            "WO-901": "A-317", "WO-902": "V-102", "WO-903": "V-210",
            "WO-904": "A-711", "WO-905": "D-118", "WO-906": "N-011",
            "WO-907": "A-205", "WO-908": "V-305", "WO-909": "E-045"
        }
        if not target_aid and order_id in base_orders_map:
            target_aid = base_orders_map[order_id]

        if not target_aid and order_id.startswith("WO-"):
            parts = order_id.split("-")
            if len(parts) >= 3:
                cand = f"{parts[1]}-{parts[2]}" if len(parts) > 3 and not parts[2].isdigit() else parts[1]
                if cand.upper() in manager.fleet_state:
                    target_aid = cand

        # Update SQLite table
        cursor.execute("UPDATE work_orders SET status = 'Dispatched to Depot' WHERE id = ?", (order_id,))
        if cursor.rowcount == 0 and order_id in base_orders_map:
            # If not in SQLite, insert base order
            save_work_order({
                "id": order_id,
                "assetId": target_aid,
                "assetName": target_aid,
                "task": f"Depot restoration for {target_aid}",
                "priority": "critical",
                "dueInHours": 12,
                "assignedCrew": "Depot Fast Response Unit",
                "partsStatus": "In Stock",
                "status": "Dispatched to Depot",
                "estimatedDowntime": "8 hrs",
                "impact": "High"
            })

        conn.commit()
        conn.close()

        # Restore asset to NORMAL (ready), decrement critical count, and broadcast to all clients!
        if target_aid:
            dispatch_res = await manager.dispatch_asset(target_aid, order_id=order_id)
            return {
                "status": "success",
                "order_id": order_id,
                "asset_id": target_aid,
                "new_status": "Dispatched to Depot",
                "new_asset_status": "ready",
                "metrics": manager.latest_metrics,
                "details": dispatch_res
            }
        else:
            manager.update_tick()
            await manager.broadcast({
                "type": "WORK_ORDER_DISPATCHED",
                "order_id": order_id,
                "assets": manager.fleet_state,
                "metrics": manager.latest_metrics,
                "timestamp": datetime.utcnow().strftime("%H:%M:%S")
            })
            return {
                "status": "success",
                "order_id": order_id,
                "new_status": "Dispatched to Depot",
                "metrics": manager.latest_metrics
            }
    except Exception as ex:
        print(f"[dispatch_work_order_endpoint] Error: {ex}")
        return {"status": "error", "message": str(ex)}


class AssetDispatchRequest(BaseModel):
    taskId: Optional[str] = None
    orderId: Optional[str] = None

@router.post("/assets/{asset_id}/dispatch")
async def dispatch_asset_endpoint(asset_id: str, req: Optional[AssetDispatchRequest] = None):
    """
    Direct endpoint for AssetDetail / Copilot dispatch action:
    Restores the asset from Critical to Normal ('ready'), creates/updates work order,
    decrements Critical count on dashboard, and broadcasts live tick.
    """
    from api.routes_ws import manager
    order_id = req.orderId if req else None
    res = await manager.dispatch_asset(asset_id, order_id=order_id)
    return res

