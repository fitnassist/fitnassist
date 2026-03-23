import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui';

interface FoodEntryRowProps {
  entry: {
    id: string;
    name: string;
    calories: number;
    proteinG: number | null;
    carbsG: number | null;
    fatG: number | null;
    servingSize: number;
    servingUnit: string;
    thumbnailUrl: string | null;
  };
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

export const FoodEntryRow = ({ entry, onDelete, isDeleting }: FoodEntryRowProps) => {
  return (
    <div className="flex items-center gap-3 py-1.5">
      {entry.thumbnailUrl && (
        <img src={entry.thumbnailUrl} alt="" className="h-8 w-8 rounded object-cover" />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm capitalize">{entry.name}</p>
        <p className="text-xs text-muted-foreground">
          {entry.servingSize} {entry.servingUnit}
          {entry.proteinG != null && ` · P: ${Math.round(entry.proteinG)}g`}
          {entry.carbsG != null && ` · C: ${Math.round(entry.carbsG)}g`}
          {entry.fatG != null && ` · F: ${Math.round(entry.fatG)}g`}
        </p>
      </div>
      <span className="text-sm font-medium">{entry.calories}</span>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-muted-foreground hover:text-destructive"
        onClick={() => onDelete(entry.id)}
        disabled={isDeleting}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
};
