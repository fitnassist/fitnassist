import { Link } from 'react-router-dom';
import { ClipboardCheck, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui';
import { routes } from '@/config/routes';
import { useMyPendingOnboarding } from '@/api/onboarding';

export const OnboardingBanner = () => {
  const { data: pending } = useMyPendingOnboarding();

  if (!pending?.length) return null;

  return (
    <div className="space-y-3 mb-6">
      {pending.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between gap-4 p-4 border rounded-lg bg-blue-50 border-blue-200"
        >
          <div className="flex items-center gap-3 min-w-0">
            <ClipboardCheck className="h-5 w-5 text-blue-600 flex-shrink-0" />
            <div className="min-w-0">
              <p className="font-medium text-blue-900">
                Complete onboarding for {item.clientRoster.trainer.displayName}
              </p>
              <p className="text-sm text-blue-700">{item.template.name}</p>
            </div>
          </div>
          <Link to={routes.dashboardOnboardingComplete(item.id)}>
            <Button size="sm" variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100">
              Complete
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      ))}
    </div>
  );
};
