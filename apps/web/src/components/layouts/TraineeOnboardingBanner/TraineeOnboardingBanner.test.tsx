import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/utils';
import userEvent from '@testing-library/user-event';
import { TraineeOnboardingBanner } from './index';

// Mock useAuth hook
const mockUseAuth = vi.fn();
vi.mock('@/hooks', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock tRPC
const mockUseQuery = vi.fn();
vi.mock('@/lib/trpc', () => ({
  trpc: {
    trainee: {
      hasProfile: {
        useQuery: (...args: unknown[]) => mockUseQuery(...args),
      },
    },
  },
}));

describe('TraineeOnboardingBanner', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should show banner when user is trainee with no profile', () => {
    mockUseAuth.mockReturnValue({
      isTrainee: true,
      isAuthenticated: true,
    });
    mockUseQuery.mockReturnValue({
      data: { hasProfile: false },
      isLoading: false,
    });

    render(<TraineeOnboardingBanner />);

    expect(screen.getByText('Complete your profile')).toBeInTheDocument();
    expect(
      screen.getByText('Help trainers understand your goals by setting up your profile.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /set up profile/i })).toBeInTheDocument();
  });

  it('should hide banner when dismissed via localStorage', () => {
    localStorage.setItem('trainee-onboarding-banner-dismissed', 'true');

    mockUseAuth.mockReturnValue({
      isTrainee: true,
      isAuthenticated: true,
    });
    mockUseQuery.mockReturnValue({
      data: { hasProfile: false },
      isLoading: false,
    });

    const { container } = render(<TraineeOnboardingBanner />);

    expect(container.innerHTML).toBe('');
  });

  it('should dismiss banner and set localStorage when dismiss button clicked', async () => {
    mockUseAuth.mockReturnValue({
      isTrainee: true,
      isAuthenticated: true,
    });
    mockUseQuery.mockReturnValue({
      data: { hasProfile: false },
      isLoading: false,
    });

    render(<TraineeOnboardingBanner />);

    expect(screen.getByText('Complete your profile')).toBeInTheDocument();

    const dismissButton = screen.getByRole('button', { name: /dismiss/i });
    await user.click(dismissButton);

    expect(localStorage.getItem('trainee-onboarding-banner-dismissed')).toBe('true');
    expect(screen.queryByText('Complete your profile')).not.toBeInTheDocument();
  });

  it('should hide banner for non-trainees', () => {
    mockUseAuth.mockReturnValue({
      isTrainee: false,
      isAuthenticated: true,
    });
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
    });

    const { container } = render(<TraineeOnboardingBanner />);

    expect(container.innerHTML).toBe('');
  });

  it('should hide banner when trainee already has a profile', () => {
    mockUseAuth.mockReturnValue({
      isTrainee: true,
      isAuthenticated: true,
    });
    mockUseQuery.mockReturnValue({
      data: { hasProfile: true },
      isLoading: false,
    });

    const { container } = render(<TraineeOnboardingBanner />);

    expect(container.innerHTML).toBe('');
  });

  it('should hide banner while loading', () => {
    mockUseAuth.mockReturnValue({
      isTrainee: true,
      isAuthenticated: true,
    });
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    const { container } = render(<TraineeOnboardingBanner />);

    expect(container.innerHTML).toBe('');
  });
});
