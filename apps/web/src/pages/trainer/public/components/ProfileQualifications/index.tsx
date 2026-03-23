import { Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { getQualificationLabel } from '../../public.utils';

interface ProfileQualificationsProps {
  qualifications: string[];
}

export function ProfileQualifications({ qualifications }: ProfileQualificationsProps) {
  if (!qualifications || qualifications.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5" />
          Qualifications
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {qualifications.map((qualification) => (
            <span
              key={qualification}
              className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground"
            >
              {getQualificationLabel(qualification)}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
