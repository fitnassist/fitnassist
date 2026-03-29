import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Eye, EyeOff, Trash2, Pencil, ChevronDown } from 'lucide-react';
import { Button, Badge } from '@/components/ui';
import { useToggleSectionVisibility } from '@/api/website';
import { SECTION_TYPES } from '../../website.constants';
import { SectionForm } from './SectionForm';
import type { WebsiteSectionData } from '../../website.types';

interface SectionCardProps {
  section: WebsiteSectionData;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onDelete: () => void;
}

export const SectionCard = ({
  section,
  isExpanded,
  onToggleExpand,
  onDelete,
}: SectionCardProps) => {
  const toggleVisibility = useToggleSectionVisibility();
  const config = SECTION_TYPES.find((s) => s.type === section.type);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border bg-card text-card-foreground shadow-sm ${
        !section.isVisible ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-center gap-3 p-4">
        <button
          type="button"
          className="cursor-grab active:cursor-grabbing touch-none flex-shrink-0"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium truncate">
              {section.title || config?.label || section.type}
            </p>
            <Badge variant="secondary" className="text-xs">
              {config?.label || section.type}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onToggleExpand}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <Pencil className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => toggleVisibility.mutate({ sectionId: section.id })}
          >
            {section.isVisible ? (
              <Eye className="h-4 w-4" />
            ) : (
              <EyeOff className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t px-4 py-4">
          <SectionForm section={section} />
        </div>
      )}
    </div>
  );
};
