# Fitnassist Project Plan

## Overview

Fitnassist is a platform connecting Personal Trainers, Gyms, and Trainees. The MVP has been completed and launched, establishing the core platform: PT discovery with location-based search, profile management, connection requests, in-app messaging, and email notifications.

This document outlines the post-MVP roadmap. The strategy is to build out features first to grow the user base, then layer in payments and subscriptions once there's traction.

## MVP (Completed)

For reference, the following is live:
- Landing page with newsletter signup
- Find a Trainer with location search and map
- PT public profiles with unique handles
- Email/password + Google OAuth authentication
- Email verification and password reset
- Trainee and trainer dashboards
- Connection request system (request, accept, decline)
- Callback request system
- In-app messaging between connected users
- Unread message badges and counts
- Profile view analytics
- Email notifications (new requests, messages)
- Account settings (change email, password, notification prefs, delete account)
- Privacy policy, terms of service, support form

## User Types

| User Type | Description | Status |
|-----------|-------------|--------|
| **Trainee** | People looking for personal trainers. Free to use. | Live |
| **Personal Trainer** | Fitness professionals managing their business. Freemium model. | Live (free tier) |
| **Gym** | Facilities managing multiple PTs and classes. Enterprise. | Future |

---

## Phase 1: Real-Time Messaging & Error Resilience ✅

**Goal**: Upgrade messaging to real-time and add baseline error resilience so the app doesn't crash on unexpected errors.

### 1.1 SSE Real-Time Messaging ✅
- Replaced polling with Server-Sent Events for instant message delivery
- Fallback to polling when SSE unavailable
- SSE is global across the entire dashboard (not just messages page)
- Real-time events: new messages, read receipts, new requests, connection accepted/declined
- Badge counts update instantly via SSE cache invalidation

### 1.2 Error Resilience ✅
- React error boundary wrapping the entire app with fallback UI
- Express error handling middleware for consistent 404/500 responses
- tRPC error interceptor to handle UNAUTHORIZED globally (auto-redirect to login)

### 1.3 Conversation Management ✅
- Archive conversations (hide from main list, visible in collapsible archived section)
- Delete conversations (clear messages for that user, thread hidden until new message arrives)
- Unarchive from archived section
- Dropdown menu on each conversation with Archive/Delete actions

---

## Phase 2: Enhanced PT Profiles ✅

**Goal**: Give PTs more tools to showcase themselves and stand out. All free for now — these become paid-tier features once subscriptions are added.

### 2.1 Profile Gallery ✅
- Multiple profile photos / image gallery
- Video introduction upload

### 2.2 Search Enhancements ✅
- Improved search filters (specialisation, price range, availability)
- Better sorting options (distance, rating, recently active)

---

## Phase 3: Client Management

**Goal**: Give PTs tools to manage their clients professionally through the platform.

### 3.1 Client Roster ✅
- View all connected clients in one place
- Client status tracking (active, inactive, on hold)
- Timestamped note entries per client (add/delete)

### 3.2 Resources Library ✅
- PTs create and manage exercises (with video links)
- Recipe library
- Workout plans and meal plans
- Assign resources to specific clients (many-to-many, bulk assign)
- Trainee "My Plans" page with clickable exercise/recipe detail dialogs

### 3.3 Client Onboarding ✅
- Induction/onboarding questionnaires
- Waivers and consent forms
- PT approves/rejects client after induction

### 3.4 Client Progress Tracking (in progress — see `docs/plans/PROGRESS_DIARY_TRACKING_PLAN.md`)
- PT can view client statistics and progress
- Assign goals and track completion

---

## Phase 4: Trainee Fitness Features

**Goal**: Give trainees standalone value from the platform beyond PT discovery. Keeps users engaged between sessions.

### 4.1 Goals & Tracking (in progress — see `docs/plans/PROGRESS_DIARY_TRACKING_PLAN.md`)
- Set fitness goals (weight, strength, endurance targets)
- Weight tracking with history/charts ✅
- Exercise diary / workout logging
- Personal bests tracking

