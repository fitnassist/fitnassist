import { TRPCError } from '@trpc/server';
import { router, trainerProcedure, publicProcedure, requireTier } from '../lib/trpc';
import { trainerRepository } from '../repositories/trainer.repository';
import { websiteService } from '../services/website.service';
import { websiteSectionService } from '../services/website-section.service';
import {
  updateWebsiteSettingsSchema,
  updateSubdomainSchema,
  addSectionSchema,
  updateSectionSchema,
  reorderSectionsSchema,
  toggleSectionVisibilitySchema,
  removeSectionSchema,
  getWebsiteBySubdomainSchema,
} from '@fitnassist/schemas';

const requireTrainerProfile = async (userId: string) => {
  const profile = await trainerRepository.findByUserId(userId);
  if (!profile) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Trainer profile not found' });
  }
  return profile;
};

export const websiteRouter = router({
  // =========================================================================
  // Public
  // =========================================================================

  getBySubdomain: publicProcedure
    .input(getWebsiteBySubdomainSchema)
    .query(async ({ input }) => {
      return websiteService.getPublicWebsite(input.subdomain);
    }),

  // =========================================================================
  // Trainer (ELITE)
  // =========================================================================

  getMyWebsite: trainerProcedure
    .use(requireTier('ELITE'))
    .query(async ({ ctx }) => {
      const profile = await requireTrainerProfile(ctx.user.id);
      return websiteService.getMyWebsite(profile.id);
    }),

  getPreview: trainerProcedure
    .use(requireTier('ELITE'))
    .query(async ({ ctx }) => {
      const profile = await requireTrainerProfile(ctx.user.id);
      return websiteService.getPreview(profile.id);
    }),

  create: trainerProcedure
    .use(requireTier('ELITE'))
    .mutation(async ({ ctx }) => {
      const profile = await requireTrainerProfile(ctx.user.id);
      return websiteService.createWebsite(profile.id, profile.handle);
    }),

  updateSettings: trainerProcedure
    .use(requireTier('ELITE'))
    .input(updateWebsiteSettingsSchema)
    .mutation(async ({ ctx, input }) => {
      const profile = await requireTrainerProfile(ctx.user.id);
      return websiteService.updateSettings(profile.id, input);
    }),

  updateSubdomain: trainerProcedure
    .use(requireTier('ELITE'))
    .input(updateSubdomainSchema)
    .mutation(async ({ ctx, input }) => {
      const profile = await requireTrainerProfile(ctx.user.id);
      return websiteService.updateSubdomain(profile.id, input.subdomain);
    }),

  publish: trainerProcedure
    .use(requireTier('ELITE'))
    .mutation(async ({ ctx }) => {
      const profile = await requireTrainerProfile(ctx.user.id);
      return websiteService.publish(profile.id);
    }),

  unpublish: trainerProcedure
    .use(requireTier('ELITE'))
    .mutation(async ({ ctx }) => {
      const profile = await requireTrainerProfile(ctx.user.id);
      return websiteService.unpublish(profile.id);
    }),

  // =========================================================================
  // Sections
  // =========================================================================

  addSection: trainerProcedure
    .use(requireTier('ELITE'))
    .input(addSectionSchema)
    .mutation(async ({ ctx, input }) => {
      const profile = await requireTrainerProfile(ctx.user.id);
      return websiteSectionService.addSection(profile.id, input);
    }),

  updateSection: trainerProcedure
    .use(requireTier('ELITE'))
    .input(updateSectionSchema)
    .mutation(async ({ ctx, input }) => {
      const { sectionId, ...data } = input;
      const profile = await requireTrainerProfile(ctx.user.id);
      return websiteSectionService.updateSection(profile.id, sectionId, data);
    }),

  removeSection: trainerProcedure
    .use(requireTier('ELITE'))
    .input(removeSectionSchema)
    .mutation(async ({ ctx, input }) => {
      const profile = await requireTrainerProfile(ctx.user.id);
      return websiteSectionService.removeSection(profile.id, input.sectionId);
    }),

  reorderSections: trainerProcedure
    .use(requireTier('ELITE'))
    .input(reorderSectionsSchema)
    .mutation(async ({ ctx, input }) => {
      const profile = await requireTrainerProfile(ctx.user.id);
      return websiteSectionService.reorderSections(profile.id, input.sectionIds);
    }),

  toggleSectionVisibility: trainerProcedure
    .use(requireTier('ELITE'))
    .input(toggleSectionVisibilitySchema)
    .mutation(async ({ ctx, input }) => {
      const profile = await requireTrainerProfile(ctx.user.id);
      return websiteSectionService.toggleSectionVisibility(profile.id, input.sectionId);
    }),
});
