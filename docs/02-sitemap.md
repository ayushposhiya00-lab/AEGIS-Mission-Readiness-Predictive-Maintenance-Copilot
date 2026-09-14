# Sitemap — Mission Readiness & Predictive Maintenance Copilot

```
Root ( / )
│
├── /dashboard                     → Main overview (readiness stats, critical alerts)
│     └── floating chat widget (available on every page)
│
├── /assets                        → Fleet/Asset list view
│     ├── /assets?type=aircraft    → Filtered by asset type
│     ├── /assets?status=non-ready → Filtered by readiness status
│     └── /assets/:assetId         → Asset Detail page
│           ├── sensor trend section
│           ├── root-cause explanation (Copilot-generated)
│           ├── service history timeline
│           └── recommended maintenance actions
│
├── /chat                          → Full-page Copilot chat (same agent as widget)
│     └── /chat?asset=:assetId     → Chat pre-scoped to one asset's context
│
├── /maintenance-plan               → Prioritized maintenance plan across all assets
│     ├── export (PDF/CSV)
│     └── send-to-erp (optional integration stub)
│
├── /upload                         → Ingest new sensor data / service records (CSV/JSON upload)
│
├── /settings                       → Thresholds config (what counts as "non-ready"),
│                                      data source connections, user preferences
│
└── /login (if auth needed)         → Simple auth gate for demo
```

## Navigation Flow (User Journey)
1. User lands on **/dashboard** → sees overview + critical alerts.
2. Clicks a flagged asset → **/assets/:assetId** → sees explanation + plan.
3. Opens chat (widget or **/chat**) → asks follow-up questions in natural language.
4. Reviews consolidated **/maintenance-plan** → exports or shares.
5. (Optional) Uploads new sensor/service data via **/upload** to refresh predictions.

## Notes
- For a hackathon MVP, `/settings`, `/upload`, and `/login` can be minimal or mocked —
  focus judging impact on `/dashboard`, `/assets/:assetId`, and `/chat`.
- Chat is the core differentiator — make sure it's reachable from every page (persistent widget).
