# Fitnassist - Claude Code Guidelines

This document contains code style preferences and project conventions for Claude Code to follow when working on this codebase.

## Project Overview

Fitnassist is a platform connecting Personal Trainers, Gyms, and Trainees. The MVP focuses on:
- PT discovery with location-based search
- PT profile management
- Contact forms and callback requests
- Newsletter signup

## Tech Stack

| Layer | Technology |
|-------|------------|
| Monorepo | npm workspaces |
| Frontend | React 18 + TypeScript + Vite |
| Routing | React Router v6 |
| Data Fetching | TanStack Query + tRPC client |
| Forms | React Hook Form + Zod |
| Styling | Tailwind CSS + shadcn/ui |
| Backend | Express + tRPC |
| Database | Prisma + PostgreSQL |
| Auth | Better Auth (planned) |

## Schema Management

**IMPORTANT**: Zod schemas are generated from Prisma schema using `zod-prisma-types`.

- **Single source of truth**: `packages/database/prisma/schema.prisma`
- **Generated Zod schemas**: `packages/database/src/generated/zod/`
- **Form-specific schemas**: `packages/schemas/src/forms/` (for schemas not mapping to DB models, like login/register with password fields)

To add validation to a Prisma field, use `/// @zod` comments:
```prisma
model User {
  /// @zod.string.email({ message: "Please enter a valid email" })
  email String @unique
}
```

After changing the Prisma schema, run:
```bash
npm run db:generate
```

## UI Components

We use **shadcn/ui** for UI components. Components live in `src/components/ui/`.

- Use shadcn components (Button, Input, Card, etc.) from `@/components/ui`
- Add new shadcn components using the CLI or manually copying from shadcn.com
- Theme colors are defined in `src/styles/globals.css` using CSS variables
- Use Lucide icons from `lucide-react`

```typescript
import { Button, Card, Input } from '@/components/ui';
import { MapPin, CheckCircle } from 'lucide-react';
```

## Code Style Preferences

### General Principles
- Files should do ONE thing only
- Separate concerns: constants, utils, types, hooks all get their own files
- Use barrel exports (index.ts) in every folder
- Prefer editing existing files over creating new ones
- No emojis in code unless explicitly requested
- **Use arrow functions** - Always prefer `export const Component = () => {}` over `export function Component() {}`
- Keep components small - extract sub-components, hooks, utils, constants as needed

### Naming Conventions
- **Components**: PascalCase (`LoginForm.tsx`)
- **Hooks**: camelCase with `use` prefix (`useAuth.ts`)
- **Utils/Helpers**: camelCase (`formatDate.ts`)
- **Types**: camelCase with `.types.ts` suffix (`auth.types.ts`)
- **Constants**: camelCase with `.constants.ts` suffix (`auth.constants.ts`)
- **Schemas**: camelCase with `.schema.ts` suffix (`login.schema.ts`)

## Folder Structure

### Root Structure
```
fitnassist/
├── apps/
│   ├── web/                      # React frontend
│   └── api/                      # Express + tRPC backend
├── packages/
│   ├── database/                 # Prisma schema + client
│   ├── schemas/                  # Zod schemas (shared validation)
│   ├── types/                    # Shared TypeScript types
│   ├── utils/                    # Shared utilities
│   └── ui/                       # Shared UI components (future)
├── CLAUDE.md                     # Claude Code guidelines
├── package.json                  # Workspace root
└── tsconfig.base.json
```

### Frontend (`apps/web/`)
```
apps/web/src/
├── components/               # GLOBAL/REUSABLE components only
│   ├── ui/                   # shadcn components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   └── index.ts
│   ├── layouts/              # Layout components
│   │   ├── MainLayout/
│   │   ├── DashboardLayout/
│   │   └── index.ts
│   └── index.ts
│
├── pages/
│   ├── auth/
│   │   ├── login/
│   │   │   ├── components/       # Page-specific components
│   │   │   │   ├── LoginForm/
│   │   │   │   │   ├── index.tsx
│   │   │   │   │   ├── LoginForm.types.ts
│   │   │   │   │   ├── LoginForm.test.tsx
│   │   │   │   │   └── LoginForm.hooks.ts
│   │   │   │   └── index.ts
│   │   │   ├── index.tsx         # Page component
│   │   │   ├── login.hooks.ts
│   │   │   └── login.types.ts
│   │   └── register/
│   ├── dashboard/
│   │   ├── index/
│   │   ├── messages/
│   │   ├── requests/
│   │   └── contacts/
│   └── trainers/
│
├── hooks/                        # Global/generic hooks
│   ├── useDebounce/
│   ├── useLocalStorage/
│   └── useMediaQuery/
│
├── api/                          # tRPC wrapper hooks
│   ├── trainer/
│   ├── auth/
│   └── contact/
│
├── types/                        # App-specific types
├── lib/                          # Third-party setup (trpc, auth)
├── config/                       # Routes, env vars
├── test/                         # Test utilities
├── styles/
├── App.tsx
└── main.tsx
```

