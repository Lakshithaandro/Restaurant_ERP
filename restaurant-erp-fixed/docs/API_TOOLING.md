# API Tooling

Use the Postman collection at `api/restaurant-erp.postman_collection.json`.

Recommended environment variables:

| Variable | Value |
|---|---|
| `baseUrl` | `http://localhost:5000/api` |
| `token` | JWT returned by `Auth - Staff login` |
| `invoiceId` | `_id` copied from `Billing - Invoices` |

Workflow:

1. Run the backend and frontend from the project root with `npm run dev`.
2. Send `Auth - Staff login` using one of the seeded staff accounts.
3. Copy the returned JWT into the `token` collection variable.
4. Use the protected dashboard, billing, order, staff, inventory and report APIs.
5. To test invoice export, copy an invoice `_id` into `invoiceId`, then send `Billing - Download invoice HTML`.
