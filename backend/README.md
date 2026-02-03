# SportsApp Backend

Express + Socket.io API with Prisma (Postgres).

## Requirements
- Node.js 18+
- Postgres running (local or Docker)

## Environment
Create `backend/.env`:
```
PORT=5000
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/sports_db
FOOTBALL_API_KEY=your_token
FRONTEND_URL=http://localhost:3000
```

## Install
```
npm install
```

## Prisma
Generate client:
```
npx prisma generate
```

Run migrations:
```
npx prisma migrate dev
```

## Run
```
npm start
```

## API
F1:
- `GET /api/f1/drivers` (championship standings)
- `GET /api/f1/teams`
- `GET /api/f1/positions/last`
- `GET /api/f1/rounds`
- `GET /api/f1/db/drivers`
- `GET /api/f1/db/sessions`

Football:
- `GET /api/football/live`
- `GET /api/football/upcoming`
- `GET /api/football/standings/:competitionId`
- `GET /api/football/db/matches`
- `GET /api/football/db/teams`

## Caching & Offline Behavior
- F1 standings and schedule are cached in Postgres for faster lookup.
- If OpenF1 is unreachable, the API falls back to Prisma data for drivers, teams, and rounds.
- Cached data is considered fresh for about:
  - 1 hour (standings)
  - 6 hours (schedule)

## WebSockets
- `f1-update`: emits live driver data
- `football-update`: emits live match data
