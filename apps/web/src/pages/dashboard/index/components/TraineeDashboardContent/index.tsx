import { Link } from 'react-router-dom';
import { Search, MessageCircle, User, BookHeart, Target, ClipboardList } from 'lucide-react';
import { routes } from '@/config/routes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { trpc } from '@/lib/trpc';
import { TodaySummary } from './TodaySummary';
import { ActiveGoalsSummary } from './ActiveGoalsSummary';
import { ProgressPhotoCompare } from './ProgressPhotoCompare';
import { Trends } from '@/pages/dashboard/diary/components';

interface TraineeDashboardContentProps {
  badgeCounts: {
    messages: number;
    requests: number;
  };
}

const quickActions = [
  { label: 'Diary', href: routes.dashboardDiary, icon: BookHeart, color: 'text-rose-500', description: 'Log food, weight & more' },
  { label: 'Goals', href: routes.dashboardGoals, icon: Target, color: 'text-blue-500', description: 'Track your progress' },
  { label: 'My Plans', href: routes.dashboardMyPlans, icon: ClipboardList, color: 'text-emerald-500', description: 'View assigned plans' },
  { label: 'Find Trainers', href: routes.trainers, icon: Search, color: 'text-violet-500', description: 'Browse trainers near you' },
  { label: 'My Contacts', href: routes.dashboardContacts, icon: User, color: 'text-amber-500', description: 'Your trainer connections' },
];

export const TraineeDashboardContent = ({
  badgeCounts,
}: TraineeDashboardContentProps) => {
  const { data: traineeProfile } = trpc.trainee.getMyProfile.useQuery();
  const unitPreference = traineeProfile?.unitPreference ?? 'METRIC';

  return (
    <div className="space-y-6">
      {/* Summary row */}
      <div className="grid gap-4 sm:grid-cols-2">
        <TodaySummary />
        <ActiveGoalsSummary />
      </div>

      {/* Trends */}
      <Trends unitPreference={unitPreference} />

      {/* Progress Photo Compare */}
      <ProgressPhotoCompare />

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {quickActions.map(({ label, href, icon: Icon, color, description }) => (
              <Link
                key={label}
                to={href}
                className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
              >
                <div className="rounded-full bg-muted p-2">
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>
                <div>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
              </Link>
            ))}
            <Link
              to={routes.dashboardMessages}
              className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
            >
              <div className="relative rounded-full bg-muted p-2">
                <MessageCircle className="h-4 w-4 text-sky-500" />
                {badgeCounts.messages > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                    {badgeCounts.messages > 9 ? '9+' : badgeCounts.messages}
                  </span>
                )}
              </div>
              <div>
                <p className="text-sm font-medium">Messages</p>
                <p className="text-xs text-muted-foreground">Chat with your trainers</p>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
