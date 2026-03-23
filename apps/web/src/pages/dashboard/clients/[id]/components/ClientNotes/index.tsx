import { useState } from 'react';
import { format } from 'date-fns';
import { Plus, Trash2 } from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Textarea,
  ConfirmDialog,
} from '@/components/ui';
import { useClientNotes, useAddClientNote, useDeleteClientNote } from '@/api/client-roster';

interface ClientNotesProps {
  clientRosterId: string;
}

export const ClientNotes = ({ clientRosterId }: ClientNotesProps) => {
  const [content, setContent] = useState('');
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null);

  const { data: notes, isLoading } = useClientNotes(clientRosterId);
  const addNote = useAddClientNote();
  const deleteNote = useDeleteClientNote();

  const handleAddNote = () => {
    const trimmed = content.trim();
    if (!trimmed) return;

    addNote.mutate(
      { clientRosterId, content: trimmed },
      { onSuccess: () => setContent('') }
    );
  };

  const handleDeleteNote = () => {
    if (!deleteNoteId) return;
    deleteNote.mutate(
      { id: deleteNoteId },
      { onSuccess: () => setDeleteNoteId(null) }
    );
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Private Notes</CardTitle>
          <CardDescription>
            Only visible to you. Keep track of client preferences, goals, and session notes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Add a note about this client..."
              rows={3}
              maxLength={2000}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {content.length}/2000 characters
              </p>
              <Button
                onClick={handleAddNote}
                disabled={!content.trim() || addNote.isPending}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                {addNote.isPending ? 'Adding...' : 'Add Note'}
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : notes && notes.length > 0 ? (
            <div className="space-y-3">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="rounded-lg border p-3 space-y-2"
                >
                  <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(note.createdAt), 'PPp')}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleteNoteId(note.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No notes yet. Add your first note above.
            </p>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteNoteId}
        onOpenChange={(open) => { if (!open) setDeleteNoteId(null); }}
        title="Delete Note"
        description="Are you sure you want to delete this note? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        isLoading={deleteNote.isPending}
        onConfirm={handleDeleteNote}
      />
    </>
  );
};
