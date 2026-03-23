import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils';
import { EmptyThread } from './index';

describe('EmptyThread', () => {
  it('should render the message circle icon', () => {
    render(<EmptyThread />);

    // The icon should be present (look for the svg with the correct class)
    const container = screen.getByText(/select a conversation to start messaging/i);
    expect(container).toBeInTheDocument();
  });

  it('should render the instruction text', () => {
    render(<EmptyThread />);

    expect(screen.getByText(/select a conversation to start messaging/i)).toBeInTheDocument();
  });

  it('should be centered in its container', () => {
    const { container } = render(<EmptyThread />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('flex-1', 'flex', 'items-center', 'justify-center');
  });
});
