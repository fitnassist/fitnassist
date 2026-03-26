import { useState } from 'react';
import { Trophy, ChevronDown, ChevronUp, TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui';
import { usePersonalBests } from '@/api/diary';
import { formatPBValue } from '../../diary.utils';

interface PersonalBestItem {
  id: string;
  label: string;
  value: number;
  unit: string;
  category: string;
  achievedAt: string | Date;
  previousValue?: number | null;
}

interface PersonalBestsProps {
  userId?: string;
  data?: PersonalBestItem[];
  variant?: 'default' | 'profile';
}

const CATEGORY_ORDER: Record<string, number> = {
  FASTEST_DISTANCE: 0,
  LONGEST_DISTANCE: 1,
  LONGEST_DURATION: 2,
  HEAVIEST_WEIGHT: 3,
  MOST_STEPS: 4,
  CUSTOM: 5,
};

const CATEGORY_LABELS: Record<string, string> = {
  FASTEST_DISTANCE: 'Speed',
  LONGEST_DISTANCE: 'Distance',
  LONGEST_DURATION: 'Duration',
  HEAVIEST_WEIGHT: 'Weight',
  MOST_STEPS: 'Steps',
  CUSTOM: 'Other',
};

export const PersonalBests = ({ userId, data: externalData, variant = 'default' }: PersonalBestsProps) => {
  const isProfile = variant === 'profile';
  const [isExpanded, setIsExpanded] = useState(true);
  const { data: fetchedPbs } = usePersonalBests(userId, !externalData);
  const pbs = externalData ?? fetchedPbs;

  const sortedPBs = [...(pbs ?? [])].sort((a, b) => {
    const orderA = CATEGORY_ORDER[a.category] ?? 99;
    const orderB = CATEGORY_ORDER[b.category] ?? 99;
    return orderA - orderB;
  });

  // Group by category
  const grouped = sortedPBs.reduce<Record<string, typeof sortedPBs>>((acc, pb) => {
    const key = pb.category;
    if (!acc[key]) acc[key] = [];
    acc[key].push(pb);
    return acc;
  }, {});

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className={isProfile
            ? 'flex items-center gap-2 text-lg sm:text-xl font-light uppercase tracking-wider'
            : 'flex items-center gap-2 text-base'
          }>
            <Trophy className={isProfile ? 'h-5 w-5' : 'h-4 w-4 text-yellow-500'} />
            Personal Bests
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent>
          {sortedPBs.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">
              No personal bests yet — keep logging!
            </p>
          ) : (
            <div className="space-y-4">
              {Object.entries(grouped).map(([category, items]) => (
                <div key={category}>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {CATEGORY_LABELS[category] ?? category}
                  </h4>
                  <div className="space-y-1.5">
                    {items.map((pb) => (
                      <div key={pb.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{pb.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(pb.achievedAt), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">{formatPBValue(pb.value, pb.unit)}</p>
                          {pb.previousValue != null && (
                            <p className="flex items-center justify-end gap-0.5 text-xs text-muted-foreground">
                              {pb.category === 'FASTEST_DISTANCE' ? (
                                // Lower is better for speed
                                <TrendingDown className="h-3 w-3 text-emerald-500" />
                              ) : (
                                <TrendingUp className="h-3 w-3 text-emerald-500" />
                              )}
                              was {formatPBValue(pb.previousValue, pb.unit)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};
