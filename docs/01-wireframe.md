# Wireframe — Mission Readiness & Predictive Maintenance Copilot

## Screen 1: Main Dashboard (Landing)
```
┌─────────────────────────────────────────────────────────────┐
│  🛡  Mission Readiness Copilot            [🔔] [⚙] [👤 User] │
├─────────────────────────────────────────────────────────────┤
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐      │
│  │ Total Assets   │ │ Mission-Ready  │ │ Non-Ready      │      │
│  │     248        │ │     212 🟢     │ │     36 🔴      │      │
│  └───────────────┘ └───────────────┘ └───────────────┘      │
│                                                               │
│  Asset Readiness Overview                                    │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  [Bar/Heatmap chart: readiness by asset type]           │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  ⚠ Critical Attention Needed                                 │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 🔴 Vehicle #V-102  — Hydraulic pressure drop — 4 days   │  │
│  │ 🔴 Aircraft #A-317 — Bearing wear high     — 7 days     │  │
│  │ 🟡 Engine  #E-045  — Sensor drift detected — 12 days    │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  [ 💬 Ask Copilot ]  (floating chat button, bottom-right)     │
└─────────────────────────────────────────────────────────────┘
```

## Screen 2: Asset List / Fleet View
```
┌─────────────────────────────────────────────────────────────┐
│  Assets   [Search 🔍]   [Filter: Type ▾] [Filter: Status ▾]  │
├─────────────────────────────────────────────────────────────┤
│  ID     | Type     | Readiness | Predicted Failure | Action  │
│  V-102  | Vehicle  | 🔴 32%    | 4 days             | [View] │
│  A-317  | Aircraft | 🔴 41%    | 7 days             | [View] │
│  E-045  | Engine   | 🟡 68%    | 12 days            | [View] │
│  V-089  | Vehicle  | 🟢 95%    | 60+ days           | [View] │
│  ...                                                          │
└─────────────────────────────────────────────────────────────┘
```

## Screen 3: Asset Detail View
```
┌─────────────────────────────────────────────────────────────┐
│  ← Back        Asset: Aircraft A-317          🔴 Non-Ready   │
├─────────────────────────────────────────────────────────────┤
│  Readiness Score: 41%        Predicted RUL: 7 days           │
│                                                               │
│  Sensor Trend (last 30 days)                                 │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  [Line chart: vibration / temperature / pressure]        │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  Root Cause Explanation (from Copilot)                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ "Bearing vibration levels have risen 34% over the last  │  │
│  │  two weeks, matching prior failure patterns in similar  │  │
│  │  units. Combined with overdue lubrication service..."   │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  Service History        Recommended Maintenance Plan          │
│  - 12 Jun: Lubrication   1. Replace bearing (Priority: High)  │
│  - 02 May: Inspection    2. Recalibrate sensor (Medium)       │
│                          3. Schedule test flight (Low)        │
│                                                               │
│  [ 💬 Ask about this asset ]                                  │
└─────────────────────────────────────────────────────────────┘
```

## Screen 4: Copilot Chat Panel (side drawer or full page)
```
┌─────────────────────────────────────────────────────────────┐
│  💬 Copilot Chat                                    [✕]      │
├─────────────────────────────────────────────────────────────┤
│  You: "Which assets won't be ready for next week's mission?" │
│                                                               │
│  Copilot: "3 assets are at risk: A-317 (bearing wear,        │
│  7-day RUL), V-102 (hydraulic drop), E-045 (sensor drift).   │
│  Here's a prioritized plan..." [table/cards inline]           │
│                                                               │
│  [Type your question...............................] [Send] │
└─────────────────────────────────────────────────────────────┘
```

## Screen 5: Maintenance Plan / Scheduling View
```
┌─────────────────────────────────────────────────────────────┐
│  Prioritized Maintenance Plan          [Export] [Send to ERP]│
├─────────────────────────────────────────────────────────────┤
│  Priority | Asset  | Task                | Due     | Owner   │
│  🔴 High  | A-317  | Replace bearing      | 2 days  | Team A  │
│  🔴 High  | V-102  | Hydraulic seal fix   | 1 day   | Team B  │
│  🟡 Medium| E-045  | Sensor recalibration | 5 days  | Team C  │
└─────────────────────────────────────────────────────────────┘
```

## Design Notes
- Mobile/tablet responsive not critical for hackathon demo — desktop-first is fine.
- Color coding: 🟢 Ready (>80%), 🟡 Watch (50-80%), 🔴 Non-Ready (<50%).
- Chat is persistent (floating button) across all screens — this is the "Copilot" core UX.
- Charts can be built with Recharts/Chart.js on frontend.
