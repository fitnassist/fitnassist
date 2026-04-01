# Fitnassist

[![CI](https://github.com/fitnassist/fitnassist/actions/workflows/ci.yml/badge.svg)](https://github.com/fitnassist/fitnassist/actions/workflows/ci.yml)
[![Node](https://img.shields.io/badge/node-24-brightgreen)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/typescript-5.7-blue)](https://www.typescriptlang.org)
[![React](https://img.shields.io/badge/react-19.2-61dafb)](https://react.dev)
[![Prisma](https://img.shields.io/badge/prisma-6-2d3748)](https://www.prisma.io)
[![Playwright](https://img.shields.io/badge/e2e-playwright-45ba4b)](https://playwright.dev)
[![Code Style: Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4)](https://prettier.io)
[![License](https://img.shields.io/badge/license-UNLICENSED-red)](#)

A platform connecting Personal Trainers, Gyms, and Trainees.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Monorepo | npm workspaces |
| Frontend | React + TypeScript + Vite |
| Mobile | React Native + Expo |
| Routing | React Router v6 |
| Data Fetching | TanStack Query + tRPC |
| Forms | React Hook Form + Zod |
| Styling | Tailwind CSS + shadcn/ui |
| Backend | Express + tRPC |
| Database | Prisma + PostgreSQL |
| Auth | Better Auth |
| E2E Testing | Playwright + axe-core |
| Unit Testing | Vitest + Testing Library |
| CI/CD | GitHub Actions + Vercel |

## Structure

```
fitnassist/
├── apps/
│   ├── web/        # React frontend (Vite)
│   ├── api/        # Express + tRPC backend
│   └── mobile/     # React Native + Expo
├── packages/
│   ├── database/   # Prisma schema + client
│   ├── schemas/    # Shared Zod schemas
│   ├── types/      # Shared TypeScript types
│   └── utils/      # Shared utilities
└── .github/
    └── workflows/  # CI pipeline + cron jobs
```

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Generate Prisma client + Zod schemas
npm run db:generate

# Push schema to database
npm run db:push

# Seed database
npm run db:seed

# Start development
npm run dev
```

## Scripts

```bash
npm run dev           # Run all apps
npm run dev:web       # Frontend only
npm run dev:api       # Backend only
npm run dev:mobile    # Mobile only

npm run build         # Build all
npm run typecheck     # Typecheck all packages
npm run test          # Unit tests (all workspaces)

npm run db:generate   # Prisma client + Zod schemas
npm run db:migrate    # Run migrations
npm run db:push       # Push schema changes
npm run db:studio     # Open Prisma Studio
npm run db:seed       # Seed database
```

## Testing

```bash
# Unit tests
npm run test -w @fitnassist/web

# E2E tests
npm run e2e -w @fitnassist/web
npm run e2e:ui -w @fitnassist/web    # With UI
npm run e2e:headed -w @fitnassist/web # Headed mode

# Formatting
npm run format:check -w @fitnassist/web
npm run format -w @fitnassist/web

# Linting
npm run lint -w @fitnassist/web
```

## CI Pipeline

All PRs to `main` must pass:

- **Format** -- Prettier check
- **Lint** -- ESLint (zero errors)
- **Typecheck** -- TypeScript strict mode
- **Unit Tests** -- Vitest (197 tests)
- **E2E Tests** -- Playwright + accessibility (axe-core)
