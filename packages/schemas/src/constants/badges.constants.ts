export type BadgeCategory =
  | 'CONSISTENCY'
  | 'FITNESS'
  | 'NUTRITION'
  | 'WELLNESS'
  | 'SOCIAL'
  | 'GOALS'
  | 'EXPLORER';

export type BadgeTier = 'BRONZE' | 'SILVER' | 'GOLD';

export type BadgeTrigger =
  | 'DIARY_ENTRY'
  | 'GOAL_COMPLETED'
  | 'PERSONAL_BEST'
  | 'FRIENDSHIP'
  | 'POST'
  | 'LIKE_RECEIVED'
  | 'FOLLOW'
  | 'ACCOUNT';

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: BadgeCategory;
  tier: BadgeTier;
  triggers: BadgeTrigger[];
}

// ============================================================================
// CONSISTENCY — rewarding regular logging habits
// ============================================================================

const CONSISTENCY_BADGES: BadgeDefinition[] = [
  // Diary streaks
  {
    id: 'streak_3',
    name: 'Getting Started',
    description: 'Log your diary for 3 days in a row',
    icon: 'Flame',
    category: 'CONSISTENCY',
    tier: 'BRONZE',
    triggers: ['DIARY_ENTRY'],
  },
  {
    id: 'streak_7',
    name: 'Week Warrior',
    description: 'Log your diary for 7 days in a row',
    icon: 'Flame',
    category: 'CONSISTENCY',
    tier: 'BRONZE',
    triggers: ['DIARY_ENTRY'],
  },
  {
    id: 'streak_14',
    name: 'Fortnight Force',
    description: 'Log your diary for 14 days in a row',
    icon: 'Flame',
    category: 'CONSISTENCY',
    tier: 'SILVER',
    triggers: ['DIARY_ENTRY'],
  },
  {
    id: 'streak_30',
    name: 'Monthly Machine',
    description: 'Log your diary for 30 days in a row',
    icon: 'Flame',
    category: 'CONSISTENCY',
    tier: 'SILVER',
    triggers: ['DIARY_ENTRY'],
  },
  {
    id: 'streak_60',
    name: 'Iron Will',
    description: 'Log your diary for 60 days in a row',
    icon: 'Flame',
    category: 'CONSISTENCY',
    tier: 'GOLD',
    triggers: ['DIARY_ENTRY'],
  },
  {
    id: 'streak_90',
    name: 'Unstoppable',
    description: 'Log your diary for 90 days in a row',
    icon: 'Flame',
    category: 'CONSISTENCY',
    tier: 'GOLD',
    triggers: ['DIARY_ENTRY'],
  },
  {
    id: 'streak_365',
    name: 'Year of Dedication',
    description: 'Log your diary for 365 days in a row',
    icon: 'Crown',
    category: 'CONSISTENCY',
    tier: 'GOLD',
    triggers: ['DIARY_ENTRY'],
  },

  // Total diary entries
  {
    id: 'entries_10',
    name: 'First Steps',
    description: 'Log 10 diary entries',
    icon: 'BookOpen',
    category: 'CONSISTENCY',
    tier: 'BRONZE',
    triggers: ['DIARY_ENTRY'],
  },
  {
    id: 'entries_50',
    name: 'Building Habits',
    description: 'Log 50 diary entries',
    icon: 'BookOpen',
    category: 'CONSISTENCY',
    tier: 'BRONZE',
    triggers: ['DIARY_ENTRY'],
  },
  {
    id: 'entries_100',
    name: 'Century Logger',
    description: 'Log 100 diary entries',
    icon: 'BookOpen',
    category: 'CONSISTENCY',
    tier: 'SILVER',
    triggers: ['DIARY_ENTRY'],
  },
  {
    id: 'entries_500',
    name: 'Dedicated Tracker',
    description: 'Log 500 diary entries',
    icon: 'BookOpen',
    category: 'CONSISTENCY',
    tier: 'GOLD',
    triggers: ['DIARY_ENTRY'],
  },
  {
    id: 'entries_1000',
    name: 'Logging Legend',
    description: 'Log 1,000 diary entries',
    icon: 'BookOpen',
    category: 'CONSISTENCY',
    tier: 'GOLD',
    triggers: ['DIARY_ENTRY'],
  },

  // Early bird — logging before 8am
  {
    id: 'early_bird_1',
    name: 'Early Bird',
    description: 'Log a diary entry before 8am',
    icon: 'Sunrise',
    category: 'CONSISTENCY',
    tier: 'BRONZE',
    triggers: ['DIARY_ENTRY'],
  },
  {
    id: 'early_bird_30',
    name: 'Dawn Patrol',
    description: 'Log 30 diary entries before 8am',
    icon: 'Sunrise',
    category: 'CONSISTENCY',
    tier: 'SILVER',
    triggers: ['DIARY_ENTRY'],
  },
];

