# BantayAni Mobile

Mobile app for government field officers, built with Expo, React Native, and TypeScript.

## What's here

- Sign in against the same backend and JWT auth as the web dashboard
- Bottom tab navigation with a Dashboard tab and a Live Map tab
- Dashboard with live stats (active incidents, critical count, potential and verified damage) and a severity sorted list of detections
- Live Map: a WebView running Leaflet with OpenStreetMap tiles, the same approach as the web app, so no Google Maps or Mapbox API key is needed. Severity colored markers, tap one to open that farm's inspection screen
- Farm inspection screen with the same verify, reject, and field validation actions as the web app, gated by the same role rules (a viewer account cannot act here either)

## What's not here yet

- No offline support or background sync. Every screen requires a live connection to the backend right now
- No photo evidence capture for field validation
- The map has no clustering or farm boundary polygons yet, unlike the web app's map, it is markers only for now

## Running it

You do not need a physical phone to try this. The fastest way to see it running is in a desktop browser:

```
cd apps/mobile
npm install
cp .env.example .env
npm run web
```

To test on an actual device, install the Expo Go app from your phone's app store, then run `npm start` and scan the QR code it prints. Your phone and your development machine need to be on the same network for this to work.

## Connecting to the backend

Edit `.env` and set `EXPO_PUBLIC_API_BASE_URL`. If you are testing in a desktop browser via `npm run web`, `http://localhost:8000/api` works as long as the backend is running locally. If you are testing on a physical phone or the Android emulator, `localhost` refers to the phone itself, not your computer, use your machine's LAN IP address instead, for example `http://192.168.1.42:8000/api`.

The same demo accounts from the web app's backend work here (see the root `README.md`).
