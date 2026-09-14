# Project Architecture — Mission Readiness & Predictive Maintenance Copilot

## High-Level Architecture
```
┌────────────────────┐      ┌─────────────────────┐      ┌───────────────────────┐
│   Frontend (React)  │ ───▶ │   Backend (FastAPI)   │ ───▶ │   ML Models (sklearn)  │
│  Dashboard / Chat UI│ ◀─── │   REST API + Agent    │ ◀─── │  Classifier + RUL model │
└────────────────────┘      └──────────┬───────────┘      └───────────────────────┘
                                        │
                                        ▼
                             ┌───────────────────────┐
                             │   LLM (Bob's model)    │
                             │  Explanation + Chat     │
                             └───────────────────────┘
                                        │
                                        ▼
                             ┌───────────────────────┐
                             │  Database (SQLite/PG)  │
                             │ assets, sensors, plans  │
                             └───────────────────────┘
```

## Full `src/` Folder Structure
```
project-root/
│
src/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard/
│   │   │   │   ├── ReadinessSummaryCards.jsx
│   │   │   │   └── CriticalAlertsList.jsx
│   │   │   ├── Assets/
│   │   │   │   ├── AssetTable.jsx
│   │   │   │   ├── AssetDetail.jsx
│   │   │   │   └── SensorTrendChart.jsx
│   │   │   ├── Chat/
│   │   │   │   ├── ChatWidget.jsx        # floating chat button + panel
│   │   │   │   ├── ChatWindow.jsx
│   │   │   │   └── MessageBubble.jsx
│   │   │   └── MaintenancePlan/
│   │   │       └── PlanTable.jsx
│   │   ├── pages/
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── AssetsPage.jsx
│   │   │   ├── AssetDetailPage.jsx
│   │   │   ├── ChatPage.jsx
│   │   │   └── MaintenancePlanPage.jsx
│   │   ├── api/
│   │   │   └── apiClient.js              # calls backend REST endpoints
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── routes_assets.py          # /assets, /assets/:id endpoints
│   │   │   ├── routes_chat.py            # /chat endpoint (agent entrypoint)
│   │   │   ├── routes_plan.py            # /maintenance-plan endpoint
│   │   │   └── routes_upload.py          # /upload endpoint
│   │   ├── ml/
│   │   │   ├── train_classifier.py       # trains readiness classifier
│   │   │   ├── train_rul_model.py        # trains RUL regressor
│   │   │   ├── predict.py                # loads models, runs inference
│   │   │   └── feature_engineering.py    # rolling stats, sensor deltas
│   │   ├── agent/
│   │   │   ├── tools.py                  # tool functions (get_asset_status, predict_rul, etc.)
│   │   │   ├── prompts.py                # system prompt + templates
│   │   │   └── agent_runner.py           # orchestrates LLM + tool calls
│   │   ├── db/
│   │   │   ├── models.py                 # SQLAlchemy models: Asset, SensorReading, ServiceRecord
│   │   │   ├── database.py               # DB connection/session setup
│   │   │   └── seed_data.py              # loads NASA C-MAPSS + synthetic data into DB
│   │   ├── config.py
│   │   └── main.py                       # FastAPI app entrypoint
│   ├── models/                           # saved trained model files (.pkl / .joblib)
│   │   ├── readiness_classifier.pkl
│   │   └── rul_regressor.pkl
│   ├── requirements.txt
│   └── tests/
│       ├── test_predict.py
│       └── test_agent.py
│
├── data/
│   ├── raw/                              # original NASA C-MAPSS files
│   ├── processed/                        # cleaned/feature-engineered CSVs
│   └── synthetic_service_records.csv     # generated service history data
│
├── docs/                                 # this set of planning docs
│   ├── 01-wireframe.md
│   ├── 02-sitemap.md
│   ├── 03-techstack.md
│   ├── 04-llm-architecture.md
│   └── 05-project-architecture.md
│
├── .bob/                                 # Bob IDE workspace config (skills/modes if used)
├── .gitignore
└── README.md
```

## Data Flow (end-to-end)
1. `data/raw` (NASA C-MAPSS + synthetic service records) → cleaned in `feature_engineering.py`.
2. `train_classifier.py` + `train_rul_model.py` → produce `.pkl` models in `backend/models/`.
3. `predict.py` loads these models, exposes predictions via `routes_assets.py`.
4. `agent/tools.py` wraps these predictions as callable tools for the LLM.
5. `agent_runner.py` handles a chat message → decides which tool(s) to call → LLM formats
   the final natural-language + structured response.
6. Frontend (`ChatWidget.jsx`, `AssetDetail.jsx`) renders the response with text + charts/tables.

## Build Order (recommended for hackathon time pressure)
1. Data prep + train the two ML models (offline, in notebooks first).
2. Backend REST endpoints for assets/predictions (no LLM yet — test with Postman).
3. Basic frontend: Dashboard + Asset Detail (static-ish, wired to backend).
4. Add the agent/chat layer on top (tools.py + agent_runner.py).
5. Polish: maintenance plan view, chat widget, charts.
