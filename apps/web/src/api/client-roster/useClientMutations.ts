import { trpc } from '@/lib/trpc';

export const useUpdateClientStatus = () => {
  const utils = trpc.useUtils();
  return trpc.clientRoster.updateStatus.useMutation({
    onSuccess: () => {
      utils.clientRoster.list.invalidate();
      utils.clientRoster.stats.invalidate();
      utils.trainer.getDashboardStats.invalidate();
    },
  });
};

export const useAssignWorkoutPlan = () => {
  const utils = trpc.useUtils();
  return trpc.clientRoster.assignWorkoutPlan.useMutation({
    onMutate: async (variables) => {
      await utils.clientRoster.get.cancel({ id: variables.clientRosterId });
      const previous = utils.clientRoster.get.getData({ id: variables.clientRosterId });
      utils.clientRoster.get.setData({ id: variables.clientRosterId }, (old) => {
        if (!old) return old;
        return {
          ...old,
          workoutPlanAssignments: [
            ...old.workoutPlanAssignments,
            {
              id: `optimistic-${variables.workoutPlanId}`,
              clientRosterId: variables.clientRosterId,
              workoutPlanId: variables.workoutPlanId,
              assignedAt: new Date(),
              workoutPlan: {
                id: variables.workoutPlanId,
                name: variables.planName ?? '',
                description: null,
                trainerId: '',
                createdAt: new Date(),
                updatedAt: new Date(),
                exercises: [],
              },
            },
          ],
        };
      });
      return { previous };
    },
    onError: (_err, variables, context) => {
      if (context?.previous) {
        utils.clientRoster.get.setData({ id: variables.clientRosterId }, context.previous);
      }
    },
    onSettled: (_data, _err, variables) => {
      utils.clientRoster.get.invalidate({ id: variables.clientRosterId });
      utils.clientRoster.list.invalidate();
    },
  });
};

export const useUnassignWorkoutPlan = () => {
  const utils = trpc.useUtils();
  return trpc.clientRoster.unassignWorkoutPlan.useMutation({
    onMutate: async (variables) => {
      await utils.clientRoster.get.cancel({ id: variables.clientRosterId });
      const previous = utils.clientRoster.get.getData({ id: variables.clientRosterId });
      utils.clientRoster.get.setData({ id: variables.clientRosterId }, (old) => {
        if (!old) return old;
        return {
          ...old,
          workoutPlanAssignments: old.workoutPlanAssignments.filter(
            (a) => a.workoutPlanId !== variables.workoutPlanId
          ),
        };
      });
      return { previous };
    },
    onError: (_err, variables, context) => {
      if (context?.previous) {
        utils.clientRoster.get.setData({ id: variables.clientRosterId }, context.previous);
      }
    },
    onSettled: (_data, _err, variables) => {
      utils.clientRoster.get.invalidate({ id: variables.clientRosterId });
      utils.clientRoster.list.invalidate();
    },
  });
};

export const useAssignMealPlan = () => {
  const utils = trpc.useUtils();
  return trpc.clientRoster.assignMealPlan.useMutation({
    onMutate: async (variables) => {
      await utils.clientRoster.get.cancel({ id: variables.clientRosterId });
      const previous = utils.clientRoster.get.getData({ id: variables.clientRosterId });
      utils.clientRoster.get.setData({ id: variables.clientRosterId }, (old) => {
        if (!old) return old;
        return {
          ...old,
          mealPlanAssignments: [
            ...old.mealPlanAssignments,
            {
              id: `optimistic-${variables.mealPlanId}`,
              clientRosterId: variables.clientRosterId,
              mealPlanId: variables.mealPlanId,
              assignedAt: new Date(),
              mealPlan: {
                id: variables.mealPlanId,
                name: variables.planName ?? '',
                description: null,
                trainerId: '',
                createdAt: new Date(),
                updatedAt: new Date(),
                recipes: [],
              },
            },
          ],
        };
      });
      return { previous };
    },
    onError: (_err, variables, context) => {
      if (context?.previous) {
        utils.clientRoster.get.setData({ id: variables.clientRosterId }, context.previous);
      }
    },
    onSettled: (_data, _err, variables) => {
      utils.clientRoster.get.invalidate({ id: variables.clientRosterId });
      utils.clientRoster.list.invalidate();
    },
  });
};

export const useUnassignMealPlan = () => {
  const utils = trpc.useUtils();
  return trpc.clientRoster.unassignMealPlan.useMutation({
    onMutate: async (variables) => {
      await utils.clientRoster.get.cancel({ id: variables.clientRosterId });
      const previous = utils.clientRoster.get.getData({ id: variables.clientRosterId });
      utils.clientRoster.get.setData({ id: variables.clientRosterId }, (old) => {
        if (!old) return old;
        return {
          ...old,
          mealPlanAssignments: old.mealPlanAssignments.filter(
            (a) => a.mealPlanId !== variables.mealPlanId
          ),
        };
      });
      return { previous };
    },
    onError: (_err, variables, context) => {
      if (context?.previous) {
        utils.clientRoster.get.setData({ id: variables.clientRosterId }, context.previous);
      }
    },
    onSettled: (_data, _err, variables) => {
      utils.clientRoster.get.invalidate({ id: variables.clientRosterId });
      utils.clientRoster.list.invalidate();
    },
  });
};

export const useBulkAssignPlan = () => {
  const utils = trpc.useUtils();
  return trpc.clientRoster.bulkAssignPlan.useMutation({
    onSuccess: () => {
      utils.clientRoster.list.invalidate();
    },
  });
};

export const useDisconnectClient = () => {
  const utils = trpc.useUtils();
  return trpc.clientRoster.disconnect.useMutation({
    onSuccess: () => {
      utils.clientRoster.list.invalidate();
      utils.clientRoster.stats.invalidate();
      utils.contact.getMyRequests.invalidate();
      utils.trainer.getDashboardStats.invalidate();
    },
  });
};

export const useDisconnectByConnection = () => {
  const utils = trpc.useUtils();
  return trpc.clientRoster.disconnectByConnection.useMutation({
    onSuccess: () => {
      utils.clientRoster.list.invalidate();
      utils.clientRoster.stats.invalidate();
      utils.contact.getMyRequests.invalidate();
      utils.trainer.getDashboardStats.invalidate();
    },
  });
};

export const useTraineeDisconnect = () => {
  const utils = trpc.useUtils();
  return trpc.clientRoster.traineeDisconnect.useMutation({
    onSuccess: () => {
      utils.clientRoster.myAssignments.invalidate();
      utils.contact.getSentRequests.invalidate();
    },
  });
};
