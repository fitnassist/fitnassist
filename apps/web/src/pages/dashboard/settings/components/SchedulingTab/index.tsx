import { WeeklyScheduleBuilder } from './WeeklyScheduleBuilder';
import { SessionLocationList } from './SessionLocationList';
import { TravelSettings } from './TravelSettings';
import { VideoSettings } from './VideoSettings';
import { DateOverrides } from './DateOverrides';

export const SchedulingTab = () => {
  return (
    <div className="space-y-6">
      <WeeklyScheduleBuilder />
      <SessionLocationList />
      <TravelSettings />
      <VideoSettings />
      <DateOverrides />
    </div>
  );
};