// ============================================================================
// FITNESS — workouts, steps, activities
// ============================================================================

const FITNESS_BADGES: BadgeDefinition[] = [
  // Workout milestones
  {
    id: 'workout_1',
    name: 'First Workout',
    description: 'Log your first workout',
    icon: 'Dumbbell',
    category: 'FITNESS',
    tier: 'BRONZE',
    triggers: ['DIARY_ENTRY'],
  },
  {
    id: 'workout_10',
    name: 'Getting Stronger',
    description: 'Log 10 workouts',
    icon: 'Dumbbell',
    category: 'FITNESS',
    tier: 'BRONZE',
    triggers: ['DIARY_ENTRY'],
  },
  {
    id: 'workout_25',
    name: 'Gym Regular',
    description: 'Log 25 workouts',
    icon: 'Dumbbell',
    category: 'FITNESS',
    tier: 'SILVER',
    triggers: ['DIARY_ENTRY'],
  },
  {
    id: 'workout_50',
    name: 'Iron Addict',
    description: 'Log 50 workouts',
    icon: 'Dumbbell',
    category: 'FITNESS',
    tier: 'SILVER',
    triggers: ['DIARY_ENTRY'],
  },
  {
    id: 'workout_100',
    name: 'Century Lifter',
    description: 'Log 100 workouts',
    icon: 'Dumbbell',
    category: 'FITNESS',
    tier: 'GOLD',
    triggers: ['DIARY_ENTRY'],
  },
  {
    id: 'workout_250',
    name: 'Beast Mode',
    description: 'Log 250 workouts',
    icon: 'Dumbbell',
    category: 'FITNESS',
    tier: 'GOLD',
    triggers: ['DIARY_ENTRY'],
  },

  // Steps milestones (cumulative)
  {
    id: 'steps_100k',
    name: 'Step Counter',
    description: 'Log 100,000 total steps',
    icon: 'Footprints',
    category: 'FITNESS',
    tier: 'BRONZE',
    triggers: ['DIARY_ENTRY'],
  },
  {
    id: 'steps_500k',
    name: 'Road Walker',
    description: 'Log 500,000 total steps',
    icon: 'Footprints',
    category: 'FITNESS',
    tier: 'SILVER',
    triggers: ['DIARY_ENTRY'],
  },
  {
    id: 'steps_1m',
    name: 'Million Stepper',
    description: 'Log 1,000,000 total steps',
    icon: 'Footprints',
    category: 'FITNESS',
    tier: 'GOLD',
    triggers: ['DIARY_ENTRY'],
  },

  // Single day steps
  {
    id: 'steps_10k_day',
    name: '10K Day',
    description: 'Log 10,000 steps in a single day',
    icon: 'Footprints',
    category: 'FITNESS',
    tier: 'BRONZE',
    triggers: ['DIARY_ENTRY'],
  },
  {
    id: 'steps_20k_day',
    name: '20K Marcher',
    description: 'Log 20,000 steps in a single day',
    icon: 'Footprints',
    category: 'FITNESS',
    tier: 'SILVER',
    triggers: ['DIARY_ENTRY'],
  },

  // Activity distance (cumulative)
  {
    id: 'distance_10k',
    name: 'First 10K',
    description: 'Cover 10 km in total activities',
    icon: 'MapPin',
    category: 'FITNESS',
    tier: 'BRONZE',
    triggers: ['DIARY_ENTRY'],
  },
  {
    id: 'distance_42k',
    name: 'Marathon Distance',
    description: 'Cover 42.2 km in total activities',
    icon: 'MapPin',
    category: 'FITNESS',
    tier: 'SILVER',
    triggers: ['DIARY_ENTRY'],
  },
  {
    id: 'distance_100k',
    name: 'Ultra Runner',
    description: 'Cover 100 km in total activities',
    icon: 'MapPin',
    category: 'FITNESS',
    tier: 'SILVER',
    triggers: ['DIARY_ENTRY'],
  },
  {
    id: 'distance_500k',
    name: 'Distance Machine',
    description: 'Cover 500 km in total activities',
    icon: 'MapPin',
    category: 'FITNESS',
    tier: 'GOLD',
    triggers: ['DIARY_ENTRY'],
  },
  {
    id: 'distance_1000k',
    name: 'Thousand Miler',
    description: 'Cover 1,000 km in total activities',
    icon: 'MapPin',
    category: 'FITNESS',
    tier: 'GOLD',
    triggers: ['DIARY_ENTRY'],
  },

  // Activity variety
  {
    id: 'activity_types_3',
    name: 'Mix It Up',
    description: 'Log 3 different activity types',
    icon: 'Activity',
    category: 'FITNESS',
    tier: 'BRONZE',
    triggers: ['DIARY_ENTRY'],
  },
  {
    id: 'activity_types_all',
    name: 'Jack of All Trades',
    description: 'Log every activity type at least once',
    icon: 'Activity',
    category: 'FITNESS',
    tier: 'SILVER',
    triggers: ['DIARY_ENTRY'],
  },

  // Personal bests
  {
    id: 'pb_1',
    name: 'Personal Best',
    description: 'Set your first personal best',
    icon: 'Trophy',
    category: 'FITNESS',
    tier: 'BRONZE',
    triggers: ['PERSONAL_BEST'],
  },
  {
    id: 'pb_5',
    name: 'Record Breaker',
    description: 'Set 5 personal bests',
    icon: 'Trophy',
    category: 'FITNESS',
    tier: 'SILVER',
    triggers: ['PERSONAL_BEST'],
  },
  {
    id: 'pb_10',
    name: 'PB Machine',
    description: 'Set 10 personal bests',
    icon: 'Trophy',
    category: 'FITNESS',
    tier: 'SILVER',
    triggers: ['PERSONAL_BEST'],
  },
  {
    id: 'pb_25',
    name: 'Record Smasher',
    description: 'Set 25 personal bests',
    icon: 'Trophy',
    category: 'FITNESS',
    tier: 'GOLD',
    triggers: ['PERSONAL_BEST'],
  },

  // Progress photos
  {
    id: 'progress_photo_1',
    name: 'Snapshot',
    description: 'Upload your first progress photo',
    icon: 'Camera',
    category: 'FITNESS',
    tier: 'BRONZE',
    triggers: ['DIARY_ENTRY'],
  },
  {
    id: 'progress_photo_10',
    name: 'Photo Journal',
    description: 'Upload 10 progress photos',
    icon: 'Camera',
    category: 'FITNESS',
    tier: 'SILVER',
    triggers: ['DIARY_ENTRY'],
  },
  {
    id: 'progress_photo_50',
    name: 'Visual Storyteller',
    description: 'Upload 50 progress photos',
    icon: 'Camera',
    category: 'FITNESS',
    tier: 'GOLD',
    triggers: ['DIARY_ENTRY'],
  },
];

