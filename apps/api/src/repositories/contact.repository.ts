import { prisma } from '../lib/prisma';
import type { ContactRequestType, ContactRequestStatus } from '@fitnassist/database';

export interface CreateContactRequestParams {
  trainerId: string;
  senderId?: string;
  type: ContactRequestType;
  name: string;
  email: string;
  phone?: string;
  message?: string;
}

export const contactRepository = {
  async create(data: CreateContactRequestParams) {
    return prisma.contactRequest.create({
      data: {
        trainerId: data.trainerId,
        senderId: data.senderId,
        type: data.type,
        name: data.name,
        email: data.email,
        phone: data.phone,
        message: data.message,
      },
      include: {
        trainer: true,
        sender: true,
      },
    });
  },

  async findById(id: string) {
    return prisma.contactRequest.findUnique({
      where: { id },
      include: {
        trainer: true,
        sender: true,
      },
    });
  },

  async findByTrainerId(trainerId: string, status?: ContactRequestStatus) {
    return prisma.contactRequest.findMany({
      where: {
        trainerId,
        ...(status ? { status } : { status: { not: 'CLOSED' } }),
      },
      include: {
        sender: {
          include: {
            traineeProfile: {
              select: { avatarUrl: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async findBySenderId(senderId: string) {
    return prisma.contactRequest.findMany({
      where: {
        senderId,
        status: { not: 'CLOSED' },
      },
      include: {
        trainer: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async updateStatus(id: string, status: ContactRequestStatus) {
    return prisma.contactRequest.update({
      where: { id },
      data: {
        status,
        respondedAt: status === 'RESPONDED' ? new Date() : undefined,
      },
    });
  },

  async getCountByTrainerId(trainerId: string, type?: ContactRequestType, since?: Date) {
    return prisma.contactRequest.count({
      where: {
        trainerId,
        ...(type && { type }),
        ...(since && { createdAt: { gte: since } }),
      },
    });
  },

  async findPendingByTraineeAndTrainer(traineeId: string, trainerId: string) {
    return prisma.contactRequest.findFirst({
      where: {
        senderId: traineeId,
        trainerId,
        status: 'PENDING',
      },
    });
  },

  async findConnectionByTraineeAndTrainer(traineeId: string, trainerId: string) {
    return prisma.contactRequest.findFirst({
      where: {
        senderId: traineeId,
        trainerId,
        type: 'CONNECTION_REQUEST',
        status: { in: ['PENDING', 'ACCEPTED'] },
      },
    });
  },

  async findClosedConnectionByTraineeAndTrainer(traineeId: string, trainerId: string) {
    return prisma.contactRequest.findFirst({
      where: {
        senderId: traineeId,
        trainerId,
        type: 'CONNECTION_REQUEST',
        status: 'CLOSED',
      },
      orderBy: { updatedAt: 'desc' },
    });
  },

  async reopen(id: string) {
    return prisma.contactRequest.update({
      where: { id },
      data: {
        status: 'PENDING',
        respondedAt: null,
      },
      include: {
        trainer: true,
        sender: true,
      },
    });
  },

  async accept(id: string) {
    return prisma.contactRequest.update({
      where: { id },
      data: {
        status: 'ACCEPTED',
        respondedAt: new Date(),
      },
      include: {
        trainer: true,
        sender: true,
      },
    });
  },

  async decline(id: string) {
    return prisma.contactRequest.update({
      where: { id },
      data: {
        status: 'DECLINED',
        respondedAt: new Date(),
      },
    });
  },

  async findConnectionsForUser(userId: string) {
    return prisma.contactRequest.findMany({
      where: {
        OR: [
          { senderId: userId },
          { trainer: { userId } },
        ],
        status: { in: ['ACCEPTED', 'CLOSED'] },
        type: 'CONNECTION_REQUEST',
      },
      include: {
        trainer: {
          select: {
            id: true,
            handle: true,
            displayName: true,
            profileImageUrl: true,
            userId: true,
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
            traineeProfile: {
              select: {
                avatarUrl: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        conversationPreferences: {
          where: { userId },
          select: { isArchived: true, deletedAt: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  },

  async findAcceptedConnectionsWithoutRoster(trainerId: string) {
    return prisma.contactRequest.findMany({
      where: {
        trainerId,
        type: 'CONNECTION_REQUEST',
        status: 'ACCEPTED',
        clientRoster: null,
      },
      select: { id: true },
    });
  },

  async findByIdWithParticipants(id: string) {
    return prisma.contactRequest.findUnique({
      where: { id },
      include: {
        trainer: {
          select: {
            id: true,
            handle: true,
            displayName: true,
            profileImageUrl: true,
            userId: true,
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
            traineeProfile: {
              select: {
                avatarUrl: true,
              },
            },
          },
        },
      },
    });
  },
};
