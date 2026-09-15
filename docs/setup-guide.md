# Setup Guide

> **This file provides complete, step-by-step instructions to run and test the Mission Readiness & Predictive Maintenance Copilot locally.**

## Prerequisites

Before you begin, ensure you have the following installed on your machine:

- [x] **Python 3.11+** (Verify with `python --version`)
- [x] **Node.js 18+ & npm 9+** (Verify with `node -v` and `npm -v`)
- [x] **Git** (Verify with `git --version`)
- [x] *(Optional)* **Groq API Key** for ultra-fast LPU Llama 3.3 70B inference (Free tier available at [console.groq.com](https://console.groq.com/keys)). If not provided, the system seamlessly falls back to the deterministic local Defense RAG engine.

---

## Environment Variables

Navigate to the backend directory and configure your environment:

```bash
# Windows PowerShell
cd src/backend
Copy-Item .env.example .env -ErrorAction SilentlyContinue

# Linux / macOS
cd src/backend
cp .env.example .env 2>/dev/null || :
```

### Supported Configuration Keys

| Variable | Description | Default / Example | Required |
|---|---|---|---|
| `GROQ_API_KEY` | Ultra-fast Groq LPU inference key (Llama 3.3 70B) | `gsk_...` | Optional (falls back to local RAG) |
| `GEMINI_API_KEY` | Google Gemini API key (secondary LLM fallback) | `AIzaSy...` | Optional |
| `PORT` | Backend server port | `8000` | Optional |
| `HOST` | Backend bind host | `0.0.0.0` | Optional |

> **Note:** The backend automatically boots with an active embedded SQLite database at `src/backend/data/defense_telemetry.db`. No separate PostgreSQL or Docker database setup is needed.

---

## Installation

### 1. Clone the Repository

```bash
git https://github.com/ayushposhiya00-lab/bob-ai-hackathon-team-x.git
cd bob-ai-hackathon-team-x
```

### 2. Install Backend Dependencies

```bash
cd src/backend
pip install -r requirements.txt
```

*Required packages installed:*
- `fastapi>=0.110.0`
- `uvicorn>=0.28.0`
- `scikit-learn>=1.7.0`
- `numpy>=2.0.0`
- `joblib>=1.3.0`
- `pandas>=2.0.0`
- `pydantic>=2.0.0`

### 3. Install Frontend Dependencies

Open a new terminal window:

```bash
cd src/frontend
npm install
```

---

## Running the Application

### 1. Start the FastAPI Backend Server

From `src/backend`:

```bash
# Using uvicorn directly
uvicorn main:app --reload --port 8000

# Or run via Python
python main.py
```

The backend API will start at: **`http://localhost:8000`**
- Interactive Swagger API Documentation: **`http://localhost:8000/docs`**
- System Status & Model Verification: **`http://localhost:8000/`**
- WebSocket Live Telemetry Stream: **`ws://localhost:8000/api/ws/telemetry`**

### 2. Start the React Frontend Dev Server

From `src/frontend`:

```bash
npm run dev
```

The tactical frontend will be available at: **`http://localhost:5173`**

---

## Running Verification Tests

The project includes automated test suites covering Explainable AI (XAI), live WebSocket telemetry, dynamic ML model scoring, work-order lifecycles, and Copilot reasoning.

Run the test suite from `src/backend`:

```bash
# 1. Run full 5-feature integration test suite
python test_features.py

# 2. Run Copilot multilingual chat reasoning test
python test_chat.py

# 3. Run NASA IMS Bearing mapping verification
python test_bearing_mapping.py
```

### Expected Test Output

```
--- [TEST 1] Explainable AI (XAI) Feature Attribution ---
✅ Bearing XAI: Critical bearing raceway wear detected with elevated RMS vibration.
✅ Ground Armor XAI: Elevated tool wear and process temp detected.
✅ Asset Route XAI for A-317: OK (3 factors)
✅ Asset Detail xaiAttribution attached: OK

--- [TEST 2] Live Telemetry & Anomaly Injection ---
✅ Baseline Telemetry Reading: Vib=4.82 mm/s, Pres=2640 PSI
✅ Injected Anomaly Reading: Vib=5.48 mm/s (Spike Detected: True)
✅ Anomaly Reset Verified: Vib=4.82 mm/s

--- [TEST 3] Dynamic Scored Assets & Custom Asset Registration ---
✅ Dynamic Scored Assets Count: 31 assets loaded
✅ Su-30MKI A-317: Readiness=28%, RUL=3 days (CRITICAL)
✅ Custom Asset Registration: OK

--- [TEST 4] Work Order Dispatch & Lifecycle Persistence ---
✅ Work Order Created: WO-A317-001 | Status=ASSIGNED
✅ Persisted Work Orders Retrieved: OK

--- [TEST 5] Copilot Autonomous Action Plan Generation ---
✅ Copilot English Query: OK
✅ Copilot Hinglish Query: OK
```

---

## Quick Demo Walkthrough

Once both servers are running, follow these steps to explore all core capabilities:

1. **Fleet Readiness Dashboard (`/`):**
   - View top-level KPIs: Total Assets, Mission-Ready (🟢 >80%), Watchlist (🟡 50–80%), Non-Ready (🔴 <50%).
   - Inspect the live fleet table featuring combat aircraft (Su-30MKI, Rafale), armor (Arjun Mk-II, T-90), and naval shafts.
2. **Real-Time Telemetry & Anomaly Injection:**
   - Click on asset **A-317 (Su-30MKI)**.
   - Observe live gauges for Vibration, Hydraulic Pressure, and Engine Temperature.
   - Click **"Inject Anomaly"** to simulate an in-flight bearing vibration spike; observe immediate alarm status change and telemetry graph response.
3. **Explainable AI (XAI) Inspector:**
   - Review the root-cause decomposition panel displaying exact percentage contributions of vibration peak frequency and kurtosis.
4. **Autonomous AI Copilot Chat:**
   - Open the Copilot console (floating button or Chat tab).
   - Test a query in English: *"Which assets require immediate attention before tomorrow's mission?"*
   - Test a query in Hinglish: *"A-317 ka issue check karo aur high priority work order dispatch karo."*
   - Watch the Copilot autonomously commit a new Work Order to the database.
5. **Work Orders & Maintenance Planning:**
   - Navigate to **Maintenance Plan** to review dispatched work orders, assigned crews, due windows, and parts requirements.

---

## Troubleshooting

| Issue | Root Cause | Solution |
|---|---|---|
| `ModuleNotFoundError: No module named 'fastapi'` | Python dependencies not installed in current environment | Run `pip install -r requirements.txt` inside `src/backend`. |
| `WebSocket connection to 'ws://localhost:8000/api/ws/telemetry' failed` | Backend server is not running or running on a different port | Ensure `uvicorn main:app --reload --port 8000` is running in `src/backend`. |
| `Failed to load models: ai4i.pkl / bearing.pkl not found` | Working directory mismatch when starting backend | Start the backend from within `src/backend` (`cd src/backend && python main.py`). |
| `Groq API rate limit or authentication error (401/429)` | Invalid or missing `GROQ_API_KEY` in `.env` | The app automatically degrades gracefully to the local defense RAG engine. Alternatively, check your key in `src/backend/.env`. |
| `Port 8000 or 5173 already in use` | Another process is occupying the default port | Terminate the occupying process or run uvicorn with `--port 8001` and update Vite's API proxy or base URL. |
| Vite dev server shows CORS errors | FastAPI CORS middleware blocking origin | `main.py` is configured with `allow_origins=["*"]`. Ensure your request is hitting `http://localhost:8000`. |
