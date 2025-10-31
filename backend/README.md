# Credit Jambo Backend API

The backend API for the Credit Jambo Savings Management System, built with Node.js, Express, and TypeScript.

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Docker Setup](#docker-setup)
  - [Manual Setup](#manual-setup)
- [API Documentation](#api-documentation)
- [Database](#database)
- [Authentication](#authentication)
- [Security](#security)
- [Testing](#testing)
- [Scripts](#scripts)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)

## Overview

The Credit Jambo Backend API provides RESTful endpoints for:
- User authentication and device management
- Account operations (balance, deposits, withdrawals)
- Transaction history
- Admin operations (device verification, customer management)
- Analytics and reporting

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with SHA-512 password hashing
- **Validation**: Zod schema validation
- **Documentation**: Swagger/OpenAPI
- **Security**: Helmet, CORS, Rate Limiting
- **Testing**: Vitest

## Prerequisites

- Node.js >= 22.x
- npm or yarn
- PostgreSQL 15+ (or Docker)
- Git

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Request handlers
│   ├── dtos/           # Data Transfer Objects
│   ├── middlewares/    # Express middlewares
│   ├── prisma/         # Database schema and migrations
│   ├── routes/         # API route definitions
│   ├── services/       # Business logic
│   ├── utils/          # Utility functions
│   └── server.ts       # Application entry point
├── tests/              # Unit and integration tests
├── docs/               # Documentation files
├── prisma/             # Prisma schema and migrations
└── package.json        # Dependencies and scripts
```

## Getting Started

### Docker Setup

The easiest way to run the backend is using Docker:

```bash
# From the creditjambo-client root directory
npm run setup
```

This will:
1. Start PostgreSQL database
2. Run database migrations
3. Seed initial data (including admin user)
4. Start the backend API server

### Manual Setup

For local development without Docker:

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start PostgreSQL (if not using Docker):**
   ```bash
   # Using Docker
   docker-compose up -d postgres
   
   # Or start your local PostgreSQL instance
   ```

4. **Run database migrations:**
   ```bash
   npm run db:migrate
   ```

5. **Seed initial data:**
   ```bash
   npm run seed
   ```

6. **Start development server:**
   ```bash
   npm run dev
   ```

The API will be available at http://localhost:4000

## API Documentation

### Interactive Documentation

Swagger/OpenAPI documentation is available at:
- http://localhost:4000/api/docs - Interactive UI
- http://localhost:4000/api/docs.json - JSON specification

### Key Endpoints

**Authentication:**
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login
- POST `/api/auth/refresh` - Refresh token
- POST `/api/auth/logout` - Logout

**Account Operations:**
- GET `/api/account/balance` - Get account balance
- GET `/api/account/transactions` - Get transaction history
- POST `/api/account/deposit` - Deposit funds
- POST `/api/account/withdraw` - Withdraw funds

**Admin Operations:**
- POST `/api/admin/auth/login` - Admin login
- GET `/api/admin/devices` - Get all devices
- PATCH `/api/admin/devices/:id/verify` - Verify device
- GET `/api/admin/customers` - Get all customers
- GET `/api/admin/transactions` - Get all transactions
- GET `/api/admin/analytics` - Get analytics dashboard data

## Database

The backend uses PostgreSQL with Prisma ORM for database operations.

### Schema

The database schema is defined in `src/prisma/schema.prisma` and includes:
- Users: Customer and admin accounts
- Devices: Device registration and verification
- Accounts: Customer savings accounts
- Transactions: Deposit and withdrawal records
- Sessions: User authentication sessions
- PushTokens: Mobile push notification tokens

### Migrations

Database migrations are managed with Prisma Migrate:

```bash
# Create and apply a new migration
npm run db:migrate

# Apply existing migrations
npm run db:push

# Generate Prisma client
npm run db:generate
```

## Authentication

### User Authentication

1. **Registration**: Users register with email, name, password, and device ID
2. **Login**: Users authenticate with email and password
3. **Device Verification**: Admin must verify user's device before full access
4. **Tokens**: JWT access (15 min) and refresh (7 days) tokens

### Admin Authentication

Admins use the same authentication flow but with a pre-seeded account:
- Email: admin@creditjambo.com
- Password: Admin123!
- DeviceId: admin-web-device

### Password Security

- SHA-512 hashing with PBKDF2
- 100,000 iterations
- Random 16-byte salt per password
- Constant-time comparison

## Security

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

### Best Practices

- Environment variables for secrets
- Input validation on all endpoints
- Output sanitization
- Secure HTTP headers
- Session management

## Testing

Run the test suite with:

```bash
npm test
```

Run tests with coverage:

```bash
npm run test:coverage
```

Tests are written with Vitest and include:
- Unit tests for services and utilities
- Integration tests for controllers and routes
- Database tests with isolated test database

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm run start` | Start production server |
| `npm test` | Run test suite |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run lint` | Check code style |
| `npm run lint:fix` | Fix code style issues |
| `npm run db:migrate` | Run database migrations |
| `npm run db:generate` | Generate Prisma client |
| `npm run seed` | Seed database with initial data |

## Configuration

### Environment Variables

Create a `.env` file based on `.env.example`:

```bash
# Database
DATABASE_URL=postgresql://postgres:kw1zera@localhost:5432/cjsavings

# JWT Secrets (min 32 characters each)
JWT_ACCESS_SECRET=your-secret-min-32-chars
JWT_REFRESH_SECRET=your-secret-min-32-chars

# CORS Origins (comma-separated)
CORS_ORIGIN=http://localhost:5174,http://localhost:8081,exp://localhost:8081

# Server
PORT=4000
NODE_ENV=development

# Rate Limiting
AUTH_RATE_LIMIT_WINDOW_MS=900000
AUTH_RATE_LIMIT_MAX=10
TRANSACTION_RATE_LIMIT_WINDOW_MS=600000
TRANSACTION_RATE_LIMIT_MAX=20
GENERAL_RATE_LIMIT_WINDOW_MS=900000
GENERAL_RATE_LIMIT_MAX=200
```

## Troubleshooting

### Common Issues

**Port Conflicts:**
```bash
# Change port in .env
PORT=4001
```

**Database Connection Failed:**
```bash
# Check if PostgreSQL is running
docker-compose ps

# Restart database
docker-compose restart postgres
```

**Migration Errors:**
```bash
# Reset database and re-migrate
docker-compose down -v
docker-compose up -d postgres
npm run db:migrate
npm run seed
```

**JWT Secret Errors:**
```bash
# Ensure secrets are at least 32 characters
JWT_ACCESS_SECRET=your-very-long-secret-key-minimum-32-characters
JWT_REFRESH_SECRET=your-very-long-refresh-key-minimum-32-characters
```

### Logs

View application logs:
```bash
# If running with Docker
docker-compose logs backend

# If running locally
# Logs are printed to console
```

## License

MIT License