import { useState, useEffect } from 'react';
import { Car } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardContent, Label, Switch } from '@/components/ui';
import { Select } from '@/components/ui';
import { useTravelSettings, useUpdateTravelSettings } from '@/api/availability';
import { toast } from '@/lib/toast';

const BUFFER_OPTIONS = [
  { value: '0', label: 'No buffer' },
  { value: '5', label: '5 minutes' },
  { value: '10', label: '10 minutes' },
  { value: '15', label: '15 minutes' },
  { value: '20', label: '20 minutes' },
  { value: '30', label: '30 minutes' },
  { value: '45', label: '45 minutes' },
  { value: '60', label: '60 minutes' },
  { value: '90', label: '90 minutes' },
  { value: '120', label: '120 minutes' },
];

export const TravelSettings = () => {
  const { data, isLoading } = useTravelSettings();
  const updateMutation = useUpdateTravelSettings();
  const [bufferMin, setBufferMin] = useState('15');
  const [smartTravel, setSmartTravel] = useState(false);

  useEffect(() => {
    if (data) {
      setBufferMin(String(data.travelBufferMin));
      setSmartTravel(data.smartTravelEnabled);
    }
  }, [data]);

  const handleSave = () => {
    updateMutation.mutate(
      { travelBufferMin: Number(bufferMin), smartTravelEnabled: smartTravel },
      { onSuccess: () => toast.success('Travel settings saved') },
    );
  };

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Car className="h-4 w-4" />
          Travel Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-sm">Travel buffer between sessions</Label>
          <p className="text-xs text-muted-foreground mb-2">
            Minimum time between sessions to account for travel
          </p>
          <Select
            value={{
              value: bufferMin,
              label: BUFFER_OPTIONS.find((o) => o.value === bufferMin)?.label ?? bufferMin,
            }}
            onChange={(option) => {
              if (option) {
                setBufferMin((option as { value: string }).value);
              }
            }}
            options={BUFFER_OPTIONS}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm">Smart travel time</Label>
            <p className="text-xs text-muted-foreground">
              Use Google Maps to calculate actual travel time between session locations
            </p>
          </div>
          <Switch
            checked={smartTravel}
            onCheckedChange={(checked) => {
              setSmartTravel(checked);
            }}
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
