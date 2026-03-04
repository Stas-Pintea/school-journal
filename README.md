# School Journal

Monorepo with:
- `backend` (Express + MongoDB)
- `frontend` (React)

## Backend setup

1. Create `backend/.env`:
```env
PORT=5000
HOST=0.0.0.0
CORS_ORIGIN=http://localhost:3000

MONGO_URI=mongodb://127.0.0.1:27017/school_journal

JWT_ACCESS_SECRET=change_me_access_secret
JWT_REFRESH_SECRET=change_me_refresh_secret
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES_DAYS=7

ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change_me_admin_password

DEPUTY_ADMIN_USERNAME=deputy_admin
DEPUTY_ADMIN_EMAIL=deputy_admin@example.com
DEPUTY_ADMIN_PASSWORD=change_me_deputy_password

TEACHER_DEFAULT_PASSWORD=change_me_teacher_password
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

## На Windows

Node.js LTS (локально)

1. Откройте PowerShell от обычного пользователя.
2. Установите через winget:
```
winget install OpenJS.NodeJS.LTS
```

MongoDB Community Server (локально)
1. Установите через winget:
```
winget install MongoDB.Server
```
2. Обычно ставится как Windows Service (MongoDB), проверьте:
```
Get-Service MongoDB
```
3. Если сервис не запущен:
```
Start-Service MongoDB
```
