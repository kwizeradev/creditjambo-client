FROM node:22-alpine AS base

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./
COPY prisma.config.ts ./

FROM base AS dependencies

RUN npm ci && \
    npm cache clean --force

FROM base AS build

ENV DATABASE_URL="postgresql://placeholder:placeholder@placeholder:5432/placeholder"

COPY --from=dependencies /app/node_modules ./node_modules
COPY src ./src

RUN npm run db:generate && \
    npm run build

FROM base AS production-deps

RUN npm ci --only=production && \
    npm cache clean --force

FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY --from=production-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/src/generated ./dist/generated
COPY src/prisma/schema.prisma ./src/prisma/schema.prisma
COPY src/prisma/seed.js ./src/prisma/seed.js
COPY package.json ./

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "dist/server.js"]
