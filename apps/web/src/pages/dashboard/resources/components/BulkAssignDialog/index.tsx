import { useState } from 'react';
import { Loader2, Users } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
} from '@/components/ui';
import { useClients, useBulkAssignPlan } from '@/api/client-roster';

interface BulkAssignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planType: 'workout' | 'meal';
  planId: string;
  planName: string;
}

export const BulkAssignDialog = ({
  open,
  onOpenChange,
  planType,
  planId,
  planName,
}: BulkAssignDialogProps) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { data } = useClients({ status: 'ACTIVE', limit: 50 });
  const bulkAssign = useBulkAssignPlan();

  const clients = data?.clients ?? [];

  const toggleClient = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === clients.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(clients.map(c => c.id)));
    }
  };

  const handleAssign = () => {
    const payload = {
      clientIds: Array.from(selectedIds),
      ...(planType === 'workout'
        ? { workoutPlanId: planId }
        : { mealPlanId: planId }),
    };
    bulkAssign.mutate(payload, {
      onSuccess: () => {
        onOpenChange(false);
        setSelectedIds(new Set());
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign to Clients</DialogTitle>
          <DialogDescription>
            Assign "{planName}" to selected clients.
          </DialogDescription>
        </DialogHeader>

        {clients.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            No active clients found.
          </div>
        ) : (
          <div className="space-y-2">
            <button
              type="button"
              onClick={toggleAll}
              className="text-xs text-primary hover:underline"
            >
              {selectedIds.size === clients.length ? 'Deselect all' : 'Select all'}
            </button>
            <div className="max-h-64 overflow-y-auto space-y-1 border rounded-lg p-2">
              {clients.map((client) => {
                const name = client.connection.sender?.name || client.connection.name;
                const isSelected = selectedIds.has(client.id);
                return (
                  <label
                    key={client.id}
                    className="flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-muted cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleClient(client.id)}
                      className="rounded border-input"
                    />
                    <span className="text-sm">{name}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={selectedIds.size === 0 || bulkAssign.isPending}
          >
            {bulkAssign.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : null}
            Assign to {selectedIds.size} client{selectedIds.size !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
