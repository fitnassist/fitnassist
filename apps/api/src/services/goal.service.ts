import { TRPCError } from '@trpc/server';
import { goalRepository } from '../repositories/goal.repository';
import { clientRosterRepository } from '../repositories/client-roster.repository';
import { trainerRepository } from '../repositories/trainer.repository';
import { inAppNotificationService } from './in-app-notification.service';
import { sseManager } from '../lib/sse';
import { prisma } from '../lib/prisma';
import type { DiaryEntryType, GoalStatus } from '@fitnassist/database';
import type { SseGoalCompletedEvent } from '@fitnassist/types';

/**
 * Resolves the target userId for goal operations.
 * If clientRosterId is provided, verifies the caller is the trainer and returns the trainee's userId.
 */
const resolveUserId = async (callerId: string, clientRosterId?: string): Promise<string> => {
  if (!clientRosterId) return callerId;

  const client = await clientRosterRepository.findById(clientRosterId);
  if (!client) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Client not found' });
  }

  const trainer = await trainerRepository.findByUserId(callerId);
  if (!trainer || client.trainerId !== trainer.id) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not have access to this client' });
  }

  const senderId = client.connection?.senderId;
  if (!senderId) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Client user not found' });
  }

  return senderId;
};

/**
 * Verifies caller can access goals for the given userId.
 */
const verifyAccess = async (callerId: string, targetUserId: string): Promise<void> => {
  if (callerId === targetUserId) return;

  const trainer = await trainerRepository.findByUserId(callerId);
  if (!trainer) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not have access to these goals' });
  }

  const roster = await clientRosterRepository.findByTrainerAndTraineeUserId(trainer.id, targetUserId);
  if (!roster) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not have access to these goals' });
  }
};

/**
 * Broadcasts a goal_completed SSE event to both the trainee and their trainer(s).
 */
const broadcastGoalCompleted = async (userId: string, goalName: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
  if (!user) return;

  const event: SseGoalCompletedEvent = {
    type: 'goal_completed',
    userId,
    userName: user.name,
    goalName,
  };

  // Notify the trainee
  sseManager.broadcastToUser(userId, 'message', event);

  // Notify trainer(s)
  const rosters = await clientRosterRepository.findByTraineeUserId(userId);
  const trainerIds = rosters.map(r => r.trainerId);
  if (trainerIds.length > 0) {
    const trainers = await prisma.trainerProfile.findMany({
      where: { id: { in: trainerIds } },
      select: { userId: true },
    });
    sseManager.broadcastToUsers(trainers.map(t => t.userId), 'message', event);
  }
};

const getWeekStart = (): Date => {
  const now = new Date();
  const day = now.getUTCDay();
  const diff = day === 0 ? 6 : day - 1; // Monday = start of week
  const weekStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - diff));
  return weekStart;
};

