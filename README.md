# Cheqzo

Desktop web app for renovation progress, money, and approvals. The spec is `docs/CHEQZO_BUILD_GUIDE.md`.

## Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The layout is desktop-first: design at 1440px, and it stays usable down to 1280px.

## Demo login

1. Enter any 10-digit mobile number that starts with 6, 7, 8, or 9.
2. Enter the OTP `123456`.
3. Choose a role. Homeowner opens Ananya Rao's projects. Designer opens Rohan Mehta's studio portfolio.

Seeded projects are Koramangala Apartment, Whitefield Villa, and Indiranagar Penthouse.

## Reset demo data

Settings → Demo tools → **Reset demo data**. That restores the original story and reloads the page. The signed-in user stays.

Adding `?reset=1` to any URL does the same thing, then removes the query.

## Checks

```bash
npm run lint
npm run test
npm run build
```

The shared-component gallery at `/dev/components` is off unless `CHEQZO_DEV_COMPONENTS=1`.
