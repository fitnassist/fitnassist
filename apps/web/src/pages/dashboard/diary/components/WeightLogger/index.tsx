import { useState } from 'react';
import { Scale, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, ConfirmDialog } from '@/components/ui';
import { useLogWeight, useDeleteDiaryEntry } from '@/api/diary';
import { formatWeight } from '../../diary.utils';

interface WeightLoggerProps {
  date: string;
  entry?: {
    id: string;
    weightEntry?: { weightKg: number } | null;
  } | null;
  unitPreference: 'METRIC' | 'IMPERIAL';
}

export const WeightLogger = ({ date, entry, unitPreference }: WeightLoggerProps) => {
  const [value, setValue] = useState('');
  const [showDelete, setShowDelete] = useState(false);
  const logWeight = useLogWeight();
  const deleteEntry = useDeleteDiaryEntry();

  const currentWeight = entry?.weightEntry?.weightKg;
  const isImperial = unitPreference === 'IMPERIAL';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) return;

    const weightKg = isImperial ? numValue / 2.20462 : numValue;
    logWeight.mutate(
      { date, weightKg: Math.round(weightKg * 10) / 10 },
      { onSuccess: () => setValue('') }
    );
  };

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Scale className="h-4 w-4 text-blue-500" />
            Weight
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
                title="Delete weight entry?"
                description="This will remove the weight entry for this date."
                onConfirm={() => deleteEntry.mutate({ id: entry.id })}
                isLoading={deleteEntry.isPending}
              />
            </>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-end">
        {currentWeight !== undefined && currentWeight !== null && (
          <p className="mb-3 text-2xl font-semibold">
            {formatWeight(currentWeight, unitPreference)}
          </p>
        )}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            type="number"
            step="0.1"
            min="0"
            placeholder={isImperial ? 'Weight (lbs)' : 'Weight (kg)'}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="flex-1"
          />
          <Button
            type="submit"
            size="sm"
            disabled={!value || logWeight.isPending}
          >
            {currentWeight ? 'Update' : 'Log'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
