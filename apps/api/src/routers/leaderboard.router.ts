import { z } from "zod";
import { router, protectedProcedure } from "../lib/trpc";
import { leaderboardService } from "../services/leaderboard.service";

export const leaderboardRouter = router({
  getLeaderboard: protectedProcedure
    .input(
      z.object({
        type: z.enum([
          "STEPS",
          "WORKOUTS",
          "STREAKS",
          "GOALS",
          "ACTIVITY_DURATION",
          "RUNNING_DISTANCE",
          "CYCLING_DISTANCE",
          "FASTEST_5K",
        ]),
        period: z.enum(["WEEKLY", "MONTHLY", "ALL_TIME"]),
        scope: z.enum(["GLOBAL", "FRIENDS"]),
        limit: z.number().min(1).max(100).default(50),
      }),
    )
    .query(async ({ input, ctx }) => {
      return leaderboardService.getLeaderboard(
        input.type,
        input.period,
        input.scope,
        ctx.user.id,
        input.limit,
      );
    }),

  getOptInStatus: protectedProcedure.query(async ({ ctx }) => {
    return leaderboardService.getOptInStatus(ctx.user.id);
  }),

  setOptInStatus: protectedProcedure
    .input(z.object({ optedIn: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      return leaderboardService.setOptInStatus(ctx.user.id, input.optedIn);
    }),
});
