# Phase 5: Social & Community — Implementation Plan

## Overview

Add social features to Fitnassist: trainee public profiles with handles, granular privacy controls, a follow/friend system, activity feed with posts, likes, leaderboards, achievements/badges, and privacy settings throughout.

### Key Design Decisions

- **Follow for trainers** (one-way): trainees follow PTs to see their posts/updates in their feed
- **Friend requests for trainees** (mutual): both parties agree before seeing each other's shared content
- **Privacy model**: every piece of shareable data has a visibility level: `ONLY_ME | MY_PT | PT_AND_FRIENDS | EVERYONE`
- **Trainee handles**: trainees get unique handles for public profile URLs (`/users/:handle`)
- **Connected PTs**: PT access is controlled by the same privacy toggles (the `MY_PT` level)
- **Incremental build**: foundation first (profiles, privacy, follows/friends), then feed/posts, then leaderboards/achievements

---

## Phase 5.1: Trainee Public Profiles & Privacy Controls

### Goal
Give trainees public-facing profiles with handles and granular control over what's visible and to whom.

### Database Changes

#### TraineeProfile — new fields
```prisma
model TraineeProfile {
  // ... existing fields ...

  /// @zod.string.min(3).max(30).regex(/^[a-z0-9_-]+$/, { message: "Handle must be lowercase letters, numbers, hyphens, or underscores" })
  handle          String?   @unique

  // Privacy settings — each controls visibility of a data category
  // Values: ONLY_ME, MY_PT, PT_AND_FRIENDS, EVERYONE
  privacyBio              Visibility @default(EVERYONE)
  privacyLocation         Visibility @default(EVERYONE)
  privacyFitnessGoals     Visibility @default(EVERYONE)
  privacyDiaryActivity    Visibility @default(MY_PT)
  privacyProgressPhotos   Visibility @default(ONLY_ME)
  privacyWeight           Visibility @default(MY_PT)
  privacyMeasurements     Visibility @default(ONLY_ME)
  privacyGoals            Visibility @default(PT_AND_FRIENDS)
  privacyPersonalBests    Visibility @default(PT_AND_FRIENDS)
  privacyStats            Visibility @default(PT_AND_FRIENDS)
  privacyNutrition        Visibility @default(MY_PT)
}

enum Visibility {
  ONLY_ME
  MY_PT
  PT_AND_FRIENDS
  EVERYONE
}
```

**Notes:**
- `handle` is optional initially so existing trainees aren't forced to pick one immediately
- Remove the old `isPublic` boolean — replaced by the granular visibility system. A trainee is "public" if they have a handle and at least some fields set to `EVERYONE`
- Sensible defaults: basic info public, sensitive data (photos, weight, measurements) locked down

#### User — add handle at user level (for URL routing)
We need to decide: put `handle` on TraineeProfile or on User? Since trainers already have `handle` on TrainerProfile, and we route to `/users/:handle`, it makes sense to add `handle` to **User** so both roles share the same URL namespace and we avoid handle collisions between trainers and trainees.

Actually — trainers use `/trainers/:handle`. Trainees will use `/users/:handle`. These are different URL spaces, but we still need to avoid collisions if we ever unify. **Recommendation**: put `handle` on TraineeProfile (mirrors TrainerProfile pattern), use `/users/:handle` for trainees. Add a cross-model unique check in the service layer if desired later.

### Backend Changes

#### Repository: `trainee.repository.ts`
- `findByHandle(handle)` — find trainee profile by handle (with user relation)
- `isHandleAvailable(handle, excludeUserId?)` — check uniqueness
- `updatePrivacySettings(userId, settings)` — bulk update visibility fields

#### Service: `trainee.service.ts`
- `getPublicProfile(handle, viewerUserId?)` — returns trainee profile filtered by privacy settings relative to the viewer's relationship:
  1. Determine viewer relationship: `SELF | PT | FRIEND | PUBLIC`
  2. For each privacy field, check if the viewer's relationship meets the required visibility level
  3. Return only permitted fields (null out restricted ones)
- `setHandle(userId, handle)` — validate + set handle
- `updatePrivacySettings(userId, settings)` — update all privacy toggles
- `getPrivacySettings(userId)` — return current settings
- `checkHandleAvailability(handle)` — public check

**Visibility resolution logic:**
```
EVERYONE  → visible to: self, PT, friends, public
PT_AND_FRIENDS → visible to: self, PT, friends
MY_PT     → visible to: self, PT
ONLY_ME   → visible to: self only
```