// ============================================================================
// NUTRITION — food and water tracking
// ============================================================================

const NUTRITION_BADGES: BadgeDefinition[] = [
  // Food logging
  {
    id: 'food_1',
    name: 'First Meal',
    description: 'Log your first food entry',
    icon: 'Utensils',
    category: 'NUTRITION',
    tier: 'BRONZE',
    triggers: ['DIARY_ENTRY'],
  },
  {
    id: 'food_50',
    name: 'Meal Tracker',
    description: 'Log 50 food entries',
    icon: 'Utensils',
    category: 'NUTRITION',
    tier: 'BRONZE',
    triggers: ['DIARY_ENTRY'],
  },
  {
    id: 'food_100',
    name: 'Nutrition Nerd',
    description: 'Log 100 food entries',
    icon: 'Utensils',
    category: 'NUTRITION',
    tier: 'SILVER',
    triggers: ['DIARY_ENTRY'],
  },
  {
    id: 'food_500',
    name: 'Macro Master',
    description: 'Log 500 food entries',
    icon: 'Utensils',
    category: 'NUTRITION',
    tier: 'GOLD',
    triggers: ['DIARY_ENTRY'],
  },

  // Water tracking
  {
    id: 'water_1',
    name: 'First Sip',
    description: 'Log your first water entry',
    icon: 'Droplets',
    category: 'NUTRITION',
    tier: 'BRONZE',
    triggers: ['DIARY_ENTRY'],
  },
  {
    id: 'water_2l_day',
    name: 'Hydrated',
    description: 'Log 2 litres of water in a single day',
    icon: 'Droplets',
    category: 'NUTRITION',
    tier: 'BRONZE',
    triggers: ['DIARY_ENTRY'],
  },
  {
    id: 'water_3l_day',
    name: 'Super Hydrated',
    description: 'Log 3 litres of water in a single day',
    icon: 'Droplets',
    category: 'NUTRITION',
    tier: 'SILVER',
    triggers: ['DIARY_ENTRY'],
  },
  {
    id: 'water_streak_7',
    name: 'Hydration Habit',
    description: 'Log water for 7 days in a row',
    icon: 'Droplets',
    category: 'NUTRITION',
    tier: 'SILVER',
    triggers: ['DIARY_ENTRY'],
  },
  {
    id: 'water_streak_30',
    name: 'Water Champion',
    description: 'Log water for 30 days in a row',
    icon: 'Droplets',
    category: 'NUTRITION',
    tier: 'GOLD',
    triggers: ['DIARY_ENTRY'],
  },
];

