import { useState } from 'react';
import {
  Dumbbell, Heart, Timer, Flame, Trophy, Target, Zap, Activity,
  Apple, Bike, Footprints, Mountain, Waves, Shield, Star, Users,
  Calendar, Clock, MapPin, Home, Building, Salad, Utensils, Scale,
  Brain, Eye, Smile, Leaf, Sun, Moon, Compass, TrendingUp, Award,
  Swords, PersonStanding, HeartPulse, Shirt, HandMetal, Sparkles,
} from 'lucide-react';
import { Button, Label } from '@/components/ui';
import { cn } from '@/lib/utils';

const ICON_OPTIONS = [
  { value: 'dumbbell', label: 'Dumbbell', icon: Dumbbell },
  { value: 'heart', label: 'Heart', icon: Heart },
  { value: 'heart-pulse', label: 'Heart Pulse', icon: HeartPulse },
  { value: 'timer', label: 'Timer', icon: Timer },
  { value: 'flame', label: 'Flame', icon: Flame },
  { value: 'trophy', label: 'Trophy', icon: Trophy },
  { value: 'target', label: 'Target', icon: Target },
  { value: 'zap', label: 'Zap', icon: Zap },
  { value: 'activity', label: 'Activity', icon: Activity },
  { value: 'apple', label: 'Apple', icon: Apple },
  { value: 'bike', label: 'Bike', icon: Bike },
  { value: 'footprints', label: 'Footprints', icon: Footprints },
  { value: 'mountain', label: 'Mountain', icon: Mountain },
  { value: 'waves', label: 'Waves', icon: Waves },
  { value: 'shield', label: 'Shield', icon: Shield },
  { value: 'star', label: 'Star', icon: Star },
  { value: 'users', label: 'Users', icon: Users },
  { value: 'calendar', label: 'Calendar', icon: Calendar },
  { value: 'clock', label: 'Clock', icon: Clock },
  { value: 'map-pin', label: 'Location', icon: MapPin },
  { value: 'home', label: 'Home', icon: Home },
  { value: 'building', label: 'Building', icon: Building },
  { value: 'salad', label: 'Salad', icon: Salad },
  { value: 'utensils', label: 'Utensils', icon: Utensils },
  { value: 'scale', label: 'Scale', icon: Scale },
  { value: 'brain', label: 'Brain', icon: Brain },
  { value: 'eye', label: 'Eye', icon: Eye },
  { value: 'smile', label: 'Smile', icon: Smile },
  { value: 'leaf', label: 'Leaf', icon: Leaf },
  { value: 'sun', label: 'Sun', icon: Sun },
  { value: 'moon', label: 'Moon', icon: Moon },
  { value: 'compass', label: 'Compass', icon: Compass },
  { value: 'trending-up', label: 'Trending Up', icon: TrendingUp },
  { value: 'award', label: 'Award', icon: Award },
  { value: 'swords', label: 'Swords', icon: Swords },
  { value: 'person-standing', label: 'Person', icon: PersonStanding },
  { value: 'shirt', label: 'Shirt', icon: Shirt },
  { value: 'hand-metal', label: 'Rock On', icon: HandMetal },
  { value: 'sparkles', label: 'Sparkles', icon: Sparkles },
] as const;

export const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = Object.fromEntries(
  ICON_OPTIONS.map((o) => [o.value, o.icon])
);

interface IconPickerProps {
  value: string;
  onChange: (value: string) => void;
}

export const IconPicker = ({ value, onChange }: IconPickerProps) => {
  const [open, setOpen] = useState(false);
  const selected = ICON_OPTIONS.find((o) => o.value === value);
  const SelectedIcon = selected?.icon;

  return (
    <div className="space-y-1">
      <Label className="text-xs">Icon</Label>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full justify-start gap-2"
        onClick={() => setOpen(!open)}
      >
        {SelectedIcon ? (
          <>
            <SelectedIcon className="h-4 w-4" />
            <span>{selected.label}</span>
          </>
        ) : (
          <span className="text-muted-foreground">Choose an icon...</span>
        )}
      </Button>
      {open && (
        <div className="grid grid-cols-6 gap-1 rounded-md border p-2 max-h-48 overflow-y-auto">
          {ICON_OPTIONS.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                type="button"
                title={option.label}
                className={cn(
                  'flex items-center justify-center rounded-md p-2 hover:bg-muted transition-colors',
                  value === option.value && 'bg-primary text-primary-foreground hover:bg-primary'
                )}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                <Icon className="h-4 w-4" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
