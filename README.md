# EduMatch

EduMatch is a full-stack platform where students create projects, find teammates, send applications, receive notifications and communicate in realtime project chats.

## Stack

- Frontend: Next.js, TypeScript, Tailwind CSS
- Backend: Go, Gin, GORM
- Database: PostgreSQL
- Sessions/cache: Redis
- Auth: JWT access token + rotating refresh token
- Realtime: WebSocket

## Project Structure

```text
backend/
  cmd/                 API entrypoint
  internal/config      env, PostgreSQL, Redis, migrations
  internal/domain      errors and repository contracts
  internal/entities    GORM entities
  internal/repositories
  internal/services
  internal/handlers
  internal/middleware
  internal/routes
  internal/ws
frontend/
  app                  Next.js App Router pages
  components           layout, forms, UI, chat, projects
  hooks
  services
  lib
  types
  utils
```

## Local Run

### 1. Start PostgreSQL and Redis

```bash
docker compose up -d postgres redis
```

### 2. Backend

```bash
cd backend
cp .env.example .env
go mod tidy
go run cmd/main.go
```

Backend URL: `http://localhost:8080`.

### 3. Frontend

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

Frontend URL: `http://localhost:3000`.

## Environment

Backend `.env`:

```env
APP_ENV=development
PORT=8080
API_BASE_URL=http://localhost:8080
FRONTEND_URL=http://localhost:3000
DATABASE_URL=postgres://edumatch:edumatch@localhost:5432/edumatch?sslmode=disable
REDIS_ADDR=localhost:6379
REDIS_PASSWORD=
REDIS_DB=0
JWT_SECRET=replace-with-a-long-random-secret
JWT_ACCESS_TTL_MINUTES=15
JWT_REFRESH_TTL_DAYS=30
UPLOAD_DIR=uploads
```

Frontend `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws
```

## Main Features

- Registration, login, logout
- JWT auth middleware
- Rotating refresh tokens persisted in PostgreSQL and Redis
- Protected frontend pages with automatic token refresh
- Student profile with avatar upload, bio, university, course, city and skills
- Project CRUD with status, deadline, stack, capacity and search filters
- Teammate search by skills, course, university and rating
- Application workflow: send, accept, reject, status display
- Project chat over WebSocket with persisted history
- Dashboard: my projects, my applications, recommendations, activity, notifications
- Recommendations by overlap between user skills and project stack
- Notifications for new application, accepted/rejected application and new message
- Light/dark theme
- Responsive desktop, tablet and mobile UI
- Project PDF export through browser print-to-PDF

## API

Base path: `/api/v1`.

Auth:

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`

Users and skills:

- `GET /skills`
- `GET /users/me`
- `PUT /users/me`
- `POST /users/me/avatar`
- `GET /users?search=&skills=&course=&university=&min_rating=&sort=`
- `GET /users/:id`

Projects:

- `GET /projects?search=&stack=&status=&sort=&limit=&offset=`
- `POST /projects`
- `GET /projects/mine`
- `GET /projects/recommended`
- `GET /projects/:id`
- `PUT /projects/:id`
- `DELETE /projects/:id`
- `POST /projects/:id/applications`
- `GET /projects/:id/messages`
- `POST /projects/:id/messages`

Applications:

- `GET /applications/mine`
- `GET /applications/incoming`
- `PATCH /applications/:id/status`

Notifications:

- `GET /notifications`
- `PATCH /notifications/:id/read`
- `PATCH /notifications/read-all`

Realtime:

- `GET /ws/projects/:id?token=<JWT_ACCESS_TOKEN>`

Health:

- `GET /health`

## Request Examples

Register:

```json
{
  "name": "Иван Иванов",
  "email": "ivan@example.com",
  "password": "password123",
  "university": "МГТУ им. Баумана",
  "course": 3,
  "skills": ["React", "Go", "PostgreSQL"]
}
```

Create project:

```json
{
  "title": "AI Study Buddy",
  "description": "Платформа для совместного обучения с использованием искусственного интеллекта.",
  "format": "Online",
  "deadline": "2026-08-20",
  "status": "open",
  "capacity": 5,
  "stack": ["React", "Go", "PostgreSQL"]
}
```

Change application status:

```json
{
  "status": "accepted"
}
```

WebSocket message:

```json
{
  "content": "Привет! Я добавил первый прототип."
}
```

## Deployment

Frontend on Vercel:

1. Import `frontend` as the project root.
2. Set `NEXT_PUBLIC_API_URL=https://your-api-host/api/v1`.
3. Set `NEXT_PUBLIC_WS_URL=wss://your-api-host/ws`.
4. Deploy with the included `frontend/vercel.json`.

Backend on Render:

1. Use `render.yaml` or create a Docker web service from `backend/Dockerfile`.
2. Set `APP_ENV=production`.
3. Set `API_BASE_URL` to the backend public URL.
4. Set `FRONTEND_URL` to the Vercel URL.
5. Set `DATABASE_URL` from Neon.
6. Set `REDIS_ADDR` and `REDIS_PASSWORD` from Upstash or Railway Redis.
7. Set a strong `JWT_SECRET`.

Backend on Railway:

1. Use `railway.json`.
2. Attach PostgreSQL/Redis or connect Neon/Upstash.
3. Configure the same env variables as Render.

PostgreSQL on Neon:

- Copy the pooled or direct connection string into `DATABASE_URL`.
- Use `sslmode=require` for production Neon connections.

Redis on Upstash:

- Use the host and port as `REDIS_ADDR`.
- Use the default password as `REDIS_PASSWORD`.

## Verification

Commands used during development:

```bash
cd backend && go test ./...
cd frontend && npm run typecheck
cd frontend && npm run lint
cd frontend && npm run build
cd frontend && npm audit --omit=dev
```
