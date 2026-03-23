import { TraineeProfileForm } from './components';

export const TraineeProfileCreatePage = () => {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-4 sm:py-8 pb-24">
      <div className="mb-4 sm:mb-8 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold">Create Your Profile</h1>
        <p className="mt-2 text-muted-foreground">
          Help trainers understand your goals and fitness level. All fields are optional.
        </p>
      </div>
      <TraineeProfileForm />
    </div>
  );
};
