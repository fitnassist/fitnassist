import { Dumbbell } from 'lucide-react';
import { Badge, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { getServiceLabel } from '../../public.utils';

interface ProfileServicesProps {
  services: string[];
}

export const ProfileServices = ({ services }: ProfileServicesProps) => {
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
            <Badge key={service}>
              {getServiceLabel(service)}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
