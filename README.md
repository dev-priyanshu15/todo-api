# Todo App API

A production-ready Todo Management backend built with NestJS, PostgreSQL, Redis, Bull Queue, WebSockets, and JWT Authentication.

---

## Tech Stack

- NestJS — Backend framework
- PostgreSQL — Primary database
- Prisma — ORM for database access
- Redis — Queue storage for background jobs
- Bull Queue — Asynchronous job processing
- Socket.io — WebSocket real-time notifications
- JWT — Access and Refresh token authentication
- bcrypt — Password hashing
- Nodemailer — Email delivery via SMTP
- Multer — File uploads for avatar images
- Swagger — Auto-generated API documentation
- Docker — Containerization

---

## Local Setup

### Prerequisites

- Node.js v18 or above
- Docker Desktop
- Git

### Step 1 — Clone the repository
```bash
git clone https://github.com/dev-priyanshu15/assignment1.git
cd assignment1
```

### Step 2 — Install dependencies
```bash
npm install
```

### Step 3 — Create environment file

Create a `.env` file in the root directory with the following variables:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/tododb

JWT_SECRET=your-jwt-secret-key
JWT_REFRESH_SECRET=your-jwt-refresh-secret-key

REDIS_HOST=localhost
REDIS_PORT=6379

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
SMTP_FROM=your-email@gmail.com

FRONTEND_URL=http://localhost:3001
RESET_TOKEN_EXPIRY_HOURS=1
```

For Gmail SMTP, generate an App Password from your Google Account under Security — App Passwords. Use that 16-digit password as `SMTP_PASS`.

### Step 4 — Start PostgreSQL and Redis via Docker
```bash
docker run -d --name todo-postgres -p 5433:5432 \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=tododb \
  postgres:16-alpine

docker run -d --name redis-todo -p 6379:6379 redis:alpine
```

### Step 5 — Run database migrations
```bash
npx prisma migrate dev
npx prisma generate
```

### Step 6 — Start the development server
```bash
npm run start:dev
```

The server starts at `http://localhost:3000`

---

## Docker Setup (Full Stack)

To run the entire stack including the app, PostgreSQL, and Redis using Docker Compose:
```bash
docker-compose up --build
```

This will start all three services together. The app will be available at `http://localhost:3000`.

---

## Swagger API Documentation

Once the server is running, open the following URL in your browser:
```
http://localhost:3000/api/docs
```

All endpoints are documented with request schemas, response examples, and authentication requirements. Click the Authorize button at the top right and enter your Bearer token to test protected routes directly from the browser.

---

## API Reference

### Authentication

All protected routes require the following header:
```
Authorization: Bearer <accessToken>
```

---

#### POST /auth/signup

Register a new user. A welcome email is sent asynchronously via the queue.

Request body:
```json
{
  "name": "Priyanshu Singh",
  "email": "user@gmail.com",
  "password": "password123"
}
```

Response:
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}
```

---

#### POST /auth/login

Authenticate an existing user and receive tokens.

Request body:
```json
{
  "email": "user@gmail.com",
  "password": "password123"
}
```

Response:
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}
```

Rate limit: 5 requests per minute.

---

#### POST /auth/logout

Invalidates the refresh token for the current device. Requires access token.

Headers:
```
Authorization: Bearer <accessToken>
```

Response:
```json
{
  "message": "Logged out successfully"
}
```

---

#### POST /auth/refresh

Get a new access token using a valid refresh token.

Headers:
```
Authorization: Bearer <refreshToken>
```

