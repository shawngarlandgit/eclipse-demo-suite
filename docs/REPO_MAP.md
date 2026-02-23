# Repo Map

## App Boundaries

| App | Responsibility | Notes |
|---|---|---|
| `apps/patient-app` | Patient shopping, preferences, cart, order submit/tracking | Canonical Eclipse patient experience |
| `apps/driver-app` | Driver queue, route view, pickup/drop status updates | Styled to match patient app with driver differentiation |
| `apps/dispatch-standalone` | Dispatch operations and fleet-level visibility | Standalone dispatch flow |
| `apps/admin-dashboard` | Management/compliance dashboard and internal tools | Includes analytics and inventory pages |
| `apps/medcard-standalone` | Intake workflow orchestration for medcard + secure call | Creates sessions and share links |
| `apps/kiosk` | License capture and scan station | Camera + image upload + manual entry fallback |
| `apps/secure-call-web` | Provider/patient secure-call room UI | Receives encrypted draft payloads |
| `apps/secure-call-server` | Signaling/session service | Default port `8787` |

## Shared Layers

| Path | Purpose |
|---|---|
| `convex/` | Shared real-time backend schema/functions |
| `packages/config` | Shared config and branding surface |
| `packages/ui` | Shared UI package |

## Run Profiles

| Profile | Command | Includes |
|---|---|---|
| Core commerce | `npm run dev:core` | patient + driver + dispatch |
| Medcard identity | `npm run dev:medcard` | medcard + secure-call server/web + kiosk |
| Full workspace | `npm run dev` | all workspace apps with `dev` script |

## Documentation Assets

Screenshots are stored under:
- `docs/screenshots/`

Current screenshots included:
- `docs/screenshots/admin-dashboard.png`
- `docs/screenshots/admin-inventory.png`
- `docs/screenshots/admin-analytics.png`
- `docs/screenshots/admin-questionnaire.png`
