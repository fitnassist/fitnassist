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
        <CardTitle>About</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground whitespace-pre-wrap">{bio}</p>
      </CardContent>
    </Card>
  );
}
