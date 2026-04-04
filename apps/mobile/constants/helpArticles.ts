export interface HelpArticle {
  id: string;
  title: string;
  category: "getting-started" | "trainee" | "trainer" | "account";
  content: string;
  keywords: string[];
}

export const HELP_CATEGORIES = [
  { key: "all" as const, label: "All" },
  { key: "getting-started" as const, label: "Getting Started" },
  { key: "trainee" as const, label: "Trainees" },
  { key: "trainer" as const, label: "Trainers" },
  { key: "account" as const, label: "Account" },
];

export type HelpCategory = "all" | HelpArticle["category"];

export const helpArticles: HelpArticle[] = [
  // Getting Started
  {
    id: "gs-1",
    title: "What is Fitnassist?",
    category: "getting-started",
    content:
      "Fitnassist is a platform that connects Personal Trainers, Gyms, and Trainees. Trainers can manage their business, build an online presence, and grow their client base. Trainees can discover trainers, book sessions, track their fitness journey, and connect with friends.",
    keywords: ["about", "what", "platform", "overview"],
  },
  {
    id: "gs-2",
    title: "Creating your account",
    category: "getting-started",
    content:
      'To create an account, tap "Sign Up" on the login screen. Choose whether you are a Trainer or a Trainee, enter your name, email, and password, then tap "Create Account". You will receive a verification email to confirm your address.',
    keywords: ["sign up", "register", "create", "account", "new"],
  },
  {
    id: "gs-3",
    title: "Navigating the app",
    category: "getting-started",
    content:
      "The bottom tab bar gives you quick access to the main sections of the app. Trainers see Home, Messages, Bookings, and Profile. Trainees see Home, Messages, Diary, Bookings, and Profile. The Profile tab is your hub for all additional features and settings.",
    keywords: ["navigation", "tabs", "menu", "layout", "bar"],
  },
  {
    id: "gs-4",
    title: "Setting up your profile",
    category: "getting-started",
    content:
      'Head to the Profile tab and tap "Edit Profile" to add your photo, bio, and other details. Trainers can set their specialisations, qualifications, and location. A complete profile helps you stand out and attract clients or find the right trainer.',
    keywords: ["profile", "setup", "edit", "photo", "bio"],
  },
  {
    id: "gs-5",
    title: "Understanding the guided tour",
    category: "getting-started",
    content:
      "When you first log in, a guided tour introduces the key features of the app. You can skip it at any time and restart it later from Account Settings. The tour covers navigation, core features, and tips for getting the most out of Fitnassist.",
    keywords: ["tour", "guided", "onboarding", "intro", "walkthrough"],
  },

  // Trainee
  {
    id: "tr-1",
    title: "Tracking your weight",
    category: "trainee",
    content:
      'Open the Diary tab and tap "Weight" to log your current weight. Your weight history is displayed as a chart so you can visualise trends over time. You can log in kilograms or pounds depending on your preference in settings.',
    keywords: ["weight", "track", "log", "diary", "chart"],
  },
  {
    id: "tr-2",
    title: "Logging meals and nutrition",
    category: "trainee",
    content:
      'From the Diary tab, tap "Meals" to log what you have eaten. You can search for foods, scan barcodes, or add custom entries. Each meal logs calories, protein, carbohydrates, and fat. Your daily totals are shown at the top of the diary.',
    keywords: ["meals", "food", "nutrition", "calories", "log", "diary"],
  },
  {
    id: "tr-3",
    title: "Recording workouts",
    category: "trainee",
    content:
      'Log workouts from the Diary tab by tapping "Workout". You can choose from guided workout plans assigned by your trainer, follow the built-in workout runner, or log a manual session. Each workout records exercises, sets, reps, and weight lifted.',
    keywords: ["workout", "exercise", "log", "training", "gym"],
  },
  {
    id: "tr-4",
    title: "Tracking mood and sleep",
    category: "trainee",
    content:
      "The Diary tab also lets you log your mood and sleep quality each day. Tracking these alongside your training and nutrition helps you and your trainer understand how lifestyle factors affect your progress.",
    keywords: ["mood", "sleep", "wellness", "diary", "track"],
  },
  {
    id: "tr-5",
    title: "Setting and managing goals",
    category: "trainee",
    content:
      'Go to Profile and tap "Goals" to set fitness targets. Goals can include weight targets, workout frequency, step counts, and more. Progress is tracked automatically from your diary entries and displayed on your dashboard.',
    keywords: ["goals", "targets", "progress", "fitness"],
  },
  {
    id: "tr-6",
    title: "Booking sessions with your trainer",
    category: "trainee",
    content:
      "Tap the Bookings tab to see available slots from your connected trainer. Select a date and time, choose in-person or video, and confirm the booking. You will receive a notification when the trainer accepts. Cancellation policies are shown before you book.",
    keywords: ["booking", "session", "appointment", "schedule", "trainer"],
  },
  {
    id: "tr-7",
    title: "Connecting with a trainer",
    category: "trainee",
    content:
      "To connect with a trainer, search for them using the Discover feature or enter their unique handle. Send a connection request and the trainer will be notified. Once accepted, you can message them, book sessions, and receive training plans.",
    keywords: ["connect", "trainer", "request", "discover", "find"],
  },
  {
    id: "tr-8",
    title: "Finding and adding friends",
    category: "trainee",
    content:
      'Go to Profile and tap "Friends" to search for other trainees by name or email. Send a friend request to connect. Once friends, you can see each other on leaderboards and share achievements.',
    keywords: ["friends", "social", "add", "search", "connect"],
  },
  {
    id: "tr-9",
    title: "Leaderboards and achievements",
    category: "trainee",
    content:
      "Access Leaderboards and Achievements from the Profile tab. Leaderboards rank you against friends across various metrics like workouts completed, steps taken, and activity streaks. Achievements are unlocked milestones that celebrate your progress.",
    keywords: ["leaderboard", "achievement", "badge", "rank", "compete"],
  },
  {
    id: "tr-10",
    title: "Viewing your training plans",
    category: "trainee",
    content:
      "Your trainer can assign training plans tailored to your goals. Find them under Profile > My Plans. Each plan contains a structured programme with exercises, sets, reps, and rest periods. Follow along using the built-in workout runner.",
    keywords: ["plans", "training", "programme", "exercises"],
  },
  {
    id: "tr-11",
    title: "GPS activity tracking",
    category: "trainee",
    content:
      "Track outdoor activities like running and cycling using GPS. Start a new activity from the Diary tab and the app will record your route, distance, pace, and elevation in real time. Completed activities appear in your diary and on the activity leaderboards.",
    keywords: ["gps", "running", "cycling", "activity", "route", "map"],
  },
  {
    id: "tr-12",
    title: "Connecting fitness apps",
    category: "trainee",
    content:
      "Go to Account Settings > Integrations to connect third-party fitness apps like Strava, Google Fit, Fitbit, and Garmin. Once connected, activities, steps, sleep, and other data sync automatically into your diary.",
    keywords: [
      "strava",
      "fitbit",
      "garmin",
      "google fit",
      "integration",
      "sync",
    ],
  },
  {
    id: "tr-13",
    title: "Purchasing products from trainers",
    category: "trainee",
    content:
      "Some trainers offer products through their storefront, such as training guides, meal plans, and merchandise. Browse available products from the trainer profile and complete purchases securely through the app.",
    keywords: ["purchase", "shop", "store", "product", "buy"],
  },

  // Trainer
  {
    id: "pt-1",
    title: "Managing your availability",
    category: "trainer",
    content:
      "Set your weekly availability in Account Settings > Scheduling. Add time slots for each day of the week, specifying start time, end time, and session duration. You can also block specific dates for holidays or time off.",
    keywords: ["availability", "schedule", "slots", "calendar", "hours"],
  },
  {
    id: "pt-2",
    title: "Handling client requests",
    category: "trainer",
    content:
      "When a trainee sends a connection request or callback enquiry, it appears under Profile > Requests. Review the request and accept or decline. Accepted trainees become your clients and can book sessions and receive plans.",
    keywords: ["requests", "clients", "accept", "decline", "callback"],
  },
  {
    id: "pt-3",
    title: "Client management",
    category: "trainer",
    content:
      "Access your client roster from Profile > Clients. View each client's profile, training history, diary entries, and progress. You can assign plans, send resources, and manage their onboarding questionnaire.",
    keywords: ["clients", "manage", "roster", "view", "progress"],
  },
  {
    id: "pt-4",
    title: "Creating training plans",
    category: "trainer",
    content:
      "Go to Profile > Resources to create training plans. Build structured programmes with exercises, sets, reps, rest periods, and notes. Assign plans to individual clients or save them as templates for reuse.",
    keywords: ["plans", "create", "programme", "exercises", "assign"],
  },
  {
    id: "pt-5",
    title: "Setting up payments",
    category: "trainer",
    content:
      "Connect your Stripe account in Account Settings > Payments. Once connected, you can set your session price, enable payment collection, and offer a free first session. Clients pay securely when booking.",
    keywords: ["payments", "stripe", "price", "session", "money"],
  },
  {
    id: "pt-6",
    title: "Subscription tiers explained",
    category: "trainer",
    content:
      "Fitnassist offers three tiers for trainers: Free, Pro, and Elite. Free includes basic profile and messaging. Pro unlocks client management, booking, resources, and onboarding. Elite adds payments, video sessions, website builder, storefront, and advanced analytics.",
    keywords: [
      "subscription",
      "tier",
      "plan",
      "upgrade",
      "pro",
      "elite",
      "free",
    ],
  },
  {
    id: "pt-7",
    title: "Using the website builder",
    category: "trainer",
    content:
      "Elite trainers can build a public website directly within Fitnassist. Go to Profile > Website Builder to customise your layout, add sections, upload images, and publish your site. Share the link with potential clients.",
    keywords: ["website", "builder", "publish", "online", "presence"],
  },
  {
    id: "pt-8",
    title: "Managing your storefront",
    category: "trainer",
    content:
      "The Storefront feature (Elite tier) lets you sell digital products like training guides, meal plans, and e-books. Create products, set prices, and manage orders all from the Profile > Storefront section.",
    keywords: ["storefront", "products", "sell", "digital", "shop"],
  },
  {
    id: "pt-9",
    title: "Viewing analytics",
    category: "trainer",
    content:
      "Track your business performance under Profile > Analytics. View metrics like client growth, booking trends, revenue, profile views, and engagement over time. Advanced analytics require the Elite subscription tier.",
    keywords: ["analytics", "stats", "metrics", "performance", "data"],
  },
  {
    id: "pt-10",
    title: "Referral programme",
    category: "trainer",
    content:
      "Earn rewards by referring other trainers to Fitnassist. Go to Profile > Referrals to get your unique referral link. When a referred trainer signs up and subscribes, you both receive credits towards your subscription.",
    keywords: ["referral", "invite", "refer", "rewards", "credits"],
  },

  // Account
  {
    id: "ac-1",
    title: "Changing your password",
    category: "account",
    content:
      'Go to Profile > Account Settings > Account tab. Enter your current password, then type and confirm your new password. Passwords must be at least 8 characters long. Tap "Update Password" to save.',
    keywords: ["password", "change", "update", "security"],
  },
  {
    id: "ac-2",
    title: "Updating your email address",
    category: "account",
    content:
      'In Account Settings > Account tab, enter your new email address and current password, then tap "Update Email". A verification email will be sent to the new address. Your email will not change until you verify it.',
    keywords: ["email", "change", "update", "verify"],
  },
  {
    id: "ac-3",
    title: "Managing notifications",
    category: "account",
    content:
      "Go to Profile > Notifications to control which notifications you receive. You can toggle push notifications for messages, bookings, reminders, and social activity. Email notification preferences are also available.",
    keywords: ["notifications", "push", "alerts", "email", "settings"],
  },
  {
    id: "ac-4",
    title: "Deleting your account",
    category: "account",
    content:
      'To permanently delete your account, go to Account Settings and select the Danger tab. Tap "Delete Account" and confirm. This action is irreversible and will remove all your data, including messages, bookings, and diary entries.',
    keywords: ["delete", "account", "remove", "permanent"],
  },
  {
    id: "ac-5",
    title: "Signing out",
    category: "account",
    content:
      'To sign out, go to the Profile tab and scroll to the bottom. Tap "Sign Out" and confirm. You will be returned to the login screen. Your data remains safe and you can sign back in at any time.',
    keywords: ["sign out", "logout", "log out"],
  },
  {
    id: "ac-6",
    title: "Restarting the guided tour",
    category: "account",
    content:
      'If you would like to see the introductory tour again, go to Profile > Account Settings and scroll to the bottom. Tap "Restart Tour" and the guided tour will appear the next time you visit the dashboard.',
    keywords: ["tour", "restart", "guided", "reset", "intro"],
  },
];
