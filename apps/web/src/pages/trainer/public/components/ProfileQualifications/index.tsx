import { Award } from 'lucide-react';
import { Badge, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { getQualificationLabel } from '../../public.utils';

interface ProfileQualificationsProps {
  qualifications: string[];
}

export const ProfileQualifications = ({ qualifications }: ProfileQualificationsProps) => {
  if (!qualifications || qualifications.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl font-light uppercase tracking-wider">
          <Award className="h-5 w-5" />
          Qualifications
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {qualifications.map((qualification) => (
            <Badge key={qualification} variant="secondary">
              {getQualificationLabel(qualification)}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
