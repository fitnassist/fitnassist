import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui';
import { PageLayout } from '@/components/layouts';
import { useAuth } from '@/hooks';
import { useTrainerBookings, useUpcomingBookings } from '@/api/booking';
import { trpc } from '@/lib/trpc';
import { routes } from '@/config/routes';
import { BookingCard } from './components';

const getDateRange = (view: 'week' | 'month') => {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  if (view === 'week') {
    end.setDate(end.getDate() + 7);
  } else {
    end.setMonth(end.getMonth() + 1);
  }

  return {
    startDate: start.toISOString().split('T')[0]!,
    endDate: end.toISOString().split('T')[0]!,
  };
};

export const BookingsPage = () => {
  const { isTrainer } = useAuth();
  const [view, setView] = useState<'week' | 'month'>('week');

  const { startDate, endDate } = useMemo(() => getDateRange(view), [view]);

  // Trainer uses date-range query, trainee uses upcoming
  const { data: trainerBookings, isLoading: trainerLoading } = useTrainerBookings(startDate, endDate);
  const { data: upcomingBookings, isLoading: upcomingLoading } = useUpcomingBookings();

  // Trainee: fetch connected trainers for "Book a Session" button
  const { data: myTrainers } = trpc.clientRoster.myTrainers.useQuery(undefined, {
    enabled: !isTrainer,
  });

  const bookings = isTrainer ? trainerBookings : upcomingBookings;
  const isLoading = isTrainer ? trainerLoading : upcomingLoading;

  // Group by date
  const groupedBookings = useMemo(() => {
    if (!bookings) return {};
    const groups: Record<string, typeof bookings> = {};
    for (const booking of bookings) {
      const dateKey = new Date(booking.date).toISOString().split('T')[0]!;
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(booking);
    }
    return groups;
  }, [bookings]);

  const sortedDates = Object.keys(groupedBookings).sort();

  return (
    <PageLayout>
      <PageLayout.Header
        title="Bookings"
        description={isTrainer ? 'Manage your upcoming sessions' : 'Your upcoming sessions'}
        icon={<Calendar className="h-6 w-6 sm:h-8 sm:w-8" />}
        action={
          isTrainer ? (
            <div className="flex items-center gap-2">
              <Button
                variant={view === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setView('week')}
              >
                Week
              </Button>
              <Button
                variant={view === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setView('month')}
              >
                Month
              </Button>
            </div>
          ) : myTrainers?.length === 1 && myTrainers[0]?.trainer ? (
            <Link to={routes.dashboardBookingsBook(myTrainers[0].trainer.id)}>
              <Button size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                Book a Session
              </Button>
            </Link>
          ) : myTrainers && myTrainers.length > 1 ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  Book a Session
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {myTrainers.filter((r) => r.trainer).map((r) => (
                  <DropdownMenuItem key={r.id} asChild>
                    <Link to={routes.dashboardBookingsBook(r.trainer!.id)}>
                      {r.trainer!.displayName}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : undefined
        }
      />
      <PageLayout.Content>
        {isLoading && (
          <div className="text-sm text-muted-foreground">Loading bookings...</div>
        )}

        {!isLoading && sortedDates.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium">No bookings</p>
            <p className="text-sm mb-4">
              {isTrainer
                ? 'No sessions scheduled for this period.'
                : 'You have no upcoming sessions.'}
            </p>
            {!isTrainer && myTrainers && myTrainers.length > 0 && (
              <div className="flex flex-col items-center gap-2">
                {myTrainers.length === 1 && myTrainers[0]?.trainer ? (
                  <Link to={routes.dashboardBookingsBook(myTrainers[0].trainer.id)}>
                    <Button>
                      <Calendar className="h-4 w-4 mr-2" />
                      Book a Session
                    </Button>
                  </Link>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button>
                        <Calendar className="h-4 w-4 mr-2" />
                        Book a Session
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {myTrainers.filter((r) => r.trainer).map((r) => (
                        <DropdownMenuItem key={r.id} asChild>
                          <Link to={routes.dashboardBookingsBook(r.trainer!.id)}>
                            {r.trainer!.displayName}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            )}
          </div>
        )}

        <div className="space-y-6">
          {sortedDates.map((dateKey) => (
            <div key={dateKey}>
              <h3 className="font-medium text-sm mb-2">
                {new Date(dateKey + 'T00:00:00').toLocaleDateString('en-GB', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </h3>
              <div className="space-y-2">
                {groupedBookings[dateKey]?.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} isTrainer={isTrainer} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </PageLayout.Content>
    </PageLayout>
  );
};

export default BookingsPage;
