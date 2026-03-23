---
name: typecheck
description: Run TypeScript type checking across the project. Use after making code changes to verify types are correct.
allowed-tools: Bash, Read, Edit
---

# TypeScript Type Checking

Run TypeScript compiler to check for type errors across the monorepo.

## When to Use

- After making code changes
- Before committing code
- After refactoring
- When fixing type errors reported in the UI

## Commands

### Full project typecheck:
```bash
npm run typecheck
```

### Web app only:
```bash
cd apps/web && npx tsc --noEmit
```

### API only:
```bash
cd apps/api && npx tsc --noEmit
```

## Process

1. **Run typecheck**: Execute `npm run typecheck`
2. **Filter known issues**: Ignore `packages/database/src/generated/zod` errors (generated file issue)
3. **Parse errors**: Identify file paths, line numbers, and error messages
4. **Fix each error**: Read the file, understand the issue, apply fix
5. **Re-run**: Verify all errors are resolved

## Filtering Output

The generated Zod schemas have known Prisma namespace issues. Filter them:
```bash
npm run typecheck 2>&1 | grep -v "packages/database/src/generated/zod"
```

## Common Type Errors & Fixes

| Error | Fix |
|-------|-----|
| `Property 'x' does not exist` | Add to interface or check spelling |
| `Type 'X' is not assignable to type 'Y'` | Update type annotation or cast |
| `Cannot find name 'X'` | Add import statement |
| `Argument of type 'X' is not assignable` | Fix function parameter type |
| `Object is possibly 'undefined'` | Add null check or optional chaining |

## Example Fix Workflow

```typescript
// Error: Property 'count' does not exist on type 'undefined'
// Line: const count = data.count;

// Fix: Add optional chaining and default
const count = data?.count ?? 0;
```

## After Fixing

Always re-run typecheck to confirm all errors resolved before marking task complete.
