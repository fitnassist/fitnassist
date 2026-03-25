import { BookHeart, UtensilsCrossed, Ruler, Activity } from "lucide-react";
import { PageLayout } from "@/components/layouts";
import { ResponsiveTabs, TabsContent } from "@/components/ui";
import { trpc } from "@/lib/trpc";
import { useTabParam } from "@/hooks";
import { useDiaryPage } from "./hooks";
import {
  DiaryDatePicker,
  WeightLogger,
  WaterTracker,
  MeasurementsLogger,
  MoodLogger,
  SleepLogger,
  FoodLogger,
  WorkoutLogger,
  StepsTracker,
  ProgressPhotos,
  ActivityLogger,
  PersonalBests,
  DiaryComments,
} from "./components";

const TAB_OPTIONS = [
  { value: "body", label: "Body", icon: <Ruler className="h-4 w-4" /> },
  {
    value: "nutrition",
    label: "Nutrition",
    icon: <UtensilsCrossed className="h-4 w-4" />,
  },
  {
    value: "activity",
    label: "Activity",
    icon: <Activity className="h-4 w-4" />,
  },
];

export const DiaryPage = () => {
  const {
    selectedDate,
    setSelectedDate,
    isLoading,
    entries,
    weightEntry,
    waterEntry,
    measurementEntry,
    moodEntry,
    sleepEntry,
    foodEntry,
    workoutEntries,
    activityEntries,
    stepsEntry,
    progressPhotoEntries,
  } = useDiaryPage();
  const { data: traineeProfile } = trpc.trainee.getMyProfile.useQuery();
  const unitPreference = traineeProfile?.unitPreference ?? "METRIC";
  const [activeTab, setActiveTab] = useTabParam("body");

  return (
    <PageLayout maxWidth="6xl">
      <PageLayout.Header
        title="Diary"
        icon={<BookHeart className="h-6 w-6 sm:h-8 sm:w-8" />}
      />

      <div className="mb-6">
        <DiaryDatePicker date={selectedDate} onChange={setSelectedDate} />
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : (
        <>
          <ResponsiveTabs
            value={activeTab}
            onValueChange={setActiveTab}
            options={TAB_OPTIONS}
            tabsListClassName="mb-6"
          >
            {/* Body: weight, measurements, progress photos */}
            <TabsContent value="body">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <WeightLogger
                  date={selectedDate}
                  entry={weightEntry}
                  unitPreference={unitPreference}
                />
                <MeasurementsLogger
                  date={selectedDate}
                  entry={measurementEntry}
                  unitPreference={unitPreference}
                />
                <StepsTracker date={selectedDate} entry={stepsEntry} />
              </div>
              <div className="mt-4">
                <ProgressPhotos
                  date={selectedDate}
                  entries={progressPhotoEntries}
                />
              </div>
            </TabsContent>

            {/* Nutrition: food + water */}
            <TabsContent value="nutrition">
              <div className="grid items-start gap-4 lg:grid-cols-[1fr_320px]">
                <FoodLogger date={selectedDate} entry={foodEntry} />
                <WaterTracker
                  date={selectedDate}
                  entry={waterEntry}
                  unitPreference={unitPreference}
                />
              </div>
            </TabsContent>

            {/* Activity: workouts, activities, mood, sleep */}
            <TabsContent value="activity">
              <div className="grid gap-4 sm:grid-cols-2">
                <ActivityLogger date={selectedDate} entries={activityEntries} />
                <MoodLogger date={selectedDate} entry={moodEntry} />
                <SleepLogger date={selectedDate} entry={sleepEntry} />
              </div>
              <div className="mt-4">
                <WorkoutLogger date={selectedDate} entries={workoutEntries} />
              </div>
              <div className="mt-4">
                <PersonalBests />
              </div>
            </TabsContent>
          </ResponsiveTabs>

          <DiaryComments entries={entries} />
        </>
      )}
    </PageLayout>
  );
};

export default DiaryPage;
