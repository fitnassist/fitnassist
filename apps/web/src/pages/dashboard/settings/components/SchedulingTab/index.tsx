import { WeeklyScheduleBuilder } from './WeeklyScheduleBuilder';
import { SessionLocationList } from './SessionLocationList';
import { TravelSettings } from './TravelSettings';
import { VideoSettings } from './VideoSettings';
import { DateOverrides } from './DateOverrides';
import { PaymentSettings } from './PaymentSettings';

export const SchedulingTab = () => {
  return (
    <div className="space-y-6">
      <WeeklyScheduleBuilder />
      <SessionLocationList />
      <TravelSettings />
      <VideoSettings />
      <PaymentSettings />
      <DateOverrides />
    </div>
  );
};
