import { Link } from 'react-router-dom';
import { Video, LinkIcon, Pencil, Trash2, Dumbbell } from 'lucide-react';
import {
  Card,
  CardContent,
  Button,
} from '@/components/ui';
import { routes } from '@/config/routes';
import { MUSCLE_GROUP_OPTIONS } from '@fitnassist/schemas';

const DIFFICULTY_STYLES: Record<string, { label: string; className: string }> = {
  BEGINNER: { label: 'Beginner', className: 'text-green-600 bg-green-50' },
  INTERMEDIATE: { label: 'Intermediate', className: 'text-amber-600 bg-amber-50' },
  ADVANCED: { label: 'Advanced', className: 'text-red-600 bg-red-50' },
};

interface ExerciseCardProps {
  exercise: {
    id: string;
    name: string;
    description: string | null;
    videoUrl: string | null;
    videoUploadUrl: string | null;
    thumbnailUrl: string | null;
    muscleGroups: string[];
    equipment: string[];
    difficulty: string | null;
  };
  onDelete: (id: string) => void;
  isDeleting?: boolean;
}

export const ExerciseCard = ({ exercise, onDelete, isDeleting }: ExerciseCardProps) => {
  const hasVideo = !!(exercise.videoUrl || exercise.videoUploadUrl);
  const difficultyStyle = exercise.difficulty ? DIFFICULTY_STYLES[exercise.difficulty] : null;

  const getMuscleGroupLabel = (value: string) =>
    MUSCLE_GROUP_OPTIONS.find(o => o.value === value)?.label ?? value;

  return (
    <Card>
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start gap-3 sm:gap-4">
          {/* Thumbnail / Placeholder */}
          <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
            {exercise.thumbnailUrl ? (
              <img
                src={exercise.thumbnailUrl}
                alt={exercise.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Dumbbell className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium truncate">{exercise.name}</h3>
                  {hasVideo && (
                    <span className="flex-shrink-0">
                      {exercise.videoUploadUrl ? (
                        <Video className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <LinkIcon className="h-4 w-4 text-muted-foreground" />
                      )}
                    </span>
                  )}
                  {difficultyStyle && (
                    <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${difficultyStyle.className}`}>
                      {difficultyStyle.label}
                    </span>
                  )}
                </div>
                {exercise.description && (
                  <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                    {exercise.description}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <Link to={routes.dashboardExerciseEdit(exercise.id)}>
                  <Button variant="ghost" size="sm">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(exercise.id)}
                  disabled={isDeleting}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Muscle groups + equipment tags */}
            {(exercise.muscleGroups.length > 0 || exercise.equipment.length > 0) && (
              <div className="flex flex-wrap gap-1 mt-2">
                {exercise.muscleGroups.slice(0, 3).map((mg) => (
                  <span
                    key={mg}
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary"
                  >
                    {getMuscleGroupLabel(mg)}
                  </span>
                ))}
                {exercise.equipment.slice(0, 2).map((eq) => (
                  <span
                    key={eq}
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-secondary text-secondary-foreground"
                  >
                    {eq}
                  </span>
                ))}
                {(exercise.muscleGroups.length > 3 || exercise.equipment.length > 2) && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">
                    +{Math.max(0, exercise.muscleGroups.length - 3) + Math.max(0, exercise.equipment.length - 2)} more
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
