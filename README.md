# ⚡ FlowForge

### Design. Chain. Execute. Debug.

**A visual API workflow builder and REST API testing platform.**

FlowForge brings API testing and multi-step workflow automation into one workspace. Test REST APIs, chain requests, pass variables between steps, create conditional branches, and debug executions with detailed logs — all through a clean visual interface.

<p align="center">

**React · Node.js · Express · MongoDB · React Flow**

</p>

---

## ✨ What Makes FlowForge Different?

Most API testing tools focus on individual requests. FlowForge takes things further with a visual workflow engine that lets developers connect multiple API operations and execute them as a single flow.

- 🔗 **Request Chaining** — Pass extracted values, such as authentication tokens, between API requests.
- 🧩 **Visual Workflow Builder** — Design multi-step API workflows using an interactive drag-and-drop canvas.
- ⚙️ **Real API Execution** — Send requests to actual endpoints and inspect real responses.
- 🐛 **Step-by-Step Debugging** — Pause, inspect, resume, and stop workflow execution.
- 📊 **Execution Analytics** — Track request performance and workflow outcomes using MongoDB aggregations.

> Pink and white SaaS-inspired interface with a focus on usability, functionality, and transparency. No fabricated analytics, mocked API responses, or non-functional controls.

---

## 🚀 Features

### 01. Authentication & Projects
- Email/password authentication using JWT and bcrypt.
- Google OAuth integration (requires your own credentials).
- Forgot and reset password functionality.
- Protected routes and persistent login.
- Project-based organization.

### 02. API Testing Workspace
- Support for GET, POST, PUT, PATCH, DELETE and other HTTP methods.
- Query parameters, headers and request configuration.
- Bearer Token, Basic Auth and API Key authentication.
- JSON, raw, URL-encoded and form-data request bodies.
- Monaco-powered JSON editor.
- Real server-side HTTP request execution.

### 03. Response Inspection
- HTTP status code, response time and response size.
- Body, Headers, Raw and Preview tabs.
- Response search and copy functionality.
- Detailed request and response inspection.

### 04. Collections & Environments
- Create, organize, rename, duplicate and delete collections.
- Organize requests using folders.
- Save requests directly from the API Tester.
- Create multiple project environments.
- Resolve dynamic variables using `{{VARIABLE}}`.
- Switch between active environments.

### 05. Visual Workflow Designer

Build API automation flows through an interactive React Flow canvas.

**Nine supported node types:**

| Node | Purpose |
|---|---|
| Start | Entry point of a workflow |
| API Request | Execute an HTTP request |
| Variable | Define workflow variables |
| Extract Variable | Extract values from responses |
| Condition | Create TRUE/FALSE branches |
| Transform | Transform workflow data |
| Delay | Add execution delays |
| Log | Record execution information |
| End | Finish workflow execution |

Additional canvas features:
- Drag, connect and delete nodes.
- Zoom, pan and fit-to-view.
- Minimap navigation.
- Node-specific configuration panels.
- Workflow validation before execution.

### 06. Workflow Execution Engine

FlowForge includes a dedicated workflow interpreter rather than simply displaying connected nodes.

- Executes API Request nodes using real HTTP calls.
- Evaluates conditional expressions.
- Supports TRUE/FALSE branching.
- Passes data between workflow nodes.
- Extracts authentication tokens and reuses them in subsequent requests.
- Records execution output and per-node status.

**Example workflow:**

`Login API → Extract Token → Authenticated API Request`

The extracted token can be passed into the next request using `{{authToken}}`.

### 07. Debug Mode & Execution Logs

- Start a workflow in debug mode.
- Pause execution between nodes.
- Inspect individual node outputs.
- Resume execution one step at a time.
- Stop execution to prevent subsequent nodes from running.
- Review request/response details and execution timing.

Debugging uses the same node execution logic as normal workflow runs.

### 08. Analytics Dashboard
- API success rate.
- Average response time.
- Requests over time.
- Most-used endpoints.
- Workflow execution outcomes.

All dashboard and analytics metrics are calculated using MongoDB queries and aggregations.

### 09. Additional Capabilities
- OpenAPI/Swagger JSON and YAML import.
- Preview and selectively import API endpoints.
- Saved request documentation view.
- Workflow starter templates:
  - Authentication Flow
  - CRUD Flow
  - User Verification
- Command palette (`Ctrl/Cmd + K`).
- Light and dark themes.
- Toast notifications, loading skeletons and empty states.
- Confirmation dialogs.

---

## 🛠️ Tech Stack

| Category | Technologies |
|---|---|
| Frontend | React 18, Vite |
| Styling | Tailwind CSS |
| Routing | React Router |
| Workflow Canvas | React Flow |
| Code Editor | Monaco Editor |
| Charts | Recharts |
| HTTP Client | Axios |
| Icons | Lucide |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Authentication | JWT, bcryptjs, Passport |
| API Specification | js-yaml |

