# DevLogger (Multi‑Tenant SaaS Logging Platform)

![App's home page](/Frontend/public/home.png)

DevLogger is evolving from a personal logging dashboard into a multi‑tenant SaaS platform. Each new user automatically receives an Organization (tenant) and all logs are scoped by organization for strong data isolation. The stack is:

- Backend: Node.js / Express 5, Mongoose 8, JWT auth, Zod validation, role & org aware access
- Frontend: React (Vite), Context API, TailwindCSS, react-toastify
- Testing: Jest + Supertest + mongodb-memory-server (baseline tests in place)

## Features

- Authentication (JWT) with password hashing (bcrypt)
- Automatic Organization creation on sign-up (owner + member record)
- Organization-scoped log storage (user + organization refs)
- Log levels: debug, info, warn, error
- Tagging & free-form metadata
- Pagination & filtering (level, tag, text search `q`)
- Secure headers (`helmet`) & basic rate limiting
- Centralized error handling & request validation (zod schemas)
- Frontend filtering + pagination UI

## API Highlights

Base URL: `http://localhost:5500/api/v1`

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

## Environment Setup

1. Copy `.env.example` → `.env` (backend root) and adjust values.
2. Create `Frontend/.env.local` with `VITE_API_URL=http://localhost:5500/api/v1/`.
3. Install dependencies:
   ```bash
   cd backend && npm install
   cd frontend && npm install
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

   ### Stripe Billing Setup

   To enable plan checkout and the billing portal:
   1. Create products and prices in Stripe (Dashboard → Products). Copy the monthly price IDs for Pro and Enterprise.
   2. Set backend env vars (see `Backend/.env.example`):
      - `STRIPE_SECRET_KEY`
      - `STRIPE_WEBHOOK_SECRET` (from Stripe CLI or Dashboard webhook endpoint)
      - `PRODUCT_PRICE_PRO`
      - `PRODUCT_PRICE_ENTERPRISE`
      - `FRONTEND_URL` (e.g., `http://localhost:5173` for dev)
   3. Start backend and frontend.
   4. In a separate terminal, run Stripe CLI to forward webhooks:

   ```bash
   stripe listen --forward-to localhost:5500/api/v1/billing/webhook
   ```

   5. Visit `/pricing` in the app, click a paid plan, and complete checkout. You’ll return to `/organization` and should see your plan and billing status update.

## Multi-Tenancy Model

On sign-up:

- User created
- Organization created with slug (unique, slugified) and user set as `owner`
- User document updated with `organization` reference
- Todo: invites, membership roles beyond owner, org switching, billing plans

## Security

- JWT bearer tokens only (stateless)
- Password hashing (bcrypt)
- Helmet for security headers
- Basic IP rate limiting (15m window)
- Central error serialization (avoids leaking stack traces in production)
- Input validation (zod) for auth + logs

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
