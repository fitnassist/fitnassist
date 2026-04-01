import { useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { Button, Card, CardContent, ConfirmDialog } from '@/components/ui';
import { useRemoveSection, useReorderSections } from '@/api/website';
import { AddSectionDialog } from './AddSectionDialog';
import { SectionCard } from './SectionCard';
import type { WebsiteData } from '../../website.types';

interface SectionEditorProps {
  website: WebsiteData;
}

export const SectionEditor = ({ website }: SectionEditorProps) => {
  const [showAdd, setShowAdd] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [expandedSectionId, setExpandedSectionId] = useState<string | null>(null);
  const removeSection = useRemoveSection();
  const reorderSections = useReorderSections();

  const sections = [...website.sections].sort((a, b) => a.sortOrder - b.sortOrder);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        const oldIndex = sections.findIndex((s) => s.id === active.id);
        const newIndex = sections.findIndex((s) => s.id === over.id);
        const reordered = arrayMove(sections, oldIndex, newIndex);
        reorderSections.mutate({ sectionIds: reordered.map((s) => s.id) });
      }
    },
    [sections, reorderSections],
  );

  const handleToggleExpand = (sectionId: string) => {
    setExpandedSectionId((prev) => (prev === sectionId ? null : sectionId));
  };

  return (
    <div className="space-y-4">
      {sections.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              No sections yet. Add your first section to start building your website.
            </p>
            <Button onClick={() => setShowAdd(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Section
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sections.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {sections.map((section) => (
                  <SectionCard
                    key={section.id}
                    section={section}
                    isExpanded={expandedSectionId === section.id}
                    onToggleExpand={() => handleToggleExpand(section.id)}
                    onDelete={() => setDeleteTarget(section.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <Button variant="outline" onClick={() => setShowAdd(true)} className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Add Section
          </Button>
        </>
      )}

      <AddSectionDialog open={showAdd} onOpenChange={setShowAdd} />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Remove section?"
        description="This section and its content will be permanently deleted."
        onConfirm={() => {
          if (deleteTarget) removeSection.mutate({ sectionId: deleteTarget });
          setDeleteTarget(null);
        }}
        isLoading={removeSection.isPending}
      />
    </div>
  );
};
