import { prisma } from '../lib/prisma';

export const onboardingRepository = {
  // ==========================================================================
  // TEMPLATES
  // ==========================================================================

  async createTemplate(trainerId: string, data: {
    name: string;
    questions: unknown;
    waiverText?: string | null;
    isActive: boolean;
  }) {
    return prisma.onboardingTemplate.create({
      data: {
        trainerId,
        name: data.name,
        questions: data.questions as any,
        waiverText: data.waiverText,
        isActive: data.isActive,
      },
    });
  },

  async updateTemplate(id: string, data: {
    name: string;
    questions: unknown;
    waiverText?: string | null;
    isActive: boolean;
  }) {
    return prisma.onboardingTemplate.update({
      where: { id },
      data: {
        name: data.name,
        questions: data.questions as any,
        waiverText: data.waiverText,
        isActive: data.isActive,
      },
    });
  },

  async deleteTemplate(id: string) {
    return prisma.onboardingTemplate.delete({
      where: { id },
    });
  },

  async findTemplateById(id: string) {
    return prisma.onboardingTemplate.findUnique({
      where: { id },
      include: { _count: { select: { responses: true } } },
    });
  },

  async findTemplatesByTrainerId(trainerId: string) {
    return prisma.onboardingTemplate.findMany({
      where: { trainerId },
      include: { _count: { select: { responses: true } } },
      orderBy: { updatedAt: 'desc' },
    });
  },

  async findActiveTemplates(trainerId: string) {
    return prisma.onboardingTemplate.findMany({
      where: { trainerId, isActive: true },
      orderBy: { updatedAt: 'desc' },
    });
  },

  // ==========================================================================
  // RESPONSES
  // ==========================================================================

  async createResponse(templateId: string, clientRosterId: string) {
    return prisma.onboardingResponse.create({
      data: {
        templateId,
        clientRosterId,
      },
    });
  },

  async findClientRosterIdsWithoutResponse(trainerId: string, templateId: string) {
    const clients = await prisma.clientRoster.findMany({
      where: {
        trainerId,
        status: { in: ['ACTIVE', 'ONBOARDING'] },
        onboardingResponses: {
          none: { templateId },
        },
      },
      select: { id: true },
    });
    return clients.map(c => c.id);
  },

  async findResponseById(id: string) {
    return prisma.onboardingResponse.findUnique({
      where: { id },
      include: {
        template: true,
        clientRoster: {
          include: {
            connection: {
              include: {
                sender: {
                  select: { id: true, name: true, email: true },
                },
                trainer: {
                  select: { id: true, displayName: true, userId: true },
                },
              },
            },
          },
        },
      },
    });
  },

  async findResponsesByClientRosterId(clientRosterId: string) {
    return prisma.onboardingResponse.findMany({
      where: { clientRosterId },
      include: {
        template: true,
        clientRoster: {
          include: {
            connection: {
              include: {
                sender: {
                  select: { id: true, name: true, email: true },
                },
                trainer: {
                  select: { id: true, displayName: true, userId: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  },

  async submitResponse(id: string, data: {
    answers: unknown;
    waiverSigned: boolean;
    waiverSignedName?: string | null;
  }) {
    return prisma.onboardingResponse.update({
      where: { id },
      data: {
        answers: data.answers as any,
        waiverSigned: data.waiverSigned,
        waiverSignedName: data.waiverSignedName,
        waiverSignedAt: data.waiverSigned ? new Date() : null,
        status: 'SUBMITTED',
        completedAt: new Date(),
      },
    });
  },

  async reviewResponse(id: string, status: 'APPROVED' | 'REJECTED', reviewNotes?: string | null) {
    return prisma.onboardingResponse.update({
      where: { id },
      data: {
        status,
        reviewNotes,
        reviewedAt: new Date(),
      },
    });
  },

  async findPendingForTrainee(userId: string) {
    return prisma.onboardingResponse.findMany({
      where: {
        status: { in: ['PENDING', 'SUBMITTED'] },
        clientRoster: {
          connection: {
            senderId: userId,
          },
        },
      },
      include: {
        template: {
          select: { name: true },
        },
        clientRoster: {
          include: {
            trainer: {
              select: { displayName: true },
            },
            connection: {
              select: { trainerId: true },
            },
          },
        },
      },
    });
  },

  async getStatsForTrainer(trainerId: string) {
    const counts = await prisma.onboardingResponse.groupBy({
      by: ['status'],
      where: {
        clientRoster: { trainerId },
      },
      _count: true,
    });

    return {
      pending: counts.find(c => c.status === 'PENDING')?._count ?? 0,
      submitted: counts.find(c => c.status === 'SUBMITTED')?._count ?? 0,
      approved: counts.find(c => c.status === 'APPROVED')?._count ?? 0,
      rejected: counts.find(c => c.status === 'REJECTED')?._count ?? 0,
    };
  },

  async getPendingReviewCount(trainerId: string) {
    return prisma.onboardingResponse.count({
      where: {
        status: 'SUBMITTED',
        clientRoster: { trainerId },
      },
    });
  },

  async findSubmittedForTrainer(trainerId: string) {
    return prisma.onboardingResponse.findMany({
      where: {
        status: 'SUBMITTED',
        clientRoster: { trainerId },
      },
      include: {
        template: {
          select: { name: true },
        },
        clientRoster: {
          include: {
            connection: {
              include: {
                sender: {
                  select: { id: true, name: true, email: true },
                  },
              },
            },
          },
        },
      },
      orderBy: { completedAt: 'asc' },
    });
  },
};
