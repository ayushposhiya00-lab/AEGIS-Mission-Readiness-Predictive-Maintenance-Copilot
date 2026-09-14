# Tech Stack — Mission Readiness & Predictive Maintenance Copilot

## Frontend
| Layer            | Choice                          | Why |
|-------------------|----------------------------------|-----|
| Framework         | React (Vite)                    | Fast setup, huge component ecosystem, Bob IDE friendly |
| Styling           | Tailwind CSS                    | Quick, consistent, avoids custom CSS overhead in a hackathon |
| Charts            | Recharts or Chart.js            | Sensor trend lines, readiness bar/heatmap |
| Chat UI           | Custom chat component (or react-chat-ui) | Needed for the Copilot conversation panel |
| State management  | React Context / Zustand         | Lightweight, no need for Redux at this scale |

## Backend
| Layer             | Choice                          | Why |
|-------------------|----------------------------------|-----|
| Runtime           | Node.js (Express) **or** Python (FastAPI) | FastAPI preferred if ML models are in Python (avoids cross-language calls) |
| API style         | REST (JSON)                     | Simple, fast to build, easy for judges to test with Postman |
| Auth (optional)   | JWT-based simple auth           | Only if hackathon rules require login |

## Machine Learning
| Component               | Model/Tool                       | Purpose |
|--------------------------|-----------------------------------|---------|
| Readiness Classification | XGBoost / Random Forest (scikit-learn) | Predicts ready / non-ready label |
| RUL Prediction            | XGBoost Regressor (or LSTM if time permits) | Predicts days-to-failure |
| Feature engineering       | pandas, numpy                    | Rolling averages, sensor deltas, service-interval gaps |
| Model serving             | FastAPI endpoint or joblib-loaded model in same backend | Keep it simple — no separate ML microservice needed for MVP |

## LLM / Agent Layer
| Component            | Choice                              | Purpose |
|-----------------------|--------------------------------------|---------|
| LLM                  | Bob's built-in LLM / Claude / GPT (whichever Bob exposes) | Natural language explanation + recommendation generation |
| Orchestration         | Simple function-calling / tool-calling pattern | LLM calls your ML prediction endpoint as a "tool", then explains result |
| Context grounding     | RAG-lite: pass structured JSON (sensor data + prediction + service history) directly into prompt | No need for a vector DB at this scale — data is small & structured |
| Prompt management     | Plain prompt templates in code (see `llm-architecture.md`) | Keeps it debuggable during demo |

## Data
| Component     | Choice                     | Purpose |
|-----------------|------------------------------|---------|
| Dataset         | NASA C-MAPSS (sensor/RUL) + synthetic service-record CSV | Training + demo data |
| Storage         | SQLite (MVP) or PostgreSQL (if scaling) | Store assets, sensor readings, service records, predictions |
| File ingestion  | pandas CSV/JSON parser       | For `/upload` screen |

## DevOps / Deployment
| Component     | Choice                        | Why |
|-----------------|---------------------------------|-----|
| Dev environment | IBM Bob IDE (mandatory per hackathon) | Required for judging/task-session export |
| Version control | Git (within Bob workspace)     | Standard practice |
| Deployment (demo)| Local run / Render / Replit (if external hosting allowed) | Only if hackathon permits external deployment for live demo |

## Summary — Minimum Viable Combo
`React + Tailwind` (frontend) → `FastAPI` (backend) → `scikit-learn/XGBoost` (prediction) → `LLM via Bob` (explanation & chat) → `SQLite` (storage).
This keeps everything in Python/JS, easy to build solo or in a small team within hackathon time.