Viewer relationship determination:
- `SELF`: viewer is the profile owner
- `PT`: viewer is a trainer with ACTIVE ClientRoster connection to this trainee
- `FRIEND`: viewer is a trainee with accepted mutual friendship (Phase 5.2)
- `PUBLIC`: anyone else (including logged-out users)

#### Router: `trainee.router.ts`
- `getByHandle` — public procedure, returns privacy-filtered profile
- `setHandle` — protected, trainee only
- `checkHandleAvailability` — public procedure
- `getPrivacySettings` — protected, trainee only
- `updatePrivacySettings` — protected, trainee only

### Frontend Changes

#### New: Trainee Public Profile Page
`apps/web/src/pages/trainee/public/index.tsx`

Route: `/users/:handle`

Components (mirror trainer public profile pattern):
```
pages/trainee/public/
├── index.tsx                    # Main page — fetch by handle, render sections
├── components/
│   ├── index.ts
│   ├── ProfileHeader/           # Avatar, name, handle, bio, location
│   │   └── index.tsx
│   ├── FitnessInfo/             # Goals, experience level, activity level
│   │   └── index.tsx
│   ├── RecentActivity/          # Recent diary entries (if visible)
│   │   └── index.tsx
│   ├── GoalsShowcase/           # Active goals + personal bests
│   │   └── index.tsx
│   ├── StatsOverview/           # High-level stats (if visible)
│   │   └── index.tsx
│   └── PrivateSection/          # "This section is private" placeholder
│       └── index.tsx
```

#### Updated: Privacy Settings Page
`apps/web/src/pages/trainee/profile/edit/components/tabs/PrivacyTab.tsx`

Replace the single `isPublic` toggle with a settings table:

| Setting | Options |
|---------|---------|
| Bio & About | Only Me / My PT / PT & Friends / Everyone |
| Location | Only Me / My PT / PT & Friends / Everyone |
| Fitness Goals | Only Me / My PT / PT & Friends / Everyone |
| Diary Activity | Only Me / My PT / PT & Friends / Everyone |
| Progress Photos | Only Me / My PT / PT & Friends / Everyone |
| Weight | Only Me / My PT / PT & Friends / Everyone |
| Measurements | Only Me / My PT / PT & Friends / Everyone |
| Goals & Personal Bests | Only Me / My PT / PT & Friends / Everyone |
| Stats & Summaries | Only Me / My PT / PT & Friends / Everyone |
| Nutrition | Only Me / My PT / PT & Friends / Everyone |

Use react-select dropdowns for each row (per feedback — never native HTML select).

#### Updated: Handle Setup
Add handle field to trainee profile edit page (or a dedicated setup prompt). Show availability check inline (debounced).

#### New: API hooks
```
apps/web/src/api/trainee/
├── useTraineeByHandle.ts
├── useCheckHandleAvailability.ts
├── usePrivacySettings.ts
├── useUpdatePrivacySettings.ts
```

### Migration Notes
- Migrate existing `isPublic: true` trainees → set their privacy fields to `EVERYONE` defaults
- Migrate existing `isPublic: false` trainees → keep the restrictive defaults above
- Drop `isPublic` field after migration

---

## Phase 5.2: Follow & Friend System

### Goal
Allow trainees to follow trainers (one-way) and send friend requests to other trainees (mutual).

### Database Changes

#### New: Follow model
```prisma
model Follow {
  id          String   @id @default(cuid())
  followerId  String   // User who is following
  followingId String   // User being followed (trainer)
  createdAt   DateTime @default(now())

  follower    User @relation("following", fields: [followerId], references: [id], onDelete: Cascade)
  following   User @relation("followers", fields: [followingId], references: [id], onDelete: Cascade)

  @@unique([followerId, followingId])
  @@index([followerId])
  @@index([followingId])
}
```

#### New: Friendship model
```prisma
model Friendship {
  id          String           @id @default(cuid())
  requesterId String           // User who sent the request
  addresseeId String           // User who received the request
  status      FriendshipStatus @default(PENDING)
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt

  requester   User @relation("friendRequestsSent", fields: [requesterId], references: [id], onDelete: Cascade)
  addressee   User @relation("friendRequestsReceived", fields: [addresseeId], references: [id], onDelete: Cascade)

  @@unique([requesterId, addresseeId])
  @@index([requesterId, status])
  @@index([addresseeId, status])
}

enum FriendshipStatus {
  PENDING
  ACCEPTED
  DECLINED
  BLOCKED
}
```

