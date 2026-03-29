import { useState } from 'react';
import { Moon, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, ConfirmDialog, SourceBadge } from '@/components/ui';
import { useLogSleep, useDeleteDiaryEntry } from '@/api/diary';
import { getSleepQualityLabel } from '../../diary.utils';

interface SleepLoggerProps {
  date: string;
  entry?: {
    id: string;
    sleepEntry?: { hoursSlept: number; quality: number; source?: string } | null;
  } | null;
}

export const SleepLogger = ({ date, entry }: SleepLoggerProps) => {
  const [hours, setHours] = useState('');
  const [quality, setQuality] = useState(0);
  const [showDelete, setShowDelete] = useState(false);
  const logSleep = useLogSleep();
  const deleteEntry = useDeleteDiaryEntry();

  const currentSleep = entry?.sleepEntry;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numHours = parseFloat(hours);
    if (isNaN(numHours) || numHours < 0 || numHours > 24 || quality < 1) return;
    logSleep.mutate(
      { date, hoursSlept: numHours, quality },
      { onSuccess: () => { setHours(''); setQuality(0); } }
    );
  };

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Moon className="h-4 w-4 text-indigo-500" />
            Sleep
            <SourceBadge source={entry?.sleepEntry?.source ?? ''} />
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
                title="Delete sleep entry?"
                description="This will remove the sleep entry for this date."
                onConfirm={() => deleteEntry.mutate({ id: entry.id })}
                isLoading={deleteEntry.isPending}
              />
            </>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-end">
        {currentSleep && (
          <div className="mb-3">
            <p className="text-2xl font-semibold">{currentSleep.hoursSlept}h</p>
            <p className="text-sm text-muted-foreground">
              Quality: {getSleepQualityLabel(currentSleep.quality)}
            </p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            type="number"
            step="0.5"
            min="0"
            max="24"
            placeholder="Hours slept"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
          />
          <div>
            <p className="mb-1.5 text-sm text-muted-foreground">
              Quality: {quality > 0 ? getSleepQualityLabel(quality) : 'Select'}
            </p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((q) => (
                <Button
                  key={q}
                  type="button"
                  variant={quality === q ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1"
                  onClick={() => setQuality(q)}
                >
                  {q}
                </Button>
              ))}
            </div>
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={!hours || quality < 1 || logSleep.isPending}
          >
            {currentSleep ? 'Update' : 'Log'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
