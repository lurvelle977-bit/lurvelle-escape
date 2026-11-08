This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Booking backend

Customers send a **booking request** (`/book`). It is stored as `PENDING`, never as a confirmed booking. The team reviews it in `/admin`, quotes it, takes manual payment and confirms it.

### Setup

1. Create a PostgreSQL database and copy `.env.example` to `.env.local`. Set `DATABASE_URL` and a random `SESSION_SECRET` (32+ characters).
2. `npm run db:migrate` applies `db/migrations/*.sql` (additive; safe to re-run).
3. Create the first admin: `ADMIN_EMAIL=you@example.com ADMIN_NAME="Your Name" ADMIN_PASSWORD='12+ character passphrase' npm run admin:create`, then sign in at `/admin/login`.
4. In `/admin/resources` add your vehicles and drivers. Availability checks and the confirm step use them.
5. Optional: configure email (Resend) and WhatsApp. Without them, notifications are recorded as `SKIPPED` in `notification_log` and shown on the booking, never as sent.

### Lifecycle

`PENDING → UNDER_REVIEW → (ALTERNATIVE_PROPOSED →) QUOTED → QUOTE_ACCEPTED → PAYMENT_PENDING → PAYMENT_RECEIVED → CONFIRMED → SCHEDULED → COMPLETED`.
A declined quotation goes `QUOTE_REJECTED → CANCELLED`. Any open booking can be `CANCELLED`. The transition table lives in `src/server/domain/status.ts`; clients cannot set arbitrary statuses.

### API

| Endpoint | Who | Purpose |
| --- | --- | --- |
| `POST /api/bookings` | public | Create a request (validated, idempotent via `idempotencyKey`, rate limited) |
| `GET /api/bookings` | admin | List with `status`, `type`, `q` (reference/name/email), `page`, `pageSize` |
| `GET /api/bookings/[id]` | admin, or customer with `?t=<token>` | Full detail, or the customer's private view (`[id]` is the reference or uuid) |
| `PATCH /api/bookings/[id]` | admin, or customer with `token` | Edit details. Customers: pickup, passengers, notes, only before quoting starts |
| `PATCH /api/bookings/[id]/status` | admin | Start review, cancel, complete |
| `GET/POST /api/bookings/[id]/assignment` | admin | Free vehicles/drivers for the date; assign (double bookings → 409) |
| `POST /api/bookings/[id]/alternative` | admin | Suggest another date, vehicle or destination |
| `GET/POST /api/bookings/[id]/quotation` | admin | List versions; create or revise a quotation |
| `POST /api/bookings/[id]/quotation/respond` | customer (`token`) | Accept or decline; the amount comes from the stored quotation |
| `POST /api/bookings/[id]/payment` | admin | `SEND_INSTRUCTIONS`, or `RECORD_RECEIVED` (needs `verified: true`) |
| `POST /api/bookings/[id]/confirm` | admin | Confirm a paid booking → `SCHEDULED` (needs vehicle + driver) |
| `POST /api/admin/login`, `/logout`, `GET/POST /api/admin/vehicles`, `/drivers` | admin | Session and fleet register |

Responses are `{ ok: true, data }` or `{ ok: false, error: { code, message, details? } }`.

Customers have no accounts. Each booking has a private link (`/booking/<reference>?t=<token>`) emailed to them; the token is an HMAC of the reference with `SESSION_SECRET`, so changing that secret invalidates all links.

### Code layout

`src/server/` holds everything server-side: `db/` (pool, transactions), `repositories/` (SQL), `services/` (business rules), `validation/` (zod), `notifications/` (email, WhatsApp, templates), `auth/`, `domain/`, `http/`. Route handlers in `src/app/api` stay thin.

### WhatsApp templates

Business-initiated WhatsApp messages need templates approved in Meta Business Manager. Create them with these body parameters, then set the `WHATSAPP_TEMPLATE_*` names:

- `NEW_BOOKING` (to the admin number): `{{1}}` reference, `{{2}}` type, `{{3}}` destination, `{{4}}` travel date, `{{5}}` customer name
- `QUOTATION`: `{{1}}` reference, `{{2}}` total with currency, `{{3}}` link
- `PAYMENT`: `{{1}}` reference, `{{2}}` amount due, `{{3}}` payment instructions
- `CONFIRMED`: `{{1}}` reference, `{{2}}` travel date, `{{3}}` pickup

### Tests

`npm run test:flow` runs an end-to-end check of the whole lifecycle against a running app and a **development** database (see the header of `scripts/test-booking-flow.mjs`).