### Backend (`apps/api/`)
```
apps/api/src/
├── routers/                      # tRPC routers (HTTP layer)
│   ├── trainer.router.ts
│   ├── auth.router.ts
│   ├── contact.router.ts
│   ├── message.router.ts
│   ├── _app.ts                   # Root router
│   └── index.ts
│
├── services/                     # Business logic
│   ├── trainer.service.ts
│   ├── auth.service.ts
│   ├── contact.service.ts
│   └── message.service.ts
│
├── repositories/                 # Data access (Prisma)
│   ├── trainer.repository.ts
│   ├── user.repository.ts
│   ├── contact.repository.ts
│   └── message.repository.ts
│
├── middleware/
├── lib/
│   ├── prisma.ts
│   ├── trpc.ts
│   └── auth.ts
├── config/
├── types/
└── server.ts
```

### Shared Packages

#### `packages/database/`
```
packages/database/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── src/
│   ├── client.ts
│   ├── generated/zod/           # Auto-generated Zod schemas
│   └── index.ts
└── package.json
```

#### `packages/schemas/`
```
packages/schemas/src/
├── forms/
│   ├── login.schema.ts
│   ├── register.schema.ts
│   └── index.ts
└── index.ts
```

### Component Location Rules

| Component Type | Location | Example |
|----------------|----------|---------|
| Global/Reusable | `src/components/` | Button, Modal, layouts |
| Page-specific | `src/pages/[route]/components/` | LoginForm, TrainerCard |

**Promotion Rule**: If a page-specific component is needed on multiple pages, move it to `src/components/`.

### File Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Component | `index.tsx` in folder | `Button/index.tsx` |
| Types | `*.types.ts` | `Button.types.ts` |
| Hooks | `*.hooks.ts` or `use*.ts` | `useAuth.ts` |
| Utils | `*.utils.ts` | `messages.utils.ts` |
| Constants | `*.constants.ts` | `messages.constants.ts` |
| Tests | `*.test.tsx` | `LoginForm.test.tsx` |
| Schemas | `*.schema.ts` | `login.schema.ts` |

### Component File Extraction Pattern
When a page or component grows large, extract into smaller files:
```
pages/dashboard/messages/
├── index.tsx                    # Main page component
├── messages.constants.ts        # Polling intervals, magic strings
├── messages.types.ts            # TypeScript types/interfaces
├── messages.utils.ts            # Pure utility functions
├── hooks/
│   ├── index.ts                 # Barrel export
│   ├── useMessages.ts           # Data fetching hooks
│   └── useSendMessage.ts        # Mutation hooks
└── components/
    ├── index.ts                 # Barrel export
    ├── ConversationList/
    │   └── index.tsx
    ├── MessageThread/
    │   └── index.tsx
    └── EmptyThread/
        └── index.tsx
```

### Barrel Exports
Every folder gets an `index.ts` that re-exports its contents:
```typescript
// components/layouts/index.ts
export { DashboardLayout } from './DashboardLayout';
export type { DashboardContext } from './DashboardLayout';
```

### Import Preferences
- Use `@/` alias for absolute imports from `src/`
- Import from barrel exports where possible
- Keep imports organized: external packages first, then internal

```typescript
// External
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { MapPin } from 'lucide-react';

// Internal - UI components
import { Button, Card, Input } from '@/components/ui';

// Internal - API/hooks
import { useLogin } from '@/api/auth';

// Internal - schemas/types
import { loginFormSchema } from '@fitnassist/schemas';
import type { User } from '@fitnassist/types';
```

### tRPC + React Query Pattern
- Use wrapper hooks for tRPC calls (not direct `trpc.x.y.useQuery()` in components)
- Wrapper hooks live in `src/api/{domain}/`
- Keep hooks simple and focused