### 4.2 Nutrition ✅
- Calorie tracker / daily intake logging ✅
- Recipe browsing (from PT-created library + platform recipes) ✅
- Saved recipes collection ✅
- Meal plans (premium content from PTs) ✅

### 4.3 Stats Dashboard (in progress — see `docs/plans/PROGRESS_DIARY_TRACKING_PLAN.md`)
- Unified dashboard: weight, steps, sleep, workouts
- Weekly/monthly progress views
- Trend visualisations

### 4.4 Weekly Reports
- Automated email reports with activity breakdown
- Summary of workouts, nutrition, goal progress

---

## Phase 5: Social & Community

**Goal**: Add social features to increase engagement, retention, and organic growth.

### 5.1 Follow System
- Follow PTs and other users
- Follow back / mutual friend connections
- Activity feed of followed users

### 5.2 Posts & Updates
- PTs and users can post updates (text, photos)
- Feed of updates from followed accounts
- Like/react to posts

### 5.3 Leaderboards
- Public leaderboards (steps, workouts, streaks)
- Private/friend-group leaderboards
- Weekly/monthly competitions

### 5.4 Achievements & Badges
- Earn badges for milestones (personal bests, streaks, goals hit)
- Badge showcase on profile
- Achievement notifications

### 5.5 Privacy Controls
- Granular control over what data is visible
- Public vs friends-only vs private settings
- Opt out of leaderboards

---

## Phase 6: Booking & Scheduling

**Goal**: Allow trainees to book sessions with PTs, and PTs to manage their calendar.

### 6.1 PT Availability Management
- Set working hours and recurring availability
- Block out time slots (holidays, personal time)
- Set travel options (client travels / PT travels / both)

### 6.2 Session Booking
- Trainees browse available slots and book sessions
- Booking confirmation and reminder notifications
- Travel time calculation using Google Maps (for mobile PTs)
- Time slot availability adjusted based on travel between appointments

### 6.3 Booking Management
- Calendar view for PTs
- Cancel/reschedule with approval workflow
- Cancellation policy enforcement (PT-defined window)

---

## Phase 7: Subscription & Payments

**Goal**: Monetise the platform. Gate premium features behind paid tiers and enable session payments.

### 7.1 Stripe Integration
- Payment processing infrastructure
- Subscription management (create, upgrade, downgrade, cancel)
- Webhook handling for payment events
- Invoice and receipt generation

### 7.2 Subscription Tiers
- **Free**: Basic profile listing, connection requests, messaging
- **Basic**: Enhanced profile, featured/boosted in search results, gallery, video intro
- **Pro**: All Basic + booking, payments, client management

### 7.3 Session Payments
- Pay for sessions at booking time via Stripe
- PT payouts / Stripe Connect for direct transfers
- Payment history for both parties
- Automatic refunds for policy-eligible cancellations

### 7.4 Additional Auth Providers
- Apple OAuth sign-in
- Any other social login providers as needed

---

## Phase 8: Integrations & Wearables

**Goal**: Connect with the fitness ecosystem to import data and reduce manual entry.

### 8.1 Fitness Tracker Integration
- Fitbit integration (steps, heart rate, sleep)
- Apple Watch integration

### 8.2 Health App Integration
- Apple Health sync
- Google Fit sync

### 8.3 Map My Activity
- GPS-tracked walks, runs, and rides
- Route mapping and distance/pace tracking
- Activity history with maps

---

## Phase 9: Advanced PT Features

**Goal**: Premium tools for PTs to grow their business beyond the platform.

### 9.1 Live Video Sessions
- 1-on-1 video training sessions
- Group session support
- In-app video with no external tools needed

### 9.2 Product Storefront
- PTs can sell fitness products, programs, and digital content
- Payment processing through platform
- Order management

### 9.3 PT Website Builder (Low Priority)
- PTs build a branded website through the platform
- Blog functionality
- Theme selection and content blocks
- Custom subdomain (e.g., buffbill.fitnassist.co.uk)

### 9.4 Affiliate & Rewards
- Partner discounts for users (meal prep, fitness products)
- Referral rewards program

---

## Phase 10: Gym Accounts

**Goal**: Expand to the B2B market. Gyms can manage their PTs, classes, and facilities.

