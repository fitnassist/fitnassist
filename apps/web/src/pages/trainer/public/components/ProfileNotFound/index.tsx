import { Link } from 'react-router-dom';
import { UserX } from 'lucide-react';
import { Button } from '@/components/ui';
import { routes } from '@/config/routes';

export function ProfileNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <UserX className="h-16 w-16 text-muted-foreground mb-6" />
      <h1 className="text-2xl font-bold mb-2">Profile Not Found</h1>
      <p className="text-muted-foreground mb-6 max-w-md">
        This trainer profile doesn't exist or isn't available. They may have made their profile
        private or the link may be incorrect.
      </p>
      <Button asChild>
        <Link to={routes.home}>Go to Homepage</Link>
      </Button>
    </div>
  );
}
