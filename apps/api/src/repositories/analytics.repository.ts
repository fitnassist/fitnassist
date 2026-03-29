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

  async getRevenueAnalytics(trainerId: string) {
    const twelveWeeksAgo = new Date(Date.now() - 12 * 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Weekly session revenue (12 weeks)
    const weeklySessionRevenue = await prisma.$queryRaw<Array<{
      week: Date;
      revenue: number;
      sessions: number;
      refunds: number;
    }>>`
      SELECT
        DATE_TRUNC('week', sp."paidAt") as week,
        COALESCE(SUM(sp."amount" - sp."platformFee"), 0)::int as revenue,
        COUNT(*)::int as sessions,
        COALESCE(SUM(sp."refundAmount"), 0)::int as refunds
      FROM "session_payments" sp
      JOIN "bookings" b ON sp."bookingId" = b."id"
      WHERE b."trainerId" = ${trainerId}
        AND sp."paidAt" IS NOT NULL
        AND sp."paidAt" >= ${twelveWeeksAgo}
        AND sp."status" IN ('SUCCEEDED', 'REFUNDED', 'PARTIALLY_REFUNDED')
      GROUP BY DATE_TRUNC('week', sp."paidAt")
      ORDER BY week ASC
    `;

    // Weekly product order revenue (12 weeks)
    const weeklyProductRevenue = await prisma.$queryRaw<Array<{
      week: Date;
      revenue: number;
      orders: number;
      refunds: number;
    }>>`
      SELECT
        DATE_TRUNC('week', po."paidAt") as week,
        COALESCE(SUM(po."totalPence" - po."platformFeePence"), 0)::int as revenue,
        COUNT(*)::int as orders,
        COALESCE(SUM(po."refundAmount"), 0)::int as refunds
      FROM "product_orders" po
      WHERE po."trainerId" = ${trainerId}
        AND po."paidAt" IS NOT NULL
        AND po."paidAt" >= ${twelveWeeksAgo}
        AND po."status" IN ('PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'REFUNDED')
      GROUP BY DATE_TRUNC('week', po."paidAt")
      ORDER BY week ASC
    `;

    // 30-day session summary
    const sessionSummary = await prisma.$queryRaw<Array<{
      total_revenue: number;
      total_sessions: number;
      total_refunds: number;
      avg_session_price: number;
    }>>`
      SELECT
        COALESCE(SUM(sp."amount" - sp."platformFee"), 0)::int as total_revenue,
        COUNT(*)::int as total_sessions,
        COALESCE(SUM(sp."refundAmount"), 0)::int as total_refunds,
        COALESCE(AVG(sp."amount" - sp."platformFee"), 0)::int as avg_session_price
      FROM "session_payments" sp
      JOIN "bookings" b ON sp."bookingId" = b."id"
      WHERE b."trainerId" = ${trainerId}
        AND sp."paidAt" IS NOT NULL
        AND sp."paidAt" >= ${thirtyDaysAgo}
        AND sp."status" IN ('SUCCEEDED', 'REFUNDED', 'PARTIALLY_REFUNDED')
    `;

    // 30-day product order summary
    const productSummary = await prisma.$queryRaw<Array<{
      total_revenue: number;
      total_orders: number;
      total_refunds: number;
      avg_order_value: number;
    }>>`
      SELECT
        COALESCE(SUM(po."totalPence" - po."platformFeePence"), 0)::int as total_revenue,
        COUNT(*)::int as total_orders,
        COALESCE(SUM(po."refundAmount"), 0)::int as total_refunds,
        COALESCE(AVG(po."totalPence" - po."platformFeePence"), 0)::int as avg_order_value
      FROM "product_orders" po
      WHERE po."trainerId" = ${trainerId}
        AND po."paidAt" IS NOT NULL
        AND po."paidAt" >= ${thirtyDaysAgo}
        AND po."status" IN ('PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'REFUNDED')
    `;

    const sessionRow = sessionSummary[0] ?? { total_revenue: 0, total_sessions: 0, total_refunds: 0, avg_session_price: 0 };
    const productRow = productSummary[0] ?? { total_revenue: 0, total_orders: 0, total_refunds: 0, avg_order_value: 0 };

    // Merge weekly data by week key
    const weeklyMap = new Map<string, { sessionRevenue: number; productRevenue: number; sessions: number; orders: number; refunds: number }>();
    for (const r of weeklySessionRevenue) {
      const key = r.week.toISOString().split('T')[0]!;
      weeklyMap.set(key, {
        sessionRevenue: r.revenue,
        productRevenue: 0,
        sessions: r.sessions,
        orders: 0,
        refunds: r.refunds,
      });
    }
    for (const r of weeklyProductRevenue) {
      const key = r.week.toISOString().split('T')[0]!;
      const existing = weeklyMap.get(key);
      if (existing) {
        existing.productRevenue = r.revenue;
        existing.orders = r.orders;
        existing.refunds += r.refunds;
      } else {
        weeklyMap.set(key, {
          sessionRevenue: 0,
          productRevenue: r.revenue,
          sessions: 0,
          orders: r.orders,
          refunds: r.refunds,
        });
      }
    }
    const weeklyRevenue = Array.from(weeklyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, data]) => ({
        week,
        sessionRevenue: data.sessionRevenue,
        productRevenue: data.productRevenue,
        revenue: data.sessionRevenue + data.productRevenue,
        sessions: data.sessions,
        orders: data.orders,
        refunds: data.refunds,
      }));

    return {
      weeklyRevenue,
      summary: {
        totalRevenue30d: sessionRow.total_revenue + productRow.total_revenue,
        totalSessions30d: sessionRow.total_sessions,
        totalRefunds30d: sessionRow.total_refunds + productRow.total_refunds,
        avgSessionPrice: sessionRow.avg_session_price,
        totalProductRevenue30d: productRow.total_revenue,
        totalOrders30d: productRow.total_orders,
        totalProductRefunds30d: productRow.total_refunds,
        avgOrderValue: productRow.avg_order_value,
      },
    };
  },

  async getRevenueTransactions(trainerId: string, cursor?: string, limit: number = 20) {
    const transactions = await prisma.sessionPayment.findMany({
      where: {
        booking: { trainerId },
        paidAt: { not: null },
      },
      include: {
        booking: {
          include: {
            clientRoster: {
              include: {
                connection: {
                  include: {
                    sender: { select: { id: true, name: true, image: true } },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { paidAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = transactions.length > limit;
    const items = hasMore ? transactions.slice(0, limit) : transactions;

    return {
      items: items.map(t => ({
        id: t.id,
        amount: t.amount,
        platformFee: t.platformFee,
        netAmount: t.amount - t.platformFee,
        currency: t.currency,
        status: t.status,
        refundAmount: t.refundAmount,
        refundReason: t.refundReason,
        refundedAt: t.refundedAt,
        paidAt: t.paidAt!,
        clientName: t.booking.clientRoster.connection.sender?.name ?? 'Unknown',
        clientImage: t.booking.clientRoster.connection.sender?.image,
        bookingDate: t.booking.date,
        startTime: t.booking.startTime,
      })),
      nextCursor: hasMore ? items[items.length - 1]?.id : undefined,
    };
  },

  async getProductOrderTransactions(trainerId: string, cursor?: string, limit: number = 20) {
    const orders = await prisma.productOrder.findMany({
      where: {
        trainerId,
        paidAt: { not: null },
      },
      include: {
        buyer: { select: { id: true, name: true, image: true } },
        items: {
          select: { productName: true, quantity: true, pricePence: true },
        },
      },
      orderBy: { paidAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = orders.length > limit;
    const items = hasMore ? orders.slice(0, limit) : orders;

    return {
      items: items.map(o => ({
        id: o.id,
        totalPence: o.totalPence,
        platformFeePence: o.platformFeePence,
        netAmount: o.totalPence - o.platformFeePence,
        discountPence: o.discountPence,
        currency: o.currency,
        status: o.status,
        refundAmount: o.refundAmount,
        refundReason: o.refundReason,
        refundedAt: o.refundedAt,
        paidAt: o.paidAt!,
        buyerName: o.buyer.name ?? 'Customer',
        buyerImage: o.buyer.image,
        items: o.items,
        couponCode: o.couponCode,
      })),
      nextCursor: hasMore ? items[items.length - 1]?.id : undefined,
    };
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
