import { useState } from 'react';
import { Ruler, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  ConfirmDialog,
} from '@/components/ui';
import { useLogMeasurements, useDeleteDiaryEntry } from '@/api/diary';
import { formatMeasurement } from '../../diary.utils';

interface MeasurementsLoggerProps {
  date: string;
  entry?: {
    id: string;
    measurementEntry?: {
      chestCm: number | null;
      waistCm: number | null;
      hipsCm: number | null;
      bicepCm: number | null;
      thighCm: number | null;
      calfCm: number | null;
      neckCm: number | null;
    } | null;
  } | null;
  unitPreference: 'METRIC' | 'IMPERIAL';
}

const FIELDS = [
  { key: 'chestCm', label: 'Chest' },
  { key: 'waistCm', label: 'Waist' },
  { key: 'hipsCm', label: 'Hips' },
  { key: 'bicepCm', label: 'Bicep' },
  { key: 'thighCm', label: 'Thigh' },
  { key: 'calfCm', label: 'Calf' },
  { key: 'neckCm', label: 'Neck' },
] as const;

export const MeasurementsLogger = ({ date, entry, unitPreference }: MeasurementsLoggerProps) => {
  const [expanded, setExpanded] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const logMeasurements = useLogMeasurements();
  const deleteEntry = useDeleteDiaryEntry();

  const currentMeasurements = entry?.measurementEntry;
  const isImperial = unitPreference === 'IMPERIAL';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: Record<string, number | null> = {};
    for (const field of FIELDS) {
      const val = values[field.key];
      if (val) {
        const numVal = parseFloat(val);
        if (!isNaN(numVal)) {
          data[field.key] = isImperial ? numVal * 2.54 : numVal;
        }
      }
    }
    if (Object.keys(data).length === 0) return;
    logMeasurements.mutate(
      { date, ...data },
      {
        onSuccess: () => {
          setValues({});
          setExpanded(false);
        },
      },
    );
  };

  const filledCount = currentMeasurements
    ? FIELDS.filter((f) => currentMeasurements[f.key] != null).length
    : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Ruler className="h-4 w-4 text-green-500" />
            Measurements
            {filledCount > 0 && (
              <span className="text-xs font-normal text-muted-foreground">
                ({filledCount} logged)
              </span>
            )}
          </CardTitle>
          <div className="flex items-center gap-1">
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
                  title="Delete measurements?"
                  description="This will remove all measurements for this date."
                  onConfirm={() => deleteEntry.mutate({ id: entry.id })}
                  isLoading={deleteEntry.isPending}
                />
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      {!expanded && currentMeasurements && (
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {FIELDS.map(({ key, label }) => {
              const val = currentMeasurements[key];
              if (val == null) return null;
              return (
                <span key={key} className="text-muted-foreground">
                  {label}:{' '}
                  <span className="font-medium text-foreground">
                    {formatMeasurement(val, unitPreference)}
                  </span>
                </span>
              );
            })}
          </div>
        </CardContent>
      )}
      {expanded && (
        <CardContent className="pt-0">
          <form onSubmit={handleSubmit} className="space-y-2">
            {FIELDS.map(({ key, label }) => (
              <div key={key} className="flex items-center gap-2">
                <label className="w-16 text-sm text-muted-foreground">{label}</label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder={isImperial ? 'inches' : 'cm'}
                  value={values[key] ?? ''}
                  onChange={(e) => setValues((prev) => ({ ...prev, [key]: e.target.value }))}
                  className="flex-1"
                />
                {currentMeasurements?.[key] != null && (
                  <span className="text-xs text-muted-foreground">
                    ({formatMeasurement(currentMeasurements[key]!, unitPreference)})
                  </span>
                )}
              </div>
            ))}
            <Button type="submit" className="w-full" disabled={logMeasurements.isPending}>
              {currentMeasurements ? 'Update' : 'Log'}
            </Button>
          </form>
        </CardContent>
      )}
    </Card>
  );
};
