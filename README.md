# Monitrax

A self-hosted cloud infrastructure monitoring platform that tracks real-time CPU, RAM, and disk metrics via REST and WebSocket.

## Folder overview

| Folder | Purpose |
|---|---|
| `frontend/` | React + Vite dashboard UI |
| `backend/` | Node.js + Express API server with WebSocket streaming |
| `infra/` | Infrastructure-as-code (empty — Phase 2+) |
| `docs/` | API documentation and Postman collection |

## How to run

### Backend

```bash
cd backend
npm install
cp .env.example .env      # then fill in values
npm run dev               # starts on http://localhost:4000
```

### Frontend

```bash
cd frontend
npm install
npm run dev               # starts on http://localhost:5173
```

### Quick WebSocket test (no frontend needed)

Open `http://localhost:4000/ws-test` in your browser after the backend is running.
