import { z } from 'zod';
import { router, trainerProcedure, traineeProcedure, requireTier } from '../lib/trpc';
import { clientRosterService } from '../services/client-roster.service';
import {
  clientRosterListSchema,
  getClientSchema,
  updateClientStatusSchema,
  createClientNoteSchema,
  deleteClientNoteSchema,
  getClientNotesSchema,
  assignWorkoutPlanSchema,
  unassignWorkoutPlanSchema,
  assignMealPlanSchema,
  unassignMealPlanSchema,
  bulkAssignPlanSchema,
} from '@fitnassist/schemas';

export const clientRosterRouter = router({
  list: trainerProcedure
    .input(clientRosterListSchema)
    .query(async ({ input, ctx }) => {
      return clientRosterService.getClients(ctx.user.id, input);
    }),

  get: trainerProcedure
    .input(getClientSchema)
    .query(async ({ input, ctx }) => {
      return clientRosterService.getClient(ctx.user.id, input.id);
    }),

  updateStatus: trainerProcedure
    .use(requireTier('PRO'))
    .input(updateClientStatusSchema)
    .mutation(async ({ input, ctx }) => {
      return clientRosterService.updateStatus(ctx.user.id, input.id, input.status);
    }),

  getNotes: trainerProcedure
    .input(getClientNotesSchema)
    .query(async ({ input, ctx }) => {
      return clientRosterService.getNotes(ctx.user.id, input.clientRosterId);
    }),

  addNote: trainerProcedure
    .use(requireTier('PRO'))
    .input(createClientNoteSchema)
    .mutation(async ({ input, ctx }) => {
      return clientRosterService.addNote(ctx.user.id, input.clientRosterId, input.content);
    }),

  deleteNote: trainerProcedure
    .use(requireTier('PRO'))
    .input(deleteClientNoteSchema)
    .mutation(async ({ input, ctx }) => {
      return clientRosterService.deleteNote(ctx.user.id, input.id);
    }),

  assignWorkoutPlan: trainerProcedure
    .use(requireTier('PRO'))
    .input(assignWorkoutPlanSchema)
    .mutation(async ({ input, ctx }) => {
      return clientRosterService.assignWorkoutPlan(ctx.user.id, input.clientRosterId, input.workoutPlanId);
    }),

  unassignWorkoutPlan: trainerProcedure
    .use(requireTier('PRO'))
    .input(unassignWorkoutPlanSchema)
    .mutation(async ({ input, ctx }) => {
      return clientRosterService.unassignWorkoutPlan(ctx.user.id, input.clientRosterId, input.workoutPlanId);
    }),

  assignMealPlan: trainerProcedure
    .use(requireTier('PRO'))
    .input(assignMealPlanSchema)
    .mutation(async ({ input, ctx }) => {
      return clientRosterService.assignMealPlan(ctx.user.id, input.clientRosterId, input.mealPlanId);
    }),

  unassignMealPlan: trainerProcedure
    .use(requireTier('PRO'))
    .input(unassignMealPlanSchema)
    .mutation(async ({ input, ctx }) => {
      return clientRosterService.unassignMealPlan(ctx.user.id, input.clientRosterId, input.mealPlanId);
    }),

  bulkAssignPlan: trainerProcedure
    .use(requireTier('PRO'))
    .input(bulkAssignPlanSchema)
    .mutation(async ({ input, ctx }) => {
      const { clientIds, ...data } = input;
      return clientRosterService.bulkAssignPlan(ctx.user.id, clientIds, data);
    }),

  stats: trainerProcedure
    .query(async ({ ctx }) => {
      return clientRosterService.getStats(ctx.user.id);
    }),

  disconnect: trainerProcedure
    .use(requireTier('PRO'))
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ input, ctx }) => {
      return clientRosterService.disconnectByTrainer(ctx.user.id, input.id);
    }),

  disconnectByConnection: trainerProcedure
    .use(requireTier('PRO'))
    .input(z.object({ connectionId: z.string().cuid() }))
    .mutation(async ({ input, ctx }) => {
      return clientRosterService.disconnectByTrainerConnection(ctx.user.id, input.connectionId);
    }),

  myAssignments: traineeProcedure
    .query(async ({ ctx }) => {
      return clientRosterService.getMyAssignments(ctx.user.id);
    }),

  // Get client roster entries where the trainee is the client (for booking)
  myTrainers: traineeProcedure
    .query(async ({ ctx }) => {
      return clientRosterService.getMyTrainers(ctx.user.id);
    }),

  traineeDisconnect: traineeProcedure
    .input(z.object({ connectionId: z.string().cuid() }))
    .mutation(async ({ input, ctx }) => {
      return clientRosterService.disconnectByTrainee(ctx.user.id, input.connectionId);
    }),
});
