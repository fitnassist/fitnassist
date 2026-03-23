import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from './label';

export interface MultiSelectOption {
  value: string;
  label: string;
  category?: string;
}

export interface MultiSelectProps {
  options: readonly MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  label?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  groupByCategory?: boolean;
}

export function MultiSelect({
  options,
  value,
  onChange,
  label,
  error,
  disabled,
  className,
  groupByCategory = false,
}: MultiSelectProps) {
  const handleToggle = (optionValue: string) => {
    if (disabled) return;

    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  // Group options by category if requested
  const groupedOptions = React.useMemo(() => {
    if (!groupByCategory) {
      return { '': [...options] };
    }

    return options.reduce(
      (acc, option) => {
        const category = option.category || 'Other';
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(option);
        return acc;
      },
      {} as Record<string, MultiSelectOption[]>
    );
  }, [options, groupByCategory]);

  const categories = Object.keys(groupedOptions);

  return (
    <div className={cn('space-y-3', className)}>
      {label && (
        <Label className="text-base font-medium">{label}</Label>
      )}

      <div className="space-y-4">
        {categories.map((category) => (
          <div key={category} className="space-y-2">
            {category && groupByCategory && (
              <h4 className="text-sm font-medium text-muted-foreground capitalize">
                {category}
              </h4>
            )}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {(groupedOptions[category] ?? []).map((option) => {
                const isSelected = value.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleToggle(option.value)}
                    disabled={disabled}
                    className={cn(
                      'flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors',
                      'hover:bg-accent hover:text-accent-foreground',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      isSelected && 'border-primary bg-primary/10 text-primary',
                      !isSelected && 'border-input bg-background',
                      disabled && 'cursor-not-allowed opacity-50'
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border',
                        isSelected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-input'
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>
                    <span className="truncate">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {value.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {value.length} selected
        </p>
      )}
    </div>
  );
}
