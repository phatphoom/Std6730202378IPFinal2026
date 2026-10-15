# HR Management Frontend

Expo Router frontend for the HR Management API contract in `../backend/docs/hr-management.md`.

## Run locally

1. Copy `.env.example` to `.env` and set `EXPO_PUBLIC_API_BASE_URL` to the backend address.
2. Install packages: `npm.cmd install`
3. Start Expo: `npx.cmd expo start`

For Android Emulator, use `http://10.0.2.2:3000`; for a physical device, use the backend machine's LAN IP address.

## Structure

- `src/app`: Expo Router routes and tab navigation only
- `src/features`: screen-specific UI for dashboard, attendance, leave, employees, and profile
- `src/services`: shared API client and HR endpoint calls
- `src/context`: authentication session state
- `src/components/hr`: reusable HR screen/card/status components
- `src/types`: API and HR domain types

The dashboard and sample records are UI examples until the Express backend endpoints are implemented. Login and API service calls are ready to use the documented API paths.
