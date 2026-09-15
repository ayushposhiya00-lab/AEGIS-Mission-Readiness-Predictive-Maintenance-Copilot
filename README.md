# 🚀 Mission Readiness & Predictive Maintenance
Copilot

> ⚠️ **Replace everything in `[ ]` brackets with your actual content before submission.**

---

## 👥 Team

| Field | Value |
|---|---|
| **Team Name** | TeamX |
| **Track** | AI |
| **Team Lead** | Ayush — 25dce092@charusat.edu.in |
| **Members** | Yaksh , Krish , Het |

---

## 🎯 Problem Statement

> In 2–3 sentences: What problem does your project solve? Who experiences this problem?

Military organisations struggle to determine whether aircraft, vehicles, and other equipment are truly mission-ready because maintenance is often based on fixed schedules rather than actual equipment condition. Maintenance teams and military operators face unexpected equipment failures because valuable HUMS sensor data and service records are not effectively analysed to predict component failures in advance. Our project helps identify non-ready assets, predict potential failures, explain readiness issues, and prioritise maintenance before the next mission.


---

## 💡 Solution

> In 2–3 sentences: What did you build? How does it solve the problem above?

[We built an AI-powered Mission Readiness & Predictive Maintenance Copilot that analyzes equipment telemetry using trained ML models to predict failure risk, operational readiness, and remaining useful life (RUL) for aircraft, ground vehicles, and bearings. The system combines these predictions with explainable sensor-level analysis and an AI copilot to identify the main causes of risk, prioritize maintenance, and help maintenance teams make faster, data-driven decisions before a mission.]

## ✨ Key Features

- **Real-Time Fleet Monitoring:** Continuously monitors aircraft, ground vehicles, and bearing assets using telemetry data and provides live asset status, health, alerts, and mission-readiness information.
- **ML-Based Failure Prediction:** Uses trained machine learning models to predict the probability of equipment failure from sensor and operational data.
- **Remaining Useful Life (RUL) Prediction:** Estimates how much useful operational life remains for supported assets, helping maintenance teams plan interventions before critical failure.
- **Explainable AI Diagnostics:** Explains why an asset is considered high-risk by analyzing sensor values, deviations from baseline conditions, severity, and their contribution to the predicted risk.
- **Predictive Maintenance Planning:** Converts high-risk predictions into prioritized maintenance actions, including repair tasks, urgency, crew assignment, spare-parts status, and mission impact.
- **AI Mission Readiness Copilot:** Provides natural-language assistance for understanding fleet health, asset risks, diagnostics, readiness, and recommended maintenance actions.

---

## 🛠️ Tech Stack

| Category | Technologies |
|---|---|
| **Languages** | Python, JavaScript (JSX) |
| **Frameworks** | React 19, Vite, FastAPI |
| **IBM Technologies** | IBM Bob - For Debugging And Code Review |
| **Databases** | SQLite |
| **Other** | scikit-learn, NumPy, pandas, Joblib, WebSockets, Lucide React |

---

## 📁 Repository Structure

```
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
├── demo/
├── presentation/
└── submission.yaml

---

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
