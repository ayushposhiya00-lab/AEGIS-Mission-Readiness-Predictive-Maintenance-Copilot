// Mission Readiness & Predictive Maintenance Defense Fleet Dataset
// Auto-synced with FastAPI ML Model Backend (26 Operational Defense Assets)

export const DEFENSE_SYSTEM_METRICS = {
  "codename": "DEFENSE MISSION READINESS SYSTEM",
  "totalAssets": 26,
  "missionReady": 13,
  "readyPercentage": 50.0,
  "watchAlerts": 8,
  "watchPercentage": 30.8,
  "criticalNonReady": 5,
  "criticalPercentage": 19.2,
  "meanTimeBetweenFailures": "418 hrs",
  "mtbfDelta": "+14.2%",
  "downtimeSaved": "142 hrs",
  "readinessByCategory": [
    {
      "category": "Combat Aircraft",
      "ready": 3,
      "watch": 2,
      "critical": 2,
      "total": 7,
      "rate": 42.9
    },
    {
      "category": "Ground Armored Fleet",
      "ready": 4,
      "watch": 2,
      "critical": 2,
      "total": 8,
      "rate": 50.0
    },
    {
      "category": "Naval Strike Group",
      "ready": 4,
      "watch": 2,
      "critical": 0,
      "total": 6,
      "rate": 66.7
    },
    {
      "category": "Air & Missile Defense",
      "ready": 2,
      "watch": 2,
      "critical": 1,
      "total": 5,
      "rate": 40.0
    }
  ]
};

