# Steadier Ground

A frontend prototype for an accountability app: sign up, invite a trusted
partner, and get flagged when something crosses an agreed-upon line.

## What's here
- `src/pages/Landing.jsx` — marketing/intro page
- `src/pages/Signup.jsx` — 3-step signup: account -> invite partner -> consent
- `src/pages/Dashboard.jsx` — the user's own view (streak, status, activity)
- `src/pages/PartnerView.jsx` — the partner's flagged-moment screen, with
  delete-on-review behavior
- `src/components/BeaconHero.jsx` — the lighthouse/beacon signature visual
- `src/styles/tokens.css` — the design system (colors, type, radii)

## Run it
    npm install
    npm run dev

## What this prototype does NOT yet do
This is the frontend shell only — no real accounts, no real detection, no
real image transmission. To become a working product you'd still need:

1. Backend — auth, partner-pairing records, and a queue that holds a
   flagged image only until the partner marks it reviewed, then deletes it
   for real (not just in UI state, as it does here).
2. Detection — a browser extension (start here; it's realistic) running
   an on-device NSFW image classifier (e.g. NSFW.js) as pages load, plus a
   heartbeat ping so the partner gets notified if the extension is disabled
   or removed.
3. Encryption in transit and at rest for the brief window the image
   exists on the server before deletion.
4. Legal review before launch — an app that stores and forwards
   explicit imagery, even briefly and even one-way, needs a privacy policy,
   data-retention policy, and terms of service that spell this out clearly,
   and likely won't be approvable on the Apple App Store or Google Play in
   this form (web-only distribution may be the realistic path).

Recommend building the browser extension next, since it's the piece that
makes the rest of this real.
