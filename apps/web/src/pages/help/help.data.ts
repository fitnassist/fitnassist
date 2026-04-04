import type { HelpArticle, HelpCategory } from './help.types';

export const HELP_CATEGORIES: { value: HelpCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'getting-started', label: 'Getting Started' },
  { value: 'trainee', label: 'For Trainees' },
  { value: 'trainer', label: 'For Trainers' },
  { value: 'account', label: 'Account' },
];

export const helpArticles: HelpArticle[] = [
  // Getting Started
  {
    id: 'gs-welcome',
    title: 'Welcome to Fitnassist',
    category: 'getting-started',
    content:
      "<p>Fitnassist is a platform that connects personal trainers, gyms, and trainees. Whether you're looking to grow your PT business or find the right coach, everything you need is in one place.</p><p>[Screenshot: Dashboard overview]</p><p>After signing up you'll be guided through a short tour of the dashboard. You can restart the tour at any time from your account settings.</p>",
    keywords: ['welcome', 'introduction', 'overview', 'about'],
  },
  {
    id: 'gs-create-account',
    title: 'Creating your account',
    category: 'getting-started',
    content:
      "<p>Head to the sign-up page and choose whether you're a trainer or a trainee. Fill in your name, email, and a secure password to get started.</p><p>You can also sign up using your Google or Apple account for a quicker onboarding experience.</p><p>[Screenshot: Registration page]</p>",
    keywords: ['sign up', 'register', 'create account', 'join', 'google', 'apple'],
  },
  {
    id: 'gs-dashboard',
    title: 'Navigating the dashboard',
    category: 'getting-started',
    content:
      "<p>Your dashboard is the central hub for everything on Fitnassist. Trainers will see key business metrics, a profile card, and quick actions. Trainees will see a summary of today's activity, progress towards goals, and quick links to common features.</p><p>[Screenshot: Dashboard overview]</p><p>Use the sidebar on desktop or the bottom navigation on mobile to move between sections. Sections are grouped by category to keep things organised.</p>",
    keywords: ['dashboard', 'navigation', 'sidebar', 'home', 'overview'],
  },
  {
    id: 'gs-guided-tour',
    title: 'The guided tour',
    category: 'getting-started',
    content:
      '<p>When you first log in, a guided tour highlights the most important areas of your dashboard. You can follow along step by step or skip it entirely.</p><p>If you\'d like to see the tour again, head to Settings, open the Account tab, and click "Restart Guided Tour".</p>',
    keywords: ['tour', 'guided', 'onboarding', 'walkthrough', 'introduction'],
  },
  {
    id: 'gs-notifications',
    title: 'Notifications and alerts',
    category: 'getting-started',
    content:
      "<p>Fitnassist sends real-time notifications for new messages, connection requests, bookings, and more. You'll see badge counts on the relevant sidebar items so you never miss anything.</p><p>You can customise which notifications you receive from the Settings page under the Notifications tab. Push notifications are also available if you allow them when prompted.</p>",
    keywords: ['notifications', 'alerts', 'badges', 'push', 'real-time'],
  },

  // Trainee
  {
    id: 'tr-find-trainers',
    title: 'Finding a personal trainer',
    category: 'trainee',
    content:
      '<p>Use the "Find Trainers" page to search for personal trainers near you. You can filter by location, specialisation, and more. Each trainer has a public profile with their qualifications, services, and reviews.</p><p>[Screenshot: Find a Trainer page]</p><p>Once you\'ve found a trainer you\'re interested in, send them a connection request or book a callback directly from their profile.</p>',
    keywords: ['find', 'search', 'trainer', 'location', 'discover', 'browse'],
  },
  {
    id: 'tr-diary',
    title: 'Using the diary',
    category: 'trainee',
    content:
      '<p>The diary is your daily log for meals, weight, workouts, mood, sleep, and custom entries. Navigate to Diary from the sidebar and select a date to start logging.</p><p>[Screenshot: Diary page]</p><p>Each entry type has its own form. You can track macros for meals, log sets and reps for workouts, and rate your mood and sleep quality. Trends are calculated automatically and displayed on your dashboard.</p>',
    keywords: ['diary', 'log', 'meals', 'weight', 'mood', 'sleep', 'workouts', 'track'],
  },
  {
    id: 'tr-goals',
    title: 'Setting and tracking goals',
    category: 'trainee',
    content:
      '<p>Goals help you stay focused and motivated. From the Goals page you can create targets for weight, body measurements, strength milestones, or custom objectives.</p><p>Each goal shows a progress bar and timeline. When you log relevant diary entries, your progress updates automatically. Completed goals are celebrated with achievements.</p><p>[Screenshot: Goals page]</p>',
    keywords: ['goals', 'targets', 'progress', 'milestones', 'track'],
  },
  {
    id: 'tr-plans',
    title: 'Viewing your plans',
    category: 'trainee',
    content:
      '<p>The My Plans section shows workout and meal plans that your trainer has assigned to you. Each plan includes detailed instructions, sets, reps, and nutritional information where applicable.</p><p>You can follow workout plans using the built-in workout runner, which guides you through each exercise with timers and tracking. Completed workouts are automatically logged in your diary.</p><p>[Screenshot: My Plans page]</p>',
    keywords: ['plans', 'workout', 'meal', 'assigned', 'runner', 'exercises'],
  },
  {
    id: 'tr-contacts',
    title: 'Managing your contacts',
    category: 'trainee',
    content:
      "<p>Your contacts page shows all of your trainer connections. From here you can view their profiles, send messages, or book sessions.</p><p>Connection requests are handled through the Requests section. Once a trainer accepts your request, they'll appear in your contacts list.</p>",
    keywords: ['contacts', 'connections', 'trainers', 'requests'],
  },
  {
    id: 'tr-messages',
    title: 'Messaging your trainer',
    category: 'trainee',
    content:
      "<p>The Messages section lets you chat with your connected trainers in real time. You can discuss plans, ask questions, and share progress updates.</p><p>Messages support text and are delivered instantly via the platform's real-time system. Unread message counts appear as badges on the Messages nav item.</p>",
    keywords: ['messages', 'chat', 'conversation', 'trainer', 'communicate'],
  },
  {
    id: 'tr-bookings',
    title: 'Booking sessions',
    category: 'trainee',
    content:
      "<p>If your trainer has scheduling enabled, you can book sessions directly from their profile or the Bookings section. Choose a date and time from their available slots and confirm your booking.</p><p>[Screenshot: Booking page]</p><p>Upcoming bookings appear in your Bookings tab with all the details. You'll receive notifications for confirmations, reminders, and any changes.</p>",
    keywords: ['bookings', 'sessions', 'schedule', 'appointments', 'book'],
  },
  {
    id: 'tr-feed',
    title: 'The social feed',
    category: 'trainee',
    content:
      '<p>Your feed shows updates from friends and the wider Fitnassist community. Share your achievements, celebrate milestones, and stay motivated by seeing what others are up to.</p><p>You can like and comment on posts. New feed items are highlighted with a badge on the Feed nav item.</p>',
    keywords: ['feed', 'social', 'posts', 'community', 'updates'],
  },
  {
    id: 'tr-friends',
    title: 'Adding friends',
    category: 'trainee',
    content:
      "<p>Connect with other trainees by sending friend requests. Friends can see each other's achievements and feed posts, making fitness more social and accountable.</p><p>Manage incoming and outgoing friend requests from the Friends page. Accepted friends appear in your friends list.</p>",
    keywords: ['friends', 'social', 'connect', 'requests', 'community'],
  },
  {
    id: 'tr-leaderboards',
    title: 'Leaderboards',
    category: 'trainee',
    content:
      '<p>Compete with friends and the community on activity leaderboards. Categories include running, cycling, and fastest 5K times. Your position updates automatically based on your logged activities.</p><p>Leaderboards are a great way to stay motivated and add a bit of friendly competition to your training.</p>',
    keywords: ['leaderboards', 'ranking', 'competition', 'running', 'cycling'],
  },
  {
    id: 'tr-achievements',
    title: 'Achievements and badges',
    category: 'trainee',
    content:
      "<p>Earn achievements for reaching milestones — completing goals, logging streaks, hitting personal bests, and more. Each achievement comes with a badge displayed on your profile.</p><p>Check the Achievements page to see what you've unlocked and what's coming next.</p>",
    keywords: ['achievements', 'badges', 'milestones', 'rewards', 'unlocked'],
  },
  {
    id: 'tr-workout-runner',
    title: 'The workout runner',
    category: 'trainee',
    content:
      '<p>When you start a workout from My Plans, the workout runner guides you through each exercise. It shows the current exercise, sets, reps, rest timers, and lets you log your actual performance as you go.</p><p>[Screenshot: Workout runner]</p><p>Completed workouts are saved to your diary automatically with all the details of what you achieved.</p>',
    keywords: ['workout', 'runner', 'exercises', 'timer', 'guided', 'sets', 'reps'],
  },
  {
    id: 'tr-gps-tracking',
    title: 'GPS activity tracking',
    category: 'trainee',
    content:
      '<p>Track outdoor activities like running and cycling with built-in GPS. The tracker records your route, distance, pace, and duration in real time.</p><p>Completed activities are logged in your diary and contribute to leaderboard rankings. You can review your route on a map after each session.</p>',
    keywords: ['gps', 'tracking', 'running', 'cycling', 'route', 'map', 'activity'],
  },

  // Trainer
  {
    id: 'pt-profile',
    title: 'Setting up your trainer profile',
    category: 'trainer',
    content:
      '<p>Your public profile is how trainees find and evaluate you. From the dashboard, click "Edit Profile" to add your display name, bio, qualifications, specialisations, location, and profile photo.</p><p>[Screenshot: Profile edit page]</p><p>Once you\'re happy with your profile, publish it to make it visible on the Find a Trainer page. You can toggle between published and draft at any time.</p>',
    keywords: ['profile', 'setup', 'edit', 'publish', 'bio', 'qualifications'],
  },
  {
    id: 'pt-requests',
    title: 'Managing requests',
    category: 'trainer',
    content:
      "<p>The Requests page shows connection requests and callback requests from trainees. You'll see the trainee's name, message, and contact details.</p><p>Accept connection requests to add the trainee to your client roster. Callback requests include a phone number and preferred time — follow up promptly for the best experience.</p>",
    keywords: ['requests', 'connections', 'callbacks', 'accept', 'decline'],
  },
  {
    id: 'pt-clients',
    title: 'Client management',
    category: 'trainer',
    content:
      "<p>The Clients section is your complete client roster. View each client's profile, add notes, assign workout and meal plans, and track their progress over time.</p><p>[Screenshot: Client detail page]</p><p>Client management is available on the Pro tier and above. You can see at a glance which clients have active plans and who might need attention.</p>",
    keywords: ['clients', 'roster', 'manage', 'notes', 'assign', 'plans'],
  },
  {
    id: 'pt-resources',
    title: 'Creating resources',
    category: 'trainer',
    content:
      '<p>Resources are the building blocks of your training programmes. Create exercises with detailed instructions, workout plans combining multiple exercises, meal plans with nutritional targets, and recipes.</p><p>Each resource type has its own creation form. Once created, resources can be assigned to individual clients or used across multiple plans.</p><p>[Screenshot: Resources page]</p>',
    keywords: ['resources', 'exercises', 'workout plans', 'meal plans', 'recipes', 'create'],
  },
  {
    id: 'pt-bookings',
    title: 'Scheduling and bookings',
    category: 'trainer',
    content:
      '<p>Set up your availability from Settings under the Scheduling tab. Define your working hours, session durations, and buffer times between appointments.</p><p>Trainees can then book sessions with you directly. Manage incoming bookings from the Bookings page — confirm, reschedule, or cancel as needed. You can also book sessions on behalf of clients.</p>',
    keywords: ['bookings', 'scheduling', 'availability', 'sessions', 'appointments', 'calendar'],
  },
  {
    id: 'pt-analytics',
    title: 'Analytics and insights',
    category: 'trainer',
    content:
      "<p>The Analytics page provides detailed insights into your business performance. Track profile views, client acquisition, booking rates, and revenue over time.</p><p>Analytics is available on the Pro tier and above. Use these insights to understand what's working and where to focus your efforts.</p>",
    keywords: ['analytics', 'insights', 'statistics', 'performance', 'views', 'revenue'],
  },
  {
    id: 'pt-reviews',
    title: 'Reviews and ratings',
    category: 'trainer',
    content:
      '<p>Clients can leave reviews and ratings on your profile. Positive reviews help build trust and attract new trainees. You can view all reviews from the Reviews page.</p><p>Respond to reviews to show engagement and professionalism. Both the rating and your response are visible on your public profile.</p>',
    keywords: ['reviews', 'ratings', 'feedback', 'reputation', 'testimonials'],
  },
  {
    id: 'pt-onboarding',
    title: 'Client onboarding forms',
    category: 'trainer',
    content:
      '<p>Create custom onboarding templates to gather information from new clients before their first session. Templates can include questions about goals, medical history, dietary requirements, and more.</p><p>When a new client connects with you, send them an onboarding form to complete. Their responses are saved against their client profile for easy reference.</p>',
    keywords: ['onboarding', 'forms', 'templates', 'questionnaire', 'intake'],
  },
  {
    id: 'pt-website',
    title: 'Your PT website',
    category: 'trainer',
    content:
      '<p>Build a simple, professional website for your personal training business directly within Fitnassist. Customise the layout, colours, and content to match your brand.</p><p>Your website is hosted at fitnassist.co/site/your-handle and can be shared with potential clients. This feature is available on the Elite tier.</p>',
    keywords: ['website', 'site', 'builder', 'online', 'presence', 'brand'],
  },

  // Account
  {
    id: 'acc-settings',
    title: 'Account settings',
    category: 'account',
    content:
      '<p>From the Settings page you can update your display name, email address, and password. Trainers also have access to subscription, scheduling, and payment settings.</p><p>[Screenshot: Settings page]</p><p>The Danger Zone tab allows you to delete your account permanently. This action cannot be undone.</p>',
    keywords: ['settings', 'account', 'name', 'email', 'password', 'preferences'],
  },
  {
    id: 'acc-subscription',
    title: 'Subscription and billing',
    category: 'account',
    content:
      '<p>Trainers can choose between Free, Pro, and Elite subscription tiers. Each tier unlocks additional features like client management, resources, analytics, and the website builder.</p><p>Manage your subscription from Settings under the Subscription tab. You can upgrade, downgrade, or cancel at any time. Changes take effect at the start of your next billing cycle.</p>',
    keywords: ['subscription', 'billing', 'pricing', 'upgrade', 'tier', 'plan', 'payment'],
  },
  {
    id: 'acc-notifications-settings',
    title: 'Notification preferences',
    category: 'account',
    content:
      '<p>Control which notifications you receive from the Notifications tab in Settings. Toggle individual notification types on or off to keep your inbox manageable.</p><p>Push notifications can be enabled or disabled through your browser settings. Email notifications are sent for important updates regardless of your preferences.</p>',
    keywords: ['notifications', 'preferences', 'email', 'push', 'settings'],
  },
  {
    id: 'acc-privacy',
    title: 'Privacy and data',
    category: 'account',
    content:
      '<p>Fitnassist takes your privacy seriously. Review our Privacy Policy for full details on how your data is collected, stored, and used.</p><p>You can request a copy of your data or delete your account at any time from the Settings page. Deleting your account removes all personal data permanently.</p>',
    keywords: ['privacy', 'data', 'gdpr', 'delete', 'personal', 'information'],
  },
];
