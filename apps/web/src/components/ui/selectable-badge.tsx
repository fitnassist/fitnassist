import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SelectableBadgeProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
}

const SelectableBadge = ({ className, selected, children, ...props }: SelectableBadgeProps) => {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        selected
          ? 'border-transparent bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300'
          : 'border-border bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
};

export { SelectableBadge };