---

## 🏗️ Architecture

```text
             FLOWFORGE ARCHITECTURE

       ┌──────────────────────────┐
       │     React + Vite         │
       │                          │
       │  Dashboard & API Tester  │
       │  Workflow Designer       │
       │  Analytics & Collections │
       └────────────┬─────────────┘
                    │
                 HTTP/JSON
                    │
       ┌────────────▼─────────────┐
       │      Express Server      │
       │                          │
       │  Authentication          │
       │  Controllers & Services  │
       │  Request Executor        │
       │  Workflow Engine         │
       │  OpenAPI Parser           │
       └────────────┬─────────────┘
                    │
                 Mongoose
                    │
       ┌────────────▼─────────────┐
       │        MongoDB            │
       │                          │
       │ Users, Projects           │
       │ Collections & Requests   │
       │ Environments & History   │
       │ Workflows & Executions   │
       └──────────────────────────┘
```

### Authentication Architecture

- Short-lived JWT access tokens.
- Longer-lived refresh tokens.
- Axios response interceptor for automatic token refresh.
- Single-flight refresh handling for concurrent unauthorized requests.

### Workflow Architecture

Both normal execution and debug execution use the same underlying node execution functions:

- `engine.js`
- `nodeExecutors.js`
- `debugSessionService.js`
- `conditionEvaluator.js`
- `validate.js`

This keeps workflow behavior consistent across execution modes.

---

## 📂 Project Structure

```text
flowforge/
│
├── client/
│   └── src/
│       ├── api/
│       ├── components/
│       │   ├── ui/
│       │   ├── apitester/
│       │   ├── workflow/
│       │   ├── layout/
│       │   ├── auth/
│       │   └── projects/
│       ├── context/
│       ├── layouts/
│       └── pages/
│
└── server/
    ├── src/
    │   ├── config/
    │   ├── controllers/
    │   ├── middleware/
    │   ├── models/
    │   ├── routes/
    │   ├── services/
    │   ├── workflow-engine/
    │   ├── openapi/
    │   └── utils/
    │
    └── tests/
```

---

## 💻 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local installation or MongoDB Atlas)
- npm

### 1. Clone the repository

```bash
git clone <YOUR_REPOSITORY_URL>
cd flowforge
```

### 2. Configure the backend

```bash
cd server
npm install
cp .env.example .env
```

Configure the environment variables in `server/.env`.

### 3. Configure the frontend

```bash
cd ../client
npm install
cp .env.example .env
```

Set the frontend API URL:

```env
VITE_API_URL=http://localhost:5000/api
```

### 4. Configure the backend environment

```env
MONGODB_URI=mongodb://127.0.0.1:27017/flowforge

JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret

CLIENT_URL=http://localhost:5173

EXECUTOR_BLOCK_PRIVATE_NETWORKS=true
EXECUTOR_TIMEOUT_MS=15000
EXECUTOR_MAX_RESPONSE_BYTES=5000000
```

Google OAuth variables are optional. See the Google OAuth setup section below.

### 5. Run the application

**Terminal 1 — Backend**

```bash
cd server
npm run dev
```

**Terminal 2 — Frontend**

```bash
cd client
npm run dev
```

Frontend: `http://localhost:5173`

Backend: `http://localhost:5000`

---

## 🔐 Google OAuth Setup

Google sign-in requires your own OAuth credentials.

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select a project.
3. Configure the OAuth consent screen.
4. Create an OAuth Client ID for a Web Application.
5. Add the authorized redirect URI:

```text
http://localhost:5000/api/auth/google/callback
```

6. Add your credentials to `server/.env`:

```env
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
```

Without credentials, Google sign-in remains visibly disabled. Email/password authentication is available independently.

---

## 🧪 Testing

FlowForge includes **87 Jest backend tests**, covering:

- Authentication and access control.
- SSRF protection and redirect guard.
- Request configuration and execution setup.
- Environment variable resolution.
- Conditional expression evaluation.
- Workflow graph validation and cycle detection.
- Workflow execution and API chaining.
- TRUE/FALSE conditional branching.
- Starter workflow templates.
- OpenAPI specification parsing.

Run the test suite:

```bash
cd server
npm test
```

<sub>All 87 tests passed in the reported build. Live MongoDB CRUD and real outbound HTTP execution still require integration testing against actual infrastructure. The frontend does not currently have an automated test suite.</sub>

---

## 🛡️ Security

Security is an important part of FlowForge's request execution architecture.

