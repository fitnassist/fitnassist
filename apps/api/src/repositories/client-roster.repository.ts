import { prisma } from '../lib/prisma';
import type { ClientStatus, Prisma } from '@fitnassist/database';

const planAssignmentIncludes = {
  workoutPlanAssignments: {
    include: {
      workoutPlan: {
        include: {
          exercises: {
            orderBy: { sortOrder: 'asc' as const },
            include: { exercise: true },
          },
        },
      },
    },
    orderBy: { assignedAt: 'desc' as const },
  },
  mealPlanAssignments: {
    include: {
      mealPlan: {
        include: {
          recipes: {
            orderBy: [
              { dayOfWeek: 'asc' as const },
              { mealType: 'asc' as const },
              { sortOrder: 'asc' as const },
            ],
            include: { recipe: true },
          },
        },
      },
    },
    orderBy: { assignedAt: 'desc' as const },
  },
};

export interface ClientRosterListParams {
  trainerId: string;
  status?: ClientStatus;
  includeDisconnected?: boolean;
  search?: string;
  page: number;
  limit: number;
}

export const clientRosterRepository = {
  async create(trainerId: string, connectionId: string) {
    return prisma.clientRoster.create({
      data: {
        trainerId,
        connectionId,
      },
    });
  },

  async findById(id: string) {
    return prisma.clientRoster.findUnique({
      where: { id },
      include: {
        connection: {
          include: {
            sender: {
              include: {
                traineeProfile: true,
              },
            },
          },
        },
        onboardingResponses: {
          select: { id: true, status: true, completedAt: true, reviewedAt: true },
        },
        ...planAssignmentIncludes,
      },
    });
  },

  async findByTrainerId(params: ClientRosterListParams) {
    const { trainerId, status, includeDisconnected, search, page, limit } = params;

    const where: Prisma.ClientRosterWhereInput = {
      trainerId,
      ...(status
        ? { status }
        : includeDisconnected
          ? {}
          : { status: { not: 'DISCONNECTED' } }),
    };

    // Search by client name
    if (search) {
      where.connection = {
        name: { contains: search, mode: 'insensitive' },
      };
    }

    const [clients, total] = await Promise.all([
      prisma.clientRoster.findMany({
        where,
        include: {
          connection: {
            include: {
              sender: {
                include: {
                  traineeProfile: {
                    select: {
                      avatarUrl: true,
                      experienceLevel: true,
                      fitnessGoals: true,
                      activityLevel: true,
                    },
                  },
                },
              },
              messages: {
                orderBy: { createdAt: 'desc' },
                take: 1,
                select: { createdAt: true },
              },
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.clientRoster.count({ where }),
    ]);

    return {
      clients,
      total,
      page,
      limit,
      hasMore: page * limit < total,
    };
  },

  async updateStatus(id: string, status: ClientStatus) {
    return prisma.clientRoster.update({
      where: { id },
      data: { status },
    });
  },

  // Client Notes
  async createNote(clientRosterId: string, content: string) {
    return prisma.clientNote.create({
      data: { clientRosterId, content },
    });
  },

  async findNotesByClientRosterId(clientRosterId: string) {
    return prisma.clientNote.findMany({
      where: { clientRosterId },
      orderBy: { createdAt: 'desc' },
    });
  },

  async findNoteById(id: string) {
    return prisma.clientNote.findUnique({
      where: { id },
    });
  },

  async deleteNote(id: string) {
    return prisma.clientNote.delete({
      where: { id },
    });
  },

  async getCountsByStatus(trainerId: string) {
    const counts = await prisma.clientRoster.groupBy({
      by: ['status'],
      where: { trainerId },
      _count: true,
    });

    return {
      onboarding: counts.find(c => c.status === 'ONBOARDING')?._count ?? 0,
      active: counts.find(c => c.status === 'ACTIVE')?._count ?? 0,
      inactive: counts.find(c => c.status === 'INACTIVE')?._count ?? 0,
      onHold: counts.find(c => c.status === 'ON_HOLD')?._count ?? 0,
      disconnected: counts.find(c => c.status === 'DISCONNECTED')?._count ?? 0,
    };
  },

  async findByConnectionId(connectionId: string) {
    return prisma.clientRoster.findUnique({
      where: { connectionId },
    });
  },

  // Assignment methods
  async assignWorkoutPlan(clientRosterId: string, workoutPlanId: string) {
    return prisma.clientWorkoutPlanAssignment.upsert({
      where: { clientRosterId_workoutPlanId: { clientRosterId, workoutPlanId } },
      create: { clientRosterId, workoutPlanId },
      update: {},
    });
  },

  async unassignWorkoutPlan(clientRosterId: string, workoutPlanId: string) {
    return prisma.clientWorkoutPlanAssignment.deleteMany({
      where: { clientRosterId, workoutPlanId },
    });
  },

  async assignMealPlan(clientRosterId: string, mealPlanId: string) {
    return prisma.clientMealPlanAssignment.upsert({
      where: { clientRosterId_mealPlanId: { clientRosterId, mealPlanId } },
      create: { clientRosterId, mealPlanId },
      update: {},
    });
  },

  async unassignMealPlan(clientRosterId: string, mealPlanId: string) {
    return prisma.clientMealPlanAssignment.deleteMany({
      where: { clientRosterId, mealPlanId },
    });
  },

  async bulkAssignWorkoutPlan(clientIds: string[], workoutPlanId: string) {
    const data = clientIds.map(clientRosterId => ({ clientRosterId, workoutPlanId }));
    return prisma.clientWorkoutPlanAssignment.createMany({
      data,
      skipDuplicates: true,
    });
  },

  async bulkAssignMealPlan(clientIds: string[], mealPlanId: string) {
    const data = clientIds.map(clientRosterId => ({ clientRosterId, mealPlanId }));
    return prisma.clientMealPlanAssignment.createMany({
      data,
      skipDuplicates: true,
    });
  },

  async findByTrainerAndTraineeUserId(trainerId: string, traineeUserId: string) {
    return prisma.clientRoster.findFirst({
      where: {
        trainerId,
        connection: {
          senderId: traineeUserId,
          type: 'CONNECTION_REQUEST',
          status: { in: ['ACCEPTED', 'CLOSED'] },
        },
      },
    });
  },

  async findMyTrainers(userId: string) {
    return prisma.clientRoster.findMany({
      where: {
        connection: { senderId: userId },
        status: { in: ['ACTIVE', 'ONBOARDING'] },
      },
      include: {
        trainer: {
          select: { id: true, displayName: true, profileImageUrl: true, userId: true },
        },
      },
    });
  },

  async findByTraineeUserId(userId: string) {
    return prisma.clientRoster.findMany({
      where: {
        connection: {
          senderId: userId,
          type: 'CONNECTION_REQUEST',
          status: 'ACCEPTED',
        },
      },
      include: {
        trainer: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
        ...planAssignmentIncludes,
      },
    });
  },
};