// ============================================================================
// WELLNESS — mood, sleep, weight, measurements
// ============================================================================

const WELLNESS_BADGES: BadgeDefinition[] = [
  // Weight tracking
  {
    id: 'weight_1',
    name: 'Weigh-In',
    description: 'Log your first weight entry',
    icon: 'Scale',
    category: 'WELLNESS',
    tier: 'BRONZE',
    triggers: ['DIARY_ENTRY'],
  },
  {
    id: 'weight_streak_7',
    name: 'Weekly Weigh-In',
    description: 'Log weight for 7 days in a row',
    icon: 'Scale',
    category: 'WELLNESS',
    tier: 'SILVER',
    triggers: ['DIARY_ENTRY'],
  },

  // Sleep tracking
  {
    id: 'sleep_1',
    name: 'Sleep Tracker',
    description: 'Log your first sleep entry',
    icon: 'Moon',
    category: 'WELLNESS',
    tier: 'BRONZE',
    triggers: ['DIARY_ENTRY'],
  },
  {
    id: 'sleep_30',
    name: 'Sleep Scientist',
    description: 'Log 30 sleep entries',
    icon: 'Moon',
    category: 'WELLNESS',
    tier: 'SILVER',
    triggers: ['DIARY_ENTRY'],
  },
  {
    id: 'sleep_8h',
    name: 'Well Rested',
    description: 'Log 8+ hours of sleep',
    icon: 'Moon',
    category: 'WELLNESS',
    tier: 'BRONZE',
    triggers: ['DIARY_ENTRY'],
  },

  // Mood tracking
  {
    id: 'mood_1',
    name: 'Mood Check',
    description: 'Log your first mood entry',
    icon: 'Smile',
    category: 'WELLNESS',
    tier: 'BRONZE',
    triggers: ['DIARY_ENTRY'],
  },
  {
    id: 'mood_great_7',
    name: 'Great Week',
    description: 'Log a "great" mood 7 times',
    icon: 'Smile',
    category: 'WELLNESS',
    tier: 'SILVER',
    triggers: ['DIARY_ENTRY'],
  },
  {
    id: 'mood_streak_30',
    name: 'Mindful Month',
    description: 'Log your mood for 30 days in a row',
    icon: 'Smile',
    category: 'WELLNESS',
    tier: 'GOLD',
    triggers: ['DIARY_ENTRY'],
  },

  // Measurements
  {
    id: 'measurement_1',
    name: 'Measuring Up',
    description: 'Log your first body measurement',
    icon: 'Ruler',
    category: 'WELLNESS',
    tier: 'BRONZE',
    triggers: ['DIARY_ENTRY'],
  },
];

// ============================================================================
// SOCIAL — friends, posts, likes, community
// ============================================================================

