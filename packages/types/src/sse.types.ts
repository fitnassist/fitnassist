// =============================================================================
// MESSAGE EVENTS
// =============================================================================

export interface SseNewMessageEvent {
  type: 'new_message';
  connectionId: string;
  message: {
    id: string;
    connectionId: string;
    senderId: string;
    content: string;
    isRead: boolean;
    readAt: Date | null;
    createdAt: Date;
    sender: {
      id: string;
      name: string;
      image: string | null;
      trainerProfile: { profileImageUrl: string | null } | null;
      traineeProfile: { avatarUrl: string | null } | null;
    };
  };
}

export interface SseMessagesReadEvent {
  type: 'messages_read';
  connectionId: string;
  readBy: string;
}

// =============================================================================
// CONTACT REQUEST EVENTS
// =============================================================================

export interface SseNewRequestEvent {
  type: 'new_request';
  requestId: string;
  requestType: 'CONNECTION_REQUEST' | 'CALLBACK_REQUEST';
  senderName: string;
}

export interface SseConnectionAcceptedEvent {
  type: 'connection_accepted';
  requestId: string;
  trainerName: string;
}

export interface SseConnectionDeclinedEvent {
  type: 'connection_declined';
  requestId: string;
  trainerName: string;
}

// =============================================================================
// DIARY EVENTS
// =============================================================================

export interface SseDiaryEntryEvent {
  type: 'diary_entry';
  userId: string;
  userName: string;
  entryType: string;
  date: string;
}

export interface SseDiaryCommentEvent {
  type: 'diary_comment';
  userId: string;
  userName: string;
  diaryEntryId: string;
  date: string;
}

// =============================================================================
// PERSONAL BEST EVENTS
// =============================================================================

export interface SsePersonalBestEvent {
  type: 'personal_best';
  userId: string;
  userName: string;
  label: string;
}

// =============================================================================
// GOAL EVENTS
// =============================================================================

export interface SseGoalCompletedEvent {
  type: 'goal_completed';
  userId: string;
  userName: string;
  goalName: string;
}

// =============================================================================
// BOOKING EVENTS
// =============================================================================

export interface SseBookingCreatedEvent {
  type: 'booking_created';
  bookingId: string;
  date: string;
  startTime: string;
}

export interface SseBookingCancelledEvent {
  type: 'booking_cancelled';
  bookingId: string;
  cancelledBy: string;
  reason?: string;
}

export interface SseBookingPendingEvent {
  type: 'booking_pending';
  bookingId: string;
}

export interface SseBookingConfirmedEvent {
  type: 'booking_confirmed';
  bookingId: string;
}

export interface SseBookingDeclinedEvent {
  type: 'booking_declined';
  bookingId: string;
}

export interface SseBookingRescheduledEvent {
  type: 'booking_rescheduled';
  bookingId: string;
}

export interface SseBookingHoldExpiredEvent {
  type: 'booking_hold_expired';
  bookingId: string;
}

export interface SseBookingSuggestionEvent {
  type: 'booking_suggestion';
  bookingId: string;
}

// =============================================================================
// NOTIFICATION EVENTS
// =============================================================================

export interface SseNotificationEvent {
  type: 'notification';
  notification: {
    id: string;
    type: string;
    title: string;
    body: string | null;
    data: unknown;
    link: string | null;
    isRead: boolean;
    createdAt: Date;
  };
}

// =============================================================================
// SOCIAL EVENTS
// =============================================================================

export interface SseFriendRequestEvent {
  type: 'friend_request';
  friendshipId: string;
  requesterId: string;
  requesterName: string;
}

export interface SseFriendAcceptedEvent {
  type: 'friend_accepted';
  friendshipId: string;
  addresseeId: string;
  addresseeName: string;
}

export interface SseNewFollowerEvent {
  type: 'new_follower';
  followerId: string;
  followerName: string;
}

// =============================================================================
// POST EVENTS
// =============================================================================

export interface SseNewPostEvent {
  type: 'new_post';
  postId: string;
  authorName: string;
}

export interface SsePostLikedEvent {
  type: 'post_liked';
  postId: string;
  userName: string;
}

export interface SseDiaryEntryLikedEvent {
  type: 'diary_entry_liked';
  diaryEntryId: string;
  userName: string;
}

// =============================================================================
// BADGE EVENTS
// =============================================================================

export interface SseBadgeEarnedEvent {
  type: 'badge_earned';
  badgeId: string;
  badgeName: string;
}

// =============================================================================
// SYSTEM EVENTS
// =============================================================================

export interface SseHeartbeatEvent {
  type: 'heartbeat';
  timestamp: number;
}

// =============================================================================
// UNION TYPE
// =============================================================================

export type SseEvent =
  | SseNewMessageEvent
  | SseMessagesReadEvent
  | SseNewRequestEvent
  | SseConnectionAcceptedEvent
  | SseConnectionDeclinedEvent
  | SseDiaryEntryEvent
  | SseDiaryCommentEvent
  | SsePersonalBestEvent
  | SseGoalCompletedEvent
  | SseBookingCreatedEvent
  | SseBookingCancelledEvent
  | SseBookingPendingEvent
  | SseBookingConfirmedEvent
  | SseBookingDeclinedEvent
  | SseBookingRescheduledEvent
  | SseBookingHoldExpiredEvent
  | SseBookingSuggestionEvent
  | SseNotificationEvent
  | SseFriendRequestEvent
  | SseFriendAcceptedEvent
  | SseNewFollowerEvent
  | SseNewPostEvent
  | SsePostLikedEvent
  | SseDiaryEntryLikedEvent
  | SseBadgeEarnedEvent
  | SseHeartbeatEvent;
