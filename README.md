# 🚀 Mission Readiness & Predictive Maintenance Copilot (AEGIS Platform)



An intelligent, multi-model predictive maintenance and fleet readiness system for defense and aerospace operations. Powered by NASA IMS Bearing vibration modeling, AI4I 2020 predictive wear modeling, NASA N-CMAPSS turbofan degradation regression, Explainable AI (XAI) feature attribution, live WebSocket telemetry streaming, and an autonomous AI Copilot (Groq LPU Llama 3.3 70B & local defense RAG).

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

Military and defense organizations struggle to determine whether combat aircraft, armored ground vehicles, rotary wings, and naval platforms are truly mission-ready because maintenance is traditionally based on rigid calendar schedules rather than actual real-time physical condition. Valuable Health and Usage Monitoring System (HUMS) sensor streams (vibration, temperature, torque, pressure) remain trapped in silos, leading to unexpected in-mission component failures, costly emergency depot downtime, and compromised mission safety. Our project continuously monitors multi-domain defense assets, predicts Remaining Useful Life (RUL) with sub-surface ML models, explains physical root causes via Explainable AI, and autonomously generates actionable maintenance work orders.

👉 **Read the full [Problem Statement](docs/problem-statement.md)**

---

## 💡 Solution

We built the **Mission Readiness & Predictive Maintenance Copilot (AEGIS Platform)** — an end-to-end tactical command and maintenance engineering platform. It ingests live and batch sensor telemetry, executes domain-specific ML models (NASA IMS Bearing, AI4I Ground Armor, NASA N-CMAPSS Turbofan), and presents real-time readiness scores and failure risks across military fleets.

Sitting on top of the models is a bilingual (English & Hinglish) **AI Copilot** powered by Groq LPU (Llama 3.3 70B) and deterministic Defense RAG. Commanders and mechanics can interrogate assets in conversational natural language, inspect XAI feature attributions (exact percentage contributions of anomalous sensor readings), simulate in-flight sensor spikes via live WebSockets, and autonomously formulate and commit maintenance work orders directly into an embedded SQLite datastore.

👉 **Read the complete [Solution Overview](docs/solution-overview.md)**

---

## ✨ Key Features

- **Multi-Model Specialized ML Engine:** Domain-tailored predictive models for rotary bearings (`bearing.pkl`), heavy ground combat armor (`ai4i.pkl`), and jet engine turbofans (`failure_model.pkl`) calculating failure probability and Remaining Useful Life (RUL) in days.
- **Explainable AI (XAI) Feature Attribution:** Deconstructs black-box model decisions into clear, auditable percentage factor weights (e.g., *Peak Vibration +48%, Kurtosis +31%*), showing technicians exactly why an asset is flagged.
- **Bilingual Autonomous AI Copilot (English & Hinglish):** Conversational AI powered by Groq LPU (Llama 3.3 70B) and local defense RAG that answers fleet readiness queries, explains anomalies, and autonomously dispatches work orders.
- **Real-Time Telemetry & Dynamic Anomaly Injection:** Bi-directional WebSocket stream (`/api/ws/telemetry`) broadcasting live sensor drift at 1-second intervals with interactive fault injection for simulation and training.
- **High-Speed Vectorized Batch Ingestion:** Vectorized CSV scoring engine (`/api/upload-csv`) capable of processing, evaluating, and persisting 5,000+ telemetry rows in under 1 second.
- **Persistent Maintenance Work Order Lifecycle:** Embedded SQLite database (`defense_telemetry.db`) tracking registered assets, telemetry batches, and dispatched maintenance tasks with assigned crews and due windows.

---

## 🛠️ Tech Stack

| Category | Technologies |
|---|---|
| **Frontend** | React 19, Vite 6, Lucide React, Cyber-Glassmorphism CSS, WebSockets |
| **Backend API** | Python 3.11+, FastAPI, Uvicorn, Pydantic v2 |
| **AI / Machine Learning** | scikit-learn, joblib, NumPy, pandas, Explainable AI (XAI) Engine |
| **LLM & Copilot** | Groq LPU (Llama 3.3 70B Versatile), Gemini API, Deterministic Defense RAG |
| **Datasets** | NASA IMS Bearing Dataset, AI4I 2020 Predictive Maintenance, NASA N-CMAPSS |
| **Database & Storage** | Embedded SQLite (`defense_telemetry.db`), File Storage (`uploads/`, `scored_batches/`) |
| **Testing & Tooling** | Python automated test suites (`test_features.py`, `test_chat.py`, `test_bearing_mapping.py`) |

