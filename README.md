# Cosmic AI — Backend API

Node.js/Express backend for the Cosmic AI Flutter app. Implements every endpoint from the API reference: auth, birth charts (Swiss Ephemeris), AI astrologer chat (Claude, streaming), horoscopes, calendar/transits, compatibility/synastry, journal, community, learn, billing (RevenueCat), and push notifications (FCM).

## Stack

- **Runtime**: Node.js 18+, Express 4
- **Database**: MongoDB + Mongoose
- **Astrology engine**: Swiss Ephemeris (`swisseph` npm package)
- **AI**: Anthropic Claude API (`@anthropic-ai/sdk`), streamed via Server-Sent Events
- **Auth**: JWT (access + refresh), Google/Apple social login, guest mode
- **Payments**: RevenueCat (webhook-driven entitlement sync)
- **Push**: Firebase Cloud Messaging
- **Scheduling**: `node-cron` for daily/weekly content generation and notification dispatch

## Project Structure

```
src/
├── server.js              # entry point -- connects DB, starts cron jobs, starts HTTP server
├── app.js                  # Express app: middleware, routes, error handling
├── config/                 # env loading, logger, DB connection
├── models/                 # Mongoose schemas
├── controllers/            # request handlers -- thin, delegate business logic to services
├── services/                # business logic, external API clients
│   └── ephemeris/           # Swiss Ephemeris wrapper + astrology math (charts, transits, synastry)
├── routes/                 # Express routers, one per feature module
├── middleware/              # auth, validation, error handling
├── validators/               # Joi schemas per feature module
├── jobs/                    # cron-scheduled background jobs
└── utils/                   # shared helpers + database seed script
```

This mirrors the 12 feature areas from the API reference doc: auth/profile, birth charts, horoscopes, calendar/transits, compatibility, AI chat, readings hub, journal, community, learn, billing, notifications.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in at minimum: `MONGODB_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `ANTHROPIC_API_KEY`. Everything else has a sane default or can be added later as you wire up that integration (Google/Apple login, RevenueCat, Firebase, Google Places).

### 3. Download Swiss Ephemeris data files

The `swisseph` npm package needs ephemeris data files to compute planetary positions -- they aren't bundled with the package.

```bash
mkdir -p ephe
# Download the standard ephemeris files (covers ~1800-2400 CE, sufficient for any living user)
curl -L -o ephe/seas_18.se1 https://www.astro.com/ftp/swisseph/ephe/seas_18.se1
curl -L -o ephe/sepl_18.se1 https://www.astro.com/ftp/swisseph/ephe/sepl_18.se1
curl -L -o ephe/semo_18.se1 https://www.astro.com/ftp/swisseph/ephe/semo_18.se1
```

Set `EPHE_PATH=./ephe` in `.env` (this is already the default).

### 4. Start MongoDB

Use a local instance, Docker, or MongoDB Atlas. Point `MONGODB_URI` at it.

```bash
# Example with Docker
docker run -d -p 27017:27017 --name cosmic-mongo mongo:7
```

### 5. Seed reference content

```bash
npm run seed
```

This populates the tarot deck, angel numbers, moon rituals, the Learn module's reference library (planets/signs/houses/aspects), sample courses, today's quiz question, and a few sample calendar events. Safe to re-run.

### 6. Run the server

```bash
npm run dev     # with nodemon, auto-restarts on file changes
# or
npm start       # plain node
```

Health check: `GET http://localhost:4000/health`
API base path: `http://localhost:4000/v1` (configurable via `API_BASE_PATH`)

## What's Stubbed / Needs Your Decision

A few things are intentionally left as clear extension points rather than guessed at, since they depend on infrastructure choices only you can make:

- **`charts/:chartId/share-image`** -- chart-to-image rendering isn't wired to a storage provider (S3, Cloudinary, etc.). The endpoint exists and is gated correctly, but returns a placeholder. Plug in your renderer + storage SDK.
- **Tarot deck seed data** -- Major Arcana (22 cards) is complete; Minor Arcana has a representative sample. Extend `src/utils/seedData/tarotCards.js` with the remaining 48 cards following the same shape.
- **Calendar events** -- the seed script inserts 3 sample events (full moon, retrograde, new moon) so the Calendar screen has something to show immediately. For production, replace this with a real generator that scans the Swiss Ephemeris output for actual moon-phase and retrograde-window dates (the `ephemeris/transitService.js` module already has the building blocks -- `calculateCurrentSky` and the retrograde flag on each planet).
- **Google Places API** -- referenced in `.env.example` but not yet called anywhere; wire it into a city-of-birth autocomplete endpoint if you want server-side validation instead of calling Places directly from Flutter.
- **RevenueCat `app_user_id` linkage** -- `billingService.js` expects `user.subscription.revenueCatAppUserId` to be set to match the RevenueCat SDK's app user ID. Set this field when a user first initializes the RevenueCat SDK client-side (typically their User `_id`).

## Key Design Decisions (in case you revisit them)

- **MongoDB over the original Supabase/Postgres assumption** -- all models use Mongoose; there's no SQL anywhere.
- **Self-hosted Swiss Ephemeris** -- no recurring per-request cost or external API dependency for chart math; the tradeoff is you own the ephemeris data files and the `swisseph` native binding.
- **AI quota enforcement is server-side and atomic** (`aiQuotaService.js` uses `findOneAndUpdate` with a count filter) -- a client can never bypass the 5-question/day free limit by manipulating local state.
- **Claude streaming uses SSE**, not WebSockets -- simpler to implement and sufficient for one-directional token streaming; the Flutter client should consume this with an SSE-aware HTTP client or a manual chunked-response reader.
- **`requirePro` is a real middleware gate**, not just a client-side flag check -- every premium route in the API reference doc enforces entitlement at the server, matching the "never trust the client" principle from the original spec.

## Testing

```bash
npm test
```

No test files are included yet -- `jest`, `supertest`, and `mongodb-memory-server` are already in `devDependencies` so you can start writing integration tests against an in-memory Mongo instance without needing a real database running.

## Note on Code Verification

Every file in this project was syntax-checked (`node --check`) and the full require/import graph was verified to resolve correctly (no broken paths or missing exports) using stubbed dependencies, since this sandbox's npm registry access blocks many packages (including very common ones like `bcryptjs`) outside of a small allowlist. Actually running `npm install` and booting the server against a real MongoDB instance still needs to happen in your own environment -- do that as your first step before relying on this code.
