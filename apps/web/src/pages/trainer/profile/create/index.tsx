import { ProfileWizard } from './components';

export function ProfileCreatePage() {
  return (
    <div className="container py-4 sm:py-8">
      <div className="mb-4 sm:mb-8 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold">Create Your Trainer Profile</h1>
        <p className="mt-2 text-muted-foreground">Let's get you set up so clients can find you</p>
      </div>
      <ProfileWizard />
    </div>
  );
}
