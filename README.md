# Credit Jambo - Client Application

A secure savings management system for customers with mobile app and backend API.

## Quick Start with Docker

```
# Clone the repository
git clone https://github.com/kwizeradev/creditjambo-client

cd creditjambo-client

# Install dependencies
npm install

# Run setup script
npm run setup
```

Then run the mobile app:
```bash
cd frontend
npm install
npm start
```

See [DOCKER_SETUP.md](DOCKER_SETUP.md) for complete Docker guide.

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Docker Setup](#docker-setup)
- [Manual Setup](#manual-setup)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Security Implementation](#security-implementation)

## Overview

Credit Jambo Client Application enables customers to:
- Register and authenticate securely
- Manage savings accounts
- Perform deposits and withdrawals
- View transaction history
- Receive push notifications

## Tech Stack

### Backend
- Node.js & Express.js
- TypeScript
- PostgreSQL
- Prisma ORM
- JWT Authentication
- SHA-512 Password Hashing

### Frontend (Mobile)
- React Native (Expo)
- Expo Router
- TypeScript
- React Query

## Prerequisites

- Node.js >= 22.x
- npm or yarn
- PostgreSQL 15+ (or Docker)
- Expo CLI
- Git

## Project Structure
```
creditjambo-client/
├── backend/
│   ├── src/
│   ├── prisma/
│   ├── tests/
│   └── package.json
├── frontend/
│   ├── app/
│   ├── components/
│   ├── services/
│   └── package.json
└── docs/
```

## Docker Setup

### Quick Start : root directory

```bash
# Clone the repository
git clone https://github.com/kwizeradev/creditjambo-client

cd creditjambo-client

# Install dependencies
npm install

# Run setup script
npm run setup
```

This starts:
- Backend API on http://localhost:4000
- PostgreSQL database on localhost:5432

### Access Points

| Service | URL | Credentials |
|---------|-----|-------------|
| Backend API | http://localhost:4000 | - |
| Database | postgresql://localhost:5432/cjsavings | postgres / kw1zera |

### Admin Credentials

```
Email:    admin@creditjambo.com
Password: Admin123!
DeviceId: admin-web-device
```

### Run Mobile App

```bash
cd frontend
npm install
npm start
```

Scan QR code with Expo Go app.

### Service Management

```bash
docker-compose logs -f          # View logs
docker-compose down             # Stop services
docker-compose restart          # Restart services
npm run teardown -- --all       # Complete cleanup
```

See [DOCKER_SETUP.md](DOCKER_SETUP.md) for detailed Docker documentation.

## Manual Setup

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
docker-compose up -d postgres
npm run db:migrate
npm run seed
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm start
```

## API Documentation

Interactive API documentation is available through Swagger/OpenAPI:

- **Swagger UI**: http://localhost:4000/api/docs
- **API Spec**: http://localhost:4000/api/docs.json

See [backend/README.md](backend/README.md) for detailed API documentation.

### Key Endpoints

**Authentication:**
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login
- POST `/api/auth/refresh` - Refresh token
- POST `/api/auth/logout` - Logout

**Account:**
- GET `/api/account/balance` - Get balance
- GET `/api/account/transactions` - Get transactions
- POST `/api/account/deposit` - Deposit funds
- POST `/api/account/withdraw` - Withdraw funds

**Admin:**
- POST `/api/admin/auth/login` - Admin login
- GET `/api/admin/devices` - Get all devices
- PATCH `/api/admin/devices/:id/verify` - Verify device
- GET `/api/admin/customers` - Get all customers
- GET `/api/admin/transactions` - Get all transactions
- GET `/api/admin/analytics` - Get analytics

## Testing

```bash
cd backend
npm test
npm run test:coverage
```

See [backend/docs/TESTING.md](backend/docs/TESTING.md) for testing documentation.

## Security Implementation

### Password Security
- SHA-512 hashing with PBKDF2
- 100,000 iterations
- Random 16-byte salt per password
- Constant-time comparison

### Authentication
- JWT access tokens (15 minutes)
- JWT refresh tokens (7 days)
- Device-based authentication
- Admin device verification required

### Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| Authentication | 10 requests | 15 minutes |
| Transactions | 20 requests | 10 minutes |
| General API | 200 requests | 15 minutes |

### Security Headers
- Helmet.js for HTTP security headers
- CORS protection with dynamic origin support
- Input validation and sanitization
- NoSQL injection prevention

See [backend/docs/SECURITY.md](backend/docs/SECURITY.md) for complete security documentation.

## Configuration

### Environment Variables

**Backend (.env):**
```bash
DATABASE_URL=postgresql://postgres:kw1zera@localhost:5432/cjsavings
JWT_ACCESS_SECRET=your-secret-min-32-chars
JWT_REFRESH_SECRET=your-secret-min-32-chars
CORS_ORIGIN=http://localhost:5174,http://localhost:8081,exp://localhost:8081
PORT=4000
```

**Frontend (lib/constants/configs.ts):**
```typescript
const ENV = {
  dev: {
    apiUrl: 'http://localhost:4000/api',
  },
  prod: {
    apiUrl: 'https://api.creditjambo.com/api',
  },
};
```

## Connecting Admin Dashboard

The admin dashboard is in a separate repository. To connect:

1. Clone and ensure backend is running (this repo)
2. Clone admin repository
3. Configure admin to connect to this backend
4. Start admin dashboard

See admin repository documentation for details.

## Architecture

```
┌─────────────────────────────────────────┐
│         Docker Network                   │
├─────────────────────────────────────────┤
│                                          │
│  ┌──────────────┐  ┌──────────────┐    │
│  │   Backend    │  │  PostgreSQL  │    │
│  │   Node.js    │◄─┤   Database   │    │
│  │   Port 4000  │  │   Port 5432  │    │
│  └──────┬───────┘  └──────────────┘    │
│         │                                │
└─────────┼────────────────────────────────┘
          │
          │ Port Mapping
          ▼
┌─────────────────────────────────────────┐
│        Host Machine                      │
├─────────────────────────────────────────┤
│  :4000 → Backend API                    │
│  :5432 → PostgreSQL                     │
└─────────────────────────────────────────┘
          │
          ├──► Admin Dashboard (separate repo)
          │
          └──► React Native App (Expo)
```

## Troubleshooting

### Port Conflicts

Edit `.env`:
```bash
BACKEND_PORT=4001
POSTGRES_PORT=5433
```

### React Native Connection

For physical device, update `frontend/lib/constants/configs.ts`:
```typescript
apiUrl: 'http://YOUR_LOCAL_IP:4000/api'
```

Find your IP:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

### Database Issues

Reset database:
```bash
docker-compose down -v
docker-compose up -d
```

## License

MIT License