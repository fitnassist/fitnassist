import { env } from '../config/env';

const dashboardUrl = `${env.FRONTEND_URL}/dashboard`;
const messagesUrl = `${dashboardUrl}/messages`;
const requestsUrl = `${dashboardUrl}/requests`;
const bookingsUrl = `${dashboardUrl}/bookings`;
const settingsUrl = `${dashboardUrl}/settings`;

const layout = (content: string) => `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
    ${content}
    <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
    <p style="font-size: 12px; color: #888;">
      You're receiving this because of your notification settings on Fitnassist.
      <a href="${settingsUrl}" style="color: #888;">Manage preferences</a>
    </p>
  </div>
`;

export const emailTemplates = {
  callbackRequest: (senderName: string, senderEmail: string, phone: string, message?: string) =>
    layout(`
      <h2 style="margin: 0 0 16px;">New callback request</h2>
      <p><strong>From:</strong> ${senderName}</p>
      <p><strong>Phone:</strong> ${phone}</p>
      <p><strong>Email:</strong> ${senderEmail}</p>
      ${message ? `<p><strong>Note:</strong> ${message}</p>` : ''}
      <p style="margin-top: 24px;">
        <a href="${requestsUrl}" style="display: inline-block; background: #0f172a; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none;">
          View requests
        </a>
      </p>
    `),

  connectionRequest: (senderName: string, senderEmail: string, message: string) =>
    layout(`
      <h2 style="margin: 0 0 16px;">New connection request</h2>
      <p><strong>From:</strong> ${senderName}</p>
      <p><strong>Email:</strong> ${senderEmail}</p>
      <p><strong>Message:</strong></p>
      <p style="background: #f5f5f5; padding: 12px; border-radius: 6px;">${message}</p>
      <p style="margin-top: 24px;">
        <a href="${requestsUrl}" style="display: inline-block; background: #0f172a; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none;">
          Accept or decline
        </a>
      </p>
    `),

  connectionAccepted: (trainerName: string, connectionId: string) =>
    layout(`
      <h2 style="margin: 0 0 16px;">Connection accepted!</h2>
      <p><strong>${trainerName}</strong> has accepted your connection request.</p>
      <p>You can now send them messages directly.</p>
      <p style="margin-top: 24px;">
        <a href="${messagesUrl}/${connectionId}" style="display: inline-block; background: #0f172a; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none;">
          Start chatting
        </a>
      </p>
    `),

  connectionDeclined: (trainerName: string) =>
    layout(`
      <h2 style="margin: 0 0 16px;">Connection update</h2>
      <p><strong>${trainerName}</strong> has declined your connection request.</p>
      <p>You can browse other trainers and send new connection requests.</p>
      <p style="margin-top: 24px;">
        <a href="${env.FRONTEND_URL}/trainers" style="display: inline-block; background: #0f172a; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none;">
          Find trainers
        </a>
      </p>
    `),

  newMessage: (senderName: string, messagePreview: string, connectionId: string) =>
    layout(`
      <h2 style="margin: 0 0 16px;">New message from ${senderName}</h2>
      <p style="background: #f5f5f5; padding: 12px; border-radius: 6px;">${messagePreview}</p>
      <p style="margin-top: 24px;">
        <a href="${messagesUrl}/${connectionId}" style="display: inline-block; background: #0f172a; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none;">
          Reply
        </a>
      </p>
    `),

  weeklyReport: (data: {
    trainerName: string;
    weekStart: string;
    weekEnd: string;
    clients: Array<{
      name: string;
      diaryEntries: number;
      weightEntries: number;
      foodEntries: number;
      exerciseEntries: number;
      goalsCompleted: number;
      totalGoals: number;
    }>;
  }) => {
    const clientCards = data.clients
      .map((client) => {
        const needsAttention = client.diaryEntries === 0;
        const borderColor = needsAttention ? '#f59e0b' : '#e5e5e5';
        const attentionBadge = needsAttention
          ? '<span style="display: inline-block; background: #fef3c7; color: #92400e; font-size: 11px; padding: 2px 8px; border-radius: 4px; margin-left: 8px;">Needs attention</span>'
          : '';

        const goalText =
          client.totalGoals > 0
            ? `${client.goalsCompleted} of ${client.totalGoals} completed`
            : 'No active goals';

        return `
          <div style="border: 1px solid ${borderColor}; border-radius: 8px; padding: 16px; margin-bottom: 12px;">
            <p style="margin: 0 0 8px; font-weight: 600;">${client.name}${attentionBadge}</p>
            <table style="width: 100%; font-size: 13px; color: #555;">
              <tr>
                <td style="padding: 2px 0;">Diary entries</td>
                <td style="padding: 2px 0; text-align: right; font-weight: 500;">${client.diaryEntries}</td>
              </tr>
              <tr>
                <td style="padding: 2px 0;">Weight logs</td>
                <td style="padding: 2px 0; text-align: right; font-weight: 500;">${client.weightEntries}</td>
              </tr>
              <tr>
                <td style="padding: 2px 0;">Food logs</td>
                <td style="padding: 2px 0; text-align: right; font-weight: 500;">${client.foodEntries}</td>
              </tr>
              <tr>
                <td style="padding: 2px 0;">Workouts</td>
                <td style="padding: 2px 0; text-align: right; font-weight: 500;">${client.exerciseEntries}</td>
              </tr>
              <tr>
                <td style="padding: 2px 0;">Goals</td>
                <td style="padding: 2px 0; text-align: right; font-weight: 500;">${goalText}</td>
              </tr>
            </table>
          </div>
        `;
      })
      .join('');

    return layout(`
      <h2 style="margin: 0 0 4px;">Weekly Client Report</h2>
      <p style="margin: 0 0 20px; color: #888; font-size: 14px;">${data.weekStart} &ndash; ${data.weekEnd}</p>
      <p>Hi ${data.trainerName}, here's a summary of your clients' activity this week.</p>
      ${clientCards}
      <p style="margin-top: 24px;">
        <a href="${dashboardUrl}/clients" style="display: inline-block; background: #0f172a; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none;">
          View clients
        </a>
      </p>
    `);
  },

  clientWeeklyProgress: (data: {
    clientName: string;
    weekStart: string;
    weekEnd: string;
    weightChange: { current: number; previous: number; unit: string } | null;
    diaryStats: {
      totalEntries: number;
      foodEntries: number;
      workoutEntries: number;
      waterEntries: number;
      stepsEntries: number;
      sleepEntries: number;
    };
    goalsCompleted: number;
    activeGoals: number;
    streak: number;
  }) => {
    const weightSection = data.weightChange
      ? (() => {
          const diff = data.weightChange.current - data.weightChange.previous;
          const diffAbs = Math.abs(diff).toFixed(1);
          const arrow = diff < 0 ? '&#9660;' : diff > 0 ? '&#9650;' : '';
          const diffColor = diff < 0 ? '#16a34a' : diff > 0 ? '#dc2626' : '#555';
          const diffText =
            diff !== 0
              ? `<span style="color: ${diffColor}; font-size: 13px;"> ${arrow} ${diffAbs} ${data.weightChange.unit}</span>`
              : '';
          return `
            <div style="background: #f5f5f5; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
              <p style="margin: 0 0 4px; font-size: 13px; color: #888;">Current Weight</p>
              <p style="margin: 0; font-size: 20px; font-weight: 600;">
                ${data.weightChange.current.toFixed(1)} ${data.weightChange.unit}${diffText}
              </p>
            </div>
          `;
        })()
      : '';

    const lowActivity = data.diaryStats.totalEntries < 2;
    const encouragement = lowActivity
      ? '<p style="background: #fef3c7; padding: 12px; border-radius: 6px; font-size: 13px; color: #92400e;">Every small step counts &mdash; try logging one thing tomorrow!</p>'
      : '';

    const streakSection =
      data.streak > 0
        ? `<p style="font-size: 14px; color: #555;">You logged activity <strong>${data.streak} day${data.streak !== 1 ? 's' : ''}</strong> in a row!</p>`
        : '';

    const goalsSection =
      data.goalsCompleted > 0 || data.activeGoals > 0
        ? `
          <div style="margin-bottom: 16px;">
            <p style="margin: 0 0 8px; font-weight: 600;">Goals</p>
            <table style="width: 100%; font-size: 13px; color: #555;">
              <tr>
                <td style="padding: 2px 0;">Completed this week</td>
                <td style="padding: 2px 0; text-align: right; font-weight: 500;">${data.goalsCompleted}</td>
              </tr>
              <tr>
                <td style="padding: 2px 0;">Still active</td>
                <td style="padding: 2px 0; text-align: right; font-weight: 500;">${data.activeGoals}</td>
              </tr>
            </table>
          </div>
        `
        : '';

    return layout(`
      <h2 style="margin: 0 0 4px;">Your Weekly Progress</h2>
      <p style="margin: 0 0 20px; color: #888; font-size: 14px;">${data.weekStart} &ndash; ${data.weekEnd}</p>
      <p>Hi ${data.clientName}, here's a summary of your activity this week.</p>
      ${weightSection}
      <div style="border: 1px solid #e5e5e5; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
        <p style="margin: 0 0 8px; font-weight: 600;">Activity Overview</p>
        <table style="width: 100%; font-size: 13px; color: #555;">
          <tr>
            <td style="padding: 2px 0;">Total entries</td>
            <td style="padding: 2px 0; text-align: right; font-weight: 500;">${data.diaryStats.totalEntries}</td>
          </tr>
          <tr>
            <td style="padding: 2px 0;">Food logs</td>
            <td style="padding: 2px 0; text-align: right; font-weight: 500;">${data.diaryStats.foodEntries}</td>
          </tr>
          <tr>
            <td style="padding: 2px 0;">Workouts</td>
            <td style="padding: 2px 0; text-align: right; font-weight: 500;">${data.diaryStats.workoutEntries}</td>
          </tr>
          <tr>
            <td style="padding: 2px 0;">Water logs</td>
            <td style="padding: 2px 0; text-align: right; font-weight: 500;">${data.diaryStats.waterEntries}</td>
          </tr>
          <tr>
            <td style="padding: 2px 0;">Steps logs</td>
            <td style="padding: 2px 0; text-align: right; font-weight: 500;">${data.diaryStats.stepsEntries}</td>
          </tr>
          <tr>
            <td style="padding: 2px 0;">Sleep logs</td>
            <td style="padding: 2px 0; text-align: right; font-weight: 500;">${data.diaryStats.sleepEntries}</td>
          </tr>
        </table>
      </div>
      ${goalsSection}
      ${streakSection}
      ${encouragement}
      <p style="margin-top: 24px;">
        <a href="${dashboardUrl}/diary" style="display: inline-block; background: #0f172a; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none;">
          View your diary
        </a>
      </p>
    `);
  },

  bookingConfirmation: (data: {
    recipientName: string;
    otherPartyName: string;
    date: string;
    startTime: string;
    endTime: string;
    durationMin: number;
    locationName?: string;
    notes?: string;
    isTrainer: boolean;
    sessionType?: string;
    bookingId?: string;
  }) =>
    layout(`
      <h2 style="margin: 0 0 16px;">Booking confirmed</h2>
      <p>Hi ${data.recipientName}, a session has been booked${data.isTrainer ? ` by ${data.otherPartyName}` : ` with ${data.otherPartyName}`}.</p>
      <div style="background: #f5f5f5; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <table style="width: 100%; font-size: 14px;">
          <tr>
            <td style="padding: 4px 0; color: #888;">Date</td>
            <td style="padding: 4px 0; text-align: right; font-weight: 500;">${data.date}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #888;">Time</td>
            <td style="padding: 4px 0; text-align: right; font-weight: 500;">${data.startTime} - ${data.endTime} (${data.durationMin} min)</td>
          </tr>
          ${data.sessionType === 'VIDEO_CALL' ? `<tr>
            <td style="padding: 4px 0; color: #888;">Type</td>
            <td style="padding: 4px 0; text-align: right; font-weight: 500;">Video Call</td>
          </tr>` : ''}
          ${data.locationName ? `<tr>
            <td style="padding: 4px 0; color: #888;">Location</td>
            <td style="padding: 4px 0; text-align: right; font-weight: 500;">${data.locationName}</td>
          </tr>` : ''}
          ${data.notes ? `<tr>
            <td style="padding: 4px 0; color: #888;">Notes</td>
            <td style="padding: 4px 0; text-align: right; font-weight: 500;">${data.notes}</td>
          </tr>` : ''}
        </table>
      </div>
      ${data.sessionType === 'VIDEO_CALL' && data.bookingId ? `<p style="margin-top: 16px;">
        <a href="${bookingsUrl}/${data.bookingId}/call" style="display: inline-block; background: #2563eb; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none;">
          Join Video Call
        </a>
      </p>` : ''}
      <p style="margin-top: 24px;">
        <a href="${bookingsUrl}" style="display: inline-block; background: #0f172a; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none;">
          View bookings
        </a>
      </p>
    `),

  bookingCancellation: (data: {
    recipientName: string;
    cancelledByName: string;
    date: string;
    startTime: string;
    endTime: string;
    reason?: string;
  }) =>
    layout(`
      <h2 style="margin: 0 0 16px;">Booking cancelled</h2>
      <p>Hi ${data.recipientName}, a session has been cancelled by ${data.cancelledByName}.</p>
      <div style="background: #f5f5f5; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <table style="width: 100%; font-size: 14px;">
          <tr>
            <td style="padding: 4px 0; color: #888;">Date</td>
            <td style="padding: 4px 0; text-align: right; font-weight: 500;">${data.date}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #888;">Time</td>
            <td style="padding: 4px 0; text-align: right; font-weight: 500;">${data.startTime} - ${data.endTime}</td>
          </tr>
          ${data.reason ? `<tr>
            <td style="padding: 4px 0; color: #888;">Reason</td>
            <td style="padding: 4px 0; text-align: right; font-weight: 500;">${data.reason}</td>
          </tr>` : ''}
        </table>
      </div>
      <p style="margin-top: 24px;">
        <a href="${bookingsUrl}" style="display: inline-block; background: #0f172a; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none;">
          View bookings
        </a>
      </p>
    `),

  bookingReminder: (data: {
    recipientName: string;
    otherPartyName: string;
    date: string;
    startTime: string;
    endTime: string;
    durationMin: number;
    locationName?: string;
    notes?: string;
    isTrainer: boolean;
    sessionType?: string;
    bookingId?: string;
  }) =>
    layout(`
      <h2 style="margin: 0 0 16px;">Session tomorrow</h2>
      <p>Hi ${data.recipientName}, this is a reminder that you have a session with ${data.otherPartyName} tomorrow.</p>
      <div style="background: #f5f5f5; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <table style="width: 100%; font-size: 14px;">
          <tr>
            <td style="padding: 4px 0; color: #888;">Date</td>
            <td style="padding: 4px 0; text-align: right; font-weight: 500;">${data.date}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #888;">Time</td>
            <td style="padding: 4px 0; text-align: right; font-weight: 500;">${data.startTime} - ${data.endTime} (${data.durationMin} min)</td>
          </tr>
          ${data.sessionType === 'VIDEO_CALL' ? `<tr>
            <td style="padding: 4px 0; color: #888;">Type</td>
            <td style="padding: 4px 0; text-align: right; font-weight: 500;">Video Call</td>
          </tr>` : ''}
          ${data.locationName ? `<tr>
            <td style="padding: 4px 0; color: #888;">Location</td>
            <td style="padding: 4px 0; text-align: right; font-weight: 500;">${data.locationName}</td>
          </tr>` : ''}
          ${data.notes ? `<tr>
            <td style="padding: 4px 0; color: #888;">Notes</td>
            <td style="padding: 4px 0; text-align: right; font-weight: 500;">${data.notes}</td>
          </tr>` : ''}
        </table>
      </div>
      ${data.sessionType === 'VIDEO_CALL' && data.bookingId ? `<p style="margin-top: 16px;">
        <a href="${bookingsUrl}/${data.bookingId}/call" style="display: inline-block; background: #2563eb; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none;">
          Join Video Call
        </a>
      </p>` : ''}
      <p style="margin-top: 24px;">
        <a href="${bookingsUrl}" style="display: inline-block; background: #0f172a; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none;">
          View bookings
        </a>
      </p>
    `),

  bookingPending: (data: {
    recipientName: string;
    requesterName: string;
    date: string;
    startTime: string;
    endTime: string;
    durationMin: number;
    locationName?: string;
    notes?: string;
    sessionType?: string;
  }) =>
    layout(`
      <h2 style="margin: 0 0 16px;">Session request</h2>
      <p>Hi ${data.recipientName}, ${data.requesterName} has requested a session with you. Please confirm or decline.</p>
      <div style="background: #f5f5f5; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <table style="width: 100%; font-size: 14px;">
          <tr>
            <td style="padding: 4px 0; color: #888;">Date</td>
            <td style="padding: 4px 0; text-align: right; font-weight: 500;">${data.date}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #888;">Time</td>
            <td style="padding: 4px 0; text-align: right; font-weight: 500;">${data.startTime} - ${data.endTime} (${data.durationMin} min)</td>
          </tr>
          ${data.sessionType === 'VIDEO_CALL' ? `<tr>
            <td style="padding: 4px 0; color: #888;">Type</td>
            <td style="padding: 4px 0; text-align: right; font-weight: 500;">Video Call</td>
          </tr>` : ''}
          ${data.locationName ? `<tr>
            <td style="padding: 4px 0; color: #888;">Location</td>
            <td style="padding: 4px 0; text-align: right; font-weight: 500;">${data.locationName}</td>
          </tr>` : ''}
          ${data.notes ? `<tr>
            <td style="padding: 4px 0; color: #888;">Notes</td>
            <td style="padding: 4px 0; text-align: right; font-weight: 500;">${data.notes}</td>
          </tr>` : ''}
        </table>
      </div>
      <p style="font-size: 13px; color: #888;">This slot is held for 48 hours. If not confirmed, it will be automatically released.</p>
      <p style="margin-top: 24px;">
        <a href="${bookingsUrl}" style="display: inline-block; background: #0f172a; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none;">
          Review request
        </a>
      </p>
    `),

  bookingDeclined: (data: {
    recipientName: string;
    declinedByName: string;
    date: string;
    startTime: string;
    endTime: string;
    reason?: string;
  }) =>
    layout(`
      <h2 style="margin: 0 0 16px;">Session request declined</h2>
      <p>Hi ${data.recipientName}, ${data.declinedByName} has declined the session request.</p>
      <div style="background: #f5f5f5; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <table style="width: 100%; font-size: 14px;">
          <tr>
            <td style="padding: 4px 0; color: #888;">Date</td>
            <td style="padding: 4px 0; text-align: right; font-weight: 500;">${data.date}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #888;">Time</td>
            <td style="padding: 4px 0; text-align: right; font-weight: 500;">${data.startTime} - ${data.endTime}</td>
          </tr>
          ${data.reason ? `<tr>
            <td style="padding: 4px 0; color: #888;">Reason</td>
            <td style="padding: 4px 0; text-align: right; font-weight: 500;">${data.reason}</td>
          </tr>` : ''}
        </table>
      </div>
      <p style="margin-top: 24px;">
        <a href="${bookingsUrl}" style="display: inline-block; background: #0f172a; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none;">
          View bookings
        </a>
      </p>
    `),

  bookingRescheduled: (data: {
    recipientName: string;
    rescheduledByName: string;
    oldDate: string;
    oldStartTime: string;
    newDate: string;
    newStartTime: string;
    newEndTime: string;
    durationMin: number;
  }) =>
    layout(`
      <h2 style="margin: 0 0 16px;">Session rescheduled</h2>
      <p>Hi ${data.recipientName}, ${data.rescheduledByName} has rescheduled a session. Please confirm the new time.</p>
      <div style="background: #f5f5f5; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <table style="width: 100%; font-size: 14px;">
          <tr>
            <td style="padding: 4px 0; color: #888;">Previously</td>
            <td style="padding: 4px 0; text-align: right; font-weight: 500; text-decoration: line-through; color: #888;">${data.oldDate} at ${data.oldStartTime}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #888;">New date</td>
            <td style="padding: 4px 0; text-align: right; font-weight: 500;">${data.newDate}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #888;">New time</td>
            <td style="padding: 4px 0; text-align: right; font-weight: 500;">${data.newStartTime} - ${data.newEndTime} (${data.durationMin} min)</td>
          </tr>
        </table>
      </div>
      <p style="font-size: 13px; color: #888;">This slot is held for 48 hours pending your confirmation.</p>
      <p style="margin-top: 24px;">
        <a href="${bookingsUrl}" style="display: inline-block; background: #0f172a; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none;">
          Review reschedule
        </a>
      </p>
    `),

  bookingSuggestion: (data: {
    recipientName: string;
    suggestorName: string;
    originalDate: string;
    originalStartTime: string;
    suggestions: { date: string; startTime: string; endTime: string }[];
  }) =>
    layout(`
      <h2 style="margin: 0 0 16px;">Alternative times suggested</h2>
      <p>Hi ${data.recipientName}, ${data.suggestorName} has suggested alternative times for the session on ${data.originalDate} at ${data.originalStartTime}.</p>
      <div style="background: #f5f5f5; border-radius: 8px; padding: 16px; margin: 16px 0;">
        ${data.suggestions.map((s, i) => `
          <div style="padding: 8px 0;${i > 0 ? ' border-top: 1px solid #e5e5e5;' : ''}">
            <strong>Option ${i + 1}:</strong> ${s.date} at ${s.startTime} - ${s.endTime}
          </div>
        `).join('')}
      </div>
      <p style="margin-top: 24px;">
        <a href="${bookingsUrl}" style="display: inline-block; background: #0f172a; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none;">
          Review suggestions
        </a>
      </p>
    `),

  paymentReceived: (data: {
    recipientName: string;
    otherPartyName: string;
    amount: string;
    date: string;
    startTime: string;
    endTime: string;
    bookingId: string;
    isTrainer: boolean;
  }) =>
    layout(`
      <h2 style="margin: 0 0 16px;">Payment received</h2>
      <p>Hi ${data.recipientName}, payment of <strong>${data.amount}</strong> has been received for your session ${data.isTrainer ? `with ${data.otherPartyName}` : `with ${data.otherPartyName}`}.</p>
      <div style="background: #f5f5f5; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <table style="width: 100%; font-size: 14px;">
          <tr>
            <td style="padding: 4px 0; color: #888;">Amount</td>
            <td style="padding: 4px 0; text-align: right; font-weight: 500;">${data.amount}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #888;">Date</td>
            <td style="padding: 4px 0; text-align: right; font-weight: 500;">${data.date}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #888;">Time</td>
            <td style="padding: 4px 0; text-align: right; font-weight: 500;">${data.startTime} - ${data.endTime}</td>
          </tr>
        </table>
      </div>
      <p style="margin-top: 24px;">
        <a href="${bookingsUrl}/${data.bookingId}" style="display: inline-block; background: #0f172a; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none;">
          View booking
        </a>
      </p>
    `),

  refundProcessed: (data: {
    recipientName: string;
    amount: string;
    date: string;
    startTime: string;
    reason?: string;
  }) =>
    layout(`
      <h2 style="margin: 0 0 16px;">Refund processed</h2>
      <p>Hi ${data.recipientName}, a refund of <strong>${data.amount}</strong> has been processed for your session on ${data.date} at ${data.startTime}.</p>
      ${data.reason ? `<p style="font-size: 13px; color: #888;">Reason: ${data.reason}</p>` : ''}
      <p style="font-size: 13px; color: #888;">The refund may take 5-10 business days to appear on your statement.</p>
      <p style="margin-top: 24px;">
        <a href="${bookingsUrl}" style="display: inline-block; background: #0f172a; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none;">
          View bookings
        </a>
      </p>
    `),

  paymentFailed: (data: {
    recipientName: string;
    otherPartyName: string;
    date: string;
    startTime: string;
    bookingId: string;
  }) =>
    layout(`
      <h2 style="margin: 0 0 16px;">Payment failed</h2>
      <p>Hi ${data.recipientName}, the payment for your session with ${data.otherPartyName} on ${data.date} at ${data.startTime} was unsuccessful.</p>
      <p>Please try again or use a different payment method.</p>
      <p style="margin-top: 24px;">
        <a href="${bookingsUrl}/${data.bookingId}" style="display: inline-block; background: #0f172a; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none;">
          Retry payment
        </a>
      </p>
    `),

  bookingHoldExpired: (data: {
    recipientName: string;
    date: string;
    startTime: string;
    endTime: string;
  }) =>
    layout(`
      <h2 style="margin: 0 0 16px;">Session request expired</h2>
      <p>Hi ${data.recipientName}, a session request has expired because it was not confirmed within 48 hours.</p>
      <div style="background: #f5f5f5; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <table style="width: 100%; font-size: 14px;">
          <tr>
            <td style="padding: 4px 0; color: #888;">Date</td>
            <td style="padding: 4px 0; text-align: right; font-weight: 500;">${data.date}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #888;">Time</td>
            <td style="padding: 4px 0; text-align: right; font-weight: 500;">${data.startTime} - ${data.endTime}</td>
          </tr>
        </table>
      </div>
      <p style="margin-top: 24px;">
        <a href="${bookingsUrl}" style="display: inline-block; background: #0f172a; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none;">
          View bookings
        </a>
      </p>
    `),
};
