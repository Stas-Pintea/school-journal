# School Journal

Monorepo with:
- `backend` (Express + MongoDB)
- `frontend` (React)

## Backend setup

1. Create `backend/.env`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/school-journal
CORS_ORIGIN=http://localhost:3000
JWT_ACCESS_SECRET=change_me_access
JWT_REFRESH_SECRET=change_me_refresh
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES_DAYS=7
NODE_ENV=development
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change_me
```
2. Install and run:
```bash
cd backend
npm install
npm run dev
```
3. Create admin:
```bash
npm run create-admin
```

## Frontend setup

1. Create `frontend/.env.local`:
```env
REACT_APP_API_URL=http://localhost:5000/api
```
2. Install and run:
```bash
cd frontend
npm install
npm start
```

## Pre-commit i18n check

To block broken i18n text before commit:

1. Activate repository hooks path:
```powershell
powershell -ExecutionPolicy Bypass -File scripts/setup-githooks.ps1
```
2. On each commit, hook runs:
```bash
npm --prefix frontend run check:i18n
```
