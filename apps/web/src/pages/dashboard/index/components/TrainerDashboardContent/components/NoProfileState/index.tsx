import { Link } from 'react-router-dom';
import { routes } from '@/config/routes';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';

export const NoProfileState = () => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle>Complete Your Profile</CardTitle>
        <CardDescription>Set up your trainer profile to start attracting clients.</CardDescription>
      </CardHeader>
      <CardContent>
        <Link to={routes.trainerProfileCreate}>
          <Button>Create Profile</Button>
        </Link>
      </CardContent>
    </Card>
  </div>
);
