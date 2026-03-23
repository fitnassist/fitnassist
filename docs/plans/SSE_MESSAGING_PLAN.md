# SSE Real-Time Messaging Implementation Plan

## Overview

Replace polling-based message updates with Server-Sent Events (SSE) for real-time messaging. This will reduce server load from 60-150 requests/minute per user to near-zero for idle connections.

## Current State

- **Polling intervals**: 5s for conversation list, 2s for active thread
- **Files involved**:
  - `apps/web/src/pages/dashboard/messages/hooks/useMessages.ts`
  - `apps/web/src/pages/dashboard/messages/messages.constants.ts`
  - `apps/api/src/routers/message.router.ts`
  - `apps/api/src/services/message.service.ts`

## Implementation Steps

### Phase 1: Backend SSE Infrastructure

#### 1.1 Create SSE Connection Manager
**File**: `apps/api/src/lib/sse.ts`

```typescript
// Manages active SSE connections per user
// - Map of userId -> Set of Response objects
// - Methods: addConnection, removeConnection, broadcast
// - Heartbeat to keep connections alive (every 30s)
// - Cleanup on disconnect
```

**Tasks**:
- [ ] Create `SseConnectionManager` class
- [ ] Implement `addConnection(userId: string, res: Response)`
- [ ] Implement `removeConnection(userId: string, res: Response)`
- [ ] Implement `broadcastToUser(userId: string, event: string, data: object)`
- [ ] Implement `broadcastToUsers(userIds: string[], event: string, data: object)`
- [ ] Add heartbeat interval to prevent connection timeout
- [ ] Handle connection cleanup on client disconnect

#### 1.2 Create SSE Endpoint
**File**: `apps/api/src/routes/sse.ts`

```typescript
// GET /api/sse/messages
// - Authenticate user via Better Auth session
// - Set SSE headers (Content-Type: text/event-stream, etc.)
// - Register connection with manager
// - Handle disconnect cleanup
```

**Tasks**:
- [ ] Create Express router for SSE
- [ ] Implement authentication middleware (reuse from tRPC context)
- [ ] Set correct SSE headers
- [ ] Register connection on connect
- [ ] Clean up on `req.on('close')`

#### 1.3 Register SSE Route
**File**: `apps/api/src/app.ts`

**Tasks**:
- [ ] Import SSE router
- [ ] Mount at `/api/sse`

#### 1.4 Broadcast on Message Events
**File**: `apps/api/src/services/message.service.ts`

**Tasks**:
- [ ] Import SSE manager
- [ ] After `sendMessage`: broadcast `new_message` to both participants
- [ ] After `markAsRead`: broadcast `messages_read` to sender
- [ ] Include relevant data in broadcast (message, connectionId, etc.)

### Phase 2: Frontend SSE Integration

#### 2.1 Create SSE Hook
**File**: `apps/web/src/pages/dashboard/messages/hooks/useSseSubscription.ts`

```typescript
// Manages SSE connection lifecycle
// - Connect on mount, disconnect on unmount
// - Parse incoming events
// - Reconnect with exponential backoff on error
// - Return connection status
```

**Tasks**:
- [ ] Create `useSseSubscription` hook
- [ ] Use `EventSource` API with credentials
- [ ] Handle `message` events and parse JSON
- [ ] Implement reconnection logic with backoff
- [ ] Return `{ isConnected, lastEvent, error }`

#### 2.2 Create Message Event Handler
**File**: `apps/web/src/pages/dashboard/messages/hooks/useMessageEvents.ts`

```typescript
// Handles incoming SSE message events
// - Updates React Query cache directly
// - Handles new_message, messages_read events
// - Plays notification sound (optional)
```

**Tasks**:
- [ ] Create `useMessageEvents` hook
- [ ] Listen for SSE events from `useSseSubscription`
- [ ] On `new_message`: update thread cache, update connections cache, update unread count
- [ ] On `messages_read`: update read status in cache
- [ ] Use `trpc.useUtils()` for cache manipulation

