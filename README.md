# SportsApp

Full-stack sports dashboard (F1 + Football) with live updates, caching, and offline-friendly reads.

## Structure
- `frontend/` React client
- `backend/` Express + Prisma API
- `database/` Database utilities
- `docker/` Docker assets

## Quick Start
1) Backend
```
cd backend
npm install
cp .env.example .env  # if you have it, otherwise create manually
npx prisma generate
npx prisma migrate dev
npm start
```

2) Frontend
```
cd frontend
npm install
npm start
```

Open `http://localhost:3000`.

## Notes
- Backend API runs on `http://localhost:5000`.
- Prisma caches F1 standings/schedule for fast local reads and offline fallback.

See `backend/README.md` and `frontend/README.md` for full details.