Response:
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}
```

---

#### POST /auth/forgot-password

Sends a password reset link to the provided email address. Returns the same response whether or not the email exists, to prevent user enumeration.

Rate limit: 3 requests per minute.

Request body:
```json
{
  "email": "user@gmail.com"
}
```

Response:
```json
{
  "message": "If that email is registered, you will receive a password reset link"
}
```

---

#### POST /auth/reset-password

Reset the password using the token received in the email. The token expires after 1 hour. All existing sessions are invalidated after a successful reset.

Request body:
```json
{
  "token": "fc72c77fa36587606a9dcc931d0c1198d1e37e90d56389ba294692f0cb05df82",
  "newPassword": "newpassword123"
}
```

Response:
```json
{
  "message": "Password reset successfully"
}
```

---

### User APIs

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | /users/me | Get own profile | Yes | USER |
| PATCH | /users/me | Update own profile | Yes | USER |
| DELETE | /users/me | Soft delete own account | Yes | USER |
| POST | /users/me/avatar | Upload profile picture | Yes | USER |
| GET | /users | Get all users paginated | Yes | ADMIN |
| PATCH | /users/:id | Update any user | Yes | ADMIN |
| DELETE | /users/:id | Soft delete any user | Yes | ADMIN |
| POST | /users/:id/restore | Restore a deleted user | Yes | ADMIN |

---

#### GET /users/me

Returns the authenticated user's profile. Password and refresh token are never returned.

Headers:
```
Authorization: Bearer <accessToken>
```

Response:
```json
{
  "id": "57b2c30a-49f4-4ce9-b181-54a42f826cf3",
  "name": "Priyanshu Singh",
  "email": "user@gmail.com",
  "role": "USER",
  "createdAt": "2026-04-01T00:13:35.587Z"
}
```

---

#### PATCH /users/me

Update the authenticated user's name or email. Checks for duplicate email before updating.

Headers:
```
Authorization: Bearer <accessToken>
```

Request body (all fields optional):
```json
{
  "name": "New Name",
  "email": "newemail@gmail.com"
}
```

Response:
```json
{
  "id": "57b2c30a-49f4-4ce9-b181-54a42f826cf3",
  "name": "New Name",
  "email": "newemail@gmail.com",
  "avatar": null
}
```

---

#### DELETE /users/me

Soft deletes the authenticated user's account. The record remains in the database with `isDeleted: true`. The user can no longer log in or access protected routes.

Headers:
```
Authorization: Bearer <accessToken>
```

Response:
```json
{
  "message": "User account deleted successfully"
}
```

---

#### POST /users/me/avatar

Upload a profile picture. Accepts `multipart/form-data`. Only image files are allowed (jpg, jpeg, png, gif, webp). Maximum file size is 5MB. The avatar URL is stored in the database and the file is saved locally under `uploads/avatars/`.

Headers:
```
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data
```

Form field:
```
avatar: <image file>
```

Response:
```json
{
  "id": "57b2c30a-49f4-4ce9-b181-54a42f826cf3",
  "name": "Priyanshu Singh",
  "email": "user@gmail.com",
  "avatar": "/uploads/avatars/1775095972117-670958593.jpg"
}
```

The avatar can be accessed at `http://localhost:3000/uploads/avatars/<filename>`.

---

#### GET /users?page=1&limit=10

Admin only. Returns a paginated list of all users including soft-deleted ones.

Headers:
```
Authorization: Bearer <adminAccessToken>
```

Query parameters:
```
page  — page number (default: 1)
limit — items per page (default: 10)
```

