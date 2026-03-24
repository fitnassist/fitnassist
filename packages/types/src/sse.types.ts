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
  | SseGoalCompletedEvent
  | SseBookingCreatedEvent
  | SseBookingCancelledEvent
  | SseNotificationEvent
  | SseHeartbeatEvent;
