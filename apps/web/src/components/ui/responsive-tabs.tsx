import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs';

interface TabOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface ResponsiveTabsProps {
  value: string;
  onValueChange: (value: string) => void;
  options: TabOption[];
  children: React.ReactNode;
  className?: string;
  tabsListClassName?: string;
}

export const ResponsiveTabs = ({
  value,
  onValueChange,
  options,
  children,
  className,
  tabsListClassName,
}: ResponsiveTabsProps) => {
  const selectedLabel = options.find((o) => o.value === value)?.label ?? value;

  return (
    <Tabs value={value} onValueChange={onValueChange} className={className}>
      {/* Mobile: native select */}
      <div className="sm:hidden relative">
        <select
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          className={cn(
            'flex h-10 w-full appearance-none rounded-md border border-input bg-background px-3 py-2 pr-9 text-sm font-medium ring-offset-background',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          )}
          aria-label={`Selected: ${selectedLabel}`}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      </div>

      {/* Desktop: regular tabs */}
      <TabsList className={cn('hidden sm:inline-flex', tabsListClassName)}>
        {options.map((option) => (
          <TabsTrigger key={option.value} value={option.value} className="gap-2">
            {option.icon}
            {option.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {children}
    </Tabs>
  );
};

export { TabsContent };
