# Dockerfile for Express API backend
FROM oven/bun:1 AS base
WORKDIR /app

# Copy root workspace configs & package definitions
COPY package.json bun.lock ./
COPY apps/api/package.json ./apps/api/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy API source code & Prisma schema
COPY apps/api ./apps/api

WORKDIR /app/apps/api

# Generate Prisma Client if schema exists
RUN bunx prisma generate

EXPOSE 5000

CMD ["bun", "run", "server.ts"]
