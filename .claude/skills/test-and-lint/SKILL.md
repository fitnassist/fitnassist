---
name: test-and-lint
description: Run tests and linting on the web app. Use to verify code quality before committing or after making changes.
allowed-tools: Bash, Read, Edit
---

# Tests and Linting

Run automated tests and linting to ensure code quality.

## When to Use

- After writing new code
- After refactoring existing code
- Before committing changes
- When verifying a feature is complete

## Commands

### Run all tests:
```bash
cd apps/web && npm run test
```

### Run tests in watch mode (for development):
```bash
cd apps/web && npm run test:watch
```

### Run tests with coverage:
```bash
cd apps/web && npm run test:coverage
```

### Run specific test file:
```bash
cd apps/web && npx vitest run src/pages/dashboard/messages/messages.utils.test.ts
```

### Run linting (if configured):
```bash
cd apps/web && npm run lint
```

## Test Structure

Tests are colocated with the code they test:
```
components/
├── LoginForm/
│   ├── index.tsx
│   └── LoginForm.test.tsx    # Test file next to component
```

## Writing Tests

Use Vitest with React Testing Library:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/utils';
import userEvent from '@testing-library/user-event';
import { MyComponent } from './index';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText(/expected text/i)).toBeInTheDocument();
  });

  it('should handle click', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<MyComponent onClick={onClick} />);

    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalled();
  });
});
```

## Common Test Issues

| Issue | Fix |
|-------|-----|
| `Cannot find module` | Check import paths, ensure `@/test/utils` is used |
| `act() warning` | Wrap state updates in `waitFor` or `act` |
| `Element not found` | Use correct query (getByRole, getByText, etc.) |
| `Mock not working` | Ensure `vi.mock()` is at top of file, before imports |

## Process

1. **Run tests**: Execute test suite
2. **Review failures**: Read error messages and stack traces
3. **Fix failing tests**: Update test or fix underlying code
4. **Re-run**: Verify all tests pass
5. **Check coverage**: Ensure new code is tested (aim for >80%)

## Test Utils Location

Custom render wrapper with providers is in `apps/web/src/test/utils.tsx`
Test setup is in `apps/web/src/test/setup.ts`