export const goalService = {
  async createGoal(callerId: string, data: {
    clientRosterId?: string;
    name: string;
    description?: string;
    type: 'TARGET' | 'HABIT';
    targetValue?: number;
    targetUnit?: string;
    currentValue?: number;
    entryType?: DiaryEntryType;
    entryField?: string;
    frequencyPerWeek?: number;
    habitEntryType?: DiaryEntryType;
    deadline?: string;
  }) {
    const userId = await resolveUserId(callerId, data.clientRosterId);
    const { clientRosterId: _, deadline, ...rest } = data;

    const goal = await goalRepository.create({
      ...rest,
      userId,
      createdById: callerId,
      deadline: deadline ? new Date(deadline + 'T00:00:00.000Z') : undefined,
    });

    // Notify trainer(s) when a client creates their own goal
    if (callerId === userId) {
      const rosters = await clientRosterRepository.findByTraineeUserId(userId);
      if (rosters.length > 0) {
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
        for (const roster of rosters) {
          inAppNotificationService.notify({
            userId: roster.trainer.userId,
            type: 'GOAL_CREATED',
            title: `${user?.name ?? 'A client'} set a new goal: ${goal.name}`,
            link: `/dashboard/clients/${roster.id}?tab=progress`,
          }).catch(console.error);
        }
      }
    }

    return goal;
  },

  async listGoals(callerId: string, data: {
    clientRosterId?: string;
    status?: GoalStatus;
  }) {
    const userId = await resolveUserId(callerId, data.clientRosterId);

    const goals = await goalRepository.findByUserId(userId, data.status);

    // Enrich habit goals with weekly progress
    const weekStart = getWeekStart();
    const enriched = await Promise.all(
      goals.map(async (goal) => {
        if (goal.type === 'HABIT' && goal.status === 'ACTIVE' && goal.habitEntryType) {
          const weeklyProgress = await goalRepository.getWeeklyHabitProgress(
            userId,
            goal.habitEntryType,
            weekStart
          );
          return { ...goal, weeklyProgress };
        }
        return { ...goal, weeklyProgress: undefined as number | undefined };
      })
    );

    return enriched;
  },

  async updateGoal(callerId: string, data: {
    id: string;
    name?: string;
    description?: string | null;
    targetValue?: number;
    currentValue?: number;
    frequencyPerWeek?: number;
    deadline?: string | null;
  }) {
    const goal = await goalRepository.findById(data.id);
    if (!goal) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Goal not found' });
    }

    await verifyAccess(callerId, goal.userId);

    const { id, deadline, ...rest } = data;
    return goalRepository.update(id, {
      ...rest,
      deadline: deadline === null ? null : deadline ? new Date(deadline + 'T00:00:00.000Z') : undefined,
    });
  },

  async completeGoal(callerId: string, id: string) {
    const goal = await goalRepository.findById(id);
    if (!goal) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Goal not found' });
    }

    await verifyAccess(callerId, goal.userId);

    if (goal.status !== 'ACTIVE') {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Only active goals can be completed' });
    }

    const result = await goalRepository.update(id, {
      status: 'COMPLETED',
      completedAt: new Date(),
    });
    broadcastGoalCompleted(goal.userId, goal.name).catch(() => {});

    // In-app notification to the other party (fire and forget)
    const notifyUserId = callerId === goal.userId ? null : goal.userId;
    if (notifyUserId) {
      const user = await prisma.user.findUnique({ where: { id: callerId }, select: { name: true } });
      inAppNotificationService.notify({
        userId: notifyUserId,
        type: 'GOAL_COMPLETED',
        title: `${user?.name ?? 'Someone'} completed: ${goal.name}`,
        link: '/dashboard/goals',
      }).catch(console.error);
    }
    // Also notify trainer(s) if the trainee completed their own goal
    if (callerId === goal.userId) {
      const rosters = await clientRosterRepository.findByTraineeUserId(goal.userId);
      if (rosters.length > 0) {
        const user = await prisma.user.findUnique({ where: { id: goal.userId }, select: { name: true } });
        for (const roster of rosters) {
          inAppNotificationService.notify({
            userId: roster.trainer.userId,
            type: 'GOAL_COMPLETED',
            title: `${user?.name ?? 'A client'} completed: ${goal.name}`,
            link: `/dashboard/clients/${roster.id}?tab=progress`,
          }).catch(console.error);
        }
      }
    }

    return result;
  },

  async abandonGoal(callerId: string, id: string) {
    const goal = await goalRepository.findById(id);
    if (!goal) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Goal not found' });
    }

    await verifyAccess(callerId, goal.userId);

    if (goal.status !== 'ACTIVE') {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Only active goals can be abandoned' });
    }

    return goalRepository.update(id, { status: 'ABANDONED' });
  },

  async getRecentClientGoalUpdates(callerId: string, limit: number) {
    const trainer = await trainerRepository.findByUserId(callerId);
    if (!trainer) {
      return [];
    }

    const { clients } = await clientRosterRepository.findByTrainerId({
      trainerId: trainer.id,
      status: 'ACTIVE',
      page: 1,
      limit: 100,
    });

    const userToRoster = new Map<string, string>();
    const clientUserIds: string[] = [];
    for (const client of clients) {
      const userId = client.connection?.senderId;
      if (userId) {
        clientUserIds.push(userId);
        userToRoster.set(userId, client.id);
      }
    }

    if (clientUserIds.length === 0) return [];

    const goals = await goalRepository.findRecentCompletedByUserIds(clientUserIds, limit);
    return goals.map(goal => ({
      ...goal,
      clientRosterId: userToRoster.get(goal.userId) ?? null,
    }));
  },

  /**
   * Called by diary service after logging an entry.
   * Auto-updates target goals and tracks habit progress.
   */
  async checkAutoProgress(userId: string, entryType: DiaryEntryType, value?: number) {
    // Update target goals
    if (value !== undefined) {
      const targetGoals = await goalRepository.findActiveTargetGoals(userId, entryType);
      for (const goal of targetGoals) {
        const updates: { currentValue: number; status?: 'COMPLETED'; completedAt?: Date } = {
          currentValue: value,
        };

        // Check if target reached
        if (goal.targetValue !== null) {
          const reached = goal.currentValue !== null && goal.currentValue <= goal.targetValue
            ? value <= goal.targetValue  // losing weight (target < start)
            : value >= goal.targetValue; // gaining (target > start)

          if (reached) {
            updates.status = 'COMPLETED';
            updates.completedAt = new Date();
          }
        }

        await goalRepository.update(goal.id, updates);
        if (updates.status === 'COMPLETED') {
          broadcastGoalCompleted(userId, goal.name).catch(() => {});
        }
      }
    }
  },
};
