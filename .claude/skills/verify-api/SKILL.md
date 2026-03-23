---
name: verify-api
description: Verify that tRPC API endpoints are working correctly. Use after implementing or modifying API routes to confirm they work.
allowed-tools: Bash, Read, Grep
---

# API Endpoint Verification

Verify tRPC API endpoints work by making HTTP requests and checking responses.

## When to Use

- After creating new tRPC router procedures
- After modifying existing API endpoints
- After changing authentication middleware
- Before marking an API task as complete

## Process

1. **Check API server**: Ensure `npm run dev:api` is running (port 3001)
2. **Identify endpoints**: Find the tRPC procedures to test
3. **Test with curl**: Make requests to verify responses
4. **Check for errors**: Verify correct status codes and data

## Testing tRPC Endpoints

tRPC endpoints are at `http://localhost:3001/trpc/<router>.<procedure>`

### Query (GET) endpoints:
```bash
# Simple query
curl "http://localhost:3001/trpc/trainer.getByHandle?input=%7B%22handle%22%3A%22john%22%7D"

# Health check style
curl "http://localhost:3001/trpc/health.check"
```

### Mutation (POST) endpoints:
```bash
curl -X POST "http://localhost:3001/trpc/contact.submit" \
  -H "Content-Type: application/json" \
  -d '{"json":{"name":"Test","email":"test@example.com"}}'
```

### Protected endpoints:
Protected endpoints will return 401 UNAUTHORIZED when called without auth - this confirms the endpoint exists and auth is working:
```bash
curl "http://localhost:3001/trpc/message.getUnreadCount"
# Expected: {"error":{"code":"UNAUTHORIZED"...}}
```

## Expected Results

- **Success**: JSON response with `{"result":{"data":{...}}}`
- **Auth required**: `{"error":{"code":"UNAUTHORIZED"...}}` (confirms endpoint exists)
- **Not found**: 404 or path not found error (endpoint doesn't exist)
- **Validation error**: `{"error":{"code":"BAD_REQUEST"...}}` (input validation failed)

## Common Issues

1. **Server not running**: Start with `npm run dev:api`
2. **Old server instance**: Restart server after adding new routes
3. **Router not registered**: Check `apps/api/src/routers/_app.ts`
4. **Wrong HTTP method**: Queries use GET, mutations use POST
