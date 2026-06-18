# TableTrack — Restaurant ERP (MERN)

A full-stack restaurant management system built with **MongoDB, Express, React, and Node.js**. It centralizes reservations, inventory, kitchen operations, billing, invoice downloads, staff management, dashboards, and reports.

This version separates the app into two experiences:

- **Customer Portal**: public guest-facing reservation page.
- **Staff Portal**: protected role-based dashboard for admin, manager, cashier, kitchen staff, and waiters.

---

## Modern redesign update

This package includes a complete 2026-style UI redesign while preserving the original ERP functionality. The staff app now includes a premium animated operations shell, command palette, persisted dark/light theme toggle, redesigned dashboard, modern public landing page, redesigned login, e-commerce-style menu catalogue search/filtering, and stronger API validation. See `REDESIGN_NOTES.md` for the full implementation summary.

## What's inside

```txt
restaurant-erp/
├── backend/      Node + Express + Mongoose + Socket.IO API
├── frontend/     React + Vite SPA
├── api/          Postman API collection
├── docs/         API tooling notes
└── package.json  Root terminal scripts for both apps
```

## Core modules

| Area | Included |
|---|---|
| Customer reservations | Public booking form with live name/phone validation, table selection, pending reservation creation |
| Staff auth | JWT login with admin, manager, cashier, kitchen and waiter roles |
| Reservation management | Booking calendar data, walk-ins, status tracking, **add/manage tables**, live table state sync |
| Inventory management | Ingredients, stock levels, low-stock alerts, **full supplier management** (add/remove) |
| Menu management | Admin/manager can **add, edit, delete and hide/show** menu items, each with a **recipe** of ingredients |
| Recipe & auto stock | Serving a dish **automatically deducts its ingredients** from inventory, per serving |
| Customer booking tracker | Guests track their reservation status by phone; **seated unlocks the menu** (view-only) |
| Kitchen operations | Real-time Socket.IO order queue and status updates |
| Billing & payments | Invoice generation, discounts, tax, payment tracking, invoice HTML download |
| Staff management | Employees, **add / edit / deactivate / remove**, role assignment, attendance tracking |
| Dashboard & reports | Daily sales, active reservations, inventory status, popular menu items, sales reports |
| Data validation | Server + client rules: no numbers in person names, 10-digit phones, no negative numbers |
| Tooling | Root dev command, lint scripts, Node tests, Postman collection |

---

## Data validation rules

These are enforced **both in the browser (instant feedback) and on the server (so no route can bypass them):**

- **Person names** (customer, staff, supplier contact) cannot contain numbers or symbols — only letters, spaces, hyphens and apostrophes.
- **Item names** (menu dishes, inventory, supplier business names) *do* allow numbers, since real names like "Coke 500ml" or "FreshFarm 24x7" need them.
- **Phone numbers** must be exactly **10 digits**. Spaces and hyphens are stripped automatically.
- **Emails** must be valid; staff passwords must be at least 6 characters.
- **Quantities, prices, thresholds and seats** cannot be negative.
- **Invoice discounts** cannot be negative or larger than the bill total; tax rate is clamped to 0–100%.

Invalid input returns a clean `400` with a readable message instead of a server error.

---

## Prerequisites

1. **Node.js 18+**
2. **MongoDB**, either local or MongoDB Atlas

---

## Setup

From the root folder:

```bash
npm install
npm run install:all
```

Create backend environment values:

```bash
cd backend
cp .env.example .env
```

Example local `.env`:

```env
MONGO_URI=mongodb://127.0.0.1:27017/restaurant_erp
JWT_SECRET=change_this_to_a_long_secret
CLIENT_URL=http://localhost:5173
PORT=5000
```

Seed the database:

```bash
cd ..
npm run seed
```

---

## Run frontend and backend together from one terminal

```bash
npm run dev
```

This starts:

- Backend API: `http://localhost:5000`
- Frontend app: `http://localhost:5173`

Vite proxies `/api` and `/socket.io` to the backend in development, so the frontend and backend connect automatically.

---

## App URLs

| Page | URL |
|---|---|
| Portal chooser | `http://localhost:5173/` |
| Customer booking page | `http://localhost:5173/customer` |
| Staff login page | `http://localhost:5173/staff-login` |
| Staff dashboard | `http://localhost:5173/staff-portal` |

---

## Demo staff logins

| Role | Email | Password |
|---|---|---|
| Admin | `admin@restaurant.com` | `admin123` |
| Manager | `manager@restaurant.com` | `manager123` |
| Cashier | `cashier@restaurant.com` | `cashier123` |
| Kitchen | `kitchen@restaurant.com` | `kitchen123` |
| Waiter | `waiter@restaurant.com` | `waiter123` |

---

## Invoice download

1. Log in as **Cashier**, **Manager**, or **Admin**.
2. Open **Staff Portal → Billing**.
3. Generate an invoice from a ready/served order.
4. The invoice downloads automatically as a printable `.html` invoice.
5. Existing invoices also have a **Download** button.

The downloaded invoice includes line items, tax, discount, payment method, total, and a **Print / Save as PDF** button.

---

## Testing and linting

```bash
npm run lint
npm run test
npm run build
```

Notes:

- Backend tests use Node's built-in test runner.
- Frontend utility tests use Node's built-in test runner.
- Frontend linting uses ESLint flat config.

---

## API tooling

Import this collection into Postman:

```txt
api/restaurant-erp.postman_collection.json
```

See `docs/API_TOOLING.md` for the recommended Postman environment variables.

---

## Real-time kitchen flow

1. Log in as **Waiter** → **Staff Portal → Orders** → place an order.
2. Log in as **Kitchen** in another browser/incognito → **Kitchen**.
3. The new order appears live.
4. Advance it through `preparing → ready → served`.
5. Log in as **Cashier** → **Billing** → generate and download the invoice.

---

## Customer booking tracker (status by phone)

1. A guest books on the **customer portal** with their 10-digit mobile number.
2. On the same page, the **Track your booking** card lets them enter that number and see a live status bar: **Requested → Confirmed → Seated → Completed** (it refreshes automatically).
3. Staff move the reservation forward from **Staff Portal → Reservations** (e.g. set it to `confirmed`, then `seated`).
4. Once the reservation is **seated**, the customer portal reveals the **full menu (view-only)**. Guests can browse it, but **orders are placed by staff only** — there is no ordering on the customer portal by design.

---

## Recipes & automatic inventory deduction

Each menu item can carry a **recipe**: a list of inventory ingredients and the amount used **per serving**.

1. In **Staff Portal → Orders → Manage menu**, add or edit a dish and list its ingredients (e.g. Paneer Tikka → 0.2 kg Paneer, 0.01 kg Garam Masala, 0.02 L Cooking Oil).
2. When that dish is **served** (from the kitchen) or **billed**, the system automatically subtracts `ingredient amount × quantity served` from inventory.
3. Stock is reduced **only once per order** and never goes below zero. An ingredient that is part of any recipe cannot be deleted until it is removed from those dishes.

The seed data ships with realistic recipes and ingredient stock so this works immediately after `npm run seed`.