### Backend Changes

#### New: `follow.repository.ts`
- `create(followerId, followingId)`
- `delete(followerId, followingId)`
- `findFollowers(userId, cursor, limit)` — paginated
- `findFollowing(userId, cursor, limit)` — paginated
- `isFollowing(followerId, followingId)`
- `getFollowerCount(userId)`
- `getFollowingCount(userId)`

#### New: `friendship.repository.ts`
- `createRequest(requesterId, addresseeId)`
- `updateStatus(id, status)`
- `findFriends(userId, cursor, limit)` — accepted friendships, paginated
- `findPendingRequests(userId, cursor, limit)` — incoming pending
- `findSentRequests(userId, cursor, limit)` — outgoing pending
- `areFriends(userIdA, userIdB)`
- `getFriendCount(userId)`
- `delete(id)` — unfriend

#### New: `follow.service.ts`
- `followUser(followerId, followingId)` — validate target is a trainer, create follow
- `unfollowUser(followerId, followingId)`
- `getFollowers(userId, cursor, limit)`
- `getFollowing(userId, cursor, limit)`
- `isFollowing(followerId, followingId)`

#### New: `friendship.service.ts`
- `sendRequest(requesterId, addresseeId)` — validate both are trainees, no existing request, create + notify
- `acceptRequest(userId, requestId)` — validate addressee, update status + notify
- `declineRequest(userId, requestId)`
- `removeFriend(userId, friendshipId)` — unfriend
- `blockUser(userId, targetId)` — block + remove friendship if exists
- `unblockUser(userId, targetId)`
- `getFriends(userId, cursor, limit)`
- `getPendingRequests(userId, cursor, limit)`
- `getSentRequests(userId, cursor, limit)`
- `areFriends(userIdA, userIdB)`

#### New: `follow.router.ts`
- `follow` — protected mutation
- `unfollow` — protected mutation
- `getFollowers` — protected query (paginated)
- `getFollowing` — protected query (paginated)
- `isFollowing` — protected query
- `getFollowCounts` — public query (for profile display)

#### New: `friendship.router.ts`
- `sendRequest` — protected mutation
- `acceptRequest` — protected mutation
- `declineRequest` — protected mutation
- `removeFriend` — protected mutation
- `blockUser` — protected mutation
- `unblockUser` — protected mutation
- `getFriends` — protected query (paginated)
- `getPendingRequests` — protected query (paginated)
- `getSentRequests` — protected query (paginated)
- `areFriends` — protected query
- `getBlockedUsers` — protected query

#### SSE Events — new types
- `SseFriendRequestEvent` — notify addressee of incoming request
- `SseFriendAcceptedEvent` — notify requester when accepted
- `SseNewFollowerEvent` — notify trainer of new follower

#### Notifications — new types
Add to `NotificationType` enum:
- `FRIEND_REQUEST`
- `FRIEND_ACCEPTED`
- `NEW_FOLLOWER`

### Frontend Changes

#### New: Friends & Following pages
```
pages/dashboard/friends/
├── index.tsx                    # Tab layout: Friends | Requests | Following
├── components/
│   ├── index.ts
│   ├── FriendsList/             # List of accepted friends
│   │   └── index.tsx
│   ├── FriendRequests/          # Incoming + sent requests
│   │   └── index.tsx
│   ├── FollowingList/           # Trainers you follow
│   │   └── index.tsx
│   ├── UserCard/                # Reusable card for friend/follower display
│   │   └── index.tsx
│   └── FriendActionButton/      # Add friend / pending / friends / blocked
│       └── index.tsx
```

#### Updated: Trainer Public Profile
- Add "Follow" / "Following" button (toggle)
- Show follower count

#### Updated: Trainee Public Profile
- Add "Add Friend" / "Pending" / "Friends" button
- Show friend count (if privacy allows)
- Show mutual friends indicator

#### Updated: Dashboard sidebar
- Add "Friends" nav item with badge for pending requests

#### New: API hooks
```
apps/web/src/api/follow/
├── useFollow.ts
├── useUnfollow.ts
├── useFollowers.ts
├── useFollowing.ts
├── useIsFollowing.ts

apps/web/src/api/friendship/
├── useSendFriendRequest.ts
├── useAcceptFriendRequest.ts
├── useDeclineFriendRequest.ts
├── useRemoveFriend.ts
├── useFriends.ts
├── usePendingRequests.ts
├── useAreFriends.ts
```

