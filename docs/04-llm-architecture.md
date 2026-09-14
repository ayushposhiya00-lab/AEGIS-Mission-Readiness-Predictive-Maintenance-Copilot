# LLM / Agent Architecture — Mission Readiness & Predictive Maintenance Copilot

## Core Idea
The LLM is **not** trained from scratch and does **not** predict readiness/RUL itself.
It sits on top of your ML models as an **orchestrator + explainer**:

```
User question
     │
     ▼
┌─────────────────────┐
│   LLM (Agent brain)  │  ← Bob's LLM / Claude / GPT
└─────────┬────────────┘
          │  decides which "tool" to call
          ▼
┌─────────────────────────────────────────────┐
│  Tools (your backend functions)               │
│  - get_asset_status(asset_id)                 │
│  - get_non_ready_assets(filter)               │
│  - predict_rul(asset_id)                      │
│  - get_service_history(asset_id)              │
│  - generate_maintenance_plan(asset_ids)       │
└─────────┬─────────────────────────────────────┘
          │ returns structured JSON
          ▼
┌─────────────────────┐
│   LLM (Agent brain)  │  ← formats JSON into human explanation
└─────────┬────────────┘
          │
          ▼
    Natural language answer + inline UI cards (table/chart)
```

## Why this pattern (function/tool calling) instead of fine-tuning
- Fine-tuning an LLM needs large labeled text data you don't have (explanations, plans) —
  not practical in hackathon time.
- Your actual predictive intelligence lives in the XGBoost/RandomForest models — those are
  what you train. The LLM's job is reasoning + language, not number-crunching.
- This is exactly the pattern Bob itself uses (agent + tools), so it fits the platform.

## Example Tool Definitions (conceptual, language-agnostic)
```json
{
  "name": "get_non_ready_assets",
  "description": "Returns all assets currently below the readiness threshold",
  "parameters": { "type": "object", "properties": { "mission_window_days": { "type": "integer" } } }
}
{
  "name": "predict_rul",
  "description": "Predicts remaining useful life (in days) for a given asset",
  "parameters": { "type": "object", "properties": { "asset_id": { "type": "string" } } }
}
{
  "name": "generate_maintenance_plan",
  "description": "Given a list of asset IDs, returns a prioritized maintenance task list",
  "parameters": { "type": "object", "properties": { "asset_ids": { "type": "array", "items": { "type": "string" } } } }
}
```

## Example Prompt Template (system prompt for the agent)
```
You are the Mission Readiness Copilot. You help military maintenance staff understand
which assets are not mission-ready, why, and what to do about it.

- Always ground your answers in the tool results provided — never invent sensor values,
  readiness scores, or timelines.
- When explaining a failure risk, reference the specific sensor(s) and trend that caused it.
- When recommending actions, prioritize by urgency (days-to-failure) and mission impact.
- Keep answers concise and operational — this is for maintenance crews, not executives.
```

## Explanation Generation Flow (per asset)
1. Backend computes: `readiness_score`, `predicted_RUL`, `contributing_sensors`, `last_service_dates`.
2. This structured JSON is passed to the LLM with a prompt like:
   > "Explain in 2-3 sentences why Asset {id} has a readiness score of {score}% and RUL of
   > {rul} days, based on this data: {json}. Then suggest a prioritized maintenance action."
3. LLM returns natural language — displayed directly in the Asset Detail screen and chat.

## Chat/Agent Behavior Rules
- If user asks a **fleet-wide** question ("which assets are at risk?") → call
  `get_non_ready_assets` → summarize as a ranked list.
- If user asks about **one asset** → call `predict_rul` + `get_service_history` →
  give a focused explanation.
- If user asks for **a plan** → call `generate_maintenance_plan` → return prioritized table.
- Always cite the underlying numbers (score, RUL, sensor name) — avoids the LLM sounding vague.

## What NOT to build (scope control for hackathon time)
- No need for a vector database / embeddings — data is small, structured, and fits directly
  in the prompt context.
- No need to fine-tune or train a custom LLM — use Bob's/host LLM as-is with tool-calling.
- No need for multi-agent frameworks (LangGraph/CrewAI) unless you have extra time —
  a single agent with 4-5 tools is enough for this challenge.
