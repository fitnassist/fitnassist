import { useParams } from 'react-router-dom';
import { useTrainerByHandle } from '@/api/trainer';
import {
  ProfileHero,
  ProfileBio,
  ProfileServices,
  ProfileQualifications,
  ProfileLocation,
  ProfileContact,
  ProfileGallery,
  ProfileVideoIntro,
  ProfileNotFound,
  ProfileSkeleton,
  FollowButton,
  ReviewsSection,
  ProfileBlogPosts,
  ProfileProducts,
} from './components';

export function TrainerPublicProfilePage() {
  const { handle } = useParams<{ handle: string }>();
  const { data: trainer, isLoading, isError } = useTrainerByHandle(handle || '');

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (isError || !trainer) {
    return <ProfileNotFound />;
  }

  return (
    <div className="min-h-screen">
      <ProfileHero trainer={trainer} />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <FollowButton trainerUserId={trainer.userId} />
        </div>
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            <ProfileBio bio={trainer.bio} />
            {trainer.videoIntroUrl && (
              <ProfileVideoIntro videoUrl={trainer.videoIntroUrl} />
            )}
            {trainer.galleryImages && trainer.galleryImages.length > 0 && (
              <ProfileGallery images={trainer.galleryImages} />
            )}
            <ProfileServices services={trainer.services} />
            <ProfileQualifications qualifications={trainer.qualifications} />
            <ReviewsSection
              trainerId={trainer.id}
              ratingAverage={trainer.ratingAverage ?? 0}
              ratingCount={trainer.ratingCount ?? 0}
            />
            {trainer.website?.subdomain && trainer.website.status === 'PUBLISHED' && (
              <ProfileProducts
                trainerId={trainer.id}
                shopUrl={`https://${trainer.website.subdomain}.sites.fitnassist.co/shop`}
              />
            )}
            {trainer.website?.subdomain && trainer.website.status === 'PUBLISHED' && (
              <ProfileBlogPosts subdomain={trainer.website.subdomain} />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <ProfileLocation
              postcode={trainer.postcode}
              city={trainer.city}
              latitude={trainer.latitude}
              longitude={trainer.longitude}
              travelOption={trainer.travelOption}
            />
            <ProfileContact
              trainerId={trainer.id}
              trainerName={trainer.displayName}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export { TrainerPublicProfilePage as default };
