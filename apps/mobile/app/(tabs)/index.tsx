import { useState, useEffect } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, Skeleton } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { useSession } from "@/lib/auth";
import { trpc } from "@/lib/trpc";
import { TrainerDashboard } from "@/components/dashboard/TrainerDashboard";
import { TraineeDashboard } from "@/components/dashboard/TraineeDashboard";
import { GuidedTour } from "@/components/GuidedTour";

const HomeScreen = () => {
  const { user, role, isLoading } = useAuth();
  const { data: session } = useSession();
  const utils = trpc.useUtils();
  const completeTour = trpc.user.completeMobileTour.useMutation({
    onSuccess: () => utils.invalidate(),
  });
  const skipTour = trpc.user.skipMobileTour.useMutation({
    onSuccess: () => utils.invalidate(),
  });
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    if (
      session?.user &&
      !(session.user as any).mobileTourCompleted &&
      !(session.user as any).mobileTourSkippedAt
    ) {
      setShowTour(true);
    }
  }, [session]);
  const isTrainer = role === "TRAINER";

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
        <View className="px-4 py-4 gap-4">
          <Skeleton className="h-8 w-48 rounded" />
          <Skeleton className="h-24 rounded-lg" />
          <View className="flex-row gap-2">
            <Skeleton className="flex-1 h-20 rounded-lg" />
            <Skeleton className="flex-1 h-20 rounded-lg" />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      {/* Header */}
      <View className="px-4 py-4">
        <Text className="text-sm text-muted-foreground">
          {isTrainer ? "Trainer Dashboard" : "Your Dashboard"}
        </Text>
        <Text
          className="text-2xl font-extralight text-foreground uppercase"
          style={{ letterSpacing: 2 }}
        >
          Hey, {user?.name?.split(" ")[0] ?? "there"}
        </Text>
      </View>

      {isTrainer ? <TrainerDashboard /> : <TraineeDashboard />}

      {showTour && role && (
        <GuidedTour
          role={role as "TRAINER" | "TRAINEE"}
          onComplete={() => {
            setShowTour(false);
            completeTour.mutate();
          }}
          onSkip={() => {
            setShowTour(false);
            skipTour.mutate();
          }}
        />
      )}
    </SafeAreaView>
  );
};

export default HomeScreen;
