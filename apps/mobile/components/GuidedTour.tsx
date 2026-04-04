import { useState } from "react";
import { View, Modal, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  Home,
  MessageCircle,
  Users,
  Sparkles,
  BookHeart,
  Calendar,
} from "lucide-react-native";
import { Text, Button } from "@/components/ui";

interface TourStep {
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
    title: "Your Dashboard",
    description:
      "View key stats, quick actions, and recent client activity all in one place.",
  },
  {
    title: "Messages & Bookings",
    description:
      "Chat with clients and manage session bookings from the tab bar.",
  },
  {
    title: "Client Management",
    description:
      "Access your client roster, resources, and onboarding from the Profile tab.",
  },
  {
    title: "You're All Set!",
    description:
      "Explore the app and start growing your PT business. Tap Profile for all features.",
  },
];

const traineeSteps: TourStep[] = [
  {
    title: "Your Dashboard",
    description: "Track your progress, view trends, and access quick actions.",
  },
  {
    title: "Diary",
    description:
      "Log meals, weight, workouts, mood, sleep, and more from the Diary tab.",
  },
  {
    title: "Bookings",
    description: "Book sessions with your trainer and manage appointments.",
  },
  {
    title: "Ready to Go!",
    description:
      "Explore goals, plans, friends, and leaderboards from the Profile tab.",
  },
];

export const GuidedTour = ({ role, onComplete, onSkip }: GuidedTourProps) => {
  const steps = role === "TRAINER" ? trainerSteps : traineeSteps;
  const [currentIndex, setCurrentIndex] = useState(0);
  const isLastStep = currentIndex === steps.length - 1;
  const step = steps[currentIndex];

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  };

  return (
    <Modal visible animationType="fade" statusBarTranslucent>
      <LinearGradient
        colors={["hsl(230, 20%, 10%)", "hsl(230, 22%, 6%)"]}
        style={{ flex: 1 }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "flex-end",
            paddingTop: 60,
            paddingHorizontal: 24,
          }}
        >
          <TouchableOpacity onPress={onSkip} activeOpacity={0.6}>
            <Text style={{ color: "hsl(230, 10%, 55%)", fontSize: 14 }}>
              Skip
            </Text>
          </TouchableOpacity>
        </View>

        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 32,
          }}
        >
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(94, 206, 187, 0.15)",
              marginBottom: 24,
            }}
          >
            {currentIndex === 0 && <Home size={28} color="#5ECEBB" />}
            {currentIndex === 1 &&
              (role === "TRAINEE" ? (
                <BookHeart size={28} color="#5ECEBB" />
              ) : (
                <MessageCircle size={28} color="#5ECEBB" />
              ))}
            {currentIndex === 2 &&
              (role === "TRAINEE" ? (
                <Calendar size={28} color="#5ECEBB" />
              ) : (
                <Users size={28} color="#5ECEBB" />
              ))}
            {currentIndex === 3 && <Sparkles size={28} color="#5ECEBB" />}
          </View>
          <Text
            style={{
              fontSize: 24,
              fontWeight: "bold",
              color: "#fff",
              textAlign: "center",
              marginBottom: 16,
            }}
          >
            {step.title}
          </Text>
          <Text
            style={{
              fontSize: 16,
              textAlign: "center",
              lineHeight: 24,
              color: "hsl(230, 10%, 65%)",
            }}
          >
            {step.description}
          </Text>
        </View>

        <View style={{ paddingHorizontal: 32, paddingBottom: 60, gap: 24 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {steps.map((_, i) => (
              <View
                key={i}
                style={{
                  width: i === currentIndex ? 24 : 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor:
                    i === currentIndex ? "#5ECEBB" : "hsl(230, 15%, 25%)",
                }}
              />
            ))}
          </View>

          <Button onPress={handleNext}>
            {isLastStep ? "Get Started" : "Next"}
          </Button>
        </View>
      </LinearGradient>
    </Modal>
  );
};
