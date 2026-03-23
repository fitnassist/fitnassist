import { Link } from 'react-router-dom';
import { Edit, Eye, MessageCircle, Phone } from 'lucide-react';
import { routes } from '@/config/routes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import type { BadgeCounts } from '@/components/layouts';

interface QuickActionsProps {
  profileHandle: string;
  badgeCounts: BadgeCounts;
}

export const QuickActions = ({ profileHandle, badgeCounts }: QuickActionsProps) => (
  <Card>
    <CardHeader>
      <CardTitle>Quick Actions</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid gap-4 md:grid-cols-2">
        <Link
          to={routes.trainerProfileEdit}
          className="rounded-lg border p-4 hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <Edit className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium">Update Profile</p>
              <p className="text-sm text-muted-foreground">
                Edit your bio, services, and qualifications
              </p>
            </div>
          </div>
        </Link>
        <Link
          to={routes.trainerPublicProfile(profileHandle)}
          className="rounded-lg border p-4 hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <Eye className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium">Preview Profile</p>
              <p className="text-sm text-muted-foreground">
                See how clients will view your profile
              </p>
            </div>
          </div>
        </Link>
        <Link
          to={routes.dashboardRequests}
          className="rounded-lg border p-4 hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="relative rounded-full bg-primary/10 p-2">
              <Phone className="h-4 w-4 text-primary" />
              {badgeCounts.requests > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-primary text-primary-foreground rounded-full text-[10px] flex items-center justify-center font-medium">
                  {badgeCounts.requests > 9 ? '9+' : badgeCounts.requests}
                </span>
              )}
            </div>
            <div>
              <p className="font-medium">View Requests</p>
              <p className="text-sm text-muted-foreground">
                Manage connection and callback requests
              </p>
            </div>
          </div>
        </Link>
        <Link
          to={routes.dashboardMessages}
          className="rounded-lg border p-4 hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="relative rounded-full bg-primary/10 p-2">
              <MessageCircle className="h-4 w-4 text-primary" />
              {badgeCounts.messages > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-primary text-primary-foreground rounded-full text-[10px] flex items-center justify-center font-medium">
                  {badgeCounts.messages > 9 ? '9+' : badgeCounts.messages}
                </span>
              )}
            </div>
            <div>
              <p className="font-medium">Messages</p>
              <p className="text-sm text-muted-foreground">
                Chat with your connected trainees
              </p>
            </div>
          </div>
        </Link>
      </div>
    </CardContent>
  </Card>
);
