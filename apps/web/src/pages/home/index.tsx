import { useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  UtensilsCrossed,
  Dumbbell,
  Heart,
  TrendingUp,
  MapPin,
  User,
  Calendar,
  Users,
  BookOpen,
  CalendarCheck,
  BarChart3,
  MessageCircle,
  LineChart,
} from 'lucide-react';
import { routes } from '@/config/routes';
import { Button, Card, CardContent } from '@/components/ui';
import { HeroBanner } from '@/components/HeroBanner';

const useSlider = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const onScroll = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const children = Array.from(el.children) as HTMLElement[];
    const center = el.scrollLeft + el.offsetWidth / 2;
    let closest = 0;
    let minDist = Infinity;
    children.forEach((child, i) => {
      const childCenter = child.offsetLeft + child.offsetWidth / 2;
      const dist = Math.abs(center - childCenter);
      if (dist < minDist) {
        minDist = dist;
        closest = i;
      }
    });
    setActive(closest);
  }, []);

  return { ref, active, onScroll };
};

interface SliderDotsProps {
  count: number;
  active: number;
  className?: string;
}

const SliderDots = ({ count, active, className = '' }: SliderDotsProps) => (
  <div className={`flex justify-center gap-2 mt-4 sm:hidden ${className}`}>
    {Array.from({ length: count }, (_, i) => (
      <div
        key={i}
        className={`h-2 w-2 rounded-full transition-colors ${
          i === active ? 'bg-primary' : 'bg-muted-foreground/30'
        }`}
      />
    ))}
  </div>
);

const SliderDotsDark = ({ count, active, className = '' }: SliderDotsProps) => (
  <div className={`flex justify-center gap-2 mt-4 sm:hidden ${className}`}>
    {Array.from({ length: count }, (_, i) => (
      <div
        key={i}
        className={`h-2 w-2 rounded-full transition-colors ${
          i === active ? 'bg-white' : 'bg-white/30'
        }`}
      />
    ))}
  </div>
);

