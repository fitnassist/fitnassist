import { cn } from '@/lib/utils';

interface ChartTab<T extends string> {
  key: T;
  label: string;
}

interface ChartTabBarProps<T extends string> {
  tabs: ChartTab<T>[];
  activeTab: T;
  onTabChange: (tab: T) => void;
}

export const ChartTabBar = <T extends string>({ tabs, activeTab, onTabChange }: ChartTabBarProps<T>) => {
  return (
    <div className="mb-4 flex flex-wrap gap-1.5">
      {tabs.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onTabChange(key)}
          className={cn(
            'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
            activeTab === key
              ? 'bg-primary text-gray-900'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
};
