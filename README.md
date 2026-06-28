# EduMatch

## Описание проекта

EduMatch — это full-stack веб-приложение, предназначенное для поиска тиммейтов, создания учебных проектов и совместной работы студентов.

Пользователь может зарегистрироваться, заполнить профиль, указать свои навыки, создавать собственные проекты, искать существующие проекты, отправлять заявки на участие и общаться с другими участниками команды через встроенный чат в режиме реального времени.

---

# Используемые технологии

## Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS
* Lucide React

## Backend

* Go
* Gin
* GORM

## База данных

* PostgreSQL (Neon)

## Кэширование и сессии

* Redis

## Авторизация

* JWT
* Refresh Token

## Дополнительно

* WebSocket
* REST API

---

# Возможности приложения

## Авторизация

* Регистрация
* Вход
* Выход
* JWT авторизация
* Refresh Token

---

## Профиль пользователя

* Редактирование профиля
* Загрузка аватара
* Изменение информации "О себе"
* Университет
* Курс
* Город
* Навыки

---

## Проекты

* Создание проекта
* Редактирование проекта
* Удаление проекта
* Просмотр проекта
* Поиск проектов
* Фильтрация
* Сортировка

---

## Поиск студентов

* Поиск по навыкам
* Поиск по университету
* Поиск по курсу
* Просмотр профиля пользователя

---

## Заявки

* Отправка заявки
* Принятие заявки
* Отклонение заявки
* Просмотр статуса заявки

---

## Dashboard

* Мои проекты
* Проекты, в которых пользователь участвует
* Мои заявки
* Рекомендуемые проекты
* Уведомления
* Последняя активность

---

## Чат

* WebSocket
* Общение участников проекта
* История сообщений

---

# Архитектура проекта

Проект построен по принципам **Clean Architecture**.

```text
Frontend (Next.js)

↓

REST API

↓

Handlers

↓

Services

↓

Repositories

↓

PostgreSQL
```

---

# Структура Backend

```text
backend/

cmd/
internal/

config/
domain/
entities/
handlers/
middleware/
repositories/
routes/
services/
ws/

uploads/
```

### cmd

Точка входа приложения.

### config

Подключение PostgreSQL, Redis и загрузка переменных окружения.

### domain

Общие структуры и фильтры.

### entities

Модели базы данных.

### handlers

Обработка HTTP-запросов.

### services

Бизнес-логика приложения.

### repositories

Работа с базой данных.

### middleware

JWT авторизация.

### routes

Настройка REST API.

### ws

WebSocket чат.

---

# Структура Frontend

```text
frontend/

app/
components/
hooks/
services/
types/
utils/
```

### app

Все страницы приложения.

### components

Переиспользуемые UI-компоненты.

### hooks

React Hooks.

### services

Работа с REST API.

### types

Типы TypeScript.

### utils

Вспомогательные функции.

---

# Основные сущности

* User
* Skill
* Project
* ProjectMember
* Application
* Message
* Notification
* RefreshSession

---

# REST API

## Авторизация

```http
POST /auth/register

POST /auth/login

POST /auth/refresh

POST /auth/logout
```

---

## Пользователь

```http
GET /users/me

PUT /users/me

POST /users/me/avatar

GET /users

GET /users/:id
```

---

## Проекты

```http
GET /projects

POST /projects

GET /projects/:id

PUT /projects/:id

DELETE /projects/:id

GET /projects/mine

GET /projects/recommended
```

---

## Заявки

```http
POST /projects/:id/applications

GET /applications/mine

GET /applications/incoming

PATCH /applications/:id/status
```

---

## Dashboard

```http
GET /dashboard
```

---

## Уведомления

```http
GET /notifications

PATCH /notifications/:id/read

PATCH /notifications/read-all
```

---

## Навыки

```http
GET /skills
```

---

## WebSocket

```text
/ws/projects/:id
```

Используется для обмена сообщениями между участниками проекта в режиме реального времени.

---

# Локальный запуск проекта

## Backend

Перейдите в папку backend

```bash
cd backend
```

Установите зависимости

```bash
go mod tidy
```

Запустите сервер

```bash
go run cmd/main.go
```

---

## Frontend

Перейдите в папку frontend

```bash
cd frontend
```

Установите зависимости

```bash
npm install
```

Запустите приложение

```bash
npm run dev
```

Frontend будет доступен по адресу:

```text
http://localhost:3000
```

Backend:

```text
http://localhost:8080
```

---

# Переменные окружения

## Backend (.env)

```env
APP_ENV=development

PORT=8080

API_BASE_URL=http://localhost:8080

FRONTEND_URL=http://localhost:3000

DATABASE_URL=postgres://...

REDIS_ADDR=localhost:6379

REDIS_PASSWORD=

REDIS_DB=0

JWT_SECRET=your-secret-key

JWT_ACCESS_TTL_MINUTES=15

JWT_REFRESH_TTL_DAYS=30

UPLOAD_DIR=uploads
```

---

## Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1

NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws
```

---

# Деплой

## Frontend

Vercel

## Backend

Render

## База данных

Neon PostgreSQL

## Redis

Redis

---

# Дизайн

Интерфейс приложения разработан в Figma.

Макет включает основные страницы приложения:

* Авторизация
* Регистрация
* Dashboard
* Проекты
* Создание проекта
* Страница проекта
* Профиль пользователя
* Поиск пользователей
* Чат проекта

Ссылка на макет:

https://www.figma.com/design/m1rGt8tQSuBplKZWENYZsi/Untitled?node-id=0-1&p=f&t=4M2vLNqAHiNw7vn3-0

---

# Автор

**Rashid Shinibaev**

Учебный проект по дисциплине **Full-Stack Web Development**.

Проект разработан в рамках производственной практики и демонстрирует создание полноценного веб-приложения с использованием современных технологий Frontend и Backend.
