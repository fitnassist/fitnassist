import { prisma } from '../lib/prisma';

export const analyticsRepository = {
  async getBookingSummary(trainerId: string) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [total, completed, cancelled] = await Promise.all([
      prisma.booking.count({ where: { trainerId, date: { gte: thirtyDaysAgo } } }),
      prisma.booking.count({ where: { trainerId, date: { gte: thirtyDaysAgo }, status: 'COMPLETED' } }),
      prisma.booking.count({ where: { trainerId, date: { gte: thirtyDaysAgo }, status: { in: ['CANCELLED_BY_TRAINER', 'CANCELLED_BY_CLIENT'] } } }),
    ]);

    return {
      totalThisMonth: total,
      completed,
      cancelled,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  },

  async getProfileViewTrend(trainerId: string) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const results = await prisma.$queryRaw<Array<{ date: Date; count: number }>>`
      SELECT DATE("viewedAt") as date, COUNT(*)::int as count
      FROM "profile_views"
      WHERE "trainerId" = ${trainerId} AND "viewedAt" >= ${thirtyDaysAgo}
      GROUP BY DATE("viewedAt")
      ORDER BY date ASC
    `;

    return results.map(r => ({
      date: r.date.toISOString().split('T')[0],
      count: r.count,
    }));
  },

  async getBookingAnalytics(trainerId: string) {
    const twelveWeeksAgo = new Date(Date.now() - 12 * 7 * 24 * 60 * 60 * 1000);

    const results = await prisma.$queryRaw<Array<{
      week: Date;
      completed: number;
      cancelled: number;
      upcoming: number;
    }>>`
      SELECT
        DATE_TRUNC('week', "date") as week,
        COUNT(*) FILTER (WHERE status = 'COMPLETED')::int as completed,
        COUNT(*) FILTER (WHERE status IN ('CANCELLED_BY_TRAINER', 'CANCELLED_BY_CLIENT'))::int as cancelled,
        COUNT(*) FILTER (WHERE status NOT IN ('COMPLETED', 'CANCELLED_BY_TRAINER', 'CANCELLED_BY_CLIENT'))::int as upcoming
      FROM "bookings"
      WHERE "trainerId" = ${trainerId} AND "date" >= ${twelveWeeksAgo}
      GROUP BY DATE_TRUNC('week', "date")
      ORDER BY week ASC
    `;

    return results.map(r => ({
      week: r.week.toISOString().split('T')[0],
      completed: r.completed,
      cancelled: r.cancelled,
      upcoming: r.upcoming,
    }));
  },

  async getClientAdherence(trainerId: string) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Get active clients with connected sender
    const activeClients = await prisma.clientRoster.findMany({
      where: {
        trainerId,
        status: 'ACTIVE',
        connection: { senderId: { not: null } },
      },
      include: {
        connection: {
          include: {
            sender: { select: { id: true, name: true, image: true } },
          },
        },
      },
    });

    // Get diary entry counts for each client in last 7 days
    const adherenceData = await Promise.all(
      activeClients
        .filter(client => client.connection.sender !== null)
        .map(async (client) => {
          const sender = client.connection.sender!;
          const entriesThisWeek = await prisma.diaryEntry.count({
            where: {
              userId: sender.id,
              date: { gte: sevenDaysAgo },
            },
          });

          return {
            clientRosterId: client.id,
            clientName: sender.name ?? 'Unknown',
            avatarUrl: sender.image,
            entriesThisWeek,
          };
        })
    );

    // Sort by entries ascending (least active first)
    return adherenceData.sort((a, b) => a.entriesThisWeek - b.entriesThisWeek);
  },

  async getGoalAnalytics(trainerId: string) {
    // Get active clients with connected sender
    const activeClients = await prisma.clientRoster.findMany({
      where: {
        trainerId,
        status: 'ACTIVE',
        connection: { senderId: { not: null } },
      },
      include: {
        connection: {
          include: {
            sender: { select: { id: true, name: true } },
          },
        },
      },
    });

    const goalData = await Promise.all(
      activeClients
        .filter(client => client.connection.sender !== null)
        .map(async (client) => {
          const sender = client.connection.sender!;
          const goals = await prisma.goal.groupBy({
            by: ['status'],
            where: { userId: sender.id },
            _count: { _all: true },
          });

          const total = goals.reduce((sum, g) => sum + g._count._all, 0);
          const completed = goals.find(g => g.status === 'COMPLETED')?._count._all ?? 0;
          const active = goals.find(g => g.status === 'ACTIVE')?._count._all ?? 0;
          const abandoned = goals.find(g => g.status === 'ABANDONED')?._count._all ?? 0;

          return {
            clientRosterId: client.id,
            clientName: sender.name ?? 'Unknown',
            total,
            completed,
            active,
            abandoned,
          };
        })
    );

    // Filter out clients with no goals
    return goalData.filter(g => g.total > 0);
  },
};