Response:
```json
{
  "data": [
    {
      "id": "57b2c30a-49f4-4ce9-b181-54a42f826cf3",
      "name": "Priyanshu Singh",
      "email": "user@gmail.com",
      "role": "ADMIN",
      "isDeleted": false,
      "createdAt": "2026-04-01T00:13:35.587Z"
    }
  ],
  "meta": {
    "total": 2,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

---

#### PATCH /users/:id

Admin only. Update any user's name or email.

Headers:
```
Authorization: Bearer <adminAccessToken>
```

Request body:
```json
{
  "name": "Updated Name"
}
```

Response:
```json
{
  "id": "acdd4661-6d7f-4d08-8569-b2b3341057a2",
  "name": "Updated Name",
  "email": "user@gmail.com",
  "avatar": null
}
```

---

#### DELETE /users/:id

Admin only. Soft deletes any user account.

Headers:
```
Authorization: Bearer <adminAccessToken>
```

Response:
```json
{
  "message": "User deleted successfully"
}
```

---

#### POST /users/:id/restore

Admin only. Restores a previously soft-deleted user account.

Headers:
```
Authorization: Bearer <adminAccessToken>
```

Response:
```json
{
  "message": "User restored successfully"
}
```

---

### Todo APIs

Each todo belongs to exactly one user. Users can only view, update, and delete their own todos. Attempting to access another user's todo returns 403 Forbidden.

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | /todos | Create a todo | Yes |
| GET | /todos?page=1&limit=10 | Get own todos paginated | Yes |
| GET | /todos/:id | Get a single todo | Yes |
| PATCH | /todos/:id | Update a todo | Yes |
| DELETE | /todos/:id | Delete a todo | Yes |

---

#### POST /todos

Headers:
```
Authorization: Bearer <accessToken>
```

Request body:
```json
{
  "title": "Buy groceries",
  "desc": "Milk, eggs, bread"
}
```

Response:
```json
{
  "id": "28b4adac-f427-4c14-aad4-3c7fb9cb68a1",
  "title": "Buy groceries",
  "desc": "Milk, eggs, bread",
  "done": false,
  "userId": "57b2c30a-49f4-4ce9-b181-54a42f826cf3",
  "createdAt": "2026-04-01T07:40:00.214Z",
  "updatedAt": "2026-04-01T07:40:00.214Z"
}
```

---

#### GET /todos?page=1&limit=10

Returns only the authenticated user's todos with pagination.

Headers:
```
Authorization: Bearer <accessToken>
```

Response:
```json
{
  "data": [
    {
      "id": "28b4adac-f427-4c14-aad4-3c7fb9cb68a1",
      "title": "Buy groceries",
      "desc": "Milk, eggs, bread",
      "done": false,
      "userId": "57b2c30a-49f4-4ce9-b181-54a42f826cf3",
      "createdAt": "2026-04-01T07:40:00.214Z",
      "updatedAt": "2026-04-01T07:40:00.214Z"
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

---

#### GET /todos/:id

Headers:
```
Authorization: Bearer <accessToken>
```

Response:
```json
{
  "id": "28b4adac-f427-4c14-aad4-3c7fb9cb68a1",
  "title": "Buy groceries",
  "desc": "Milk, eggs, bread",
  "done": false,
  "userId": "57b2c30a-49f4-4ce9-b181-54a42f826cf3",
  "createdAt": "2026-04-01T07:40:00.214Z",
  "updatedAt": "2026-04-01T07:40:00.214Z"
}
```

---

#### PATCH /todos/:id

Headers:
```
Authorization: Bearer <accessToken>
```

Request body (all fields optional):
```json
{
  "title": "Updated title",
  "desc": "Updated description",
  "done": true
}
```

Response returns the updated todo object.

---

#### DELETE /todos/:id

Headers:
```
Authorization: Bearer <accessToken>
```

Response:
```json
{
  "message": "Todo deleted successfully"
}
```

---

## WebSockets

The server exposes a Socket.io namespace at `/todos` for real-time notifications. A valid JWT access token is required to establish a connection. Only the owner of a todo receives events when their todos are created, updated, or deleted.

### Connecting from a browser
```javascript
const socket = io('http://localhost:3000/todos', {
  extraHeaders: {
    authorization: 'Bearer <accessToken>'
  }
});
```

### Available events
```javascript
socket.on('connected', (data) => {
  console.log('Connected:', data);
  // { message: 'Connected successfully' }
});

socket.on('todo:created', (todo) => {
  console.log('New todo:', todo);
});

socket.on('todo:updated', (todo) => {
  console.log('Updated todo:', todo);
});

socket.on('todo:deleted', (data) => {
  console.log('Deleted:', data);
  // { id: 'todo-id' }
});
```

If the token is missing or invalid, the connection is rejected and the socket is disconnected immediately.

---

## Rate Limiting

Rate limiting is enforced using `@nestjs/throttler`. Requests that exceed the limit receive a 429 response.

| Endpoint | Limit |
|----------|-------|
| POST /auth/login | 5 requests per minute |
| POST /auth/signup | 5 requests per minute |
| POST /auth/forgot-password | 3 requests per minute |
| All other routes | 100 requests per minute |

Error response when limit is exceeded:
```json
{
  "success": false,
  "statusCode": 429,
  "message": "ThrottlerException: Too Many Requests",
  "errors": null,
  "path": "/auth/login",
  "timestamp": "2026-04-01T12:06:20.131Z"
}
```

---

## Queue System

Background jobs are processed asynchronously using Bull Queue backed by Redis. The HTTP response is returned to the client immediately without waiting for the job to complete.

| Job | Trigger | Description |
|-----|---------|-------------|
| welcome-email | User signup | Sends a welcome email to the new user |
| password-reset-email | Forgot password request | Sends a password reset link via email |

Each job is configured with 3 retry attempts using exponential backoff starting at 2 seconds (2s, 4s, 8s). Failed jobs are retained in the queue for inspection.

---

## Error Response Format

All errors across the application follow a consistent format via the global exception filter:
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Email already registered",
  "errors": null,
  "path": "/auth/signup",
  "timestamp": "2026-04-01T10:00:00.000Z"
}
```

For validation errors, the `errors` field contains an array of field-level messages:
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    "email must be an email",
    "password must be longer than or equal to 6 characters"
  ],
  "path": "/auth/signup",
  "timestamp": "2026-04-01T10:00:00.000Z"
}
```

---

## Project Structure
```
src/
├── auth/
│   ├── dto/            — signup.dto, login.dto, forgot-password.dto, reset-password.dto
│   ├── guards/         — jwt-auth.guard, jwt-refresh.guard
│   ├── strategies/     — jwt.strategy, jwt-refresh.strategy
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── auth.module.ts
├── user/
│   ├── dto/            — update-user.dto
│   ├── user.controller.ts
│   ├── user.service.ts
│   └── user.module.ts
├── todo/
│   ├── dto/            — create-todo.dto, update-todo.dto
│   ├── todo.controller.ts
│   ├── todo.service.ts
│   └── todo.module.ts
├── gateway/
│   ├── gateway.service.ts
│   ├── todo.gateway.ts
│   └── gateway.module.ts
├── queue/
│   ├── producers/      — email.producer.ts
│   ├── consumers/      — email.consumer.ts
│   ├── queue.constants.ts
│   └── queue.module.ts
├── mail/
│   └── mail.service.ts
├── prisma/
│   ├── prisma.service.ts
│   └── prisma.module.ts
├── common/
│   ├── decorators/     — get-user.decorator.ts, roles.decorator.ts
│   ├── filters/        — http-exception.filter.ts
│   └── guards/         — roles.guard.ts
├── app.module.ts
└── main.ts
```

---

## Security Highlights

- Passwords are hashed using bcrypt with 10 salt rounds before storage
- Refresh tokens are hashed with bcrypt before being stored in the database
- Password reset tokens are hashed using SHA-256 and expire after 1 hour
- Logging out sets the refresh token to null, invalidating all sessions on that device
- Resetting a password sets the refresh token to null, logging out all devices
- Soft-deleted users cannot log in or access any protected route
- All todo operations verify that the requesting user is the owner of the todo
- Rate limiting is enforced on authentication routes to prevent brute force attacks
- Sensitive fields such as password and refreshToken are never returned in API responses

---

## Author

Priyanshu Singh
GitHub: https://github.com/dev-priyanshu15
