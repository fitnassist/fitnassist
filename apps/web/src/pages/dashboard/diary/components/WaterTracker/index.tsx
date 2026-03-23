import { Droplets, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, ConfirmDialog } from '@/components/ui';
import { useLogWater, useDeleteDiaryEntry } from '@/api/diary';
import { formatWater, WATER_PRESETS } from '../../diary.utils';
import { useState } from 'react';

interface WaterTrackerProps {
  date: string;
  entry?: {
    id: string;
    waterEntry?: { totalMl: number } | null;
  } | null;
  unitPreference: 'METRIC' | 'IMPERIAL';
}

export const WaterTracker = ({ date, entry, unitPreference }: WaterTrackerProps) => {
  const [showDelete, setShowDelete] = useState(false);
  const logWater = useLogWater();
  const deleteEntry = useDeleteDiaryEntry();

  const currentMl = entry?.waterEntry?.totalMl ?? 0;
  const targetMl = 2000; // TODO: from trainee profile
  const percentage = Math.min(Math.round((currentMl / targetMl) * 100), 100);

  const handleAdd = (ml: number) => {
    logWater.mutate({ date, totalMl: currentMl + ml });
  };

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Droplets className="h-4 w-4 text-cyan-500" />
            Water
          </CardTitle>
          {entry && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => setShowDelete(true)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
              <ConfirmDialog
                open={showDelete}
                onOpenChange={setShowDelete}
                title="Delete water entry?"
                description="This will reset water intake for this date."
                onConfirm={() => deleteEntry.mutate({ id: entry.id })}
                isLoading={deleteEntry.isPending}
              />
            </>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-end">
        <div className="mb-3">
          <p className="text-2xl font-semibold">{formatWater(currentMl, unitPreference)}</p>
          <div className="mt-2 h-2 w-full rounded-full bg-muted">
            <div
              className="h-2 rounded-full bg-cyan-500 transition-all"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {percentage}% of {formatWater(targetMl, unitPreference)} target
          </p>
        </div>
        <div className="flex gap-2">
          {WATER_PRESETS.map((preset) => (
            <Button
              key={preset.label}
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => handleAdd(preset.ml)}
              disabled={logWater.isPending}
            >
              +{preset.ml}ml
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