const SOCIAL_BADGES: BadgeDefinition[] = [
  // Friends
  {
    id: 'friend_1',
    name: 'First Friend',
    description: 'Make your first friend',
    icon: 'Heart',
    category: 'SOCIAL',
    tier: 'BRONZE',
    triggers: ['FRIENDSHIP'],
  },
  {
    id: 'friend_5',
    name: 'Social Butterfly',
    description: 'Make 5 friends',
    icon: 'Heart',
    category: 'SOCIAL',
    tier: 'BRONZE',
    triggers: ['FRIENDSHIP'],
  },
  {
    id: 'friend_10',
    name: 'Popular',
    description: 'Make 10 friends',
    icon: 'Heart',
    category: 'SOCIAL',
    tier: 'SILVER',
    triggers: ['FRIENDSHIP'],
  },
  {
    id: 'friend_25',
    name: 'Life of the Party',
    description: 'Make 25 friends',
    icon: 'Heart',
    category: 'SOCIAL',
    tier: 'GOLD',
    triggers: ['FRIENDSHIP'],
  },

  // Following trainers
  {
    id: 'follow_1',
    name: 'Fan',
    description: 'Follow your first trainer',
    icon: 'UserPlus',
    category: 'SOCIAL',
    tier: 'BRONZE',
    triggers: ['FOLLOW'],
  },
  {
    id: 'follow_5',
    name: 'PT Explorer',
    description: 'Follow 5 trainers',
    icon: 'UserPlus',
    category: 'SOCIAL',
    tier: 'SILVER',
    triggers: ['FOLLOW'],
  },

  // Posts
  {
    id: 'post_1',
    name: 'First Post',
    description: 'Create your first post',
    icon: 'Rss',
    category: 'SOCIAL',
    tier: 'BRONZE',
    triggers: ['POST'],
  },
  {
    id: 'post_10',
    name: 'Active Poster',
    description: 'Create 10 posts',
    icon: 'Rss',
    category: 'SOCIAL',
    tier: 'SILVER',
    triggers: ['POST'],
  },
  {
    id: 'post_50',
    name: 'Content Creator',
    description: 'Create 50 posts',
    icon: 'Rss',
    category: 'SOCIAL',
    tier: 'GOLD',
    triggers: ['POST'],
  },

  // Receiving likes
  {
    id: 'likes_received_1',
    name: 'First Like',
    description: 'Receive your first like',
    icon: 'ThumbsUp',
    category: 'SOCIAL',
    tier: 'BRONZE',
    triggers: ['LIKE_RECEIVED'],
  },
  {
    id: 'likes_received_10',
    name: 'Crowd Pleaser',
    description: 'Receive 10 likes',
    icon: 'ThumbsUp',
    category: 'SOCIAL',
    tier: 'BRONZE',
    triggers: ['LIKE_RECEIVED'],
  },
  {
    id: 'likes_received_50',
    name: 'Inspiration',
    description: 'Receive 50 likes',
    icon: 'ThumbsUp',
    category: 'SOCIAL',
    tier: 'SILVER',
    triggers: ['LIKE_RECEIVED'],
  },
  {
    id: 'likes_received_100',
    name: 'Community Hero',
    description: 'Receive 100 likes',
    icon: 'ThumbsUp',
    category: 'SOCIAL',
    tier: 'GOLD',
    triggers: ['LIKE_RECEIVED'],
  },
];

// ============================================================================
// GOALS — setting and achieving goals
// ============================================================================

const GOALS_BADGES: BadgeDefinition[] = [
  {
    id: 'goal_completed_1',
    name: 'Goal Getter',
    description: 'Complete your first goal',
    icon: 'Target',
    category: 'GOALS',
    tier: 'BRONZE',
    triggers: ['GOAL_COMPLETED'],
  },
  {
    id: 'goal_completed_3',
    name: 'On a Roll',
    description: 'Complete 3 goals',
    icon: 'Target',
    category: 'GOALS',
    tier: 'BRONZE',
    triggers: ['GOAL_COMPLETED'],
  },
  {
    id: 'goal_completed_5',
    name: 'High Achiever',
    description: 'Complete 5 goals',
    icon: 'Target',
    category: 'GOALS',
    tier: 'SILVER',
    triggers: ['GOAL_COMPLETED'],
  },
  {
    id: 'goal_completed_10',
    name: 'Goal Machine',
    description: 'Complete 10 goals',
    icon: 'Target',
    category: 'GOALS',
    tier: 'SILVER',
    triggers: ['GOAL_COMPLETED'],
  },
  {
    id: 'goal_completed_25',
    name: 'Unstoppable Achiever',
    description: 'Complete 25 goals',
    icon: 'Target',
    category: 'GOALS',
    tier: 'GOLD',
    triggers: ['GOAL_COMPLETED'],
  },
  {
    id: 'goal_completed_50',
    name: 'Goal Legend',
    description: 'Complete 50 goals',
    icon: 'Target',
    category: 'GOALS',
    tier: 'GOLD',
    triggers: ['GOAL_COMPLETED'],
  },
];