- Password hashing with bcrypt (cost factor 12).
- JWT-based authentication and refresh tokens.
- Helmet security headers.
- CORS configuration.
- Authentication, general and executor rate limiting.
- Hashed password-reset tokens with expiration.
- Request timeout and response-size restrictions.
- SSRF protection against private and reserved network addresses.
- DNS resolution checks before outbound requests.
- HTTP/HTTPS protocol restrictions.

**Note:** Redirect validation has a documented limitation for hostname-based redirects resolving to private IP addresses. See Known Limitations.

---

## ⚠️ Known Limitations

FlowForge is built with transparency in mind. Features that are incomplete are documented rather than presented as fully functional.

| Feature | Current Status |
|---|---|
| OAuth 2 token acquisition | UI/schema only |
| Debug session persistence | In-memory only |
| Public documentation sharing | Not implemented |
| Workflow undo/redo | Not implemented |
| Frontend automated tests | Not available |
| Root-level combined dev script | Not available |
| Redirect DNS re-validation | Limited |
| OpenAPI import | Supports a documented subset |
| Live MongoDB integration tests | Not performed in the build environment |
| Real outbound API integration tests | Not performed in the build environment |

Additional details:

- OAuth 2 authentication does not acquire tokens automatically. Bearer Token authentication with a manually obtained token is supported.
- Debug sessions expire after 15 minutes and do not survive server restarts.
- Public documentation sharing is not available; saved request documentation is owner-only.
- OpenAPI import currently supports paths, methods, query/header parameters and JSON request bodies with limitations around references and complex schemas.
- The redirect guard does not perform asynchronous DNS re-validation on every redirect hop.
- The frontend production bundle is approximately 890 KB (263 KB gzipped). Code splitting Monaco and React Flow is a potential improvement.

---

## 🌐 Production Deployment

| Component | Recommended Platform |
|---|---|
| Frontend | Vercel |
| Backend | Render |
| Database | MongoDB Atlas |

**Frontend**
- Root directory: `client/`
- Build command: `npm run build`
- Output directory: `dist`
- Configure `VITE_API_URL` with your deployed backend URL.

**Backend**
- Root directory: `server/`
- Start command: `npm start`
- Configure production environment variables.
- Update CORS and Google OAuth callback URLs.

**Database**
- Configure MongoDB Atlas connectivity and network access for your backend host.

---

## 🔌 API Reference

All routes use the `/api` prefix.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Register |
| POST | `/auth/login` | Login |
| POST | `/auth/refresh` | Refresh token |
| GET | `/auth/me` | Current user |
| POST | `/auth/forgot-password` | Forgot password |
| POST | `/auth/reset-password` | Reset password |
| GET / PATCH | `/users/me` | User profile |
| POST | `/users/me/change-password` | Change password |
| GET / POST / PATCH / DELETE | `/projects` | Project management |
| GET | `/dashboard/summary` | Dashboard metrics |
| GET / POST / PATCH / DELETE | `/collections` | Collection management |
| GET / POST / PATCH / DELETE | `/requests` | Saved requests |
| POST | `/requests/execute` | Execute API request |
| GET / POST / PATCH / DELETE | `/environments` | Environment management |
| GET / DELETE | `/history` | Request history |
| POST | `/history/:id/rerun` | Re-run request |
| GET / POST / PATCH / DELETE | `/workflows` | Workflow management |
| GET | `/workflows/templates` | Workflow templates |
| GET | `/workflows/:id/validate` | Validate workflow |
| POST | `/workflows/:id/run` | Execute workflow |
| POST | `/workflows/:id/debug/start` | Start debugging |
| POST | `/debug/:sessionId/step` | Execute next step |
| POST | `/debug/:sessionId/stop` | Stop debugging |
| GET | `/executions` | Execution logs |
| GET | `/analytics` | Analytics data |
| POST | `/openapi/parse` | Parse API specification |
| POST | `/openapi/import` | Import endpoints |
| GET | `/health` | Health check |

---

## 🔮 Future Improvements

Planned areas for further development:

- Real-time execution updates using WebSockets or SSE.
- Team workspaces and collaboration.
- Public API documentation sharing.
- Automated OAuth 2 token acquisition.
- Persistent debug sessions using Redis.
- Frontend automated testing.
- Code splitting for faster initial loading.
- Improved OpenAPI schema and reference support.

---

## 💡 Project Highlights

| Area | Implementation |
|---|---|
| API Execution | Server-side HTTP execution |
| Workflow Automation | Custom graph interpreter |
| Request Chaining | Variable extraction and substitution |
| Debugging | Paused and resumable execution |
| Analytics | MongoDB aggregations |
| Security | JWT, bcrypt and SSRF protection |
| Testing | 87 backend Jest tests |

---

<p align="center">

### Built to make API development more visual, connected, and transparent.

**FLOWFORGE ⚡**

*Design workflows. Execute requests. Debug with confidence.*

</p>
