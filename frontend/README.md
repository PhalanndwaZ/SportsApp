# SportsApp Frontend

React client for live F1 + football dashboards.

## Requirements
- Node.js 18+
- Backend running on `http://localhost:5000`

## Setup
```
npm install
```

## Run
```
npm start
```

## Notes
- The app expects these backend endpoints:
  - `GET /api/f1/drivers`
  - `GET /api/f1/teams`
  - `GET /api/f1/positions/last`
  - `GET /api/f1/rounds`
  - `GET /api/football/live`
  - `GET /api/football/upcoming`
  - `GET /api/football/standings/:competitionId`
- F1 background video source:
  - `https://www.youtube.com/watch?v=1b-qCz6glP8`
- Icons: Freepik / Flaticon (F1 icons).
