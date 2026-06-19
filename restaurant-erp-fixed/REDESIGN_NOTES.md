# TableTrack Modern ERP Redesign Notes

## Design direction

The redesign keeps TableTrack as a restaurant ERP, but gives it a premium modern commerce/dashboard feel inspired by current Framer-style template patterns: confident typography, animated gradients, glass panels, scroll reveals, hover micro-interactions, live-status chips, ecommerce-style catalogue cards, and cinematic dark-mode surfaces.

## Preserved functionality

- Customer reservation portal
- Staff authentication and role-based routing
- Dashboard metrics
- Reservation and table management
- Order placement and menu management
- Kitchen Socket.IO live order queue
- Inventory and supplier management
- Billing, invoice creation and HTML invoice download
- Staff management
- Attendance self-service and admin attendance
- Reports and revenue chart

## Added / improved features

- Modern responsive shell with redesigned sidebar/topbar
- Command palette with `Ctrl/Cmd + K` module search
- Staff theme toggle with persisted dark/light preference
- Live clock in staff header
- Animated ambient background, scroll reveals, hover effects and reduced-motion support
- Redesigned landing page with premium ERP/e-commerce positioning
- Redesigned staff login with role-focused marketing panel
- Redesigned dashboard hero and quick action shortcuts
- Ecommerce-style order menu catalogue with search and category filters
- Stronger frontend auth cleanup when token expires
- Better mobile navigation behavior

## Bug fixes / hardening

- Fixed lint-blocking unescaped apostrophes in `Attendance.jsx`
- Fixed stale authenticated UI after 401 token expiry by dispatching an auth logout event
- Added backend validation to reject invalid or negative order quantities
- Added backend check to prevent ordering hidden/unavailable menu items through direct API calls
- Added backend validation for billing payment method
- Improved reservation update logic to normalize phone numbers and free previous tables when a reservation changes tables
- Reservation deletion now frees the assigned table

## Verification run

Executed successfully from the project root:

```bash
npm run lint
npm run build
npm test
```

Build output confirms the frontend compiles with Vite and all existing backend/frontend tests pass.
