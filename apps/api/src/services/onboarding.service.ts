import { TRPCError } from '@trpc/server';
import { onboardingRepository } from '../repositories/onboarding.repository';
import { trainerRepository } from '../repositories/trainer.repository';
import { clientRosterRepository } from '../repositories/client-roster.repository';
import { inAppNotificationService } from './in-app-notification.service';
import { prisma } from '../lib/prisma';
import type { CreateOnboardingTemplateInput, UpdateOnboardingTemplateInput, SubmitOnboardingResponseInput, ReviewOnboardingResponseInput, Question } from '@fitnassist/schemas';

export const onboardingService = {
  // ==========================================================================
  // TEMPLATES
  // ==========================================================================

  async createTemplate(userId: string, data: CreateOnboardingTemplateInput) {
    const trainer = await trainerRepository.findByUserId(userId);
    if (!trainer) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Trainer profile not found' });
    }

    const template = await onboardingRepository.createTemplate(trainer.id, data);

    if (data.isActive) {
      await this.sendTemplateToExistingClients(trainer.id, template.id);
    }

    return template;
  },

  async updateTemplate(userId: string, data: UpdateOnboardingTemplateInput) {
    const trainer = await trainerRepository.findByUserId(userId);
    if (!trainer) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Trainer profile not found' });
    }

    const template = await onboardingRepository.findTemplateById(data.id);
    if (!template || template.trainerId !== trainer.id) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Template not found' });
    }

    const updated = await onboardingRepository.updateTemplate(data.id, data);

    // If template was just activated (wasn't active before), send to existing clients
    if (data.isActive && !template.isActive) {
      await this.sendTemplateToExistingClients(trainer.id, data.id);
    }

    return updated;
  },

  async deleteTemplate(userId: string, templateId: string) {
    const trainer = await trainerRepository.findByUserId(userId);
    if (!trainer) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Trainer profile not found' });
    }

    const template = await onboardingRepository.findTemplateById(templateId);
    if (!template || template.trainerId !== trainer.id) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Template not found' });
    }

    return onboardingRepository.deleteTemplate(templateId);
  },

  async getTemplates(userId: string) {
    const trainer = await trainerRepository.findByUserId(userId);
    if (!trainer) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Trainer profile not found' });
    }

    return onboardingRepository.findTemplatesByTrainerId(trainer.id);
  },

  async getTemplate(userId: string, templateId: string) {
    const trainer = await trainerRepository.findByUserId(userId);
    if (!trainer) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Trainer profile not found' });
    }

    const template = await onboardingRepository.findTemplateById(templateId);
    if (!template || template.trainerId !== trainer.id) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Template not found' });
    }

    return template;
  },

  async getActiveTemplates(userId: string) {
    const trainer = await trainerRepository.findByUserId(userId);
    if (!trainer) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Trainer profile not found' });
    }

    return onboardingRepository.findActiveTemplates(trainer.id);
  },

  // ==========================================================================
  // SEND TEMPLATE TO EXISTING CLIENTS
  // ==========================================================================

  async sendTemplateToExistingClients(trainerId: string, templateId: string) {
    const clientRosterIds = await onboardingRepository.findClientRosterIdsWithoutResponse(trainerId, templateId);
    if (!clientRosterIds.length) return;

    await Promise.all(
      clientRosterIds.map(async (clientRosterId) => {
        await onboardingRepository.createResponse(templateId, clientRosterId);
        await clientRosterRepository.updateStatus(clientRosterId, 'ONBOARDING');
      })
    );
  },

  // ==========================================================================
  // RESPONSE CREATION (called from contact.service on accept)
  // ==========================================================================

  async createResponseForConnection(trainerId: string, clientRosterId: string) {
    const activeTemplates = await onboardingRepository.findActiveTemplates(trainerId);
    if (!activeTemplates.length) {
      return []; // No active templates — skip onboarding
    }

    // Create a PENDING response for each active template
    const responses = await Promise.all(
      activeTemplates.map(t => onboardingRepository.createResponse(t.id, clientRosterId))
    );
    await clientRosterRepository.updateStatus(clientRosterId, 'ONBOARDING');

    return responses;
  },

  // ==========================================================================
  // TRAINEE OPERATIONS
  // ==========================================================================

  async getPendingOnboarding(userId: string) {
    return onboardingRepository.findPendingForTrainee(userId);
  },

  async getResponseById(userId: string, responseId: string) {
    const response = await onboardingRepository.findResponseById(responseId);
    if (!response) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Onboarding response not found' });
    }

    // Verify the trainee owns this response
    if (response.clientRoster.connection.sender?.id !== userId) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not have access to this onboarding' });
    }

    return response;
  },

  async submitResponse(userId: string, data: SubmitOnboardingResponseInput) {
    const response = await onboardingRepository.findResponseById(data.responseId);
    if (!response) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Onboarding response not found' });
    }

    // Verify the trainee owns this response
    if (response.clientRoster.connection.sender?.id !== userId) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not have access to this onboarding' });
    }

    if (response.status !== 'PENDING') {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'This onboarding has already been submitted' });
    }

    // Validate that required questions are answered
    const questions = response.template.questions as Question[];
    const answersMap = new Map(data.answers.map(a => [a.questionId, a.answer]));

    for (const question of questions) {
      if (question.required) {
        const answer = answersMap.get(question.id);
        if (answer === undefined || answer === '' || (Array.isArray(answer) && answer.length === 0)) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Question "${question.label}" is required`,
          });
        }
      }
    }

    // Validate waiver if template has waiver text
    if (response.template.waiverText && !data.waiverSigned) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'You must agree to the waiver' });
    }

    const result = await onboardingRepository.submitResponse(data.responseId, {
      answers: data.answers,
      waiverSigned: data.waiverSigned,
      waiverSignedName: data.waiverSignedName,
    });

    // Notify trainer (fire and forget)
    const trainerUserId = response.clientRoster.connection.trainer?.userId;
    if (trainerUserId) {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
      inAppNotificationService.notify({
        userId: trainerUserId,
        type: 'ONBOARDING_SUBMITTED',
        title: `${user?.name ?? 'A client'} submitted onboarding form`,
        link: '/dashboard/onboarding?tab=review',
      }).catch(console.error);
    }

    return result;
  },

  // ==========================================================================
  // TRAINER REVIEW
  // ==========================================================================

  async getResponsesForClient(userId: string, clientRosterId: string) {
    const trainer = await trainerRepository.findByUserId(userId);
    if (!trainer) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Trainer profile not found' });
    }

    const responses = await onboardingRepository.findResponsesByClientRosterId(clientRosterId);
    if (!responses.length || responses[0]!.clientRoster.trainerId !== trainer.id) {
      return [];
    }

    return responses;
  },

  async reviewResponse(userId: string, data: ReviewOnboardingResponseInput) {
    const trainer = await trainerRepository.findByUserId(userId);
    if (!trainer) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Trainer profile not found' });
    }

    const response = await onboardingRepository.findResponseById(data.responseId);
    if (!response) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Onboarding response not found' });
    }

    // Verify trainer owns this client
    if (response.clientRoster.trainerId !== trainer.id) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not have access to this onboarding' });
    }

    if (response.status !== 'SUBMITTED') {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'This response is not awaiting review' });
    }

    // Update response status
    const updated = await onboardingRepository.reviewResponse(data.responseId, data.decision, data.reviewNotes);

    // Notify client (fire and forget)
    const clientUserId = response.clientRoster.connection.sender?.id;
    if (clientUserId) {
      inAppNotificationService.notify({
        userId: clientUserId,
        type: 'ONBOARDING_REVIEWED',
        title: 'Your onboarding form was reviewed',
        link: '/dashboard',
      }).catch(console.error);
    }

    if (data.decision === 'REJECTED') {
      // Any rejection → client goes INACTIVE
      await clientRosterRepository.updateStatus(response.clientRosterId, 'INACTIVE');
    } else {
      // Check if ALL responses for this client are now approved
      const allResponses = await onboardingRepository.findResponsesByClientRosterId(response.clientRosterId);
      const allApproved = allResponses.every(r => r.status === 'APPROVED');
      if (allApproved) {
        await clientRosterRepository.updateStatus(response.clientRosterId, 'ACTIVE');
      }
    }

    return updated;
  },

  async getStats(userId: string) {
    const trainer = await trainerRepository.findByUserId(userId);
    if (!trainer) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Trainer profile not found' });
    }

    return onboardingRepository.getStatsForTrainer(trainer.id);
  },

  async getPendingReviewCount(userId: string) {
    const trainer = await trainerRepository.findByUserId(userId);
    if (!trainer) {
      return 0;
    }

    return onboardingRepository.getPendingReviewCount(trainer.id);
  },

  async getSubmittedResponses(userId: string) {
    const trainer = await trainerRepository.findByUserId(userId);
    if (!trainer) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Trainer profile not found' });
    }

    return onboardingRepository.findSubmittedForTrainer(trainer.id);
  },
};
