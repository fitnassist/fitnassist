# Plan: Phase 4.4 — Weekly Activity Reports

## Context

Trainers need visibility into their clients' weekly progress without manually checking each client. The app already has email infrastructure (Resend + HTML templates in `apps/api/src/lib/email-templates.ts`), notification preferences in the settings UI, and diary/goal data. This plan adds a weekly email report summarizing each client's activity, sent to trainers every Monday morning.

---

## 1. Database: Add notification preference

**`packages/database/prisma/schema.prisma`** — add to `User` model:
```prisma
emailNotifyWeeklyReport Boolean @default(true)
```

Run `npm run db:migrate` to create migration, then `npm run db:generate`.

---

## 2. Backend: Weekly report service

**New file: `apps/api/src/services/weekly-report.service.ts`**

Main function: `sendWeeklyReports()`
- Query all trainers where `emailNotifyWeeklyReport = true`
- For each trainer, get their active clients via `clientRosterRepository` (existing)
- For each client, gather last 7 days of data:
  - Diary entries via `diaryRepository.findByDateRange(userId, startDate, endDate)` (existing)
  - Goals completed via `goalRepository` (query goals where `status = 'COMPLETED'` and `updatedAt` in range)
- Build per-client summary: entry counts by type (weight, food, exercise, etc.), goals completed, streak info
- Skip trainers with zero client activity
- Send one email per trainer using Resend via `notificationService.sendEmail()` (existing pattern)

**Key reuse:**
- `apps/api/src/repositories/client-roster.repository.ts` — `findByTrainerUserId()` for client list
- `apps/api/src/repositories/diary.repository.ts` — `findByDateRange()` for diary data
- `apps/api/src/repositories/goal.repository.ts` — needs new method `findCompletedInRange(userId, start, end)`
- `apps/api/src/services/notification.service.ts` — `sendEmail()` for Resend integration
- `apps/api/src/lib/email-templates.ts` — `layout()` wrapper for consistent email styling

---

## 3. Backend: Email template

**`apps/api/src/lib/email-templates.ts`** — add `weeklyReport` template:

```typescript
export const weeklyReport = (data: {
  trainerName: string;
  weekStart: string; // "17 Mar 2026"
  weekEnd: string;   // "23 Mar 2026"
  clients: Array<{
    name: string;
    diaryEntries: number;
    weightEntries: number;
    foodEntries: number;
    exerciseEntries: number;
    goalsCompleted: number;
    totalGoals: number;
  }>;
  dashboardUrl: string;
}) => layout({ ... });
```

Email design:
- Subject: "Weekly Client Report — 17–23 Mar 2026"
- Header with date range
- Per-client card: name, diary entry counts by type, goals progress
- Highlight clients with zero activity (needs attention)
- CTA button linking to trainer dashboard

---

## 4. Backend: Cron endpoint

**New file: `apps/api/src/routes/cron.ts`** — Express router (not tRPC, since it's called by external cron)

```typescript
router.post('/api/cron/weekly-reports', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  await sendWeeklyReports();
  res.json({ ok: true });
});
```

**`apps/api/src/config/env.ts`** — add `CRON_SECRET` to env schema (optional, only needed in prod)

**`apps/api/src/server.ts`** — mount the cron router: `app.use(cronRouter)`

**External cron:** Use cron-job.org (free) to POST to `/api/cron/weekly-reports` every Monday at 7:00 UTC with Bearer token.

---

## 5. Goal repository: New query

**`apps/api/src/repositories/goal.repository.ts`** — add:
```typescript
findCompletedInRange(userId: string, start: Date, end: Date)
```
Query: `where: { userId, status: 'COMPLETED', updatedAt: { gte: start, lte: end } }`

---

## 6. Frontend: Notification preference toggle

**`packages/schemas/src/forms/notification-preferences.schema.ts`** — add `emailNotifyWeeklyReport` to schema

**`apps/web/src/pages/dashboard/settings/components/NotificationsTab/index.tsx`** — add toggle:
- Label: "Weekly client reports"
- Description: "Receive a weekly email summarizing your clients' activity"
- Only show for TRAINER role (check `user.role`)

**`apps/api/src/routers/user.router.ts`** — ensure `updateNotificationPreferences` mutation includes the new field

---

## Key Files

| File | Change |
|------|--------|
| `packages/database/prisma/schema.prisma` | Add `emailNotifyWeeklyReport` field |
| `apps/api/src/services/weekly-report.service.ts` | **New** — report generation + sending |
| `apps/api/src/routes/cron.ts` | **New** — POST endpoint for external cron |
| `apps/api/src/lib/email-templates.ts` | Add `weeklyReport` template |
| `apps/api/src/repositories/goal.repository.ts` | Add `findCompletedInRange` |
| `apps/api/src/config/env.ts` | Add `CRON_SECRET` |
| `apps/api/src/server.ts` | Mount cron router |
| `packages/schemas/src/forms/notification-preferences.schema.ts` | Add weekly report field |
| `apps/web/src/pages/dashboard/settings/components/NotificationsTab/index.tsx` | Add toggle (trainer only) |
| `apps/api/src/routers/user.router.ts` | Include new field in mutation |

---

## Implementation Order

1. DB migration + generate (schema change)
2. Goal repository method
3. Weekly report service
4. Email template
5. Cron endpoint + env config
6. Frontend notification toggle
7. Test end-to-end by calling cron endpoint manually

## Verification

- Run migration: `npm run db:migrate`
- Add `CRON_SECRET=test-secret` to `.env`
- Call endpoint: `curl -X POST http://localhost:3000/api/cron/weekly-reports -H "Authorization: Bearer test-secret"`
- Verify email received (check Resend dashboard or logs)
- Toggle preference off in settings → re-trigger → no email sent
- `npx tsc --noEmit` clean
