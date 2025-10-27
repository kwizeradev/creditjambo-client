# Credit Jambo - Client Application

A secure savings management system for customers with mobile app and backend API.

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Database Setup](#database-setup)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Docker Setup](#docker-setup)
- [Deployment](#deployment)
- [Architecture Decisions](#architecture-decisions)
- [Security Implementation](#security-implementation)
- [Assumptions](#assumptions)
- [Contributing](#contributing)
- [License](#license)

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

## Installation

[Installation instructions to be added]

## Database Setup

1. Ensure Docker Desktop is running

2. Start PostgreSQL:
```bash
   cd backend
   docker-compose up -d
```

3. Verify connection:
```bash
   docker ps
```

4. The database will be available at:
```
   postgresql://postgres:kw1zera@localhost:5432/cjsavings
```

5. To stop the database:
```bash
   docker-compose down
```

For detailed database documentation, see [DATABASE.md](backend/DATABASE.MD)

## Environment Variables

[Environment variables documentation to be added]

## Running the Application

[Run instructions to be added]

## API Documentation

[API documentation to be added]

## Testing

[Testing instructions to be added]

## Docker Setup

[Docker instructions to be added]

## Deployment

[Deployment guide to be added]

## Architecture Decisions

[Architecture notes to be added]

## Security Implementation

[Security notes to be added]

## Assumptions

[Project assumptions to be added]

## License

MIT License

---