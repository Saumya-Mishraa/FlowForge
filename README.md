# FlowForge

A developer platform for testing REST APIs and visually designing multi-step
API workflows — request chaining, variable passing, conditional branching,
and real execution with full logs and step-by-step debugging.

Pink + white, professional SaaS design. **No fake data, no mocked
responses, no buttons that do nothing.** Every number on the dashboard and
analytics pages comes from a real MongoDB query; every "Run" and "Send"
makes a real HTTP call. Where something genuinely isn't implemented (OAuth 2
token acquisition, public doc sharing, per-hop redirect re-validation), the
UI or this README says so explicitly rather than faking it — see
[Known limitations](#11-known-limitations) for the full, honest list.

## 1. Features

- **Authentication** — email/password (JWT, bcrypt) and Google OAuth
  (bring your own credentials — [setup below](#7-google-oauth-setup)),
  forgot/reset password, protected routes, persistent login.
- **Projects** — the top-level container everything else lives under.
- **API Tester** — full method support, query params, headers, four auth
  modes (Bearer/Basic/API Key are fully implemented; OAuth 2 is UI-only —
  see limitations), JSON (Monaco editor)/raw/urlencoded/form-data bodies,
  and a **Send** that actually executes the request server-side.
- **Response Viewer** — status/time/size, Body/Headers/Raw/Preview tabs,
  copy, in-response search.
- **Collections** — folders, save/duplicate/rename/delete, save a request
  straight from the API Tester.
- **Environments** — per-project variable sets, one active at a time,
  `{{VARIABLE}}` resolution everywhere a request can use it.
- **Request History** — every executed request logged with a full
  request/response snapshot; re-run and delete both hit the real backend.
- **Visual Workflow Designer** (React Flow) — nine node types (Start, API
  Request, Variable, Extract Variable, Condition, Transform, Delay, Log,
  End), drag/connect/delete, zoom/pan/minimap/fit-view, a node
  configuration panel per type.
- **Workflow execution engine** — a real interpreter (`server/src/workflow-engine/`)
  that walks the node graph, makes real HTTP calls for API Request nodes,
  evaluates Condition nodes with a small safe expression language
  (`statusCode == 200`, `response.user.active == true`, `userId exists`,
  etc.), branches on TRUE/FALSE, and passes data between nodes via
  workflow variables — this is the part of the brief that makes FlowForge
  more than a Postman clone, and it's genuinely implemented, not stubbed.
- **API chaining** — Login → Extract Token → an authenticated request all
  actually works: the extracted value is substituted into the next
  request's `{{authToken}}` the same way any environment variable would
  be. Covered end-to-end by `tests/engine.test.js`.
- **Execution Logs** — every run (and every stopped debug session) is
  recorded with per-node status, timing, request/response, and output.
- **Debug Mode** — a genuine paused, resumable execution, not a replay of
  an already-finished run. The server holds execution state in memory
  between `/debug/start`, `/debug/:sessionId/step`, and
  `/debug/:sessionId/stop` calls; clicking **Stop** really does prevent
  any further node from executing. See limitations for what this doesn't
  cover (no persistence across a server restart).
- **Workflow validation** — checked before every run and via an explicit
  **Validate** button: missing Start/End, broken edges, unconfigured
  nodes, Condition nodes missing a branch, and circular graphs are all
  caught with a specific error message, not a generic failure.
- **Workflow Templates** — Authentication Flow, CRUD Flow, and User
  Verification all build real, valid node graphs (verified by
  `tests/templates.test.js`), not just descriptive text.
- **OpenAPI/Swagger import** — paste or upload a JSON or YAML spec, preview
  the parsed endpoints, pick which ones to import, and they land as real
  saved requests in a collection. Supports a documented subset — see
  limitations for exactly what's covered.
- **Analytics** — success rate, average response time, requests-over-time,
  most-used endpoints, and workflow execution outcomes, all from real
  MongoDB aggregations (`server/src/controllers/analyticsController.js`).
- **Documentation view** — a clean, read-only rendering of a saved
  request's method/endpoint/description/params/headers/body. Public
  sharing isn't built (see limitations), but the view itself is real.
- **Command palette** (Ctrl/Cmd+K) — jump to any major section from
  anywhere in the app.
- Working light/dark theme, toasts, empty states, loading skeletons,
  confirmation dialogs throughout.

## 2. Tech stack

**Frontend:** React 18, Vite, Tailwind CSS, React Router, React Flow,
Monaco Editor, Recharts, Axios, Lucide icons.

**Backend:** Node.js, Express, MongoDB/Mongoose, JWT, bcryptjs, Passport
(Google OAuth), js-yaml (OpenAPI YAML parsing).

## 3. Architecture

```
Client (React/Vite)  ──HTTP/JSON──▶  Server (Express)  ──Mongoose──▶  MongoDB
     │                                     │
     ├─ AuthContext / ProjectContext       ├─ controllers/  (request handling)
     ├─ api/ (axios client + refresh)      ├─ services/     (auth, env resolution,
     ├─ components/workflow/ (React Flow)  │                 request execution)
     └─ pages/                             ├─ workflow-engine/ (the interpreter:
                                            │   engine, nodeExecutors, validate,
                                            │   conditionEvaluator, debugSessionService,
                                            │   templates)
                                            ├─ openapi/ (spec parser)
                                            ├─ models/
                                            └─ middleware/ (auth, errors, rate limits)
```

**Auth:** short-lived access token + longer-lived refresh token. An axios
response interceptor catches a single 401, refreshes once (single-flight —
concurrent 401s share one refresh call), and retries.

**Workflow execution:** `workflow-engine/engine.js` (full "Run") and
`workflow-engine/debugSessionService.js` (step-by-step "Debug") both drive
the exact same `nodeExecutors.executeNode()` and `getNextNode()` functions,
so a workflow behaves identically whether you run it straight through or
step through it — there's no separate "debug" code path that could drift
from what actually runs in production.

## 4. Folder structure

```
flowforge/
├── client/src/
│   ├── api/            # axios instance + per-resource calls
│   ├── components/
│   │   ├── ui/          apitester/     workflow/       layout/
│   │   ├── auth/        projects/
│   ├── context/         # AuthContext, ProjectContext, ToastContext
│   ├── layouts/         # AppLayout, AuthLayout
│   └── pages/            Landing, auth/, dashboard/ (Dashboard, Projects,
│                          ApiTester, Collections, Environments, History,
│                          Workflows, WorkflowEditor, Analytics, ...)
└── server/
    ├── src/
    │   ├── config/            env, db, passport
    │   ├── controllers/       auth, user, project, dashboard, collection,
    │   │                      request, environment, history, workflow,
    │   │                      debug, execution, analytics, openapi
    │   ├── middleware/        auth, error handling, rate limiting, validation
    │   ├── models/            User, Project, Collection, ApiRequest,
    │   │                      Environment, RequestHistory, Workflow, Execution
    │   ├── routes/
    │   ├── services/          authService, environmentService,
    │   │                      requestExecutorService
    │   ├── workflow-engine/   engine, nodeExecutors, validate,
    │   │                      conditionEvaluator, debugSessionService,
    │   │                      templates, pathUtils
    │   ├── openapi/           parser
    │   └── utils/             ApiError, tokens, urlSafety (SSRF), validators
    └── tests/                 87 Jest tests — see section 9
```

## 5. Installation

Requires Node.js 18+ and a MongoDB instance (local or Atlas).

```bash
# Backend
cd server
npm install
cp .env.example .env    # then edit — see section 6

# Frontend
cd ../client
npm install
cp .env.example .env    # defaults to http://localhost:5000/api
```

## 6. Environment variables

### `server/.env`

| Variable | Required | Notes |
|---|---|---|
| `MONGODB_URI` | Yes | Local (`mongodb://127.0.0.1:27017/flowforge`) or Atlas connection string |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | Yes | Generate with `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `JWT_EXPIRES_IN` / `JWT_REFRESH_EXPIRES_IN` | No | Default `7d` / `30d` |
| `CLIENT_URL` | Yes | For CORS + OAuth redirects, e.g. `http://localhost:5173` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_CALLBACK_URL` | No | Leave blank to disable Google sign-in |
| `EXECUTOR_BLOCK_PRIVATE_NETWORKS` | No | Default `true` — SSRF protection, see section 10 |
| `EXECUTOR_TIMEOUT_MS` | No | Default `15000` |
| `EXECUTOR_MAX_RESPONSE_BYTES` | No | Default `5000000` |

### `client/.env`

| Variable | Required | Notes |
|---|---|---|
| `VITE_API_URL` | Yes | Backend base URL, e.g. `http://localhost:5000/api` |

Never commit a real `.env` — only `.env.example` is checked in.

## 7. Google OAuth setup

I did not invent or embed any credentials — create your own:

1. [Google Cloud Console](https://console.cloud.google.com/) → create/select
   a project.
2. **APIs & Services → OAuth consent screen** — configure it (External is
   fine for testing); add your email as a test user if unpublished.
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID**
   → Application type **Web application**.
4. Authorized redirect URI: `http://localhost:5000/api/auth/google/callback`
   (must exactly match `GOOGLE_CALLBACK_URL`).
5. Put the Client ID/Secret into `server/.env`, restart the server.

Without these, email/password auth works fully and the Google button stays
visibly disabled with an explanatory tooltip — it never pretends to work
(`GET /api/auth/google/status` is what the frontend checks).

## 8. Local development

```bash
# Terminal 1
cd server && npm run dev     # http://localhost:5000

# Terminal 2
cd client && npm run dev     # http://localhost:5173
```

No root-level combined dev script exists in this build — see limitations.

## 9. Testing

```bash
cd server
npm test
```

87 Jest tests, all passing as of this build, covering:
- SSRF protection and the redirect guard (`urlSafety.test.js`, `redirectGuard.test.js`)
- Environment variable resolution (`environmentService.test.js`)
- Request-config building — params/headers/auth/body (`requestExecutorService.test.js`)
- Auth validation and access control (`auth.test.js`)
- The condition expression language (`conditionEvaluator.test.js`)
- Dot-path resolution (`pathUtils.test.js`)
- Workflow graph validation, including cycle detection (`workflowValidate.test.js`)
- **The full workflow engine end-to-end**, with a mocked HTTP layer —
  chaining a login → extract token → authenticated request, TRUE/FALSE
  branching, a failing API node stopping the workflow, and more
  (`engine.test.js`)
- Every starter template actually passes its own validation (`templates.test.js`)
- The OpenAPI parser against a real sample spec (`openapiParser.test.js`)

What isn't tested: anything requiring a live MongoDB connection or a real
outbound HTTP call to a public API — this sandbox had neither (see
limitations). CRUD controller logic is covered by code review, not
execution, so please run through registration → project → request →
workflow once against your own MongoDB before relying on it.

There is no frontend automated test suite in this build.

## 10. Security notes

- Passwords hashed with bcrypt (cost 12); never logged or stored in plaintext.
- Short-lived JWT access tokens, longer-lived refresh tokens exchanged only
  via `/auth/refresh`.
- `helmet`, CORS locked to `CLIENT_URL`, general + auth + executor rate
  limiters (`middleware/rateLimiter.js`).
- Password reset tokens are emailed as a raw value but stored only as a
  SHA-256 hash with a 1-hour expiry.
- **SSRF protection** on the request executor (`utils/urlSafety.js`,
  `services/requestExecutorService.js`), on by default:
  - Blocks private/reserved IPv4 ranges (RFC1918, loopback, link-local —
    including the `169.254.169.254` cloud metadata address — CGNAT,
    multicast, reserved) and the IPv6 equivalents.
  - Blocks `localhost` and any `*.local` hostname.
  - Resolves other hostnames via DNS and checks every returned address.
  - Rejects non-`http(s)` protocols.
  - **Documented limitation:** the redirect guard (`beforeRedirect`) is
    synchronous, so it can only catch a redirect whose target is an IP
    literal or `localhost`/`.local` — it cannot re-run the async DNS
    lookup per hop. A malicious server could still redirect to a hostname
    that resolves to a private IP without being caught. Pinned exactly by
    `tests/redirectGuard.test.js`.
  - Request timeout and response-size cap are enforced
    (`EXECUTOR_TIMEOUT_MS`, `EXECUTOR_MAX_RESPONSE_BYTES`).
- The workflow engine reuses the same executor, so the same SSRF
  protections apply to API Request nodes inside a workflow.
- Debug sessions live in server memory only (`workflow-engine/debugSessionService.js`),
  expire after 15 minutes, and are strictly owner-checked — but they will
  not survive a server restart and won't work correctly behind a
  load-balanced multi-instance deployment without sticky sessions.

## 11. Known limitations

Called out here (and in-app, where relevant) rather than hidden:

- **Verified without live infrastructure.** This was built in a sandbox
  with no reachable MongoDB and no general internet access (only an
  npm/package-registry allowlist). That means: DB-backed CRUD is verified
  by code review, not live execution; a real outbound HTTP call
  (`executeRequest`'s success path against, say, `https://httpbin.org/get`)
  has not actually been made — the request-building and error-handling
  logic around it is unit-tested with mocks, but test it against a real
  API once you have this running with real infrastructure.
- **OAuth 2 auth type** in the API Tester and workflow API Request nodes is
  UI/schema only — no token-acquisition flow runs behind it. The UI says
  so explicitly rather than pretending. Use Bearer Token with a manually
  obtained access token instead.
- **Debug Mode sessions** are in-memory, not persisted — see Security notes.
- **Redirect SSRF guard** only catches IP-literal/localhost redirect
  targets synchronously, not hostname-based ones that resolve to private
  IPs — see Security notes.
- **OpenAPI import** supports a documented subset: paths, methods,
  query/header parameters, and JSON request bodies with a best-effort
  example generated from the schema. Path parameters (`{id}`) are left
  inline rather than auto-converted to `{{id}}`; security schemes,
  `oneOf`/`anyOf`/`allOf` schemas, and external `$ref`s are not handled.
- **Public documentation sharing** (an unauthenticated `/docs/:id` page) is
  not built — the Documentation view exists but is only visible to the
  request's owner, as the view itself states.
- **No undo/redo** in the workflow designer (the brief marks this
  "if practical" — it wasn't, given everything else in scope).
- **No root-level script** to run both frontend and backend together —
  run the two `npm run dev` commands separately.
- **No frontend automated tests.**
- The production client bundle is a single ~890KB (263KB gzipped) chunk —
  Monaco and React Flow are both sizeable libraries. Code-splitting them
  behind `React.lazy` (only loading Monaco when the API Tester or a
  workflow's API Request panel is open, React Flow only on the workflow
  editor route) would meaningfully cut initial load time; not done here.

## 12. Production deployment

- **Frontend → Vercel:** project root `client/`, build command
  `npm run build`, output directory `dist`, set `VITE_API_URL` to your
  deployed backend's URL.
- **Backend → Render (or any Node host):** project root `server/`, start
  command `npm start`, set every variable from `server/.env.example` in
  the platform's environment settings, update `GOOGLE_CALLBACK_URL` and
  `CLIENT_URL` to production URLs.
- **Database → MongoDB Atlas:** allow your deployment platform's outbound
  IPs (or `0.0.0.0/0` for a simple portfolio deployment) in Atlas's
  network access settings.
- If you run more than one backend instance behind a load balancer,
  Debug Mode sessions will misbehave without sticky sessions (see
  limitations) — fine for a single-instance deployment.

## 13. API reference

All routes are prefixed with `/api`; `Bearer` means `Authorization: Bearer <token>` is required.

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` \| `/auth/login` \| `/auth/refresh` | – | Auth |
| GET | `/auth/me` | Bearer | Current user |
| POST | `/auth/forgot-password` \| `/auth/reset-password` | – | Password reset |
| GET | `/auth/google` \| `/auth/google/callback` \| `/auth/google/status` | – | Google OAuth |
| GET / PATCH | `/users/me` | Bearer | Profile |
| POST | `/users/me/change-password` | Bearer | Change password |
| GET / POST / PATCH / DELETE | `/projects[/:id]` | Bearer | Project CRUD |
| GET | `/dashboard/summary` | Bearer | Real aggregated stats |
| GET / POST / PATCH / DELETE | `/collections[/:id]` | Bearer | Collections + folders |
| GET / POST / PATCH / DELETE | `/requests[/:id]` | Bearer | Saved requests |
| POST | `/requests/execute` | Bearer | **Real HTTP execution** + history |
| GET / POST / PATCH / DELETE | `/environments[/:id]` | Bearer | Environments |
| POST | `/environments/:id/activate` | Bearer | Set active environment |
| GET / DELETE | `/history[/:id]` | Bearer | Request history |
| POST | `/history/:id/rerun` | Bearer | Re-execute a past request |
| GET / POST / PATCH / DELETE | `/workflows[/:id]` | Bearer | Workflow CRUD |
| GET | `/workflows/templates` | Bearer | Starter templates |
| GET | `/workflows/:id/validate` | Bearer | Validate without running |
| POST | `/workflows/:id/run` | Bearer | **Full real execution** |
| POST | `/workflows/:id/debug/start` \| `/debug/:sessionId/step` \| `/debug/:sessionId/stop` | Bearer | Step-by-step debug |
| GET | `/executions[/:id]` | Bearer | Execution logs |
| GET | `/analytics?project=` | Bearer | Real aggregated analytics |
| POST | `/openapi/parse` | Bearer | Preview an OpenAPI/Swagger spec |
| POST | `/openapi/import` | Bearer | Import selected endpoints as requests |
| GET | `/health` | – | Liveness check |

Responses follow `{ success, data }` or `{ success: false, message, details? }`.

## 14. Future improvements

Real-time execution progress over WebSockets/SSE instead of the current
synchronous run + step model; team/workspace sharing and permissions;
public documentation sharing; a transactional email provider so password
reset doesn't rely on the dev-mode direct link; OAuth 2 token acquisition;
code-splitting Monaco/React Flow; a frontend test suite; persisting Debug
Mode sessions somewhere shared (Redis) instead of in-process memory.