export const DEFENSE_ASSETS = [
  {
    "id": "A-317",
    "callsign": "GARUDA-01",
    "name": "Sukhoi Su-30MKI Multi-Role Fighter",
    "type": "Aircraft",
    "category": "Combat Aircraft",
    "status": "critical",
    "readinessScore": 69,
    "predictedRUL": 13,
    "operationalBase": "Ambala Air Force Station",
    "crewAssigned": "Squadron 220 'Desert Tigers'",
    "lastServiceDate": "2026-08-18",
    "nextScheduledService": "2026-09-20",
    "flightHours": 1842,
    "mlModelApplied": "IMS Bearing RandomForest (NASA/UC)",
    "failureRiskDescription": "Bearing vibration acceleration exceeds tolerance (ML Failure Probability: 31.0%). High likelihood of turbine shaft fatigue within 312 flight-hours.",
    "contributingSensors": [
      {
        "name": "HPT Bearing Vibration",
        "current": "4.82 mm/s",
        "baseline": "1.80 mm/s",
        "status": "critical",
        "delta": "+167%"
      },
      {
        "name": "Hydraulic System Pressure",
        "current": "2640 PSI",
        "baseline": "3000 PSI",
        "status": "warning",
        "delta": "-12%"
      },
      {
        "name": "Exhaust Gas Temp (EGT)",
        "current": "742 \u00b0C",
        "baseline": "680 \u00b0C",
        "status": "warning",
        "delta": "+9.1%"
      },
      {
        "name": "Oil Particle Density",
        "current": "82 ppm",
        "baseline": "20 ppm",
        "status": "critical",
        "delta": "+310%"
      }
    ],
    "copilotAnalysis": "Real-time inference on the IMS Bearing model flags a 31.0% failure probability on High-Pressure Turbine (HPT) roller bearing assembly #3. Rate of vibration increase accelerated by 34% over prior cycles. Immediate depot replacement recommended.",
    "actionPlan": [
      {
        "id": "AP-317-1",
        "task": "Replace HPT Roller Bearing Assembly #3",
        "priority": "critical",
        "eta": "24 hrs",
        "crew": "Air Wing Depot Team A",
        "partsAvailable": true
      },
      {
        "id": "AP-317-2",
        "task": "Flush & replenish synthetic turbine lubricant",
        "priority": "high",
        "eta": "6 hrs",
        "crew": "Tech Crew 4",
        "partsAvailable": true
      },
      {
        "id": "AP-317-3",
        "task": "Perform full engine run-up test & sensor recalibration",
        "priority": "medium",
        "eta": "8 hrs",
        "crew": "Avionics Flight Lead",
        "partsAvailable": true
      }
    ],
    "serviceHistory": [
      {
        "date": "2026-08-18",
        "event": "Standard 100-Hour Phase Inspection",
        "inspector": "Chief Tech R. Sharma",
        "status": "Completed"
      },
      {
        "date": "2026-07-02",
        "event": "Hydraulic Actuator O-ring replacement",
        "inspector": "Senior Tech V. Nair",
        "status": "Completed"
      }
    ],
    "telemetryHistory": [
      {
        "t": "-28d",
        "vibration": 1.8,
        "pressure": 3010,
        "temp": 678
      },
      {
        "t": "-24d",
        "vibration": 1.9,
        "pressure": 2990,
        "temp": 681
      },
      {
        "t": "-20d",
        "vibration": 2.1,
        "pressure": 2980,
        "temp": 685
      },
      {
        "t": "-16d",
        "vibration": 2.4,
        "pressure": 2950,
        "temp": 692
      },
      {
        "t": "-12d",
        "vibration": 2.9,
        "pressure": 2890,
        "temp": 704
      },
      {
        "t": "-8d",
        "vibration": 3.5,
        "pressure": 2810,
        "temp": 718
      },
      {
        "t": "-4d",
        "vibration": 4.1,
        "pressure": 2720,
        "temp": 730
      },
      {
        "t": "Now",
        "vibration": 4.8,
        "pressure": 2640,
        "temp": 742
      }
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
      {
        "name": "Fan Core Vibration",
        "current": "0.92 mm/s",
        "baseline": "0.90 mm/s",
        "status": "nominal",
        "delta": "+2.2%"
      },
      {
        "name": "Hydraulic Brake Pressure",
        "current": "3020 PSI",
        "baseline": "3000 PSI",
        "status": "nominal",
        "delta": "+0.6%"
      },
      {
        "name": "Turbine Inlet Temp (TIT)",
        "current": "985 \u00b0C",
        "baseline": "980 \u00b0C",
        "status": "nominal",
        "delta": "+0.5%"
      }
    ],
    "copilotAnalysis": "Turbofan cycle model indicates asset is in peak operational health. Mission readiness cleared for unrestricted tactical sorties.",
    "actionPlan": [
      {
        "id": "AP-108-1",
        "task": "Scheduled pre-sortie avionics self-test",
        "priority": "low",
        "eta": "1 hr",
        "crew": "Flight Line Avionics",
        "partsAvailable": true
      }
    ],
    "serviceHistory": [
      {
        "date": "2026-09-02",
        "event": "50-Hour Airframe Check",
        "inspector": "Junior Warrant Officer K. Roy",
        "status": "Completed"
      }
    ],
    "telemetryHistory": [
      {
        "t": "-28d",
        "vibration": 0.9,
        "pressure": 3010,
        "temp": 980
      },
      {
        "t": "Now",
        "vibration": 0.9,
        "pressure": 3020,
        "temp": 985
      }
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
      {
        "name": "Fuel Metering Valve Delta",
        "current": "4.2%",
        "baseline": "0.5%",
        "status": "warning",
        "delta": "+740%"
      },
      {
        "name": "Turbine Exhaust Temp",
        "current": "710 \u00b0C",
        "baseline": "675 \u00b0C",
        "status": "warning",
        "delta": "+5.2%"
      },
      {
        "name": "Flight Control Actuator Amp",
        "current": "12.4 A",
        "baseline": "12.0 A",
        "status": "nominal",
        "delta": "+3.3%"
      }
    ],
    "copilotAnalysis": "Fuel valve solenoid feedback response has degraded slightly. Recommend ultrasonic valve cleaning and pressure bench test within 16 days.",
    "actionPlan": [
      {
        "id": "AP-205-1",
        "task": "Inspect & flush F404 Afterburner Fuel Valve Solenoid",
        "priority": "medium",
        "eta": "5 hrs",
        "crew": "Engine Bay Crew C",
        "partsAvailable": true
      }
    ],
    "serviceHistory": [
      {
        "date": "2026-08-22",
        "event": "Scheduled 100h Engine Borescope Inspection",
        "inspector": "Sgt. P. Verma",
        "status": "Completed"
      }
    ],
    "telemetryHistory": [
      {
        "t": "-28d",
        "vibration": 1.2,
        "pressure": 2980,
        "temp": 675
      },
      {
        "t": "Now",
        "vibration": 1.5,
        "pressure": 2910,
        "temp": 710
      }
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
      {
        "name": "Starboard Elevon Servo Pressure",
        "current": "2780 PSI",
        "baseline": "3000 PSI",
        "status": "warning",
        "delta": "-7.3%"
      },
      {
        "name": "Engine Core Vibration",
        "current": "1.65 mm/s",
        "baseline": "1.30 mm/s",
        "status": "warning",
        "delta": "+26.9%"
      }
    ],
    "copilotAnalysis": "Secondary hydraulic seal ring on servo cylinder 2 is nearing wear threshold. Replace during scheduled depot rotation.",
    "actionPlan": [
      {
        "id": "AP-412-1",
        "task": "Replace Elevon Hydraulic Actuator Seal Kit",
        "priority": "medium",
        "eta": "8 hrs",
        "crew": "Depot Hydraulics Wing",
        "partsAvailable": true
      }
    ],
    "serviceHistory": [
      {
        "date": "2026-08-11",
        "event": "Fly-by-wire computer calibration",
        "inspector": "Master Warrant Officer T. Singh",
        "status": "Completed"
      }
    ],
    "telemetryHistory": [
      {
        "t": "-28d",
        "vibration": 1.3,
        "pressure": 2990,
        "temp": 690
      },
      {
        "t": "Now",
        "vibration": 1.6,
        "pressure": 2780,
        "temp": 705
      }
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
      {
        "name": "Turbine RPM Telemetry",
        "current": "12,100 RPM",
        "baseline": "12,000 RPM",
        "status": "nominal",
        "delta": "+0.8%"
      },
      {
        "name": "Avionics Nav Radar Temp",
        "current": "42 \u00b0C",
        "baseline": "40 \u00b0C",
        "status": "nominal",
        "delta": "+5.0%"
      }
    ],
    "copilotAnalysis": "Aircraft is cleared for maritime patrol and anti-shipping strike missions.",
    "actionPlan": [
      {
        "id": "AP-502-1",
        "task": "Sea-spray anti-corrosion washdown routine",
        "priority": "low",
        "eta": "2 hrs",
        "crew": "Base Wash Team",
        "partsAvailable": true
      }
    ],
    "serviceHistory": [
      {
        "date": "2026-08-29",
        "event": "Anti-corrosion inspection & airframe seal refresh",
        "inspector": "Junior Tech D. Das",
        "status": "Completed"
      }
    ],
    "telemetryHistory": [
      {
        "t": "-28d",
        "vibration": 1.1,
        "pressure": 3000,
        "temp": 650
      },
      {
        "t": "Now",
        "vibration": 1.2,
        "pressure": 2990,
        "temp": 655
      }
    ]
  },
  {
    "id": "A-711",
    "callsign": "GLADIATOR-07",
    "name": "AH-64E Apache Guardian Attack Helicopter",
    "type": "Aircraft",
    "category": "Combat Aircraft",
    "status": "critical",
    "readinessScore": 69,
    "predictedRUL": 10,
    "operationalBase": "Pathankot Air Base",
    "crewAssigned": "125 Helicopter Squadron 'Gladiators'",
    "lastServiceDate": "2026-08-05",
    "nextScheduledService": "2026-09-14",
    "flightHours": 1420,
    "mlModelApplied": "IMS Bearing RandomForest (NASA/UC)",
    "failureRiskDescription": "Tail rotor intermediate gearbox bearing flaking detected (ML Failure Risk: 31.0%). High risk of rotor seizure during high-g yaw maneuvering.",
    "contributingSensors": [
      {
        "name": "Tail Gearbox Vibration",
        "current": "4.95 mm/s",
        "baseline": "1.50 mm/s",
        "status": "critical",
        "delta": "+230%"
      },
      {
        "name": "Gearbox Oil Temp",
        "current": "112 \u00b0C",
        "baseline": "85 \u00b0C",
        "status": "critical",
        "delta": "+31.8%"
      },
      {
        "name": "Main Rotor Swashplate Force",
        "current": "4.2 kN",
        "baseline": "4.0 kN",
        "status": "nominal",
        "delta": "+5.0%"
      }
    ],
    "copilotAnalysis": "IMS Bearing classifier detected harmonic vibration patterns matching outer ring raceway micro-pitting on the tail rotor intermediate drive. Urgent replacement required before sortie release.",
    "actionPlan": [
      {
        "id": "AP-711-1",
        "task": "Replace Tail Rotor 42-degree Gearbox Bearing Assembly",
        "priority": "critical",
        "eta": "16 hrs",
        "crew": "Helicopter Heavy Maintenance Bay",
        "partsAvailable": true
      },
      {
        "id": "AP-711-2",
        "task": "Drain and flush metallic debris from gearbox casing",
        "priority": "high",
        "eta": "4 hrs",
        "crew": "Lube Team 2",
        "partsAvailable": true
      }
    ],
    "serviceHistory": [
      {
        "date": "2026-08-05",
        "event": "Swashplate bearing lubricator overhaul",
        "inspector": "Chief Tech N. Yadav",
        "status": "Completed"
      }
    ],
    "telemetryHistory": [
      {
        "t": "-28d",
        "vibration": 1.5,
        "pressure": 2900,
        "temp": 85
      },
      {
        "t": "-14d",
        "vibration": 2.8,
        "pressure": 2850,
        "temp": 96
      },
      {
        "t": "Now",
        "vibration": 4.95,
        "pressure": 2720,
        "temp": 112
      }
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
      {
        "name": "Engine Core Vane Angle",
        "current": "22.1 deg",
        "baseline": "22.0 deg",
        "status": "nominal",
        "delta": "+0.5%"
      },
      {
        "name": "Transmission Lube Pressure",
        "current": "62 PSI",
        "baseline": "60 PSI",
        "status": "nominal",
        "delta": "+3.3%"
      }
    ],
    "copilotAnalysis": "Asset maintains optimal readiness for high-altitude strike and reconnaissance deployment in Siachen and Ladakh sectors.",
    "actionPlan": [
      {
        "id": "AP-720-1",
        "task": "Check de-icing thermal boots on rotor blades",
        "priority": "low",
        "eta": "1.5 hrs",
        "crew": "Forward Winter Maintenance",
        "partsAvailable": true
      }
    ],
    "serviceHistory": [
      {
        "date": "2026-08-27",
        "event": "High Altitude 50h Cold Soak Inspection",
        "inspector": "Havildar M. Pillai",
        "status": "Completed"
      }
    ],
    "telemetryHistory": [
      {
        "t": "-28d",
        "vibration": 1.0,
        "pressure": 60,
        "temp": 540
      },
      {
        "t": "Now",
        "vibration": 1.1,
        "pressure": 62,
        "temp": 545
      }
    ]
  },
  {
    "id": "V-102",
    "callsign": "THUNDER-09",
    "name": "Arjun Mk-II Main Battle Tank",
    "type": "Ground Armor",
    "category": "Ground Armored Fleet",
    "status": "critical",
    "readinessScore": 51,
    "predictedRUL": 30,
    "operationalBase": "Jaisalmer Forward Armor Depot",
    "crewAssigned": "14th Cavalry Regiment",
    "lastServiceDate": "2026-08-10",
    "nextScheduledService": "2026-09-15",
    "flightHours": 3410,
    "mlModelApplied": "AI4I 2020 Predictive Maintenance (UCI ML)",
    "failureRiskDescription": "Recoil hydraulic pressure dropped to 142 bar (ML Overstrain/Thermal Risk: 49.0%). Safe combat firing disabled.",
    "contributingSensors": [
      {
        "name": "Turret Hydraulic Pressure",
        "current": "142 bar",
        "baseline": "195 bar",
        "status": "critical",
        "delta": "-27.2%"
      },
      {
        "name": "Transmission Fluid Heat",
        "current": "118 \u00b0C",
        "baseline": "92 \u00b0C",
        "status": "warning",
        "delta": "+28.2%"
      },
      {
        "name": "Track Tension Telemetry",
        "current": "88 kN",
        "baseline": "95 kN",
        "status": "nominal",
        "delta": "-7.3%"
      }
    ],
    "copilotAnalysis": "AI4I 2020 multi-parameter model classifies primary recoil hydraulic accumulator seal as degraded. Pressure drop across high-torque traverse maneuvers indicates accumulator bladder failure within 30 days.",
    "actionPlan": [
      {
        "id": "AP-102-1",
        "task": "Replace Hydraulic Accumulator Bladder Assembly",
        "priority": "critical",
        "eta": "12 hrs",
        "crew": "Armor Field Recovery Team B",
        "partsAvailable": true
      },
      {
        "id": "AP-102-2",
        "task": "Pressure test turret elevation servo valves",
        "priority": "high",
        "eta": "4 hrs",
        "crew": "Armament Tech Group",
        "partsAvailable": true
      }
    ],
    "serviceHistory": [
      {
        "date": "2026-08-10",
        "event": "Desert Exercise Track Overhaul",
        "inspector": "Subedar Major M. Singh",
        "status": "Completed"
      }
    ],
    "telemetryHistory": [
      {
        "t": "-28d",
        "vibration": 1.2,
        "pressure": 195,
        "temp": 92
      },
      {
        "t": "-20d",
        "vibration": 1.3,
        "pressure": 192,
        "temp": 95
      },
      {
        "t": "-12d",
        "vibration": 1.6,
        "pressure": 175,
        "temp": 104
      },
      {
        "t": "-4d",
        "vibration": 2.1,
        "pressure": 151,
        "temp": 114
      },
      {
        "t": "Now",
        "vibration": 2.4,
        "pressure": 142,
        "temp": 118
      }
    ]
  },
  {
    "id": "V-108",
    "callsign": "BHISHMA-12",
    "name": "T-90S Bhishma Main Battle Tank",
    "type": "Ground Armor",
    "category": "Ground Armored Fleet",
    "status": "ready",
    "readinessScore": 100,
    "predictedRUL": 60,
    "operationalBase": "Bikaner Strike Division",
    "crewAssigned": "4th Armoured Brigade",
    "lastServiceDate": "2026-08-28",
    "nextScheduledService": "2026-10-30",
    "flightHours": 2180,
    "mlModelApplied": "AI4I 2020 Predictive Maintenance (UCI ML)",
    "failureRiskDescription": "V-92S2 high-performance diesel engine and automatic transmission clutch operating within normal thermal envelope.",
    "contributingSensors": [
      {
        "name": "Engine Torque Loading",
        "current": "42.0 Nm",
        "baseline": "45.0 Nm",
        "status": "nominal",
        "delta": "-6.7%"
      },
      {
        "name": "Transmission Fluid Temp",
        "current": "88 \u00b0C",
        "baseline": "90 \u00b0C",
        "status": "nominal",
        "delta": "-2.2%"
      },
      {
        "name": "Track Drive Sprocket Wear",
        "current": "65 min",
        "baseline": "60 min",
        "status": "nominal",
        "delta": "+8.3%"
      }
    ],
    "copilotAnalysis": "AI4I inference confirms nominal health with zero predictive tool wear warnings. Asset is 100% mission deployable.",
    "actionPlan": [
      {
        "id": "AP-108-1",
        "task": "Standard grease gun application to road wheels",
        "priority": "low",
        "eta": "2 hrs",
        "crew": "Tank Crew Maintenance",
        "partsAvailable": true
      }
    ],
    "serviceHistory": [
      {
        "date": "2026-08-28",
        "event": "Quarterly transmission flush",
        "inspector": "Daffadar S. Gill",
        "status": "Completed"
      }
    ],
    "telemetryHistory": [
      {
        "t": "-28d",
        "vibration": 0.8,
        "pressure": 180,
        "temp": 86
      },
      {
        "t": "Now",
        "vibration": 0.9,
        "pressure": 182,
        "temp": 88
      }
    ]
  },
  {
    "id": "V-210",
    "callsign": "VIPER-06",
    "name": "Autonomous Combat Recon UGV",
    "type": "Ground Armor",
    "category": "Ground Armored Fleet",
    "status": "critical",
    "readinessScore": 47,
    "predictedRUL": 28,
    "operationalBase": "Forward Testing Grounds",
    "crewAssigned": "Robotics Operations Unit 9",
    "lastServiceDate": "2026-08-14",
    "nextScheduledService": "2026-09-12",
    "flightHours": 720,
    "mlModelApplied": "AI4I 2020 Predictive Maintenance (UCI ML)",
    "failureRiskDescription": "Lidar optical flux sensor degradation causing 38% blind spot. Autonomous navigation disabled.",
    "contributingSensors": [
      {
        "name": "Lidar Optical Sensor Flux",
        "current": "420 lm",
        "baseline": "950 lm",
        "status": "critical",
        "delta": "-55.7%"
      },
      {
        "name": "Drive Motor Current Delta",
        "current": "184 A",
        "baseline": "140 A",
        "status": "warning",
        "delta": "+31.4%"
      }
    ],
    "copilotAnalysis": "Optical scratch damage from desert sand coupled with thermal inverter stress. Protective sapphire lens shield replacement required.",
    "actionPlan": [
      {
        "id": "AP-210-1",
        "task": "Replace armored Lidar optical shield",
        "priority": "critical",
        "eta": "8 hrs",
        "crew": "Robotics Tech Unit",
        "partsAvailable": true
      }
    ],
    "serviceHistory": [
      {
        "date": "2026-08-14",
        "event": "Firmware v4.2 Navigation Mesh Update",
        "inspector": "Eng. M. Chawla",
        "status": "Completed"
      }
    ],
    "telemetryHistory": [
      {
        "t": "-28d",
        "vibration": 1.1,
        "pressure": 85,
        "temp": 48
      },
      {
        "t": "Now",
        "vibration": 2.2,
        "pressure": 72,
        "temp": 68
      }
    ]
  },
  {
    "id": "V-305",
    "callsign": "VAJRA-04",
    "name": "K9 Vajra-T 155mm Self-Propelled Howitzer",
    "type": "Ground Armor",
    "category": "Ground Armored Fleet",
    "status": "watch",
    "readinessScore": 76,
    "predictedRUL": 45,
    "operationalBase": "Pokhran Artillery Range",
    "crewAssigned": "Artillery Strike Regiment 311",
    "lastServiceDate": "2026-08-19",
    "nextScheduledService": "2026-09-24",
    "flightHours": 1890,
    "mlModelApplied": "AI4I 2020 Predictive Maintenance (UCI ML)",
    "failureRiskDescription": "Hydro-pneumatic suspension unit #4 gas seal leakage causing 8% tilt on uneven terrain during recoil cycle.",
    "contributingSensors": [
      {
        "name": "Suspension Gas Nitrogen Pressure",
        "current": "165 bar",
        "baseline": "210 bar",
        "status": "warning",
        "delta": "-21.4%"
      },
      {
        "name": "Breech Block Recoil Speed",
        "current": "1.9 m/s",
        "baseline": "1.7 m/s",
        "status": "warning",
        "delta": "+11.8%"
      }
    ],
    "copilotAnalysis": "AI4I model flags moderate tool/equipment strain (score 65). Hydro-pneumatic cylinder replacement is recommended prior to scheduled live firing exercise.",
    "actionPlan": [
      {
        "id": "AP-305-1",
        "task": "Recharge Nitrogen bottle & replace seal kit on suspension unit #4",
        "priority": "high",
        "eta": "8 hrs",
        "crew": "Artillery Workshop EME",
        "partsAvailable": true
      }
    ],
    "serviceHistory": [
      {
        "date": "2026-08-19",
        "event": "Breech obturator ring check",
        "inspector": "Naib Subedar B. Singh",
        "status": "Completed"
      }
    ],
    "telemetryHistory": [
      {
        "t": "-28d",
        "vibration": 1.2,
        "pressure": 210,
        "temp": 75
      },
      {
        "t": "Now",
        "vibration": 1.7,
        "pressure": 165,
        "temp": 82
      }
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
      {
        "name": "Water Jet Impeller RPM",
        "current": "2850 RPM",
        "baseline": "2800 RPM",
        "status": "nominal",
        "delta": "+1.8%"
      },
      {
        "name": "Bilge Pump Current",
        "current": "14.2 A",
        "baseline": "14.0 A",
        "status": "nominal",
        "delta": "+1.4%"
      }
    ],
    "copilotAnalysis": "Vehicle is combat ready. Amphibious flotation seals tested and certified for river crossings.",
    "actionPlan": [
      {
        "id": "AP-440-1",
        "task": "Standard road march lubrication",
        "priority": "low",
        "eta": "2 hrs",
        "crew": "Unit Mechanics",
        "partsAvailable": true
      }
    ],
    "serviceHistory": [
      {
        "date": "2026-08-26",
        "event": "Semi-annual water-tight integrity test",
        "inspector": "Capt. R. Bhatia",
        "status": "Completed"
      }
    ],
    "telemetryHistory": [
      {
        "t": "-28d",
        "vibration": 0.9,
        "pressure": 150,
        "temp": 68
      },
      {
        "t": "Now",
        "vibration": 1.0,
        "pressure": 149,
        "temp": 70
      }
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
      {
        "name": "Thermal Sight Cryo-Chiller Temp",
        "current": "77.1 K",
        "baseline": "77.0 K",
        "status": "nominal",
        "delta": "+0.1%"
      },
      {
        "name": "Missile Retractable Mast Force",
        "current": "8.4 kN",
        "baseline": "8.5 kN",
        "status": "nominal",
        "delta": "-1.2%"
      }
    ],
    "copilotAnalysis": "Full missile launch sequence verified; all optics and fire-control interfaces ready for night sorties.",
    "actionPlan": [
      {
        "id": "AP-512-1",
        "task": "Thermal imaging sight nitrogen purge",
        "priority": "low",
        "eta": "1 hr",
        "crew": "Optronics Workshop",
        "partsAvailable": true
      }
    ],
    "serviceHistory": [
      {
        "date": "2026-08-23",
        "event": "Missile canister latch seal inspection",
        "inspector": "Subedar H. Rao",
        "status": "Completed"
      }
    ],
    "telemetryHistory": [
      {
        "t": "-28d",
        "vibration": 0.7,
        "pressure": 170,
        "temp": 65
      },
      {
        "t": "Now",
        "vibration": 0.8,
        "pressure": 170,
        "temp": 66
      }
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
      {
        "name": "CTIS Manifold Pressure",
        "current": "4.8 bar",
        "baseline": "6.2 bar",
        "status": "warning",
        "delta": "-22.5%"
      },
      {
        "name": "Axle 3 Hub Temperature",
        "current": "84 \u00b0C",
        "baseline": "68 \u00b0C",
        "status": "warning",
        "delta": "+23.5%"
      }
    ],
    "copilotAnalysis": "CTIS pressure regulator valve exhibits sticking. Clean manifold and replace solenoid seal to prevent uneven tire wear on hard tarmac.",
    "actionPlan": [
      {
        "id": "AP-620-1",
        "task": "Replace CTIS Solenoid Valve Block on Axle 3",
        "priority": "medium",
        "eta": "4 hrs",
        "crew": "Wheeled Vehicle Wing",
        "partsAvailable": true
      }
    ],
    "serviceHistory": [
      {
        "date": "2026-08-17",
        "event": "Run-flat tire insert inspection",
        "inspector": "Havildar K. Pillay",
        "status": "Completed"
      }
    ],
    "telemetryHistory": [
      {
        "t": "-28d",
        "vibration": 0.9,
        "pressure": 6.2,
        "temp": 68
      },
      {
        "t": "Now",
        "vibration": 1.4,
        "pressure": 4.8,
        "temp": 84
      }
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
      {
        "name": "Winch Motor Hydraulic Bar",
        "current": "240 bar",
        "baseline": "240 bar",
        "status": "nominal",
        "delta": "0.0%"
      },
      {
        "name": "Dozer Blade Arm Stress",
        "current": "12 MPa",
        "baseline": "14 MPa",
        "status": "nominal",
        "delta": "-14.3%"
      }
    ],
    "copilotAnalysis": "Combat engineering asset ready for obstacle breaching and route clearance deployment.",
    "actionPlan": [
      {
        "id": "AP-801-1",
        "task": "Check winch wire-rope tension & lubricate cable drum",
        "priority": "low",
        "eta": "2 hrs",
        "crew": "Sappers EME",
        "partsAvailable": true
      }
    ],
    "serviceHistory": [
      {
        "date": "2026-08-31",
        "event": "Heavy hydraulic fluid change",
        "inspector": "Capt. A. Malhotra",
        "status": "Completed"
      }
    ],
    "telemetryHistory": [
      {
        "t": "-28d",
        "vibration": 0.7,
        "pressure": 240,
        "temp": 62
      },
      {
        "t": "Now",
        "vibration": 0.7,
        "pressure": 240,
        "temp": 63
      }
    ]
  },
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
      {
        "name": "Gas Turbine Drive Efficiency",
        "current": "99.4%",
        "baseline": "99.0%",
        "status": "nominal",
        "delta": "+0.4%"
      },
      {
        "name": "Hull Sonar Transducer Temp",
        "current": "18.2 \u00b0C",
        "baseline": "18.0 \u00b0C",
        "status": "nominal",
        "delta": "+1.1%"
      }
    ],
    "copilotAnalysis": "Asset is fully mission-ready for unrestricted deployment. Telemetry indicates optimal equipment health across all key systems.",
    "actionPlan": [
      {
        "id": "AP-089-1",
        "task": "Routine watermaker filter cleaning",
        "priority": "low",
        "eta": "2 hrs",
        "crew": "Shipboard Marine Eng",
        "partsAvailable": true
      }
    ],
    "serviceHistory": [
      {
        "date": "2026-08-30",
        "event": "Post-sea trials certification",
        "inspector": "Commander K. Sen",
        "status": "Completed"
      }
    ],
    "telemetryHistory": [
      {
        "t": "-28d",
        "vibration": 0.8,
        "pressure": 310,
        "temp": 420
      },
      {
        "t": "Now",
        "vibration": 0.8,
        "pressure": 310,
        "temp": 419
      }
    ]
  },
  {
    "id": "N-011",
    "callsign": "INS-VIKRANT",
    "name": "INS Vikrant (IAC-1) Indigenous Aircraft Carrier",
    "type": "Naval",
    "category": "Naval Strike Group",
    "status": "watch",
    "readinessScore": 69,
    "predictedRUL": 31,
    "operationalBase": "Southern Naval Command, Kochi",
    "crewAssigned": "Carrier Strike Taskforce 1",
    "lastServiceDate": "2026-08-12",
    "nextScheduledService": "2026-09-28",
    "flightHours": 9200,
    "mlModelApplied": "IMS Bearing RandomForest (NASA/UC)",
    "failureRiskDescription": "Port propulsion LM2500 gas turbine shaft intermediate thrust bearing vibration elevated (ML Failure Risk: 31.0%).",
    "contributingSensors": [
      {
        "name": "Port Shaft Thrust Bearing Vib",
        "current": "2.85 mm/s",
        "baseline": "1.20 mm/s",
        "status": "warning",
        "delta": "+137%"
      },
      {
        "name": "Lube Oil Water Saturation",
        "current": "140 ppm",
        "baseline": "50 ppm",
        "status": "warning",
        "delta": "+180%"
      },
      {
        "name": "Ski-Jump Arrestor Cable Pressure",
        "current": "3100 PSI",
        "baseline": "3100 PSI",
        "status": "nominal",
        "delta": "0.0%"
      }
    ],
    "copilotAnalysis": "IMS Bearing classifier flags moderate mechanical wear in the port main reduction gearbox thrust collar. Water contamination in lube oil likely caused early lubrication breakdown. Schedule port-side lube centrifuge flush within 31 days.",
    "actionPlan": [
      {
        "id": "AP-011-1",
        "task": "Centrifuge lube oil filtration & replace coalescer elements",
        "priority": "high",
        "eta": "12 hrs",
        "crew": "Carrier Propulsion Division",
        "partsAvailable": true
      },
      {
        "id": "AP-011-2",
        "task": "Borescope inspection of reduction gear teeth",
        "priority": "medium",
        "eta": "6 hrs",
        "crew": "Naval Dockyard Techs",
        "partsAvailable": true
      }
    ],
    "serviceHistory": [
      {
        "date": "2026-08-12",
        "event": "Flight deck ski-jump safety audit",
        "inspector": "Commodore T. Nambiar",
        "status": "Completed"
      }
    ],
    "telemetryHistory": [
      {
        "t": "-28d",
        "vibration": 1.2,
        "pressure": 3100,
        "temp": 52
      },
      {
        "t": "Now",
        "vibration": 2.85,
        "pressure": 3050,
        "temp": 64
      }
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
      {
        "name": "MF-STAR Radar Chiller Flow",
        "current": "124 L/min",
        "baseline": "125 L/min",
        "status": "nominal",
        "delta": "-0.8%"
      },
      {
        "name": "Shaft Vibration Spectral Peak",
        "current": "1.05 mm/s",
        "baseline": "1.00 mm/s",
        "status": "nominal",
        "delta": "+5.0%"
      }
    ],
    "copilotAnalysis": "Destroyer is on active operational patrol. Zero anomalies logged across combat command systems.",
    "actionPlan": [
      {
        "id": "AP-045-1",
        "task": "Routine cathode protection voltage logging",
        "priority": "low",
        "eta": "1 hr",
        "crew": "Electrical Officers",
        "partsAvailable": true
      }
    ],
    "serviceHistory": [
      {
        "date": "2026-08-25",
        "event": "Dry dock maintenance overhaul sign-off",
        "inspector": "Capt. P. Goswami",
        "status": "Completed"
      }
    ],
    "telemetryHistory": [
      {
        "t": "-28d",
        "vibration": 0.9,
        "pressure": 315,
        "temp": 395
      },
      {
        "t": "Now",
        "vibration": 1.0,
        "pressure": 314,
        "temp": 398
      }
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
      {
        "name": "Primary Coolant Pump Acoustic Level",
        "current": "28 dB",
        "baseline": "28 dB",
        "status": "nominal",
        "delta": "0.0%"
      },
      {
        "name": "Atmosphere Oxygen Reclamation",
        "current": "20.8%",
        "baseline": "20.9%",
        "status": "nominal",
        "delta": "-0.5%"
      }
    ],
    "copilotAnalysis": "Strategic nuclear deterrence asset maintains maximum mission readiness. Acoustic stealth profile intact.",
    "actionPlan": [
      {
        "id": "AP-072-1",
        "task": "Automated nuclear sensor diagnostic self-test",
        "priority": "low",
        "eta": "2 hrs",
        "crew": "Reactor Tech Team",
        "partsAvailable": true
      }
    ],
    "serviceHistory": [
      {
        "date": "2026-09-01",
        "event": "Comprehensive acoustic signature silence run",
        "inspector": "Rear Admiral A. Saxena",
        "status": "Completed"
      }
    ],
    "telemetryHistory": [
      {
        "t": "-28d",
        "vibration": 0.2,
        "pressure": 150,
        "temp": 280
      },
      {
        "t": "Now",
        "vibration": 0.2,
        "pressure": 150,
        "temp": 280
      }
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
      {
        "name": "Reduction Gearbox Bearing Vibration",
        "current": "2.40 mm/s",
        "baseline": "1.30 mm/s",
        "status": "warning",
        "delta": "+84.6%"
      },
      {
        "name": "Turbine Exhaust Flange Temp",
        "current": "460 \u00b0C",
        "baseline": "430 \u00b0C",
        "status": "warning",
        "delta": "+7.0%"
      }
    ],
    "copilotAnalysis": "Bearing cage wear detected under high-torque sprint testing. Restrict continuous full-flank sprint to <4 hours until depot bearing check.",
    "actionPlan": [
      {
        "id": "AP-105-1",
        "task": "Replace roller bearing on starboard reduction pinion",
        "priority": "medium",
        "eta": "10 hrs",
        "crew": "Karwar Base Workshop",
        "partsAvailable": true
      }
    ],
    "serviceHistory": [
      {
        "date": "2026-08-16",
        "event": "Routine propeller shaft alignment verification",
        "inspector": "Lt. Cdr. S. Menon",
        "status": "Completed"
      }
    ],
    "telemetryHistory": [
      {
        "t": "-28d",
        "vibration": 1.3,
        "pressure": 290,
        "temp": 430
      },
      {
        "t": "Now",
        "vibration": 2.4,
        "pressure": 285,
        "temp": 460
      }
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
      {
        "name": "Main Electric Motor Bearing Vib",
        "current": "0.45 mm/s",
        "baseline": "0.40 mm/s",
        "status": "nominal",
        "delta": "+12.5%"
      },
      {
        "name": "Battery Cell Temp Uniformity",
        "current": "28.5 \u00b0C",
        "baseline": "28.0 \u00b0C",
        "status": "nominal",
        "delta": "+1.8%"
      }
    ],
    "copilotAnalysis": "Vessel is fully certified for deep sub-surface anti-submarine and sea interdiction patrol.",
    "actionPlan": [
      {
        "id": "AP-220-1",
        "task": "Top up battery demineralized electrolyte",
        "priority": "low",
        "eta": "3 hrs",
        "crew": "Submarine Electrical Staff",
        "partsAvailable": true
      }
    ],
    "serviceHistory": [
      {
        "date": "2026-08-29",
        "event": "Deep dive pressure hull strain gauge calibration",
        "inspector": "Commander R. George",
        "status": "Completed"
      }
    ],
    "telemetryHistory": [
      {
        "t": "-28d",
        "vibration": 0.4,
        "pressure": 120,
        "temp": 28
      },
      {
        "t": "Now",
        "vibration": 0.45,
        "pressure": 120,
        "temp": 28.5
      }
    ]
  },
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
      {
        "name": "Radar Coolant Flow Rate",
        "current": "94.2 L/min",
        "baseline": "95.0 L/min",
        "status": "nominal",
        "delta": "-0.8%"
      },
      {
        "name": "Launcher Hydraulic Erector",
        "current": "220 bar",
        "baseline": "220 bar",
        "status": "nominal",
        "delta": "0%"
      }
    ],
    "copilotAnalysis": "Battery is mission-ready on 24/7 readiness alert. No anomalous degradation detected.",
    "actionPlan": [
      {
        "id": "AP-204-1",
        "task": "Scheduled antenna diagnostics check",
        "priority": "low",
        "eta": "1 hr",
        "crew": "EW Unit",
        "partsAvailable": true
      }
    ],
    "serviceHistory": [
      {
        "date": "2026-08-25",
        "event": "Quarterly phased array antenna diagnostics",
        "inspector": "Lt. Col. P. Rawat",
        "status": "Completed"
      }
    ],
    "telemetryHistory": [
      {
        "t": "-28d",
        "vibration": 0.5,
        "pressure": 220,
        "temp": 52
      },
      {
        "t": "Now",
        "vibration": 0.6,
        "pressure": 220,
        "temp": 52
      }
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
      {
        "name": "Transmitter RF Cavity Temp",
        "current": "94 \u00b0C",
        "baseline": "65 \u00b0C",
        "status": "critical",
        "delta": "+44.6%"
      },
      {
        "name": "Coolant Loop Pump Vibration",
        "current": "3.8 mm/s",
        "baseline": "1.1 mm/s",
        "status": "critical",
        "delta": "+245%"
      },
      {
        "name": "Missile Elevation Ram Pressure",
        "current": "190 bar",
        "baseline": "210 bar",
        "status": "warning",
        "delta": "-9.5%"
      }
    ],
    "copilotAnalysis": "Radar transmitter overheating caused by degraded impeller in secondary dielectric coolant loop. Radar shut down safeguard will trip after 18 mins of continuous high-power emission. Immediate impeller replacement required.",
    "actionPlan": [
      {
        "id": "AP-118-1",
        "task": "Replace Dielectric Coolant Pump Impeller & Motor on Rajendra Radar",
        "priority": "critical",
        "eta": "10 hrs",
        "crew": "Radar Depot Unit C",
        "partsAvailable": true
      },
      {
        "id": "AP-118-2",
        "task": "Pressure-test RF waveguide dielectric nitrogen envelope",
        "priority": "high",
        "eta": "3 hrs",
        "crew": "EW Techs",
        "partsAvailable": true
      }
    ],
    "serviceHistory": [
      {
        "date": "2026-08-08",
        "event": "Semi-annual missile battery live tracking calibration",
        "inspector": "Maj. V. Shekhawat",
        "status": "Completed"
      }
    ],
    "telemetryHistory": [
      {
        "t": "-28d",
        "vibration": 1.1,
        "pressure": 210,
        "temp": 65
      },
      {
        "t": "-14d",
        "vibration": 2.2,
        "pressure": 204,
        "temp": 78
      },
      {
        "t": "Now",
        "vibration": 3.8,
        "pressure": 190,
        "temp": 94
      }
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
      {
        "name": "VLU Gas Generator Pressure",
        "current": "310 bar",
        "baseline": "310 bar",
        "status": "nominal",
        "delta": "0.0%"
      },
      {
        "name": "Radar Tracking Bus Latency",
        "current": "1.2 ms",
        "baseline": "1.2 ms",
        "status": "nominal",
        "delta": "0.0%"
      }
    ],
    "copilotAnalysis": "Battery is fully ready to intercept aircraft, drones, and cruise missiles within 70km envelope.",
    "actionPlan": [
      {
        "id": "AP-309-1",
        "task": "Scheduled missile canister seal nitrogen pressure log",
        "priority": "low",
        "eta": "1 hr",
        "crew": "Battery Launch Crew",
        "partsAvailable": true
      }
    ],
    "serviceHistory": [
      {
        "date": "2026-08-27",
        "event": "Vertical launcher canister dry run",
        "inspector": "Wing Commander S. Roy",
        "status": "Completed"
      }
    ],
    "telemetryHistory": [
      {
        "t": "-28d",
        "vibration": 0.4,
        "pressure": 310,
        "temp": 44
      },
      {
        "t": "Now",
        "vibration": 0.4,
        "pressure": 310,
        "temp": 44.5
      }
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
      {
        "name": "Launch Pod Hydraulic Pressure",
        "current": "172 bar",
        "baseline": "205 bar",
        "status": "warning",
        "delta": "-16.1%"
      },
      {
        "name": "Traverse Servo Backlash",
        "current": "1.8 deg",
        "baseline": "0.3 deg",
        "status": "warning",
        "delta": "+500%"
      }
    ],
    "copilotAnalysis": "Hydraulic elevation seal has degraded due to desert dust intrusion. Traverse overshoot may degrade long-range saturation salvo accuracy. Refit seal before next live fire.",
    "actionPlan": [
      {
        "id": "AP-401-1",
        "task": "Replace Elevation Hydraulic Cylinder Seal & Bleed Air",
        "priority": "medium",
        "eta": "6 hrs",
        "crew": "Artillery Workshop Team A",
        "partsAvailable": true
      }
    ],
    "serviceHistory": [
      {
        "date": "2026-08-15",
        "event": "Salvo firing electronics check",
        "inspector": "Maj. D. Chauhan",
        "status": "Completed"
      }
    ],
    "telemetryHistory": [
      {
        "t": "-28d",
        "vibration": 0.8,
        "pressure": 205,
        "temp": 50
      },
      {
        "t": "Now",
        "vibration": 1.4,
        "pressure": 172,
        "temp": 64
      }
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
      {
        "name": "Combustor Zone 3 Pyrometer",
        "current": "812 \u00b0C",
        "baseline": "750 \u00b0C",
        "status": "warning",
        "delta": "+8.2%"
      },
      {
        "name": "Vibration Sensor Peak",
        "current": "2.3 mm/s",
        "baseline": "1.4 mm/s",
        "status": "warning",
        "delta": "+64%"
      }
    ],
    "copilotAnalysis": "Sensor drift detected through cross-correlation with adjacent temperature probes. Mechanical core is intact, but sensor recalibration and nozzle cleaning is needed within 12 days to avoid sub-optimal fuel trim.",
    "actionPlan": [
      {
        "id": "AP-045-1",
        "task": "Recalibrate dual EGT pyrometer probe array",
        "priority": "medium",
        "eta": "6 hrs",
        "crew": "Instrument Calibration Lab",
        "partsAvailable": true
      }
    ],
    "serviceHistory": [
      {
        "date": "2026-07-29",
        "event": "Semi-annual fuel filtration service",
        "inspector": "Havildar S. Joshi",
        "status": "Completed"
      }
    ],
    "telemetryHistory": [
      {
        "t": "-28d",
        "vibration": 1.4,
        "pressure": 45,
        "temp": 752
      },
      {
        "t": "Now",
        "vibration": 2.3,
        "pressure": 41,
        "temp": 812
      }
    ]
  }
];