// ============================================================================
// EXPLORER — trying different features, diversity of use
// ============================================================================

const EXPLORER_BADGES: BadgeDefinition[] = [
  // Diary type variety
  {
    id: 'diary_types_3',
    name: 'Explorer',
    description: 'Use 3 different diary entry types',
    icon: 'Compass',
    category: 'EXPLORER',
    tier: 'BRONZE',
    triggers: ['DIARY_ENTRY'],
  },
  {
    id: 'diary_types_5',
    name: 'Well Rounded',
    description: 'Use 5 different diary entry types',
    icon: 'Compass',
    category: 'EXPLORER',
    tier: 'SILVER',
    triggers: ['DIARY_ENTRY'],
  },
  {
    id: 'diary_types_all',
    name: 'Complete Tracker',
    description: 'Use every diary entry type at least once',
    icon: 'Compass',
    category: 'EXPLORER',
    tier: 'GOLD',
    triggers: ['DIARY_ENTRY'],
  },

  // Weekend warrior
  {
    id: 'weekend_warrior_4',
    name: 'Weekend Warrior',
    description: 'Log activities on 4 consecutive weekends',
    icon: 'Zap',
    category: 'EXPLORER',
    tier: 'SILVER',
    triggers: ['DIARY_ENTRY'],
  },

  // Account milestones
  {
    id: 'account_7_days',
    name: 'One Week In',
    description: 'Be a member for 1 week',
    icon: 'Calendar',
    category: 'EXPLORER',
    tier: 'BRONZE',
    triggers: ['ACCOUNT'],
  },
  {
    id: 'account_30_days',
    name: 'Monthly Member',
    description: 'Be a member for 1 month',
    icon: 'Calendar',
    category: 'EXPLORER',
    tier: 'BRONZE',
    triggers: ['ACCOUNT'],
  },
  {
    id: 'account_90_days',
    name: 'Quarterly Commitment',
    description: 'Be a member for 3 months',
    icon: 'Calendar',
    category: 'EXPLORER',
    tier: 'SILVER',
    triggers: ['ACCOUNT'],
  },
  {
    id: 'account_365_days',
    name: 'Year One',
    description: 'Be a member for 1 year',
    icon: 'Calendar',
    category: 'EXPLORER',
    tier: 'GOLD',
    triggers: ['ACCOUNT'],
  },
];

// ============================================================================
// ALL BADGES
// ============================================================================

export const ALL_BADGES: BadgeDefinition[] = [
  ...CONSISTENCY_BADGES,
  ...FITNESS_BADGES,
  ...NUTRITION_BADGES,
  ...WELLNESS_BADGES,
  ...SOCIAL_BADGES,
  ...GOALS_BADGES,
  ...EXPLORER_BADGES,
];

export const BADGE_MAP = new Map<string, BadgeDefinition>(
  ALL_BADGES.map((b) => [b.id, b])
);

export const BADGE_CATEGORIES: { key: BadgeCategory; label: string; icon: string }[] = [
  { key: 'CONSISTENCY', label: 'Consistency', icon: 'Flame' },
  { key: 'FITNESS', label: 'Fitness', icon: 'Dumbbell' },
  { key: 'NUTRITION', label: 'Nutrition', icon: 'Utensils' },
  { key: 'WELLNESS', label: 'Wellness', icon: 'Heart' },
  { key: 'SOCIAL', label: 'Social', icon: 'Users' },
  { key: 'GOALS', label: 'Goals', icon: 'Target' },
  { key: 'EXPLORER', label: 'Explorer', icon: 'Compass' },
];
