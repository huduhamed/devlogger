# Devlogger (Multi‑Tenant SaaS Logging Platform)

![App's home page](/Frontend/public/home.png)

Devlogger is evolving from a personal logging dashboard into a multi‑tenant SaaS platform. Each new user automatically receives an Organization (tenant) and all logs are scoped by organization for strong data isolation. The stack is:

- Backend: Node.js / Express 5, Mongoose 8, JWT auth, Zod validation, role & org aware access
- Frontend: React (Vite), Context API, TailwindCSS, react-toastify
- Testing: Jest + Supertest + mongodb-memory-server (baseline tests in place)

## Features

- Authentication (JWT) with password hashing (bcrypt)
- Automatic Organization creation on sign-up for standalone users
- Email invitations that route invited users straight to sign-up
- Organization-scoped log storage (user + organization refs)
- Stripe subscription checkout for Pro and Enterprise plans
- Stripe customer portal for self-serve billing management
- Log levels: debug, info, warn, error
- Tagging & free-form metadata
- Pagination & filtering (level, tag, text search `q`)
- Secure headers (`helmet`) & basic rate limiting
- Centralized error handling & request validation (zod schemas)
- Frontend filtering + pagination UI

## API Highlights

Base URL: `http://localhost:5500/api/v1`

Auth:
POST `/auth/sign-up` → creates user + organization, or joins an invited organization when `inviteToken` is present
POST `/auth/sign-in`
POST `/auth/sign-out` (stateless acknowledgment)
GET `/auth/invitations/:token` → resolves invite details for the sign-up page

Billing:
GET `/billing/config`
POST `/billing/checkout`
POST `/billing/verify-session`
POST `/billing/portal`
POST `/billing/webhook`

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

## Stripe Billing

Devlogger uses Stripe Checkout for paid subscriptions and Stripe Billing Portal for managing an existing subscription.

### What the app expects

- Backend creates Stripe Checkout sessions for `pro` and `enterprise`
- Stripe webhooks update the organization billing state
- Successful checkout also verifies the session and syncs plan data back to MongoDB
- Organization plan changes update billing metadata and plan limits together

### Stripe dashboard setup

1. Turn on Stripe `Test mode`.
2. Create two products in Stripe:
   - `Devlogger Pro`
   - `Devlogger Enterprise`
3. Create one recurring monthly price for each product.
4. Copy the `price_...` IDs for those recurring prices.
5. Enable the Stripe Customer Portal if you want `Manage Billing` to work.

### Required backend env vars

Set these in `Backend/.env`.

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
PRODUCT_PRICE_PRO=price_...
PRODUCT_PRICE_ENTERPRISE=price_...
FRONTEND_URL=http://localhost:5173
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=Devlogger <onboarding@resend.dev>
PORT=5500
```

### Local webhook forwarding

The Stripe webhook endpoint is:

```text
http://localhost:5500/api/v1/billing/webhook
```

Run Stripe CLI in a separate terminal:

```bash
stripe listen --forward-to http://localhost:5500/api/v1/billing/webhook
```

Stripe CLI will print a webhook signing secret. Copy that `whsec_...` value into `STRIPE_WEBHOOK_SECRET` in `Backend/.env`.

### Stripe events used by the app

The billing flow handles these webhook events:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

### Billing behavior in this repo

- Stripe customer IDs are stored on the organization document
- Subscription status and current period end are stored under `organization.billing`
- Plan changes sync both:
  - `organization.plan`
  - `organization.limits`
- Billing portal returns users to `/organization`

## Multi-Tenancy Model

On sign-up:

- User created
- Organization created with slug (unique, slugified) and user set as `owner`
- User document updated with `organization` reference
- Membership invites now support email-first onboarding; org switching is still pending

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