👉 **Read the comprehensive [Tech Stack Specification](docs/03-techstack.md)**

---

## 📁 Repository Structure

```
├── src/
│   ├── backend/                  # FastAPI Python backend
│   │   ├── api/                  # REST & WebSocket route handlers
│   │   ├── ml/                   # Trained models (.pkl), predictor, XAI explainer
│   │   ├── data/                 # SQLite database & CSV batch storage
│   │   ├── database.py           # Database schema & queries
│   │   ├── main.py               # FastAPI application entrypoint
│   │   ├── requirements.txt      # Python dependencies
│   │   └── test_features.py      # Automated feature integration test suite
│   ├── frontend/                 # React 19 + Vite frontend
│   │   ├── src/                  # Components (Dashboard, Assets, Chat, Gauges)
│   │   ├── package.json          # Node dependencies
│   │   └── vite.config.js        # Vite configuration
│   └── .env.example              # Template environment variables
├── docs/                         # Written documentation
│   ├── 01-wireframe.md           # UI/UX Wireframe blueprints
│   ├── 02-sitemap.md             # Site routing & user journeys
│   ├── 03-techstack.md           # Detailed technology stack
│   ├── 04-llm-architecture.md   # Copilot LLM & tool-calling architecture
│   ├── 05-project-architecture.md # Directory map & end-to-end flows
│   ├── architecture.md           # Formal system architecture & Mermaid diagrams
│   ├── problem-statement.md      # Comprehensive defense problem statement
│   ├── solution-overview.md      # Executive solution overview & capabilities
│   └── setup-guide.md            # Exact local run & test instructions
├── demo/                         # Demo artifacts
│   ├── screenshots/              # Application screenshots
│   ├── demo-video-link.txt       # Link to recorded demo video
│   └── live-demo-url.txt         # Live demo URL (if deployed)
├── presentation/                 # Slide deck (slides.pdf / slides.pptx)
└── submission.yaml               # Structured evaluation metadata
```

---

## ⚡ How to Run

> **For complete details, see [`docs/setup-guide.md`](docs/setup-guide.md)**

```bash
# 1. Clone the repository
git clone https://github.com/ayushposhiya00-lab/bob-ai-hackathon-team-x.git
cd bob-ai-hackathon-team-x

# 2. Run Backend (Terminal 1)
cd src/backend
pip install -r requirements.txt
python main.py
# Backend runs at http://localhost:8000 (Swagger docs at /docs)

# 3. Run Frontend (Terminal 2)
cd src/frontend
npm install
npm run dev
# Tactical UI available at http://localhost:5173

# 4. Run Automated Tests
cd src/backend
python test_features.py
python test_chat.py
python test_bearing_mapping.py
```

---

## 🖥️ Demo

| Artifact | Link |
|---|---|
| 📹 Demo Video | [demo/demo-video-link.txt](demo/demo-video-link.txt) |
| 🌐 Live Demo | [demo/live-demo-url.txt](demo/live-demo-url.txt) |
| 🖼️ Screenshots | [demo/screenshots/](demo/screenshots/) |
| 📊 Presentation | [presentation/](presentation/) |

---

## ⚠️ Known Limitations

- **Simulated Flight Telemetry Stream:** In this hackathon release, live telemetry streaming (`/api/ws/telemetry`) is generated from baseline statistical parameters and NASA dataset distributions rather than a direct physical MIL-STD-1553 aircraft databus hookup.
- **Single-Node SQLite Datastore:** SQLite is used for zero-overhead local and forward operating base deployment. While fast and portable, a multi-base enterprise deployment would transition to distributed PostgreSQL or IBM Db2.
- **External LLM Internet Access:** The high-speed Groq LPU engine requires internet egress. For completely air-gapped combat deployments, the system defaults to the deterministic local Defense RAG engine.

---

## 🏅 What We're Most Proud Of

1. **True Explainable AI (XAI) for Defense:** We did not stop at raw ML probability outputs; our system computes exact, transparent percentage contributions for anomalous sensor factors, directly solving the military auditability challenge.
2. **Bilingual Defense Domain AI Copilot:** The Copilot seamlessly comprehends both technical English and natural Hinglish operational vernacular (*"Su-30 A-317 ka vibration kyu spike ho raha hai?"*), making AI immediately usable for frontline ground technicians.
3. **Autonomous End-to-End Workflow:** The Copilot can transition directly from conversational reasoning to concrete operational action by generating and committing structured work orders to the database in real time.
4. **Instant Batch Scoring Performance:** Our vectorized ML pipeline parses and scores over 5,000 telemetry sensor rows in under 1 second.