#### Privacy Integration
- Update `trainee.service.ts` `getPublicProfile` to check `FRIEND` relationship via `friendship.repository.areFriends()`
- "Add Friend" button only visible on public profiles or when found via search
- Blocked users cannot view profile at all

---

## Phase 5.3: Posts, Feed & Likes

### Goal
Allow PTs and trainees to post updates, build an activity feed from posts + existing diary data, and enable likes/reactions.

### Database Changes

#### New: Post model
```prisma
model Post {
  id        String     @id @default(cuid())
  userId    String
  content   String     @db.Text
  imageUrl  String?
  type      PostType   @default(UPDATE)
  visibility Visibility @default(EVERYONE)
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt

  user      User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  likes     PostLike[]

  @@index([userId, createdAt])
  @@index([createdAt])
}

enum PostType {
  UPDATE          // General text/photo update
  ACHIEVEMENT     // Auto-generated from personal bests, goal completions
  MILESTONE       // Auto-generated from streaks, badges
}
```

#### New: PostLike model
```prisma
model PostLike {
  id        String   @id @default(cuid())
  postId    String
  userId    String
  createdAt DateTime @default(now())

  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([postId, userId])
  @@index([postId])
}
```

#### New: DiaryEntryLike model (likes on shared diary entries)
```prisma
model DiaryEntryLike {
  id           String     @id @default(cuid())
  diaryEntryId String
  userId       String
  createdAt    DateTime   @default(now())

  diaryEntry   DiaryEntry @relation(fields: [diaryEntryId], references: [id], onDelete: Cascade)
  user         User       @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([diaryEntryId, userId])
  @@index([diaryEntryId])
}
```

### Backend Changes

#### New: `post.repository.ts`
- `create(userId, data)`
- `findById(id)`
- `delete(id)`
- `getFeed(userId, cursor, limit)` — posts from followed users + friends, filtered by visibility
- `getUserPosts(userId, cursor, limit)` — posts by a specific user
- `like(postId, userId)` / `unlike(postId, userId)`
- `getLikeCount(postId)`
- `hasLiked(postId, userId)`

#### New: `post.service.ts`
- `createPost(userId, data)` — create + broadcast via SSE
- `deletePost(userId, postId)` — only own posts
- `getFeed(userId, cursor, limit)` — aggregate feed:
  1. Posts from followed trainers (all public posts)
  2. Posts from friends (respecting visibility)
  3. Shared diary entries from friends (respecting privacy settings)
  4. Own posts
  - Merge and sort by `createdAt` desc
  - Cursor-based pagination
- `getUserPosts(userId, viewerUserId)` — posts on a user's profile, filtered by relationship
- `likePost(userId, postId)` — like + notify post author
- `unlikePost(userId, postId)`
- `likeDiaryEntry(userId, diaryEntryId)` — like + notify entry owner

#### New: `post.router.ts`
- `create` — protected mutation
- `delete` — protected mutation
- `getFeed` — protected query (paginated)
- `getUserPosts` — protected query (paginated)
- `like` — protected mutation
- `unlike` — protected mutation
- `likeDiaryEntry` — protected mutation
- `unlikeDiaryEntry` — protected mutation

#### Feed Algorithm (simple for MVP)
```
SELECT from posts
WHERE (
  -- Posts from trainers I follow
  (userId IN (SELECT followingId FROM follows WHERE followerId = :me) AND visibility = 'EVERYONE')
  OR
  -- Posts from friends
  (userId IN (SELECT friendId FROM accepted_friendships WHERE userId = :me) AND visibility IN ('EVERYONE', 'PT_AND_FRIENDS'))
  OR
  -- My own posts
  userId = :me
)
ORDER BY createdAt DESC
LIMIT :limit
```

Diary entries in feed: separate query for friends' diary entries where their privacy setting for that entry type >= `PT_AND_FRIENDS`, merged client-side or via UNION.

#### SSE Events — new types
- `SseNewPostEvent` — broadcast to followers/friends
- `SsePostLikedEvent` — notify post author
- `SseDiaryEntryLikedEvent` — notify entry owner

#### Notifications — new types
- `POST_LIKED`
- `DIARY_ENTRY_LIKED`

