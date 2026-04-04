import { useState, useRef } from "react";
import {
  View,
  Modal,
  TouchableOpacity,
  Dimensions,
  FlatList,
  type ViewToken,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  Home,
  MessageCircle,
  Users,
  Sparkles,
  BookHeart,
  Calendar,
  type LucideIcon,
} from "lucide-react-native";
import { Text, Button } from "@/components/ui";
import { colors } from "@/constants/theme";

interface TourStep {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface GuidedTourProps {
  role: "TRAINER" | "TRAINEE";
  onComplete: () => void;
  onSkip: () => void;
}

const trainerSteps: TourStep[] = [
  {
    icon: Home,
    title: "Your Dashboard",
    description:
      "View key stats, quick actions, and recent client activity all in one place.",
  },
  {
    icon: MessageCircle,
    title: "Messages & Bookings",
    description:
      "Chat with clients and manage session bookings from the tab bar.",
  },
  {
    icon: Users,
    title: "Client Management",
    description:
      "Access your client roster, resources, and onboarding from the Profile tab.",
  },
  {
    icon: Sparkles,
    title: "You're All Set!",
    description:
      "Explore the app and start growing your PT business. Tap Profile for all features.",
  },
];

const traineeSteps: TourStep[] = [
  {
    icon: Home,
    title: "Your Dashboard",
    description: "Track your progress, view trends, and access quick actions.",
  },
  {
    icon: BookHeart,
    title: "Diary",
    description:
      "Log meals, weight, workouts, mood, sleep, and more from the Diary tab.",
  },
  {
    icon: Calendar,
    title: "Bookings",
    description: "Book sessions with your trainer and manage appointments.",
  },
  {
    icon: Sparkles,
    title: "Ready to Go!",
    description:
      "Explore goals, plans, friends, and leaderboards from the Profile tab.",
  },
];

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const StepCard = ({ step }: { step: TourStep }) => {
  const Icon = step.icon;

  return (
    <View
      style={{ width: SCREEN_WIDTH }}
      className="flex-1 items-center justify-center px-8"
    >
      <View
        className="w-20 h-20 rounded-full items-center justify-center mb-8"
        style={{ backgroundColor: colors.teal + "20" }}
      >
        <Icon size={40} color={colors.teal} />
      </View>
      <Text className="text-2xl font-bold text-white text-center mb-4">
        {step.title}
      </Text>
      <Text
        className="text-base text-center leading-6"
        style={{ color: "hsl(230, 10%, 65%)" }}
      >
        {step.description}
      </Text>
    </View>
  );
};

export const GuidedTour = ({ role, onComplete, onSkip }: GuidedTourProps) => {
  const steps = role === "TRAINER" ? trainerSteps : traineeSteps;
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const isLastStep = currentIndex === steps.length - 1;

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setCurrentIndex(viewableItems[0].index);
      }
    },
  ).current;

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 50,
  }).current;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    }
  };

  return (
    <Modal
      visible
      animationType="fade"
      presentationStyle="fullScreen"
      statusBarTranslucent
    >
      <LinearGradient
        colors={["hsl(230, 20%, 10%)", "hsl(230, 22%, 6%)"]}
        className="flex-1"
      >
        {/* Skip button */}
        <View className="flex-row justify-end pt-16 px-6">
          <TouchableOpacity onPress={onSkip} activeOpacity={0.6}>
            <Text style={{ color: "hsl(230, 10%, 55%)" }} className="text-sm">
              Skip
            </Text>
          </TouchableOpacity>
        </View>

        {/* Step cards */}
        <FlatList
          ref={flatListRef}
          data={steps}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item }) => <StepCard step={item} />}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          className="flex-1"
        />

        {/* Bottom controls */}
        <View className="px-8 pb-16 gap-6">
          {/* Pagination dots */}
          <View className="flex-row items-center justify-center gap-2">
            {steps.map((_, i) => (
              <View
                key={i}
                className="rounded-full"
                style={{
                  width: i === currentIndex ? 24 : 8,
                  height: 8,
                  backgroundColor:
                    i === currentIndex ? colors.teal : "hsl(230, 15%, 25%)",
                }}
              />
            ))}
          </View>

          {/* Next / Get Started button */}
          <Button onPress={handleNext}>
            {isLastStep ? "Get Started" : "Next"}
          </Button>
        </View>
      </LinearGradient>
    </Modal>
  );
};