export const HomePage = () => {
  const traineeSlider = useSlider();
  const trainerDiscoverySlider = useSlider();
  const trainerPitchSlider = useSlider();
  const stepsSlider = useSlider();

  return (
    <div>
      {/* Hero Section */}
      <HeroBanner title="Welcome to Fitness" imageUrl="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920&q=80">
        <p className="mx-auto mt-6 max-w-2xl text-lg text-white/70">
          Your all-in-one fitness platform. Track nutrition, workouts, and wellness — or
          find a personal trainer to guide your journey. For trainers, manage clients and
          grow your business from one dashboard.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to={routes.trainers}>
            <Button size="lg" className="uppercase tracking-wider font-semibold">
              Find a Trainer
            </Button>
          </Link>
          <Link to={routes.register}>
            <Button variant="outline" size="lg" className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white uppercase tracking-wider font-semibold">
              I'm a Trainer
            </Button>
          </Link>
        </div>
      </HeroBanner>

      {/* Section 2: Trainee Pitch */}
      <section className="py-12 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-light text-foreground uppercase tracking-wider">
              One App. Every Goal.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              Stop juggling apps. Track your entire fitness journey in one place — calories,
              workouts, runs, weight, sleep, and more.
            </p>
          </div>
          <div
            ref={traineeSlider.ref}
            onScroll={traineeSlider.onScroll}
            className="mt-8 sm:mt-16 -mx-4 px-[10vw] sm:mx-0 sm:px-0 flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 sm:pb-0 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-4 sm:gap-8 scrollbar-none"
          >
            <Card className="min-w-[80vw] snap-center sm:min-w-0">
              <CardContent className="pt-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <UtensilsCrossed className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">Nutrition Tracking</h3>
                <p className="mt-2 text-muted-foreground">
                  Log meals, track calories and macros, browse recipes from your trainer.
                </p>
              </CardContent>
            </Card>
            <Card className="min-w-[80vw] snap-center sm:min-w-0">
              <CardContent className="pt-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Dumbbell className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">Workouts & Activities</h3>
                <p className="mt-2 text-muted-foreground">
                  Log gym sessions, runs, walks, cycles. Track personal bests automatically.
                </p>
              </CardContent>
            </Card>
            <Card className="min-w-[80vw] snap-center sm:min-w-0">
              <CardContent className="pt-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">Body & Wellness</h3>
                <p className="mt-2 text-muted-foreground">
                  Weight, measurements, sleep, mood, water intake, progress photos.
                </p>
              </CardContent>
            </Card>
            <Card className="min-w-[80vw] snap-center sm:min-w-0">
              <CardContent className="pt-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">Goals & Trends</h3>
                <p className="mt-2 text-muted-foreground">
                  Set targets, view trend charts, get weekly email reports.
                </p>
              </CardContent>
            </Card>
          </div>
          <SliderDots count={4} active={traineeSlider.active} />
          <div className="mt-8 sm:mt-12 text-center">
            <Link to={routes.register}>
              <Button size="lg" className="uppercase tracking-wider font-semibold">
                Start Tracking Free
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Section 3: Find Your Perfect Trainer (dark) */}
      <section className="bg-gradient-to-br from-[#20415c] to-[#5a0c30] py-12 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-light text-white uppercase tracking-wider">
              Find Your Perfect Trainer
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-white/70">
              Search by location, browse profiles, and connect directly — no middleman.
            </p>
          </div>
          <div
            ref={trainerDiscoverySlider.ref}
            onScroll={trainerDiscoverySlider.onScroll}
            className="mt-8 sm:mt-16 -mx-4 px-[10vw] sm:mx-0 sm:px-0 flex gap-8 overflow-x-auto snap-x snap-mandatory pb-4 sm:pb-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:gap-12 scrollbar-none"
          >
            <div className="text-center min-w-[80vw] snap-center sm:min-w-0">
              <MapPin className="mx-auto h-10 w-10 text-white/80" />
              <h3 className="mt-4 text-lg font-semibold text-white">Search Nearby</h3>
              <p className="mt-2 text-white/70">
                Map-based search with filters for distance, services, and price range.
              </p>
            </div>
            <div className="text-center min-w-[80vw] snap-center sm:min-w-0">
              <User className="mx-auto h-10 w-10 text-white/80" />
              <h3 className="mt-4 text-lg font-semibold text-white">Browse Profiles</h3>
              <p className="mt-2 text-white/70">
                Photo galleries, video intros, qualifications, and client reviews.
              </p>
            </div>
            <div className="text-center min-w-[80vw] snap-center sm:min-w-0">
              <Calendar className="mx-auto h-10 w-10 text-white/80" />
              <h3 className="mt-4 text-lg font-semibold text-white">Book Sessions</h3>
              <p className="mt-2 text-white/70">
                Request callbacks, message directly, or book sessions online.
              </p>
            </div>
          </div>
          <SliderDotsDark count={3} active={trainerDiscoverySlider.active} />
          <div className="mt-8 sm:mt-12 text-center">
            <Link to={routes.trainers}>
              <Button size="lg" className="uppercase tracking-wider font-semibold">
                Find a Trainer
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Section 4: Built For Trainers (white) */}
      <section className="py-12 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-light text-foreground uppercase tracking-wider">
              Built For Trainers
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              Everything you need to manage and grow your personal training business.
            </p>
          </div>
          <div
            ref={trainerPitchSlider.ref}
            onScroll={trainerPitchSlider.onScroll}
            className="mt-8 sm:mt-16 -mx-4 px-[10vw] sm:mx-0 sm:px-0 flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 sm:pb-0 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-3 sm:gap-8 scrollbar-none"
          >
            <Card className="min-w-[80vw] snap-center sm:min-w-0">
              <CardContent className="pt-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">Client Management</h3>
                <p className="mt-2 text-muted-foreground">
                  Onboard clients, track status, manage your full roster from one dashboard.
                </p>
              </CardContent>
            </Card>
            <Card className="min-w-[80vw] snap-center sm:min-w-0">
              <CardContent className="pt-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">Resources Library</h3>
                <p className="mt-2 text-muted-foreground">
                  Create exercises with videos, recipes, workout plans, and meal plans. Assign to clients in bulk.
                </p>
              </CardContent>
            </Card>
            <Card className="min-w-[80vw] snap-center sm:min-w-0">
              <CardContent className="pt-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <CalendarCheck className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">Booking & Scheduling</h3>
                <p className="mt-2 text-muted-foreground">
                  Set your availability, accept bookings, automatic travel time calculations.
                </p>
              </CardContent>
            </Card>
            <Card className="min-w-[80vw] snap-center sm:min-w-0">
              <CardContent className="pt-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">Client Progress</h3>
                <p className="mt-2 text-muted-foreground">
                  View diary entries, set goals, comment, track trends and progress photos.
                </p>
              </CardContent>
            </Card>
            <Card className="min-w-[80vw] snap-center sm:min-w-0">
              <CardContent className="pt-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <MessageCircle className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">Real-Time Messaging</h3>
                <p className="mt-2 text-muted-foreground">
                  Instant messaging with read receipts and push notifications.
                </p>
              </CardContent>
            </Card>
            <Card className="min-w-[80vw] snap-center sm:min-w-0">
              <CardContent className="pt-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <LineChart className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">Analytics</h3>
                <p className="mt-2 text-muted-foreground">
                  Profile views, booking stats, client adherence, goal completion rates.
                </p>
              </CardContent>
            </Card>
          </div>
          <SliderDots count={6} active={trainerPitchSlider.active} />
          <div className="mt-8 sm:mt-12 text-center">
            <Link to={routes.register}>
              <Button size="lg" className="uppercase tracking-wider font-semibold">
                Start Your Free Trial
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Section 5: Get Started in Minutes (muted bg) */}
      <section className="bg-muted/50 py-12 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-light text-foreground uppercase tracking-wider">
              Get Started in Minutes
            </h2>
          </div>
          <div
            ref={stepsSlider.ref}
            onScroll={stepsSlider.onScroll}
            className="mt-8 sm:mt-16 -mx-4 px-[10vw] sm:mx-0 sm:px-0 flex gap-8 overflow-x-auto snap-x snap-mandatory pb-4 sm:pb-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:gap-12 scrollbar-none"
          >
            <div className="text-center min-w-[80vw] snap-center sm:min-w-0">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white text-xl font-bold">
                1
              </div>
              <h3 className="mt-4 text-lg font-semibold">Sign Up Free</h3>
              <p className="mt-2 text-muted-foreground">
                Create your account in seconds, no card required.
              </p>
            </div>
            <div className="text-center min-w-[80vw] snap-center sm:min-w-0">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white text-xl font-bold">
                2
              </div>
              <h3 className="mt-4 text-lg font-semibold">Set Up Your Profile</h3>
              <p className="mt-2 text-muted-foreground">
                Add your fitness goals or list your PT services.
              </p>
            </div>
            <div className="text-center min-w-[80vw] snap-center sm:min-w-0">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white text-xl font-bold">
                3
              </div>
              <h3 className="mt-4 text-lg font-semibold">Start Your Journey</h3>
              <p className="mt-2 text-muted-foreground">
                Track your progress or start connecting with clients.
              </p>
            </div>
          </div>
          <SliderDots count={3} active={stepsSlider.active} />
          <div className="mt-8 sm:mt-12 text-center">
            <Link to={routes.register}>
              <Button size="lg" className="uppercase tracking-wider font-semibold">
                Create Your Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Section 6: Stats Bar */}
      <section className="bg-coral py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:gap-8 grid-cols-2 lg:grid-cols-4 text-center">
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-white">Free Forever</p>
              <p className="mt-1 text-sm text-white/70">For trainees</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-white">30-Day Pro Trial</p>
              <p className="mt-1 text-sm text-white/70">For trainers</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-white">8 Categories</p>
              <p className="mt-1 text-sm text-white/70">Weight, nutrition, activity & more</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-white">Real-Time Messaging</p>
              <p className="mt-1 text-sm text-white/70">Instant communication</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