### 10.1 Gym Registration & Profiles
- Gym account type with facility details
- Gym public profile page
- Location and amenities

### 10.2 PT Management
- Gym links/manages in-house PTs
- PT schedules within gym context
- Gym-level analytics across all PTs

### 10.3 Class Management
- Create and manage group fitness classes
- Class scheduling and capacity management
- Trainee booking for classes

---

## Phase Dependencies

```
Phase 1 (Real-Time & Error Resilience)
    └── Phase 2 (Enhanced PT Profiles)
            └── Phase 3 (Client Management)
                    └── Phase 4 (Trainee Fitness) — builds on client tracking data
                            └── Phase 5 (Social & Community) — builds on user activity data
Phase 6 (Booking & Scheduling) — can start after Phase 3
Phase 7 (Subscriptions & Payments) — can start after Phase 6, gates features retroactively
Phase 8 (Integrations) — can start after Phase 4
Phase 9 (Advanced PT Features) — can start after Phase 7
Phase 10 (Gym Accounts) — can start after Phase 7
```

## Feature Gating & Subscription Architecture

**Important**: From Phase 2 onwards, all new PT features should be built with subscription-based feature gating in mind. Even though payments aren't added until Phase 7, the infrastructure to enable/disable features per subscription tier needs to be in place early.

### Approach
- Define a feature flags / entitlements system tied to the trainer's `subscriptionTier` (already in the schema as FREE | BASIC | PRO)
- Backend: middleware or utility that checks feature access before allowing operations (e.g., `requireTier('BASIC')`)
- Frontend: hook (e.g., `useFeatureAccess`) to conditionally render features or show upgrade prompts
- Keep tier definitions and feature mappings in a single config so pricing/bundling can be adjusted without code changes

### Tier Structure (TBD — to be finalised before Phase 7)
Rough thinking on what maps where:

| Feature | Free | Basic | Pro |
|---------|------|-------|-----|
| Basic profile & listing | Yes | Yes | Yes |
| Connections & messaging | Yes | Yes | Yes |
| Profile gallery & video intro | - | Yes | Yes |
| Featured in search | - | Yes | Yes |
| Client management | - | - | Yes |
| Resources library | - | - | Yes |
| Booking & scheduling | - | - | Yes |
| Session payments | - | - | Yes |

Pricing, exact feature boundaries, and tier names are all open questions to revisit when approaching Phase 7. The key requirement is that the code is structured so these can be configured without rebuilding features.

## Planning Approach

Before starting each phase (or major feature within a phase), create a detailed implementation plan in `docs/plans/` following the pattern established by [SSE_MESSAGING_PLAN.md](./plans/SSE_MESSAGING_PLAN.md). Each plan should cover:

- Current state and what needs to change
- Database schema changes (if any)
- Backend implementation (repositories, services, routers)
- Frontend implementation (pages, components, hooks)
- File-by-file breakdown of new and modified files
- Testing approach

## Tech Stack

| Layer | Technology |
|-------|------------|
| Monorepo | npm workspaces |
| Frontend | React 18 + TypeScript + Vite |
| Routing | React Router v6 |
| Data Fetching | TanStack Query + tRPC |
| Forms | React Hook Form + Zod |
| Styling | Tailwind CSS + shadcn/ui |
| Backend | Express + tRPC |
| Database | Prisma + PostgreSQL (Neon) |
| Auth | Better Auth |
| Maps | Google Maps JS API |
| Email | Resend |
| Payments | Stripe (Phase 7+) |
| Hosting | Vercel (web) + Railway (api + db) |
| Storage | Cloudflare R2 |

## Monetisation

| Tier | Price | Features |
|------|-------|----------|
| Free | £0 | Basic profile, connections, messaging |
| Basic | TBD | Enhanced profile, featured in search, gallery, video intro |
| Pro | TBD | All Basic + booking, payments, client management |
| Gym | TBD | Enterprise — PT management, classes, facility tools |

## External Links

- Database Design: https://drawsql.app/teams/fitnassist/diagrams/fitnassist
- Figma Designs: https://www.figma.com/files/team/1370307932467859230/Fitnassist
