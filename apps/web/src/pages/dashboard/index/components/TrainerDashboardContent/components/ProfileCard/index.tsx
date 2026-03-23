import { Link } from "react-router-dom";
import { Edit, Eye, MapPin, CheckCircle, Clock } from "lucide-react";
import { routes } from "@/config/routes";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/ui";
import { getInitials } from "../../TrainerDashboardContent.utils";
import type { TrainerProfile } from "../../TrainerDashboardContent.types";

interface ProfileCardProps {
  profile: TrainerProfile;
}

export const ProfileCard = ({ profile }: ProfileCardProps) => {
  const initials = getInitials(profile.displayName);

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <Avatar className="h-12 w-12 sm:h-16 sm:w-16 flex-shrink-0">
              {profile.profileImageUrl && (
                <AvatarImage
                  src={profile.profileImageUrl}
                  alt={profile.displayName}
                />
              )}
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <CardTitle className="flex items-center gap-2 flex-wrap">
                {profile.displayName}
                {profile.isPublished ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                    <CheckCircle className="h-3 w-3" />
                    Published
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                    <Clock className="h-3 w-3" />
                    Draft
                  </span>
                )}
              </CardTitle>
              <CardDescription className="mt-1 truncate">
                <span className="text-muted-foreground">
                  fitnassist.com/trainers/
                </span>
                <span className="font-medium text-foreground">
                  {profile.handle}
                </span>
              </CardDescription>
              {profile.city && profile.postcode && (
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  {profile.city}, {profile.postcode}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Link to={routes.trainerPublicProfile(profile.handle)}>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">View Profile</span>
              </Button>
            </Link>
            <Link to={routes.trainerProfileEdit}>
              <Button size="sm">
                <Edit className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Edit Profile</span>
              </Button>
            </Link>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-sm font-medium text-muted-foreground">
              Services
            </p>
            <p className="text-2xl font-bold">
              {profile.services?.length || 0}
            </p>
          </div>
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-sm font-medium text-muted-foreground">
              Qualifications
            </p>
            <p className="text-2xl font-bold">
              {profile.qualifications?.length || 0}
            </p>
          </div>
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-sm font-medium text-muted-foreground">
              Profile Views
            </p>
            <p className="text-2xl font-bold">-</p>
            <p className="text-xs text-muted-foreground">Coming soon</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
