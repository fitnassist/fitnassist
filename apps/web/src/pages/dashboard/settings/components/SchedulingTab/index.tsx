import { WeeklyScheduleBuilder } from './WeeklyScheduleBuilder';
import { SessionLocationList } from './SessionLocationList';
import { TravelSettings } from './TravelSettings';
import { DateOverrides } from './DateOverrides';

export const SchedulingTab = () => {
  return (
    <div className="space-y-6">
      <WeeklyScheduleBuilder />
      <SessionLocationList />
      <TravelSettings />
      <DateOverrides />
    </div>
  );
};
