import ReactSelect from 'react-select';
import type { Props, GroupBase, StylesConfig } from 'react-select';

export interface SelectOption {
  value: string;
  label: string;
}

type SelectProps<IsMulti extends boolean = false> = Omit<
  Props<SelectOption, IsMulti, GroupBase<SelectOption>>,
  'styles' | 'theme'
> & {
  error?: boolean;
};

const getStyles = <IsMulti extends boolean = false>(
  error?: boolean,
): StylesConfig<SelectOption, IsMulti, GroupBase<SelectOption>> => ({
  control: (base, state) => ({
    ...base,
    minHeight: '2.5rem',
    borderRadius: 'calc(var(--radius) - 2px)',
    borderColor: error
      ? 'hsl(var(--destructive))'
      : state.isFocused
        ? 'hsl(var(--ring))'
        : 'hsl(var(--input))',
    backgroundColor: 'hsl(var(--background))',
    boxShadow: state.isFocused
      ? '0 0 0 2px hsl(var(--background)), 0 0 0 4px hsl(var(--ring))'
      : 'none',
    fontSize: '0.875rem',
    '&:hover': {
      borderColor: state.isFocused ? 'hsl(var(--ring))' : 'hsl(var(--input))',
    },
  }),
  menu: (base) => ({
    ...base,
    borderRadius: 'calc(var(--radius) - 2px)',
    border: '1px solid hsl(var(--border))',
    backgroundColor: 'hsl(var(--popover))',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    zIndex: 50,
    overflow: 'hidden',
  }),
  menuList: (base) => ({
    ...base,
    padding: '4px',
  }),
  option: (base, state) => ({
    ...base,
    borderRadius: 'calc(var(--radius) - 4px)',
    fontSize: '0.875rem',
    backgroundColor: state.isSelected
      ? 'hsl(var(--accent))'
      : state.isFocused
        ? 'hsl(var(--accent))'
        : 'transparent',
    color: 'hsl(var(--popover-foreground))',
    cursor: 'pointer',
    '&:active': {
      backgroundColor: 'hsl(var(--accent))',
    },
  }),
  singleValue: (base) => ({
    ...base,
    color: 'hsl(var(--foreground))',
  }),
  multiValue: (base) => ({
    ...base,
    backgroundColor: 'hsl(var(--accent))',
    borderRadius: 'calc(var(--radius) - 4px)',
  }),
  multiValueLabel: (base) => ({
    ...base,
    color: 'hsl(var(--accent-foreground))',
    fontSize: '0.8rem',
  }),
  multiValueRemove: (base) => ({
    ...base,
    color: 'hsl(var(--muted-foreground))',
    borderRadius: '0 calc(var(--radius) - 4px) calc(var(--radius) - 4px) 0',
    '&:hover': {
      backgroundColor: 'hsl(var(--destructive))',
      color: 'hsl(var(--destructive-foreground))',
    },
  }),
  placeholder: (base) => ({
    ...base,
    color: 'hsl(var(--muted-foreground))',
  }),
  indicatorSeparator: () => ({
    display: 'none',
  }),
  dropdownIndicator: (base) => ({
    ...base,
    color: 'hsl(var(--muted-foreground))',
    padding: '0 8px',
    '&:hover': {
      color: 'hsl(var(--foreground))',
    },
  }),
  clearIndicator: (base) => ({
    ...base,
    color: 'hsl(var(--muted-foreground))',
    '&:hover': {
      color: 'hsl(var(--foreground))',
    },
  }),
  input: (base) => ({
    ...base,
    color: 'hsl(var(--foreground))',
  }),
});

export const Select = <IsMulti extends boolean = false>({
  error,
  ...props
}: SelectProps<IsMulti>) => {
  return (
    <ReactSelect<SelectOption, IsMulti, GroupBase<SelectOption>>
      styles={getStyles<IsMulti>(error)}
      {...props}
    />
  );
};
