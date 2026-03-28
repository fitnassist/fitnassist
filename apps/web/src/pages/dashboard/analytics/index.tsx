import { useState } from 'react';
import { Eye, Calendar, Users, Target, PoundSterling } from 'lucide-react';
import { Card, CardContent, ResponsiveTabs, TabsContent } from '@/components/ui';
import { UpgradePrompt } from '@/components/UpgradePrompt';
import { useTierAccess } from '@/hooks/useFeatureAccess';
import { useDashboardStats } from '@/api/analytics';
import {
  ProfileViewsChart,
  BookingAnalytics,
  ClientAdherence,
  GoalAnalytics,
  RevenueAnalytics,
} from './components';

const TAB_OPTIONS = [
  { value: 'views', label: 'Profile Views', icon: <Eye className="h-4 w-4" /> },
  { value: 'bookings', label: 'Bookings', icon: <Calendar className="h-4 w-4" /> },
  { value: 'adherence', label: 'Client Adherence', icon: <Users className="h-4 w-4" /> },
  { value: 'goals', label: 'Goals', icon: <Target className="h-4 w-4" /> },
  { value: 'revenue', label: 'Revenue', icon: <PoundSterling className="h-4 w-4" /> },
];

export const AnalyticsPage = () => {
  const { hasAccess, isLoading: tierLoading } = useTierAccess('ELITE');
  const [activeTab, setActiveTab] = useState('views');

  if (tierLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="h-96 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <h1 className="text-2xl font-bold mb-6">Analytics</h1>
        <UpgradePrompt requiredTier="ELITE" featureName="Advanced Analytics" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <h1 className="text-2xl font-bold">Analytics</h1>

      <SummaryCards />

      <ResponsiveTabs
        value={activeTab}
        onValueChange={setActiveTab}
        options={TAB_OPTIONS}
      >
        <TabsContent value="views">
          <ProfileViewsChart />
        </TabsContent>
        <TabsContent value="bookings">
          <BookingAnalytics />
        </TabsContent>
        <TabsContent value="adherence">
          <ClientAdherence />
        </TabsContent>
        <TabsContent value="goals">
          <GoalAnalytics />
        </TabsContent>
        <TabsContent value="revenue">
          <RevenueAnalytics />
        </TabsContent>
      </ResponsiveTabs>
    </div>
  );
};

const SummaryCards = () => {
  const { data, isLoading } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="h-10 animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const stats = [
    { label: 'Profile Views (30d)', value: data?.profileViews30d ?? 0 },
    { label: 'Bookings (30d)', value: data?.bookings30d ?? 0 },
    { label: 'Active Clients', value: data?.activeClients ?? 0 },
    { label: 'Completion Rate', value: `${data?.completionRate ?? 0}%` },
  ];

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="text-2xl font-bold">{stat.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
