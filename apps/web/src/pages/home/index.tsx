import { Link } from 'react-router-dom';
import { MapPin, CheckCircle, MessageCircle } from 'lucide-react';
import { routes } from '@/config/routes';
import { Button, Card, CardContent } from '@/components/ui';
import { HeroBanner } from '@/components/HeroBanner';

export const HomePage = () => {
  return (
    <div>
      {/* Hero Section */}
      <HeroBanner title="Welcome to Fitness" imageUrl="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920&q=80">
        <p className="mx-auto mt-6 max-w-2xl text-lg text-white/70">
          Connect with qualified personal trainers in your area. Whether you're
          looking to build muscle, lose weight, or improve your overall fitness,
          we'll help you find the right trainer for your goals.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
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

      {/* Features Section */}
      <section className="py-12 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-light text-foreground uppercase tracking-wide">Why Fitnassist?</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Everything you need to find and connect with the best personal trainers
            </p>
          </div>
          <div className="mt-8 sm:mt-16 grid gap-4 sm:gap-8 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">Location-Based Search</h3>
                <p className="mt-2 text-muted-foreground">
                  Find trainers near you with our map-based search. Filter by distance and location.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <CheckCircle className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">Verified Trainers</h3>
                <p className="mt-2 text-muted-foreground">
                  All trainers display their qualifications and certifications for your peace of mind.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <MessageCircle className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">Easy Contact</h3>
                <p className="mt-2 text-muted-foreground">
                  Reach out to trainers directly through our platform. Request callbacks or send messages.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