### Frontend Changes

#### New: Feed Page
```
pages/dashboard/feed/
├── index.tsx                    # Main feed with infinite scroll
├── components/
│   ├── index.ts
│   ├── FeedItem/                # Polymorphic: post or diary entry
│   │   └── index.tsx
│   ├── PostCard/                # Text + optional image post
│   │   └── index.tsx
│   ├── DiaryFeedCard/           # Diary entry shared in feed
│   │   └── index.tsx
│   ├── CreatePostForm/          # Compose new post (text + image)
│   │   └── index.tsx
│   ├── LikeButton/              # Heart icon with count
│   │   └── index.tsx
│   └── FeedEmpty/               # Empty state with suggestions
│       └── index.tsx
```

#### Updated: Dashboard sidebar
- Add "Feed" nav item (above Messages)

#### New: API hooks
```
apps/web/src/api/post/
├── useCreatePost.ts
├── useDeletePost.ts
├── useFeed.ts                   # Infinite query
├── useUserPosts.ts
├── useLikePost.ts
├── useUnlikePost.ts
├── useLikeDiaryEntry.ts
```

---

## Phase 5.4: Leaderboards

### Goal
Gamify the platform with public and friend-group leaderboards.

### Database Changes

No new models needed — leaderboards are computed views over existing data (diary entries, steps, workouts, goals).

#### Leaderboard types (computed):
- **Steps** — total steps this week/month
- **Workouts** — total workouts this week/month
- **Streaks** — longest current diary streak
- **Goals Completed** — goals completed this month
- **Activity Duration** — total activity minutes this week/month

### Backend Changes

#### New: `leaderboard.service.ts`
- `getLeaderboard(type, period, scope, userId)` — compute rankings
  - `type`: STEPS | WORKOUTS | STREAKS | GOALS | ACTIVITY_DURATION
  - `period`: WEEKLY | MONTHLY | ALL_TIME
  - `scope`: GLOBAL | FRIENDS
  - For GLOBAL: only include users with `privacyStats = EVERYONE`
  - For FRIENDS: include accepted friends with `privacyStats >= PT_AND_FRIENDS`
- `getUserRank(userId, type, period, scope)` — where does this user rank
- `getOptInStatus(userId)` — is user opted into leaderboards
- `setOptInStatus(userId, optedIn)` — opt in/out

#### TraineeProfile — new field
```prisma
  leaderboardOptIn  Boolean @default(false)
```

Users must explicitly opt in to appear on global leaderboards. Friend leaderboards use privacy settings.

#### New: `leaderboard.router.ts`
- `getLeaderboard` — protected query
- `getUserRank` — protected query
- `getOptInStatus` — protected query
- `setOptInStatus` — protected mutation

### Frontend Changes

#### New: Leaderboards Page
```
pages/dashboard/leaderboards/
├── index.tsx                    # Tab layout: Global | Friends
├── components/
│   ├── index.ts
│   ├── LeaderboardTable/        # Ranked list with avatars
│   │   └── index.tsx
│   ├── LeaderboardFilters/      # Type + period selectors
│   │   └── index.tsx
│   ├── UserRankCard/            # "Your rank" highlight card
│   │   └── index.tsx
│   └── OptInPrompt/             # Prompt to opt in if not yet
│       └── index.tsx
```

#### Updated: Dashboard sidebar
- Add "Leaderboards" nav item

#### Updated: Privacy settings
- Add "Appear on leaderboards" toggle (maps to `leaderboardOptIn`)

---

## Phase 5.5: Achievements & Badges

### Goal
Reward users for milestones with visual badges they can showcase.

### Database Changes

#### New: Badge definition (config-driven, not DB)
Badge definitions live in a constants file — no DB table needed for the definitions themselves.

```typescript
// packages/schemas/src/constants/badges.constants.ts
type BadgeDefinition = {
  id: string;
  name: string;
  description: string;
  icon: string;           // Lucide icon name
  category: BadgeCategory;
  tier: 'BRONZE' | 'SILVER' | 'GOLD';
  criteria: BadgeCriteria; // programmatic check
};
```

#### Badge categories:
- **CONSISTENCY**: streak-based (7-day streak, 30-day streak, 90-day streak)
- **STRENGTH**: personal bests (first PB, 10 PBs, 50 PBs)
- **ENDURANCE**: activity milestones (first run, 100km total, marathon distance)
- **NUTRITION**: food logging streaks, calorie goals met
- **SOCIAL**: first friend, 10 friends, first post, first like received
- **GOALS**: first goal completed, 5 goals, 10 goals

