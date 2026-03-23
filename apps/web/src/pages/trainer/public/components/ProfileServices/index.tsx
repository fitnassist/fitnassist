import { Dumbbell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { getServiceLabel } from '../../public.utils';

interface ProfileServicesProps {
  services: string[];
}

export function ProfileServices({ services }: ProfileServicesProps) {
  if (!services || services.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Dumbbell className="h-5 w-5" />
          Services
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {services.map((service) => (
            <span
              key={service}
              className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
            >
              {getServiceLabel(service)}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
