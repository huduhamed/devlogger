# DevLogger (Multi‑Tenant SaaS Logging Platform)

DevLogger is evolving from a personal logging dashboard into a multi‑tenant SaaS platform. Each new user automatically receives an Organization (tenant) and all logs are scoped by organization for strong data isolation. The stack is:

- Backend: Node.js / Express 5, Mongoose 8, JWT auth, Zod validation, role & org aware access
- Frontend: React (Vite), Context API, TailwindCSS, react-toastify
- Testing: Jest + Supertest + mongodb-memory-server (baseline tests in place)

## Features
* Authentication (JWT) with password hashing (bcrypt)
* Automatic Organization creation on sign-up (owner + member record)
* Organization-scoped log storage (user + organization refs)
* Log levels: debug, info, warn, error
* Tagging & free-form metadata
* Pagination & filtering (level, tag, text search `q`)
* Secure headers (`helmet`) & basic rate limiting
* Centralized error handling & request validation (zod schemas)
* Frontend filtering + pagination UI

## API Highlights
Base URL (default local): `http://localhost:5500/api/v1`

Auth:
POST `/auth/sign-up` → creates user + organization
POST `/auth/sign-in`
POST `/auth/sign-out` (stateless acknowledgment)

Logs:
GET `/logs` → scoped to caller's organization, supports query params:
  - `page` (default 1)
  - `limit` (default 20, max 100)
  - `level` (debug|info|warn|error)
  - `tag` (single exact tag)
  - `q` (case-insensitive partial match against title or description)
GET `/logs/:id`
POST `/logs`
PUT `/logs/:id`
DELETE `/logs/:id`

Response pagination structure:
```json
{
  "success": true,
  "data": [/* logs */],
  "pagination": { "page": 1, "limit": 20, "total": 42, "pages": 3 }
}
```

## Environment Setup
1. Copy `.env.example` → `.env` (backend root) and adjust values.
2. (Frontend) Create `Frontend/.env.local` with `VITE_API_URL=http://localhost:5500/api/v1/`.
3. Install dependencies:
	```bash
	cd Backend && npm install
	cd ../Frontend && npm install
	```
4. Run backend:
	```bash
	cd Backend
	npm run dev
	```
5. Run frontend:
	```bash
	cd Frontend
	npm run dev
	```

## Multi-Tenancy Model
On sign-up:
* User created
* Organization created with slug (unique, slugified) and user set as `owner`
* User document updated with `organization` reference
* Future: invites, membership roles beyond owner, org switching, billing plans

## Security & Hardening
* JWT bearer tokens only (stateless)
* Password hashing (bcrypt)
* Helmet for security headers
* Basic IP rate limiting (15m window)
* Central error serialization (avoids leaking stack traces in production)
* Input validation (zod) for auth + logs

## Roadmap (Planned Enhancements)
| Area | Next Steps |
|------|------------|
| Org Management | Invite members, accept tokens, role escalation (admin/member) |
| Billing | Usage metering (log count per month), plan enforcement, Stripe integration |
| Search | Compound indexes, optional text index for full-text search |
| Observability | Structured logging of API performance, metrics export |
| API Keys | Per-organization API keys for server-to-server log ingestion |
| UI | Organization switcher, log detail view, editing inline |
| Alerts | Threshold-based notifications (error spike, volume surge) |
| Export | CSV/JSON export & webhooks |

## Development Scripts
Backend tests:
```bash
cd Backend
npm test
```

## Contributing
Pull requests welcome. Please open an issue first for major changes. Add/extend tests where feasible (test debt will be addressed after feature build-out phase).

## License
ISC – Use freely with attribution.

---
This document will evolve as SaaS features are implemented.
