import { useState } from 'react';
import { SmilePlus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, Textarea, ConfirmDialog } from '@/components/ui';
import { useLogMood, useDeleteDiaryEntry } from '@/api/diary';
import { MOOD_OPTIONS, getMoodEmoji, getMoodLabel } from '../../diary.utils';

interface MoodLoggerProps {
  date: string;
  entry?: {
    id: string;
    moodEntry?: { level: string; notes?: string | null } | null;
  } | null;
}

export const MoodLogger = ({ date, entry }: MoodLoggerProps) => {
  const [notes, setNotes] = useState('');
  const [showDelete, setShowDelete] = useState(false);
  const logMood = useLogMood();
  const deleteEntry = useDeleteDiaryEntry();

  const currentMood = entry?.moodEntry;

  const handleSelect = (level: typeof MOOD_OPTIONS[number]['value']) => {
    logMood.mutate({ date, level, notes: notes || undefined });
  };

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <SmilePlus className="h-4 w-4 text-amber-500" />
            Mood
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
                title="Delete mood entry?"
                description="This will remove the mood entry for this date."
                onConfirm={() => deleteEntry.mutate({ id: entry.id })}
                isLoading={deleteEntry.isPending}
              />
            </>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-end">
        {currentMood && (
          <div className="mb-3">
            <p className="text-2xl">{getMoodEmoji(currentMood.level)} {getMoodLabel(currentMood.level)}</p>
            {currentMood.notes && (
              <p className="mt-1 text-sm text-muted-foreground">{currentMood.notes}</p>
            )}
          </div>
        )}
        <div className="flex gap-1">
          {MOOD_OPTIONS.map((mood) => (
            <Button
              key={mood.value}
              variant={currentMood?.level === mood.value ? 'default' : 'outline'}
              size="sm"
              className="flex-1 text-lg"
              onClick={() => handleSelect(mood.value)}
              disabled={logMood.isPending}
              title={mood.label}
            >
              {mood.emoji}
            </Button>
          ))}
        </div>
        {!currentMood && (
          <Textarea
            placeholder="How are you feeling? (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-2"
            rows={2}
          />
        )}
      </CardContent>
    </Card>
  );
};
