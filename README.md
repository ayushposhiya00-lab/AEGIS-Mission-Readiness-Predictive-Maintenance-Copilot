# 🚀 Mission Readiness & Predictive Maintenance Copilot

> An AI-powered platform for mission readiness assessment, predictive maintenance, failure prediction, and Remaining Useful Life (RUL) estimation for critical assets.

---

## 👥 Team

| Field | Value |
|---|---|
| **Team Name** | TeamX |
| **Track** | AI |
| **Team Lead** | Ayush — 25dce092@charusat.edu.in |
| **Members** | Yaksh, Krish, Het |

---

## 🎯 Problem Statement

Military organisations struggle to determine whether aircraft, vehicles, and other critical equipment are truly mission-ready because maintenance is often based on fixed schedules rather than actual equipment condition. Maintenance teams and military operators may face unexpected equipment failures because valuable HUMS sensor data and service records are not effectively analysed to identify early signs of component degradation.

Our project helps identify non-ready assets, predict potential failures, explain the factors affecting asset health, estimate Remaining Useful Life (RUL), and prioritise maintenance before the next mission.

---

## 💡 Solution

We built an **AI-powered Mission Readiness & Predictive Maintenance Copilot** that analyses equipment telemetry using trained machine learning models to predict failure risk, operational readiness, and Remaining Useful Life (RUL) for supported aircraft, ground-vehicle, and bearing-related assets.

The system combines ML predictions with explainable sensor-level diagnostics and an AI copilot to identify the main causes of risk, prioritise maintenance actions, and help maintenance teams make faster, data-driven decisions before a mission.

---

## ✨ Key Features

- **Real-Time Fleet Monitoring:** Continuously monitors supported assets using telemetry data and provides live asset health, status, alerts, and mission-readiness information.

- **ML-Based Failure Prediction:** Uses trained machine learning models to estimate the probability of equipment failure from sensor and operational data.

- **Remaining Useful Life (RUL) Prediction:** Estimates the remaining useful operational life of supported assets to help maintenance teams plan interventions before critical degradation.

- **Explainable AI Diagnostics:** Analyses sensor values, operating conditions, deviations from baseline behaviour, and severity to explain the major factors contributing to an asset's predicted risk.

- **Predictive Maintenance Planning:** Converts high-risk predictions into prioritised maintenance actions based on asset condition, urgency, and mission impact.

- **AI Mission Readiness Copilot:** Provides natural-language assistance for understanding fleet health, asset risks, diagnostics, readiness, and recommended maintenance actions.

---

## 🛠️ Tech Stack

| Category | Technologies |
|---|---|
| **Languages** | Python, JavaScript (JSX) |
| **Frameworks** | React 19, Vite, FastAPI |
| **Machine Learning** | scikit-learn, NumPy, pandas, Joblib |
| **IBM Technologies** | IBM Bob – used for development, debugging, and code review |
| **Databases** | SQLite |
| **Real-Time Communication** | WebSockets |
| **UI / Icons** | Lucide React |

---

## 🤖 Machine Learning Models

The platform integrates trained machine learning models for different types of equipment and telemetry:

| Dataset / Model | Purpose |
|---|---|
| **AI4I 2020 Predictive Maintenance** | Mechanical failure prediction |
| **IMS Bearing Dataset** | Bearing health, vibration analysis, and failure prediction |
| **N-CMAPSS Turbofan Dataset** | Turbofan engine degradation and RUL prediction |

The trained models are stored as serialized model files and loaded by the backend for inference on compatible telemetry data.

---

## 📁 Repository Structure

```text
├── src/
│   ├── frontend/
│   │   └── src/
│   │       ├── components/
│   │       │   ├── Assets/
│   │       │   ├── Chat/
│   │       │   ├── Dashboard/
│   │       │   └── MaintenancePlan/
│   │       ├── pages/
│   │       ├── data/
│   │       └── utils/
│   │
│   ├── backend/
│   │   ├── ml/
│   │   │   ├── predictor.py
│   │   │   ├── explainer.py
│   │   │   ├── ai4i.pkl
│   │   │   ├── bearing.pkl
│   │   │   └── failure_model.pkl
│   │   ├── data/
│   │   ├── database.py
│   │   ├── main.py
│   │   └── requirements.txt
│   │
│   └── project architecture
│
├── docs/
│   ├── problem-statement.md
│   ├── solution-overview.md
│   ├── architecture.md
│   └── setup-guide.md
│
├── demo/
│   ├── screenshots/
│   ├── demo-video-link.txt
│   └── live-demo-url.txt
│
├── presentation/
│   └── slides.pdf
│
└── submission.yaml

## ⚡ How to Run

> **Copy these exact steps from your [`docs/setup-guide.md`](docs/setup-guide.md)**

```bash
# 1. Clone the repo
git clone https://github.com/[your-repo].git
cd [your-repo]

# 2. Install dependencies
[your install command here]

# 3. Configure environment
cp .env.example .env
# Edit .env with your values

# 4. Run the project
[your run command here]
```

---

## 🖥️ Demo

| Artifact | Link |
|---|---|
| 📹 Demo Video | [See demo/demo-video-link.txt](demo/demo-video-link.txt) |
| 🌐 Live Demo | [See demo/live-demo-url.txt](demo/live-demo-url.txt) |
| 🖼️ Screenshots | [See demo/screenshots/](demo/screenshots/) |
| 📊 Presentation | [See presentation/slides.pdf](presentation/) |

---

## ⚠️ Known Limitations

> Be honest — judges appreciate transparency over overclaiming.

- [Limitation 1: e.g., "Authentication is mocked — not production-ready"]
- [Limitation 2: e.g., "Only tested on Chrome"]
- [Limitation 3: e.g., "Feature X is scaffolded but not fully implemented"]

---

## 🏅 What We're Most Proud Of

[Tell the judges what part of your submission is strongest and worth paying close attention to.]

---