#### New: UserBadge model
```prisma
model UserBadge {
  id        String   @id @default(cuid())
  userId    String
  badgeId   String   // References badge definition constant
  earnedAt  DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, badgeId])
  @@index([userId])
}
```

#### TraineeProfile — new field
```prisma
  showcaseBadgeIds  String[]  @default([])  // Up to 5 badges to show on profile
```

### Backend Changes

#### New: `badge.service.ts`
- `checkAndAwardBadges(userId, triggerType)` — called after relevant events (diary entry created, goal completed, PB set, etc.)
  - Checks all badge criteria for the trigger type
  - Awards any newly earned badges
  - Sends notification + SSE event for each new badge
- `getUserBadges(userId)` — all earned badges
- `getShowcaseBadges(userId)` — badges selected for profile display
- `setShowcaseBadges(userId, badgeIds)` — update showcase (max 5)

#### New: `badge.router.ts`
- `getUserBadges` — protected query
- `getShowcaseBadges` — public query (for profile display)
- `setShowcaseBadges` — protected mutation
- `getAllBadgeDefinitions` — public query (for badge catalog)

#### Integration points — call `checkAndAwardBadges` from:
- `diary.service.ts` — after creating entries (streak badges, nutrition badges)
- `goal.service.ts` — after completing goals
- `personalBest.service.ts` (or diary service PB logic) — after new PBs
- `friendship.service.ts` — after accepting friend requests (social badges)
- `post.service.ts` — after creating posts, receiving likes

#### SSE Events
- `SseBadgeEarnedEvent` — notify user of new badge (celebratory UI)

#### Notifications
- `BADGE_EARNED`

### Frontend Changes

#### New: Achievements Page
```
pages/dashboard/achievements/
├── index.tsx                    # Badge grid with earned/locked states
├── components/
│   ├── index.ts
│   ├── BadgeGrid/               # Grid of all badges grouped by category
│   │   └── index.tsx
│   ├── BadgeCard/               # Individual badge (earned/locked/progress)
│   │   └── index.tsx
│   ├── BadgeDetailDialog/       # Click badge for details + criteria
│   │   └── index.tsx
│   ├── ShowcaseEditor/          # Pick up to 5 badges for profile
│   │   └── index.tsx
│   └── BadgeEarnedToast/        # Celebratory notification
│       └── index.tsx
```

#### Updated: Trainee Public Profile
- Show showcase badges under the profile header

#### Updated: Dashboard sidebar
- Add "Achievements" nav item

---

## Phase 5.6: Privacy Controls (cross-cutting)

### Goal
Ensure all social features respect the privacy model and give trainees a single page to manage everything.

### Privacy Settings Page (consolidated)

The existing Privacy Tab in profile edit gets expanded into a full settings table:

| Category | Setting | Default | Options |
|----------|---------|---------|---------|
| **Profile** | Bio & About | Everyone | Only Me / My PT / PT & Friends / Everyone |
| | Location | Everyone | Only Me / My PT / PT & Friends / Everyone |
| | Fitness Goals | Everyone | Only Me / My PT / PT & Friends / Everyone |
| **Activity** | Diary Activity | My PT | Only Me / My PT / PT & Friends / Everyone |
| | Progress Photos | Only Me | Only Me / My PT / PT & Friends / Everyone |
| | Weight | My PT | Only Me / My PT / PT & Friends / Everyone |
| | Measurements | Only Me | Only Me / My PT / PT & Friends / Everyone |
| | Nutrition | My PT | Only Me / My PT / PT & Friends / Everyone |
| **Goals & Stats** | Goals & Personal Bests | PT & Friends | Only Me / My PT / PT & Friends / Everyone |
| | Stats & Summaries | PT & Friends | Only Me / My PT / PT & Friends / Everyone |
| **Social** | Appear on Leaderboards | Off (opt-in) | Toggle |
| | Show Friend Count | PT & Friends | Only Me / My PT / PT & Friends / Everyone |
| | Show Badges | Everyone | Only Me / My PT / PT & Friends / Everyone |

### Enforcement

Privacy must be enforced at the **API layer**, not just the frontend:

