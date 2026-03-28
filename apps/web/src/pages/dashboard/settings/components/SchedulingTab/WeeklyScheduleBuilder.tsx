import { useState } from 'react';
import { Clock, Plus, Trash2 } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardContent, Input } from '@/components/ui';
import { useWeeklyAvailability, useSetWeeklyAvailability } from '@/api/availability';
import { toast } from '@/lib/toast';
import type { DayOfWeek } from '@fitnassist/database';

const DAYS: { value: DayOfWeek; label: string; short: string }[] = [
  { value: 'MONDAY', label: 'Monday', short: 'Mon' },
  { value: 'TUESDAY', label: 'Tuesday', short: 'Tue' },
  { value: 'WEDNESDAY', label: 'Wednesday', short: 'Wed' },
  { value: 'THURSDAY', label: 'Thursday', short: 'Thu' },
  { value: 'FRIDAY', label: 'Friday', short: 'Fri' },
  { value: 'SATURDAY', label: 'Saturday', short: 'Sat' },
  { value: 'SUNDAY', label: 'Sunday', short: 'Sun' },
];

interface SlotEntry {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  sessionDurationMin: number;
}

export const WeeklyScheduleBuilder = () => {
  const { data: existing, isLoading } = useWeeklyAvailability();
  const setWeekly = useSetWeeklyAvailability();
  const [slots, setSlots] = useState<SlotEntry[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Initialize from server data
  if (existing && !initialized) {
    setSlots(
      existing.map((a) => ({
        dayOfWeek: a.dayOfWeek as DayOfWeek,
        startTime: a.startTime,
        endTime: a.endTime,
        sessionDurationMin: a.sessionDurationMin,
      }))
    );
    setInitialized(true);
  }

  const addSlot = (day: DayOfWeek) => {
    setSlots([...slots, { dayOfWeek: day, startTime: '09:00', endTime: '17:00', sessionDurationMin: 60 }]);
  };

  const removeSlot = (index: number) => {
    setSlots(slots.filter((_, i) => i !== index));
  };

  const updateSlot = (index: number, field: keyof SlotEntry, value: string | number) => {
    const updated = [...slots];
    updated[index] = { ...updated[index]!, [field]: value };
    setSlots(updated);
  };

  const handleSave = () => {
    setWeekly.mutate(
      { slots },
      { onSuccess: () => toast.success('Schedule saved') }
    );
  };

  const getSlotsForDay = (day: DayOfWeek) => {
    return slots
      .map((s, i) => ({ ...s, index: i }))
      .filter((s) => s.dayOfWeek === day);
  };

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading schedule...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="h-4 w-4" />
          Weekly Availability
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {DAYS.map((day) => {
          const daySlots = getSlotsForDay(day.value);
          return (
            <div key={day.value} className="border-b last:border-b-0 pb-3 last:pb-0">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm">{day.label}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => addSlot(day.value)}
                  className="h-7 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </Button>
              </div>
              {daySlots.length === 0 && (
                <p className="text-xs text-muted-foreground ml-1">No availability</p>
              )}
              {daySlots.map((slot) => (
                <div key={slot.index} className="flex items-center gap-2 ml-1 mb-1">
                  <Input
                    type="time"
                    value={slot.startTime}
                    onChange={(e) => updateSlot(slot.index, 'startTime', e.target.value)}
                    className="w-28 h-8 text-sm"
                  />
                  <span className="text-xs text-muted-foreground">to</span>
                  <Input
                    type="time"
                    value={slot.endTime}
                    onChange={(e) => updateSlot(slot.index, 'endTime', e.target.value)}
                    className="w-28 h-8 text-sm"
                  />
                  <Input
                    type="number"
                    value={slot.sessionDurationMin}
                    onChange={(e) => updateSlot(slot.index, 'sessionDurationMin', Number(e.target.value))}
                    className="w-20 h-8 text-sm"
                    min={15}
                    max={180}
                    step={15}
                  />
                  <span className="text-xs text-muted-foreground">min</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSlot(slot.index)}
                    className="h-7 w-7 p-0 text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          );
        })}

        <div className="flex items-center gap-3 pt-2">
          <Button onClick={handleSave} disabled={setWeekly.isPending}>
            {setWeekly.isPending ? 'Saving...' : 'Save Schedule'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