#### 2.3 Update useMessages Hook
**File**: `apps/web/src/pages/dashboard/messages/hooks/useMessages.ts`

**Tasks**:
- [ ] Import and use `useSseSubscription`
- [ ] Import and use `useMessageEvents`
- [ ] Remove `refetchInterval` from queries when SSE is connected
- [ ] Keep polling as fallback when SSE disconnected
- [ ] Update `useConnections` to not poll when SSE active
- [ ] Update `useThread` to not poll when SSE active

#### 2.4 Update Barrel Export
**File**: `apps/web/src/pages/dashboard/messages/hooks/index.ts`

**Tasks**:
- [ ] Export new hooks

### Phase 3: Event Types & Payloads

#### 3.1 Define Event Types
**File**: `packages/types/src/sse.types.ts` (or in messages.types.ts)

```typescript
export type SseMessageEvent =
  | { type: 'new_message'; data: { connectionId: string; message: Message } }
  | { type: 'messages_read'; data: { connectionId: string; readBy: string } }
  | { type: 'connection_accepted'; data: { connectionId: string } }
  | { type: 'heartbeat'; data: { timestamp: number } };
```

**Tasks**:
- [ ] Define SSE event types
- [ ] Share types between frontend and backend

### Phase 4: Testing & Reliability

#### 4.1 Connection Resilience
**Tasks**:
- [ ] Test reconnection on network loss
- [ ] Test multiple browser tabs (multiple connections per user)
- [ ] Test server restart (clients should reconnect)
- [ ] Verify memory cleanup on disconnect

#### 4.2 Fallback Behavior
**Tasks**:
- [ ] Verify polling resumes when SSE fails
- [ ] Test SSE behind corporate proxies (may need polling fallback)
- [ ] Add connection status indicator (optional)

#### 4.3 Load Testing
**Tasks**:
- [ ] Test with 100+ concurrent connections
- [ ] Monitor memory usage
- [ ] Verify heartbeat keeps connections alive

### Phase 5: Cleanup & Optimization

#### 5.1 Remove Unused Code
**Tasks**:
- [ ] Remove or reduce polling intervals in constants
- [ ] Update any documentation

#### 5.2 Optional Enhancements
**Tasks**:
- [ ] Add typing indicators (user is typing...)
- [ ] Add online/offline presence
- [ ] Add notification sound for new messages
- [ ] Add unread badge updates via SSE

## File Summary

### New Files
| File | Purpose |
|------|---------|
| `apps/api/src/lib/sse.ts` | SSE connection manager |
| `apps/api/src/routes/sse.ts` | SSE endpoint |
| `apps/web/src/pages/dashboard/messages/hooks/useSseSubscription.ts` | SSE connection hook |
| `apps/web/src/pages/dashboard/messages/hooks/useMessageEvents.ts` | Event handler hook |

### Modified Files
| File | Changes |
|------|---------|
| `apps/api/src/app.ts` | Register SSE route |
| `apps/api/src/services/message.service.ts` | Broadcast on send/read |
| `apps/web/src/pages/dashboard/messages/hooks/useMessages.ts` | Use SSE, fallback to polling |
| `apps/web/src/pages/dashboard/messages/hooks/index.ts` | Export new hooks |

## Estimated Effort

| Phase | Time |
|-------|------|
| Phase 1: Backend | 1 day |
| Phase 2: Frontend | 1 day |
| Phase 3: Types | 0.5 day |
| Phase 4: Testing | 0.5 day |
| Phase 5: Cleanup | Optional |
| **Total** | **2-3 days** |

## Rollback Plan

If issues arise in production:
1. Set `SSE_ENABLED=false` environment variable
2. Frontend falls back to polling automatically
3. No data loss - just temporary latency increase

## Future Enhancements

Once SSE is working, consider:
- **WebSockets for typing indicators**: SSE is one-way, typing needs bidirectional
- **Push notifications**: For mobile/background tabs
- **Message delivery receipts**: Confirm message received by recipient
