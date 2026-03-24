import { useState } from 'react';
import { MapPin, Plus, Trash2, Star } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardContent, Input, Label } from '@/components/ui';
import { ConfirmDialog } from '@/components/ui';
import {
  useSessionLocations,
  useCreateSessionLocation,
  useUpdateSessionLocation,
  useDeleteSessionLocation,
} from '@/api/session-location';

export const SessionLocationList = () => {
  const { data: locations, isLoading } = useSessionLocations();
  const createMutation = useCreateSessionLocation();
  const updateMutation = useUpdateSessionLocation();
  const deleteMutation = useDeleteSessionLocation();

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('');
  const [postcode, setPostcode] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleCreate = () => {
    createMutation.mutate(
      { name, addressLine1: addressLine1 || undefined, city: city || undefined, postcode: postcode || undefined },
      {
        onSuccess: () => {
          setShowForm(false);
          setName('');
          setAddressLine1('');
          setCity('');
          setPostcode('');
        },
      }
    );
  };

  const handleSetDefault = (id: string) => {
    updateMutation.mutate({ id, isDefault: true });
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteMutation.mutate(
      { id: deleteId },
      { onSuccess: () => setDeleteId(null) }
    );
  };

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading locations...</div>;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4" />
              Session Locations
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => setShowForm(!showForm)}>
              <Plus className="h-3 w-3 mr-1" />
              Add
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {showForm && (
            <div className="space-y-3 p-3 border rounded-lg bg-muted/50">
              <div>
                <Label className="text-xs">Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Home Gym" className="h-8" />
              </div>
              <div>
                <Label className="text-xs">Address</Label>
                <Input value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} placeholder="Address line" className="h-8" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">City</Label>
                  <Input value={city} onChange={(e) => setCity(e.target.value)} className="h-8" />
                </div>
                <div>
                  <Label className="text-xs">Postcode</Label>
                  <Input value={postcode} onChange={(e) => setPostcode(e.target.value)} className="h-8" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleCreate} disabled={!name || createMutation.isPending}>
                  {createMutation.isPending ? 'Adding...' : 'Add Location'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </div>
          )}

          {(!locations || locations.length === 0) && !showForm && (
            <p className="text-sm text-muted-foreground">No locations added yet.</p>
          )}

          {locations?.map((loc) => (
            <div key={loc.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{loc.name}</span>
                  {loc.isDefault && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Default</span>
                  )}
                  {!loc.isActive && (
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">Inactive</span>
                  )}
                </div>
                {(loc.addressLine1 || loc.city || loc.postcode) && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {[loc.addressLine1, loc.city, loc.postcode].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1">
                {!loc.isDefault && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSetDefault(loc.id)}
                    className="h-7 w-7 p-0"
                    title="Set as default"
                  >
                    <Star className="h-3 w-3" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteId(loc.id)}
                  className="h-7 w-7 p-0 text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Delete Location"
        description="Are you sure you want to delete this location? This cannot be undone."
        onConfirm={handleDelete}
        confirmLabel="Delete"
        variant="destructive"
      />
    </>
  );
};
