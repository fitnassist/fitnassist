import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';

interface ProfileBioProps {
  bio: string | null;
}

export function ProfileBio({ bio }: ProfileBioProps) {
  if (!bio) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl font-light uppercase tracking-wider">About</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground whitespace-pre-wrap">{bio}</p>
      </CardContent>
    </Card>
  );
}
