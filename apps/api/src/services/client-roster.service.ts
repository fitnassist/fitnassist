import { TRPCError } from '@trpc/server';
import { clientRosterRepository } from '../repositories/client-roster.repository';
import { contactRepository } from '../repositories/contact.repository';
import { trainerRepository } from '../repositories/trainer.repository';
import { workoutPlanRepository } from '../repositories/workout-plan.repository';
import { mealPlanRepository } from '../repositories/meal-plan.repository';
import type { ClientStatus, ContactRequestStatus } from '@fitnassist/database';

const verifyTrainerOwnsClient = async (userId: string, clientId: string) => {
  const client = await clientRosterRepository.findById(clientId);
  if (!client) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Client not found' });
  }
  const trainer = await trainerRepository.findByUserId(userId);
  if (!trainer || client.trainerId !== trainer.id) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not have access to this client' });
  }
  return { client, trainer };
};

const verifyTrainerOwnsPlan = async (trainerId: string, planType: 'workout' | 'meal', planId: string) => {
  if (planType === 'workout') {
    const plan = await workoutPlanRepository.findById(planId);
    if (!plan || plan.trainerId !== trainerId) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Workout plan not found' });
    }
  } else {
    const plan = await mealPlanRepository.findById(planId);
    if (!plan || plan.trainerId !== trainerId) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Meal plan not found' });
    }
  }
};

export const clientRosterService = {
  async getClients(userId: string, filters: {
    status?: ClientStatus;
    search?: string;
    page: number;
    limit: number;
  }) {
    const trainer = await trainerRepository.findByUserId(userId);
    if (!trainer) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Trainer profile not found' });
    }

    const missing = await contactRepository.findAcceptedConnectionsWithoutRoster(trainer.id);
    if (missing.length > 0) {
      await Promise.all(
        missing.map(conn => clientRosterRepository.create(trainer.id, conn.id))
      );
    }

    return clientRosterRepository.findByTrainerId({ trainerId: trainer.id, ...filters });
  },

  async getClient(userId: string, clientId: string) {
    const { client } = await verifyTrainerOwnsClient(userId, clientId);
    return client;
  },

  async updateStatus(userId: string, clientId: string, status: ClientStatus) {
    await verifyTrainerOwnsClient(userId, clientId);
    return clientRosterRepository.updateStatus(clientId, status);
  },

  async addNote(userId: string, clientRosterId: string, content: string) {
    await verifyTrainerOwnsClient(userId, clientRosterId);
    return clientRosterRepository.createNote(clientRosterId, content);
  },

  async getNotes(userId: string, clientRosterId: string) {
    await verifyTrainerOwnsClient(userId, clientRosterId);
    return clientRosterRepository.findNotesByClientRosterId(clientRosterId);
  },

  async deleteNote(userId: string, noteId: string) {
    const note = await clientRosterRepository.findNoteById(noteId);
    if (!note) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Note not found' });
    }
    await verifyTrainerOwnsClient(userId, note.clientRosterId);
    return clientRosterRepository.deleteNote(noteId);
  },

  async getStats(userId: string) {
    const trainer = await trainerRepository.findByUserId(userId);
    if (!trainer) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Trainer profile not found' });
    }
    return clientRosterRepository.getCountsByStatus(trainer.id);
  },

  async createForConnection(trainerId: string, connectionId: string) {
    const existing = await clientRosterRepository.findByConnectionId(connectionId);
    if (existing) return existing;
    return clientRosterRepository.create(trainerId, connectionId);
  },

  // Plan assignment methods
  async assignWorkoutPlan(userId: string, clientRosterId: string, workoutPlanId: string) {
    const { trainer } = await verifyTrainerOwnsClient(userId, clientRosterId);
    await verifyTrainerOwnsPlan(trainer.id, 'workout', workoutPlanId);
    return clientRosterRepository.assignWorkoutPlan(clientRosterId, workoutPlanId);
  },

  async unassignWorkoutPlan(userId: string, clientRosterId: string, workoutPlanId: string) {
    await verifyTrainerOwnsClient(userId, clientRosterId);
    return clientRosterRepository.unassignWorkoutPlan(clientRosterId, workoutPlanId);
  },

  async assignMealPlan(userId: string, clientRosterId: string, mealPlanId: string) {
    const { trainer } = await verifyTrainerOwnsClient(userId, clientRosterId);
    await verifyTrainerOwnsPlan(trainer.id, 'meal', mealPlanId);
    return clientRosterRepository.assignMealPlan(clientRosterId, mealPlanId);
  },

  async unassignMealPlan(userId: string, clientRosterId: string, mealPlanId: string) {
    await verifyTrainerOwnsClient(userId, clientRosterId);
    return clientRosterRepository.unassignMealPlan(clientRosterId, mealPlanId);
  },

  async bulkAssignPlan(userId: string, clientIds: string[], data: {
    workoutPlanId?: string | null;
    mealPlanId?: string | null;
  }) {
    const trainer = await trainerRepository.findByUserId(userId);
    if (!trainer) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Trainer profile not found' });
    }

    // Verify all clients belong to this trainer
    const clients = await Promise.all(
      clientIds.map(id => clientRosterRepository.findById(id))
    );
    for (const client of clients) {
      if (!client || client.trainerId !== trainer.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'One or more clients not found or not yours' });
      }
    }

    if (data.workoutPlanId) {
      await verifyTrainerOwnsPlan(trainer.id, 'workout', data.workoutPlanId);
      return clientRosterRepository.bulkAssignWorkoutPlan(clientIds, data.workoutPlanId);
    }
    if (data.mealPlanId) {
      await verifyTrainerOwnsPlan(trainer.id, 'meal', data.mealPlanId);
      return clientRosterRepository.bulkAssignMealPlan(clientIds, data.mealPlanId);
    }
  },

  async getMyAssignments(userId: string) {
    return clientRosterRepository.findByTraineeUserId(userId);
  },

  async disconnectByTrainer(userId: string, clientId: string) {
    const { client } = await verifyTrainerOwnsClient(userId, clientId);

    if (client.status === 'DISCONNECTED') {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Already disconnected' });
    }

    await clientRosterRepository.updateStatus(clientId, 'DISCONNECTED');
    await contactRepository.updateStatus(client.connectionId, 'CLOSED' as ContactRequestStatus);

    return { success: true };
  },

  async disconnectByTrainerConnection(userId: string, connectionId: string) {
    const roster = await clientRosterRepository.findByConnectionId(connectionId);
    if (!roster) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Connection not found' });
    }

    // Verify trainer owns this connection via the roster
    const { client } = await verifyTrainerOwnsClient(userId, roster.id);

    if (client.status === 'DISCONNECTED') {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Already disconnected' });
    }

    await clientRosterRepository.updateStatus(roster.id, 'DISCONNECTED');
    await contactRepository.updateStatus(connectionId, 'CLOSED' as ContactRequestStatus);

    return { success: true };
  },

  async disconnectByTrainee(userId: string, connectionId: string) {
    const roster = await clientRosterRepository.findByConnectionId(connectionId);
    if (!roster) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Connection not found' });
    }

    // Verify trainee owns this connection
    const connection = await contactRepository.findById(connectionId);
    if (!connection || connection.senderId !== userId) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not have permission to disconnect' });
    }

    if (roster.status === 'DISCONNECTED') {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Already disconnected' });
    }

    await clientRosterRepository.updateStatus(roster.id, 'DISCONNECTED');
    await contactRepository.updateStatus(connectionId, 'CLOSED' as ContactRequestStatus);

    return { success: true };
  },
};
