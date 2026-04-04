import { useState } from 'react';
import { View, Modal, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Home,
  MessageCircle,
  Users,
  Sparkles,
  BookHeart,
  Calendar,
  type LucideIcon,
} from 'lucide-react-native';
import { Text, Button } from '@/components/ui';
import { colors } from '@/constants/theme';

interface TourStep {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface GuidedTourProps {
  role: 'TRAINER' | 'TRAINEE';
  onComplete: () => void;
  onSkip: () => void;
}

const trainerSteps: TourStep[] = [
  {
    icon: Home,
    title: 'Your Dashboard',
    description:
      'View key stats, quick actions, and recent client activity all in one place.',
  },
  {
    icon: MessageCircle,
    title: 'Messages & Bookings',
    description:
      'Chat with clients and manage session bookings from the tab bar.',
  },
  {
    icon: Users,
    title: 'Client Management',
    description:
      'Access your client roster, resources, and onboarding from the Profile tab.',
  },
  {
    icon: Sparkles,
    title: "You're All Set!",
    description:
      'Explore the app and start growing your PT business. Tap Profile for all features.',
  },
];

const traineeSteps: TourStep[] = [
  {
    icon: Home,
    title: 'Your Dashboard',
    description: 'Track your progress, view trends, and access quick actions.',
  },
  {
    icon: BookHeart,
    title: 'Diary',
    description:
      'Log meals, weight, workouts, mood, sleep, and more from the Diary tab.',
  },
  {
    icon: Calendar,
    title: 'Bookings',
    description: 'Book sessions with your trainer and manage appointments.',
  },
  {
    icon: Sparkles,
    title: 'Ready to Go!',
    description:
      'Explore goals, plans, friends, and leaderboards from the Profile tab.',
  },
];

export const GuidedTour = ({ role, onComplete, onSkip }: GuidedTourProps) => {
  const steps = role === 'TRAINER' ? trainerSteps : traineeSteps;
  const [currentIndex, setCurrentIndex] = useState(0);
  const isLastStep = currentIndex === steps.length - 1;
  const step = steps[currentIndex];
  const Icon = step.icon;

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
        colors={['hsl(230, 20%, 10%)', 'hsl(230, 22%, 6%)']}
        style={{ flex: 1 }}
      >
        {/* Skip button */}
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingTop: 60, paddingHorizontal: 24 }}>
          <TouchableOpacity onPress={onSkip} activeOpacity={0.6}>
            <Text style={{ color: 'hsl(230, 10%, 55%)', fontSize: 14 }}>
              Skip
            </Text>
          </TouchableOpacity>
        </View>

        {/* Step content */}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.teal + '20',
              marginBottom: 32,
            }}
          >
            <Icon size={40} color={colors.teal} />
          </View>
          <Text
            style={{
              fontSize: 24,
              fontWeight: 'bold',
              color: '#fff',
              textAlign: 'center',
              marginBottom: 16,
            }}
          >
            {step.title}
          </Text>
          <Text
            style={{
              fontSize: 16,
              textAlign: 'center',
              lineHeight: 24,
              color: 'hsl(230, 10%, 65%)',
            }}
          >
            {step.description}
          </Text>
        </View>

        {/* Bottom controls */}
        <View style={{ paddingHorizontal: 32, paddingBottom: 60, gap: 24 }}>
          {/* Pagination dots */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {steps.map((_, i) => (
              <View
                key={i}
                style={{
                  width: i === currentIndex ? 24 : 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor:
                    i === currentIndex ? colors.teal : 'hsl(230, 15%, 25%)',
                }}
              />
            ))}
          </View>

          {/* Next / Get Started button */}
          <Button onPress={handleNext}>
            {isLastStep ? 'Get Started' : 'Next'}
          </Button>
        </View>
      </LinearGradient>
    </Modal>
  );
};
