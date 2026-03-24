import { Link } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui';
import { routes } from '@/config/routes';

export const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center space-y-4">
        <FileQuestion className="h-16 w-16 text-muted-foreground mx-auto" />
        <h1 className="text-4xl font-bold">404</h1>
        <p className="text-muted-foreground text-lg">
          The page you're looking for doesn't exist.
        </p>
        <div className="flex gap-3 justify-center pt-2">
          <Button variant="outline" asChild>
            <Link to={routes.home}>Home</Link>
          </Button>
          <Button asChild>
            <Link to={routes.dashboard}>Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};
