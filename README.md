# Trade Position Sizer

Position sizing and PnL calculator for Indian equities. Size from stop loss against a risk budget; target from a configurable reward:risk ratio (RRR).

## Prerequisites

- [Node.js](https://nodejs.org/) **18+** (LTS recommended)
- npm (comes with Node.js)

Check versions:

```bash
node -v
npm -v
```

## Setup

From the project folder:

```bash
cd position_pnl_calculator
npm install
```

## Run (development)

```bash
npm run dev
```

Open the URL Vite prints — usually [http://localhost:5173](http://localhost:5173).

## Build (production)

```bash
npm run build
```

Output goes to `dist/`. Preview the production build locally:

```bash
npm run preview
```

## Other scripts

| Command        | Description              |
|----------------|--------------------------|
| `npm run dev`  | Start Vite dev server    |
| `npm run build`| Typecheck + production build |
| `npm run preview` | Serve the `dist/` build |
| `npm run lint` | Run oxlint               |

## How to use

1. Enter **capital** (default ₹10,00,000) and either **risk %** or a **fixed ₹** risk.
2. Enter **entry** and **stop loss**.
   - SL below entry → **Long**
   - SL above entry → **Short**
3. Set **RRR** (e.g. `2` = 1:2). Target = entry ± (risk per share × RRR).
4. Quantity is `floor(risk budget ÷ |entry − SL|)` — whole shares only.

PnL is shown at stop and at target. Brokerage, STT, and taxes are not included.

## Stack

- React + TypeScript
- Vite
