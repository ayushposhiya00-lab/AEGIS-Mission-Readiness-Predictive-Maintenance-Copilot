# Source Code — Mission Readiness & Predictive Maintenance Copilot

This directory contains the complete source code for the platform, divided into a high-performance Python FastAPI backend and a modern React 19 frontend.

## Directory Structure

```
src/
├── backend/                  # FastAPI Python Backend
│   ├── api/                  # API routers
│   │   ├── routes_assets.py  # Fleet overview, asset details, work orders
│   │   ├── routes_batch.py   # Vectorized CSV batch ingestion & scoring
│   │   ├── routes_chat.py    # Copilot LLM (Groq LPU / RAG) & tool execution
│   │   ├── routes_predict.py # Single model prediction endpoints
│   │   └── routes_ws.py      # Real-time WebSocket telemetry stream
│   ├── ml/                   # Machine Learning Models & Explainers
│   │   ├── ai4i.pkl          # AI4I 2020 Ground Armor failure model
│   │   ├── bearing.pkl       # NASA IMS Bearing rotary model
│   │   ├── failure_model.pkl # NASA N-CMAPSS Turbofan degradation model
│   │   ├── predictor.py      # Multi-model registry & batch scoring
│   │   └── explainer.py      # Explainable AI (XAI) feature attribution
│   ├── data/                 # SQLite persistence & batch storage
│   │   ├── defense_telemetry.db
│   │   ├── uploads/
│   │   └── scored_batches/
│   ├── database.py           # SQLite connection, tables, queries
│   ├── main.py               # FastAPI application entrypoint & CORS
│   ├── requirements.txt      # Python dependencies
│   ├── .env                  # Environment configuration
│   └── test_features.py      # Automated integration test suite
│
├── frontend/                 # React 19 Client (Vite)
│   ├── src/
│   │   ├── components/       # UI Components
│   │   │   ├── Assets/       # Asset tables, detail cards, radial gauges
│   │   │   ├── Chat/         # Copilot conversation drawer & message cards
│   │   │   ├── Dashboard/    # Readiness summary KPIs & critical alerts
│   │   │   └── MaintenancePlan/ # Work order dispatch table
│   │   ├── pages/            # Page-level route views
│   │   ├── App.jsx           # Root layout & active view controller
│   │   ├── index.css         # High-contrast cyber-defense dark styling
│   │   └── main.jsx          # Vite React bootstrap
│   ├── package.json          # Node dependencies
│   └── vite.config.js        # Vite bundler configuration
│
└── .env.example              # Template environment configuration
```

## Quick Start

### Backend
```bash
cd backend
pip install -r requirements.txt
python main.py
```
*API available at `http://localhost:8000` (Swagger docs at `/docs`)*

### Frontend
```bash
cd frontend
npm install
npm run dev
```
*UI available at `http://localhost:5173`*
