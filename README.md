# EduMatch

EduMatch is a platform for students that helps them find teammates, collaborate on projects, and communicate with each other.

## Features

* User registration and authentication
* JWT Access & Refresh Tokens
* Student profile management
* Avatar upload
* Skills management
* Project creation and management
* Search and filter projects
* Apply to projects
* Incoming and outgoing applications
* Application approval and rejection
* Real-time project chat (WebSocket)
* Dashboard
* Notifications
* PostgreSQL database
* Redis refresh token storage
* REST API
* Responsive Next.js frontend

---

## Tech Stack

### Backend

* Go
* Gin
* GORM
* PostgreSQL
* Redis
* JWT
* Gorilla WebSocket

### Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS

### Deployment

* Backend — Render
* Frontend — Vercel
* Database — Neon PostgreSQL
* Cache — Upstash Redis

---

## Project Structure

```
backend/
├── cmd/
├── internal/
│   ├── config/
│   ├── handlers/
│   ├── middleware/
│   ├── repositories/
│   ├── routes/
│   ├── services/
│   └── ws/
└── uploads/

frontend/
├── app/
├── components/
├── lib/
├── services/
├── types/
└── public/
```

---

## Installation

### Clone repository

```bash
git clone https://github.com/rash111d/work.git
cd work
```

---

## Backend

```bash
cd backend

go mod tidy

go run ./cmd
```

The backend starts on:

```
http://localhost:8080
```

---

## Frontend

```bash
cd frontend

npm install

npm run dev
```

Frontend:

```
http://localhost:3000
```

---

## Environment Variables

### Backend (.env)

```env
APP_ENV=development

PORT=8080

API_BASE_URL=http://localhost:8080

FRONTEND_URL=http://localhost:3000

DATABASE_URL=postgres://postgres:password@localhost:5432/edumatch?sslmode=disable

REDIS_ADDR=localhost:6379
REDIS_PASSWORD=
REDIS_DB=0

JWT_SECRET=your-secret-key
JWT_ACCESS_TTL_MINUTES=15
JWT_REFRESH_TTL_DAYS=30

UPLOAD_DIR=uploads
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws
```

---

## API

### Authentication

| Method | Endpoint              |
| ------ | --------------------- |
| POST   | /api/v1/auth/register |
| POST   | /api/v1/auth/login    |
| POST   | /api/v1/auth/refresh  |
| POST   | /api/v1/auth/logout   |

### Users

| Method | Endpoint                |
| ------ | ----------------------- |
| GET    | /api/v1/users/me        |
| PUT    | /api/v1/users/me        |
| POST   | /api/v1/users/me/avatar |
| GET    | /api/v1/users           |
| GET    | /api/v1/users/:id       |
| GET    | /api/v1/skills          |

### Projects

| Method | Endpoint                     |
| ------ | ---------------------------- |
| GET    | /api/v1/projects             |
| POST   | /api/v1/projects             |
| GET    | /api/v1/projects/:id         |
| PUT    | /api/v1/projects/:id         |
| DELETE | /api/v1/projects/:id         |
| GET    | /api/v1/projects/mine        |
| GET    | /api/v1/projects/recommended |

### Applications

| Method | Endpoint                          |
| ------ | --------------------------------- |
| POST   | /api/v1/projects/:id/applications |
| GET    | /api/v1/applications/mine         |
| GET    | /api/v1/applications/incoming     |
| PATCH  | /api/v1/applications/:id/status   |

### Notifications

| Method | Endpoint                       |
| ------ | ------------------------------ |
| GET    | /api/v1/notifications          |
| PATCH  | /api/v1/notifications/:id/read |
| PATCH  | /api/v1/notifications/read-all |

### WebSocket

```
ws://localhost:8080/ws/projects/{projectId}
```

---

## Screenshots

Add screenshots of:

* Login
* Registration
* Dashboard
* Profile
* Project List
* Project Details
* Chat
* Notifications

---

## Author

**Rashid Shinibaev**

GitHub: https://github.com/rash111d
