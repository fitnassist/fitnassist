import { useParams } from 'react-router-dom';
import { SiteRenderer } from './index';

export const SiteRoutePage = () => {
  const { handle } = useParams<{ handle: string }>();

  if (!handle) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">No site handle provided.</p>
      </div>
    );
  }

  return <SiteRenderer handle={handle} />;
};
