import { Search } from 'lucide-react';
import { Select, type SelectOption, Switch, Label } from '@/components/ui';

type ActiveClientStatus = 'ONBOARDING' | 'ACTIVE' | 'INACTIVE' | 'ON_HOLD';

const STATUS_OPTIONS: SelectOption[] = [
  { value: '', label: 'All Statuses' },
  { value: 'ONBOARDING', label: 'Onboarding' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'ON_HOLD', label: 'On Hold' },
  { value: 'INACTIVE', label: 'Inactive' },
];

interface ClientFiltersProps {
  status: ActiveClientStatus | undefined;
  onStatusChange: (status: ActiveClientStatus | undefined) => void;
  search: string;
  onSearchChange: (search: string) => void;
  showDisconnected: boolean;
  onShowDisconnectedChange: (show: boolean) => void;
}

export const ClientFilters = ({
  status,
  onStatusChange,
  search,
  onSearchChange,
  showDisconnected,
  onShowDisconnectedChange,
}: ClientFiltersProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search clients..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </div>
      <div className="w-full sm:w-48">
        <label htmlFor="client-status-filter" className="sr-only">
          Client status
        </label>
        <Select
          inputId="client-status-filter"
          value={STATUS_OPTIONS.find((o) => o.value === (status || '')) || STATUS_OPTIONS[0]}
          onChange={(opt) => onStatusChange((opt?.value as ActiveClientStatus) || undefined)}
          options={STATUS_OPTIONS}
          isClearable={false}
        />
      </div>
      <div className="flex items-center gap-2">
        <Switch
          id="show-disconnected"
          checked={showDisconnected}
          onCheckedChange={onShowDisconnectedChange}
        />
        <Label
          htmlFor="show-disconnected"
          className="text-sm mb-0 whitespace-nowrap cursor-pointer"
        >
          Show disconnected
        </Label>
      </div>
    </div>
  );
};