```typescript
// src/api/trainer/useTrainer.ts
import { trpc } from '@/lib/trpc';

export const useTrainerByHandle = (handle: string) => {
  return trpc.trainer.getByHandle.useQuery(
    { handle },
    { enabled: !!handle }
  );
};
```

### Form Handling
- Use generated Zod schemas from `@fitnassist/database` for model validation
- Use form-specific schemas from `@fitnassist/schemas` for auth forms, search forms, etc.
- Use React Hook Form with `@hookform/resolvers/zod`
- Form components receive `onSubmit` callback, handle their own loading/error states

### Testing
- Tests are colocated with the code they test
- `ComponentName.test.tsx` next to `index.tsx`
- Use descriptive test names

## Commands

```bash
# Development
npm run dev           # Run all apps
npm run dev:web       # Run frontend only
npm run dev:api       # Run backend only

# Database
npm run db:generate   # Generate Prisma client + Zod schemas
npm run db:migrate    # Run migrations
npm run db:push       # Push schema changes
npm run db:studio     # Open Prisma Studio
npm run db:seed       # Seed database

# Build
npm run build         # Build all apps
npm run typecheck     # Type check all packages

# Other
npm run clean         # Remove node_modules and build artifacts
```

## Database

- PostgreSQL with Prisma ORM
- Schema in `packages/database/prisma/schema.prisma`
- Zod schemas auto-generated with `zod-prisma-types`
- Use repository pattern for data access
- Never import Prisma client directly in frontend

## Error Handling

- Use tRPC errors for API errors (`throw new TRPCError({...})`)
- Frontend should handle loading/error states gracefully
- Always show user-friendly error messages

## React Router Patterns

### useOutletContext Limitation
**IMPORTANT**: `useOutletContext()` only works in the DIRECT child of an `<Outlet>`, NOT in nested components.

```typescript
// ❌ WRONG - nested component tries to use useOutletContext
const DashboardPage = () => {
  return <TrainerDashboard />;  // This nested component cannot call useOutletContext
};

const TrainerDashboard = () => {
  const { badgeCounts } = useOutletContext();  // This will NOT work!
  return <div>...</div>;
};

// ✅ CORRECT - direct child gets context and passes as props
const DashboardPage = () => {
  const { badgeCounts } = useOutletContext<DashboardContext>();
  return <TrainerDashboard badgeCounts={badgeCounts} />;
};
```

### Nested Route Guards Must Forward Context
When using nested layout/guard routes, intermediate components must forward the outlet context:

```typescript
// ❌ WRONG - guard breaks context chain
const OnboardingGuard = () => {
  if (needsOnboarding) return <Navigate to="/setup" />;
  return <Outlet />;  // Context from parent is lost!
};

// ✅ CORRECT - guard forwards context
const OnboardingGuard = () => {
  const context = useOutletContext();  // Get context from parent
  if (needsOnboarding) return <Navigate to="/setup" />;
  return <Outlet context={context} />;  // Pass to children
};
```

### Polling Intervals
Keep polling intervals consistent across related data to avoid UI sync issues:
- Badge counts: 5 seconds
- Connections list: 5 seconds
- Active message thread: 2 seconds

## Claude Code Guidelines

- **Never assume, never guess** - If unsure about approach, coding style, or tools to use, ask first
- **Use agents to investigate** - For exploring the codebase or researching implementation approaches
- **Refer to the plan** - Check existing plans before starting implementation
- **Follow folder structures** - Adhere to the established project structure documented above
- **Ask questions** - When multiple valid approaches exist, ask which is preferred
- **Always verify your work** - After implementing API changes or new endpoints, test them with curl or similar to confirm they work. Don't assume configuration changes take effect without verification.

## Environment Variables

- API: `apps/api/.env` (copy from `.env.example`)
- Web: `apps/web/.env` (copy from `.env.example`)
- Never commit `.env` files
- All env vars must be validated with Zod

## Adding New Features

1. Update Prisma schema if needed (with `/// @zod` annotations)
2. Run `npm run db:generate` to regenerate schemas
3. Add form-specific schemas to `packages/schemas/` if needed
4. Create repository in `apps/api/src/repositories/`
5. Create service in `apps/api/src/services/`
6. Add tRPC router in `apps/api/src/routers/`
7. Create API wrapper hook in `apps/web/src/api/`
8. Build page/components using shadcn/ui
