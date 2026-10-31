# Aegis Pulse — disaster response platform

Real-time disaster coordination: hazard mapping, SOS triage, responder dispatch, safe-route
navigation, missing-person registry and offline mesh relay.

Next.js 14 (App Router) frontend · Express + Socket.IO backend · MongoDB (Mongoose).

## Repository layout

```
backend/                 self-contained Node package — owns its own node_modules
  server.js              bootstrap: express app, socket.io, listen
  src/
    models/              mongoose schemas + connection + seed data
    controllers/         request handlers
    routes/api.js        route table
    middleware/          auth (JWT/RBAC), upload (multer)
    sockets/             socket.io event handlers
    services/            auto-dispatch, routing, mesh simulation
    ai/                  damage classifier, prediction engine, priority scorer
    utils/               geo math, SMS compression
frontend/                self-contained Next.js package
  src/
    app/                 routes (App Router), globals.css, icon
    components/          ui primitives, shell, feature views
    context/             emergency / socket / audio providers
    types/               shared TS types
  DESIGN.md              the design system this UI is built from
```

### Why it was restructured

The previous layout put `database/`, `ai/`, `services/` and `utils/` at the repository root while
`backend/` had its own `node_modules`. Node resolves packages by walking **up from the importing
file**, so `backend/server.js` importing `../database/index.js` could never see
`backend/node_modules` — it died on `ERR_MODULE_NOT_FOUND: Cannot find package 'mongoose'` from a
clean clone. The only thing that ever made it work in production was the root `package.json`
accidentally listing the backend's dependencies too.

The frontend carried a second copy of the same folders (`src/database`, `src/ai`, `src/services`)
containing Mongoose schemas — server-only code inside a Next.js bundle.

After the restructure each package is closed over its own dependencies, the duplicate trees are
gone, and the root `package.json` is scripts only.

## Running locally

```bash
npm run install-all          # root + backend + frontend

cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

npm run dev                  # backend :5001, frontend :3000
```

### Backend environment

| variable | purpose |
|---|---|
| `PORT` | defaults to 5001 |
| `MONGO_URI` / `MONGODB_URI` | Atlas connection string. **Leave empty for local dev** — the server falls back to an embedded in-memory MongoDB and seeds demo data. First run downloads a ~509 MB `mongod` binary, cached afterwards. |
| `JWT_SECRET` | sign tokens; generate with `openssl rand -base64 32` |
| `CLIENT_ORIGIN` | comma-separated allowed origins |

### Frontend environment

`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SERVER_URL`, `NEXT_PUBLIC_SOCKET_URL` — all point at the
backend. Default `http://localhost:5001`.

> **Security note:** `NEXT_PUBLIC_*` values are compiled into the client bundle and are readable by
> anyone. Do not put a Gemini/OpenAI key in one. AI calls belong behind a backend endpoint.

## API surface

`/health` · `/api/auth/*` · `/api/incidents` · `/api/sos` · `/api/responders` · `/api/shelters`
· `/api/missing` · `/api/chat` · `/api/tasks` · `/api/ai/damage-analysis` · `/api/routing/calculate`
· `/api/prediction/forecast` · `/api/mesh/simulate` · `/api/alert/broadcast` · `/api/upload/*`

## Design system

The UI is built from the design analysis in [`frontend/DESIGN.md`](frontend/DESIGN.md)
(Linear): near-black canvas `#010102`, four-step surface ladder, hairline borders
`#23252a`, a **single** chromatic accent (lavender `#5e6ad2`) reserved for the brand mark, primary
actions and focus rings.

Adaptation for this product: **severity colours are functional, not decorative.** Red / amber /
green appear only as status dots, status text and capacity bars — never as panel fills, gradients
or glows. Every token lives in `frontend/src/app/globals.css` and `frontend/tailwind.config.js`;
no component hardcodes a hex value.

Linear's display and text faces are proprietary, so `--font-display` / `--font-text` fall back to
SF Pro / Segoe UI / Inter as the DESIGN.md fallback stack specifies.

Brand analyses courtesy of [VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md)
(analyses of public sites, not official brand kits, no endorsement implied).

## Verification

```bash
npm run build --prefix frontend      # must be clean
cd backend && node server.js         # /health returns 200
```

Browser check (overflow, contrast, console errors) with the design skill's harness:

```bash
node verify_artifact.js http://localhost:3000/ ./preview 1440x960 390x844
```