export const MAINTENANCE_WORK_ORDERS = [
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
];

export const COPILOT_PRESET_QUERIES = [
  {
    id: 'pq-1',
    label: '🚨 Which assets are at critical failure risk?',
    prompt: 'Which combat assets are at critical failure risk and require immediate depot action?',
    response: {
      text: 'Four primary platforms currently exhibit critical failure indicators across their predictive models:\n\n1. A-317 (Su-30MKI): HPT bearing vibration at 4.82 mm/s (+167% over nominal) with 82 ppm metallic oil debris (IMS Bearing model risk: 79%).\n2. V-102 (Arjun MBT): Turret hydraulic recoil pressure dropped to 142 bar (safe minimum: 180 bar) with thermal spike to 118°C.\n3. V-210 (Combat UGV): Optical flux drop to 420 lm on primary Lidar caused by desert sand scoring; autonomous mesh disabled.\n4. A-711 (AH-64E Apache): Tail rotor 42-degree gearbox bearing flaking detected (vibration: 4.95 mm/s, temp: 112°C).\n5. D-118 (Akash Prime): Rajendra radar coolant pump cavitation tripping thermal safeguard after 18 mins.\n\nAll five assets are blocked from sortie dispatch until respective work orders are executed.',
      highlightAssetIds: ['A-317', 'V-102', 'V-210', 'A-711', 'D-118']
    }
  },
  {
    id: 'pq-2',
    label: '🔍 Su-30MKI Bearing Analysis (IMS Model)',
    prompt: 'Explain the vibration anomaly and predictive ML diagnosis on A-317 Su-30MKI.',
    response: {
      text: 'Telemetry for A-317 (Su-30MKI) processed through the NASA IMS Bearing model indicates an outer race flaking pattern on High-Pressure Turbine roller bearing #3.\n\n• Harmonic Frequency: Strong peak at 3.2x shaft speed.\n• Vibration G-RMS: 4.82 mm/s (MIL-STD limit is 3.5 mm/s).\n• Calculated RUL: 7 days to catastrophic shaft seizure.\n• Recommended Action: Work Order WO-901 dispatched to Air Wing Depot Team A for replacement and synthetic lube flush.',
      highlightAssetIds: ['A-317']
    }
  },
  {
    id: 'pq-3',
    label: '🛡️ Fleet Mission Readiness Overview',
    prompt: 'What is the current operational readiness status across all military branches?',
    response: {
      text: 'Current Fleet Mission Readiness Overview:\n\n• Total Monitored Assets: 26\n• Mission-Ready: 15 (57.7%)\n• Watchlist (Minor Anomaly): 6 (23.1%)\n• Critical Non-Ready: 5 (19.2%)\n• Mean Time Between Failures: 418 operating hours (+14.2% improvement)\n\nBreakdown by Domain:\n- Naval Strike Group: 66.7% Ready (INS Arihant, INS Visakhapatnam, INS Kolkata fully operational)\n- Air Force Combat Aircraft: 57.1% Ready (Rafale, Tejas, Jaguar cleared; Su-30MKI & Apache grounded)\n- Armored Corps: 50.0% Ready (T-90 Bhishma, BMP-2, NAMICA operational; Arjun & UGV in depot)\n- Air Defense Grid: 60.0% Ready (S-400 & MRSAM active; Akash Prime pump repair pending)',
      highlightAssetIds: ['N-089', 'N-072', 'A-108', 'V-108', 'D-204']
    }
  },
  {
    id: 'pq-4',
    label: '📋 Generate Depot Dispatch Schedule',
    prompt: 'What is the recommended priority dispatch schedule for depot maintenance teams?',
    response: {
      text: 'Recommended Immediate Depot Dispatch Priority:\n\n1. PRIORITY 1 (0-12 hrs): WO-902 (Arjun MBT) - 14th Cavalry Recovery Team B replacing hydraulic accumulator.\n2. PRIORITY 2 (0-16 hrs): WO-904 (Apache Guardian) - Pathankot Bay replacing tail rotor 42-degree gearbox bearing.\n3. PRIORITY 3 (0-24 hrs): WO-901 (Su-30MKI) - Ambala Depot Team A replacing HPT roller bearing #3.\n4. PRIORITY 4 (0-36 hrs): WO-903 (Combat UGV) - Robotics Unit 9 installing sapphire Lidar shield.\n5. PRIORITY 5 (24-48 hrs): WO-906 (INS Vikrant) - Centrifuging port shaft lube oil & reduction gear borescope.',
      highlightAssetIds: ['V-102', 'A-711', 'A-317', 'V-210', 'N-011']
    }
  }
];

