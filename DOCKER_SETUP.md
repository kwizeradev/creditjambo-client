# Credit Jambo Client - Docker Setup

## Overview

This repository contains the backend API and React Native mobile app for Credit Jambo customers.

**Docker Services:**
- Backend API (Node.js + Express)
- PostgreSQL Database

**Non-Docker:**
- React Native mobile app (runs on host with Expo)

## Quick Start

### Prerequisites
- Docker Desktop installed and running
- Node.js 22+ (for React Native)
- Expo CLI
- Ports 4000 and 5432 available

### One-Command Setup

```bash
npm run setup
```

This will:
1. Create `.env` from `.env.docker`
2. Build Docker images
3. Start PostgreSQL and backend
4. Run database migrations
5. Seed admin user

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

## React Native Setup

The mobile app runs on your host machine:

```bash
cd frontend
npm install
npm start
```

Scan QR code with Expo Go app. The app connects to backend at `http://localhost:4000/api`.

## Manual Setup

### 1. Environment Configuration

```bash
cp .env.docker .env
```

Edit `.env` and update:
- `JWT_ACCESS_SECRET` (minimum 32 characters)
- `JWT_REFRESH_SECRET` (minimum 32 characters)
- `POSTGRES_PASSWORD` (for production)

### 2. Build and Start

```bash
docker-compose build
docker-compose up -d
```

### 3. Check Status

```bash
docker-compose ps
```

Both services should show "healthy" status.

## Service Management

### View Logs

```bash
docker-compose logs -f
docker-compose logs -f backend
docker-compose logs -f postgres
```

### Restart Services

```bash
docker-compose restart
docker-compose restart backend
```

### Stop Services

```bash
docker-compose down
```


## Configuration

### Environment Variables

**Required:**
- `JWT_ACCESS_SECRET` - Access token secret (min 32 chars)
- `JWT_REFRESH_SECRET` - Refresh token secret (min 32 chars)
- `DATABASE_URL` - PostgreSQL connection (auto-configured in Docker)

**Optional:**
- `BACKEND_PORT` - Backend port (default: 4000)
- `POSTGRES_PORT` - Database port (default: 5432)
- `CORS_ORIGIN` - Allowed origins (default includes localhost)
- `NODE_ENV` - Environment (development/production)

### Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| Authentication | 10 requests | 15 minutes |
| Transactions | 20 requests | 10 minutes |
| General API | 200 requests | 15 minutes |

### CORS

Development mode automatically allows:
- `http://localhost:*`
- `http://192.168.*.*:*`
- `exp://192.168.*.*:*`

Production requires explicit origins in `CORS_ORIGIN`.

## Connecting Admin Dashboard

The admin dashboard (separate repository) connects to this backend:

1. Set admin's `VITE_API_URL=http://localhost:4000/api`
2. Add admin URL to backend's `CORS_ORIGIN`
3. Both can run simultaneously

## Troubleshooting

### Port Already in Use

Edit `.env`:

```bash
BACKEND_PORT=4001
POSTGRES_PORT=5433
```

Then restart:

```bash
docker-compose down
docker-compose up -d
```

### Database Connection Issues

Check PostgreSQL health:

```bash
docker-compose ps postgres
docker-compose logs postgres
```

Reset database:

```bash
docker-compose down -v
docker-compose up -d
```

### Backend Not Starting

Check logs:

```bash
docker-compose logs backend
```

Common issues:
- Database not ready (wait 30 seconds)
- Invalid JWT secrets (check `.env`)
- Port conflict (change `BACKEND_PORT`)

### React Native Connection Issues

**For physical device or different network:**

1. Find your local IP:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

2. Update `frontend/lib/constants/configs.ts`:
```typescript
const ENV = {
  dev: {
    apiUrl: 'http://YOUR_LOCAL_IP:4000/api',
  },
};
```

3. Add your IP to backend CORS:
```bash
CORS_ORIGIN=http://192.168.1.X:8081,exp://192.168.1.X:8081
```

## Database Management

### Access Database

```bash
docker-compose exec postgres psql -U postgres -d cjsavings
```

### Backup Database

```bash
docker-compose exec postgres pg_dump -U postgres cjsavings > backup.sql
```

### Restore Database

```bash
docker-compose exec -T postgres psql -U postgres -d cjsavings < backup.sql
```

### Run Migrations

```bash
docker-compose exec backend npx prisma migrate dev --schema=src/prisma/schema.prisma
```

### Seed Database

```bash
docker-compose exec backend npm run seed
```

## Development Workflow

### Making Backend Changes

1. Edit code in `backend/src/`
2. Rebuild and restart:

```bash
docker-compose build backend
docker-compose restart backend
```

### Making Frontend Changes

Frontend runs on host, so changes are live with Expo:

```bash
cd frontend
npm start
```

### Database Schema Changes

1. Edit `backend/src/prisma/schema.prisma`
2. Create migration:

```bash
docker-compose exec backend npx prisma migrate dev --name your_migration_name
```

## Production Deployment

### Security Checklist

- [ ] Generate strong JWT secrets (32+ characters)
- [ ] Change database password
- [ ] Update CORS origins to production domains
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS
- [ ] Configure firewall rules
- [ ] Set up monitoring
- [ ] Enable refresh token rotation

### Deploy

```bash
cp .env.docker .env
# Edit .env with production values
docker-compose up -d
```

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
          │
          ▼
┌─────────────────────────────────────────┐
│   React Native App (Expo)               │
│   Port 8081                              │
└─────────────────────────────────────────┘
```

## Testing

```bash
cd backend
npm test
npm run test:coverage
```

## Support

For issues:
- Check logs: `docker-compose logs -f`
- Verify health: `docker-compose ps`
- Review backend docs: `backend/docs/`