1. **Profile viewing** (`trainee.getByHandle`): filter response fields based on viewer relationship
2. **Feed generation** (`post.getFeed`): only include diary entries/posts where viewer meets visibility threshold
3. **Leaderboards** (`leaderboard.getLeaderboard`): exclude users not opted in or without sufficient `privacyStats`
4. **Friend list** (`friendship.getFriends`): respect `showFriendCount` setting
5. **Badge showcase** (`badge.getShowcaseBadges`): respect `showBadges` setting

### Blocked Users
- Blocked users cannot: view profile, send friend requests, see in leaderboards, see posts in feed
- Check block status in all relevant queries

---

## Implementation Order

Build incrementally in this order:

1. **5.1 Trainee Profiles & Privacy** — handle system, privacy settings, public profile page
2. **5.2 Follow & Friends** — follow trainers, friend requests between trainees
3. **5.3 Posts & Feed** — create posts, activity feed, likes
4. **5.4 Leaderboards** — computed rankings with opt-in
5. **5.5 Achievements & Badges** — badge definitions, awarding, showcase
6. **5.6 Privacy hardening** — audit all endpoints, ensure enforcement

Each sub-phase is independently deployable — the system works after each step.

---

## Files to Create

| File | Purpose |
|------|---------|
| `apps/api/src/repositories/follow.repository.ts` | Follow data access |
| `apps/api/src/repositories/friendship.repository.ts` | Friendship data access |
| `apps/api/src/repositories/post.repository.ts` | Post data access |
| `apps/api/src/services/follow.service.ts` | Follow business logic |
| `apps/api/src/services/friendship.service.ts` | Friendship business logic |
| `apps/api/src/services/post.service.ts` | Post + feed business logic |
| `apps/api/src/services/leaderboard.service.ts` | Leaderboard computation |
| `apps/api/src/services/badge.service.ts` | Badge checking + awarding |
| `apps/api/src/routers/follow.router.ts` | Follow endpoints |
| `apps/api/src/routers/friendship.router.ts` | Friendship endpoints |
| `apps/api/src/routers/post.router.ts` | Post + feed endpoints |
| `apps/api/src/routers/leaderboard.router.ts` | Leaderboard endpoints |
| `apps/api/src/routers/badge.router.ts` | Badge endpoints |
| `packages/schemas/src/constants/badges.constants.ts` | Badge definitions |
| `packages/types/src/badge.types.ts` | Badge TypeScript types |
| `apps/web/src/pages/trainee/public/index.tsx` | Trainee public profile |
| `apps/web/src/pages/dashboard/feed/index.tsx` | Activity feed |
| `apps/web/src/pages/dashboard/friends/index.tsx` | Friends management |
| `apps/web/src/pages/dashboard/leaderboards/index.tsx` | Leaderboard views |
| `apps/web/src/pages/dashboard/achievements/index.tsx` | Badge collection |
| `apps/web/src/api/follow/*` | Follow API hooks |
| `apps/web/src/api/friendship/*` | Friendship API hooks |
| `apps/web/src/api/post/*` | Post + feed API hooks |
| `apps/web/src/api/leaderboard/*` | Leaderboard API hooks |
| `apps/web/src/api/badge/*` | Badge API hooks |

## Files to Modify

| File | Changes |
|------|---------|
| `packages/database/prisma/schema.prisma` | Add Follow, Friendship, Post, PostLike, DiaryEntryLike, UserBadge models; add Visibility enum; add privacy fields + handle to TraineeProfile |
| `packages/types/src/sse.types.ts` | Add new SSE event types |
| `apps/api/src/routers/_app.ts` | Register new routers |
| `apps/api/src/repositories/trainee.repository.ts` | Add findByHandle, privacy queries |
| `apps/api/src/services/trainee.service.ts` | Add public profile logic with privacy filtering |
| `apps/api/src/routers/trainee.router.ts` | Add handle + privacy endpoints |
| `apps/api/src/services/diary.service.ts` | Call badge checker, support diary likes |
| `apps/api/src/services/goal.service.ts` | Call badge checker on goal completion |
| `apps/web/src/App.tsx` | Add new routes |
| `apps/web/src/pages/trainee/profile/edit/components/tabs/PrivacyTab.tsx` | Rebuild with granular controls |
| `apps/web/src/components/layouts/DashboardLayout/*` | Add sidebar nav items (Feed, Friends, Leaderboards, Achievements) |
| `apps/web/src/hooks/useSse/useSseEvents.ts` | Handle new SSE event types |
