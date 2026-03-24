import { useState } from 'react';
import { CalendarOff, Plus, Trash2 } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardContent, Input, Label } from '@/components/ui';
import { ConfirmDialog } from '@/components/ui';
import { useAvailabilityOverrides, useCreateOverride, useDeleteOverride } from '@/api/availability';

export const DateOverrides = () => {
  // Show overrides for next 3 months
  const startDate = new Date().toISOString().split('T')[0]!;
  const endDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]!;

  const { data: overrides, isLoading } = useAvailabilityOverrides(startDate, endDate);
  const createMutation = useCreateOverride();
  const deleteMutation = useDeleteOverride();

  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleCreate = () => {
    createMutation.mutate(
      { date, isBlocked: true, reason: reason || undefined },
      {
        onSuccess: () => {
          setShowForm(false);
          setDate('');
          setReason('');
        },
      }
    );
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteMutation.mutate(
      { id: deleteId },
      { onSuccess: () => setDeleteId(null) }
    );
  };

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading...</div>;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarOff className="h-4 w-4" />
              Blocked Dates
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => setShowForm(!showForm)}>
              <Plus className="h-3 w-3 mr-1" />
              Block Date
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {showForm && (
            <div className="space-y-3 p-3 border rounded-lg bg-muted/50">
              <div>
                <Label className="text-xs">Date</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-8" />
              </div>
              <div>
                <Label className="text-xs">Reason (optional)</Label>
                <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g., Holiday" className="h-8" />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleCreate} disabled={!date || createMutation.isPending}>
                  {createMutation.isPending ? 'Blocking...' : 'Block Date'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </div>
          )}

          {(!overrides || overrides.length === 0) && !showForm && (
            <p className="text-sm text-muted-foreground">No blocked dates.</p>
          )}

          {overrides?.map((override) => (
            <div key={override.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <span className="font-medium text-sm">
                  {new Date(override.date).toLocaleDateString('en-GB', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
                {override.reason && (
                  <p className="text-xs text-muted-foreground">{override.reason}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteId(override.id)}
                className="h-7 w-7 p-0 text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Unblock Date"
        description="Are you sure you want to remove this blocked date?"
        onConfirm={handleDelete}
        confirmLabel="Unblock"
      />
    </>
  );
};
