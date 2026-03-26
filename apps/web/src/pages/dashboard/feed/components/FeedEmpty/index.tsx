import { Rss, UserPlus, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui';
import { routes } from '@/config/routes';

export const FeedEmpty = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-full bg-muted p-4">
        <Rss className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-medium">Your feed is empty</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Follow trainers and add friends to see their posts and updates here.
      </p>
      <div className="mt-6 flex gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link to={routes.trainers}>
            <UserPlus className="mr-2 h-4 w-4" />
            Find Trainers
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link to={routes.dashboardFriends}>
            <Heart className="mr-2 h-4 w-4" />
            Friends
          </Link>
        </Button>
      </div>
    </div>
  );
};
