# Eclipse Patient App

Patient-facing ordering app for the Eclipse demo stack.

## Purpose

This app is the customer experience layer for:
- menu browsing
- product filtering and preferences
- cart and checkout
- order submission and status updates

## Local Run

```bash
npm install
npm run dev
```

Default URL:
- `http://localhost:3000/`

## Environment

Required in `.env.local`:
- `VITE_CONVEX_URL`

Optional:
- `VITE_CLERK_PUBLISHABLE_KEY`

## Repo Scope (Important)

This repository path contains only the patient app code.

Apps included here:
- Patient App only

Apps not in this folder (monorepo root has them):
- Driver App
- Dispatch App
- Secure Call Web
- Secure Call Server
- Medcard App
- Scanner Kiosk

## Full Demo Ecosystem (Monorepo)

The complete demo stack lives in:
- `https://github.com/shawngarlandgit/eclipse-demo-suite`

| App | Role | Monorepo Path |
|---|---|---|
| Patient App | Menu, preferences, cart, checkout, order tracking | `apps/patient-app` |
| Driver App | Driver queue, route flow, delivery status updates | `apps/driver-app` |
| Dispatch App | Dispatch board and assignment workflow | `apps/dispatch-standalone` |
| Secure Call Web | Provider/patient secure session UI | `apps/secure-call-web` |
| Secure Call Server | Session/signaling backend for secure call | `apps/secure-call-server` |
| Medcard App | Intake + handoff orchestration for secure call | `apps/medcard-standalone` |
| Scanner Kiosk | ID scan/upload/manual entry capture flow | `apps/kiosk` |

## Screenshots

### Eclipse Patient Branding

![Patient Brand Asset](docs/screenshots/patient-brand.webp)

### Patient App Screens (To Add)

Add patient-only captures to:
- `docs/screenshots/patient-home.png`
- `docs/screenshots/patient-menu.png`
- `docs/screenshots/patient-checkout.png`
