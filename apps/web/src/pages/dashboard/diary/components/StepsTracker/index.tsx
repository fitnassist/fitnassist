import { Footprints, Trash2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  ConfirmDialog,
  SourceBadge,
} from '@/components/ui';
import { useLogSteps, useDeleteDiaryEntry } from '@/api/diary';
import { STEPS_PRESETS, formatSteps } from '../../diary.utils';
import { useState } from 'react';

interface StepsTrackerProps {
  date: string;
  entry?: {
    id: string;
    stepsEntry?: { totalSteps: number; source?: string } | null;
  } | null;
}

export const StepsTracker = ({ date, entry }: StepsTrackerProps) => {
  const [showDelete, setShowDelete] = useState(false);
  const logSteps = useLogSteps();
  const deleteEntry = useDeleteDiaryEntry();

  const currentSteps = entry?.stepsEntry?.totalSteps ?? 0;
  const targetSteps = 10000;
  const percentage = Math.min(Math.round((currentSteps / targetSteps) * 100), 100);

  const handleAdd = (steps: number) => {
    logSteps.mutate({ date, totalSteps: currentSteps + steps });
  };

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Footprints className="h-4 w-4 text-green-500" />
            Steps
            <SourceBadge source={entry?.stepsEntry?.source ?? ''} />
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
                title="Delete steps entry?"
                description="This will reset step count for this date."
                onConfirm={() => deleteEntry.mutate({ id: entry.id })}
                isLoading={deleteEntry.isPending}
              />
            </>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-end">
        <div className="mb-3">
          <p className="text-2xl font-semibold">{currentSteps.toLocaleString()}</p>
          <div className="mt-2 h-2 w-full rounded-full bg-muted">
            <div
              className="h-2 rounded-full bg-green-500 transition-all"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {percentage}% of {formatSteps(targetSteps)} target
          </p>
        </div>
        <div className="flex gap-2">
          {STEPS_PRESETS.map((preset) => (
            <Button
              key={preset.label}
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => handleAdd(preset.steps)}
              disabled={logSteps.isPending}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
