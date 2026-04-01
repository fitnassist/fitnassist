import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/utils';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './index';

// Mock the auth-client
vi.mock('@/lib/auth-client', () => ({
  signIn: {
    email: vi.fn(),
  },
}));

// Mock react-router-dom's useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

import { signIn } from '@/lib/auth-client';

describe('LoginForm', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render all form fields', () => {
    render(<LoginForm />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('should render link to registration page', () => {
    render(<LoginForm />);

    const signUpLink = screen.getByRole('link', { name: /sign up/i });
    expect(signUpLink).toBeInTheDocument();
    expect(signUpLink).toHaveAttribute('href', '/register');
  });

  it('should show validation error for empty email', async () => {
    render(<LoginForm />);

    const passwordInput = screen.getByLabelText(/^password$/i);
    await user.type(passwordInput, 'somepassword');

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
    });
  });

  it('should show validation error for empty password', async () => {
    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/email/i);
    await user.type(emailInput, 'test@example.com');

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  it('should call signIn.email with correct data on valid submission', async () => {
    const mockSignIn = vi.mocked(signIn.email);
    mockSignIn.mockImplementation(async (_creds, options) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (options?.onSuccess as any)?.();
      return { data: { user: { id: '1' } }, error: null };
    });

    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'TestPass123');

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith(
        {
          email: 'test@example.com',
          password: 'TestPass123',
        },
        expect.objectContaining({
          onSuccess: expect.any(Function),
          onError: expect.any(Function),
        }),
      );
    });
  });

  it('should navigate to dashboard on successful login', async () => {
    const mockSignIn = vi.mocked(signIn.email);
    mockSignIn.mockImplementation(async (_creds, options) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (options?.onSuccess as any)?.();
      return { data: { user: { id: '1' } }, error: null };
    });

    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'TestPass123');

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('should call onSuccess callback after successful login', async () => {
    const mockSignIn = vi.mocked(signIn.email);
    mockSignIn.mockImplementation(async (_creds, options) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (options?.onSuccess as any)?.();
      return { data: { user: { id: '1' } }, error: null };
    });
    const onSuccess = vi.fn();

    render(<LoginForm onSuccess={onSuccess} />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'TestPass123');

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('should show error message when login fails', async () => {
    const mockSignIn = vi.mocked(signIn.email);
    mockSignIn.mockImplementation(async (_creds, options) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (options?.onError as any)?.({ error: { message: 'Invalid credentials' } });
      return { data: null, error: { message: 'Invalid credentials' } };
    });

    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'wrongpassword');

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  it('should show loading state during submission', async () => {
    const mockSignIn = vi.mocked(signIn.email);
    mockSignIn.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => {
            resolve({ data: { user: { id: '1' } }, error: null });
          }, 100),
        ),
    );

    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'TestPass123');

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(submitButton);

    expect(screen.getByRole('button', { name: /signing in/i })).toBeInTheDocument();
  });

  it('should disable form fields during loading', async () => {
    const mockSignIn = vi.mocked(signIn.email);
    mockSignIn.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => {
            resolve({ data: { user: { id: '1' } }, error: null });
          }, 100),
        ),
    );

    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'TestPass123');

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(submitButton);

    expect(emailInput).toBeDisabled();
    expect(passwordInput).toBeDisabled();
  });
});
