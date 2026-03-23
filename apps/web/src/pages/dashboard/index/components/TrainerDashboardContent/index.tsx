import { trpc } from "@/lib/trpc";
import {
  LoadingState,
  NoProfileState,
  ProfileCard,
  QuickActions,
  ClientActivityFeed,
} from "./components";
import type { TrainerDashboardContentProps } from "./TrainerDashboardContent.types";

export const TrainerDashboardContent = ({
  badgeCounts,
}: TrainerDashboardContentProps) => {
  const { data: profile, isLoading } = trpc.trainer.getMyProfile.useQuery();

  if (isLoading) {
    return <LoadingState />;
  }

  if (!profile) {
    return <NoProfileState />;
  }

  return (
    <div className="space-y-6">
      <ProfileCard profile={profile} />
      <QuickActions profileHandle={profile.handle} badgeCounts={badgeCounts} />
      <ClientActivityFeed />
    </div>
  );
};
