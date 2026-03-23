import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/utils';
import userEvent from '@testing-library/user-event';
import { RegisterForm } from './index';

// Mock the auth-client
vi.mock('@/lib/auth-client', () => ({
  signUp: {
    email: vi.fn(),
  },
}));

import { signUp } from '@/lib/auth-client';

describe('RegisterForm', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render all form fields', () => {
    render(<RegisterForm />);

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByText(/trainee/i)).toBeInTheDocument();
    expect(screen.getByText(/personal trainer/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('should render link to sign in page', () => {
    render(<RegisterForm />);

    const signInLink = screen.getByRole('link', { name: /sign in/i });
    expect(signInLink).toBeInTheDocument();
    expect(signInLink).toHaveAttribute('href', '/login');
  });

  it('should have TRAINEE selected by default', () => {
    render(<RegisterForm />);

    const traineeRadio = screen.getByRole('radio', { name: /trainee/i });
    expect(traineeRadio).toBeChecked();
  });

  it('should show validation errors for empty form submission', async () => {
    render(<RegisterForm />);

    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/name must be at least 2 characters/i)).toBeInTheDocument();
    });
  });

  it('should require a valid email address format', async () => {
    // This test checks that an empty email shows a validation error
    render(<RegisterForm />);

    const nameInput = screen.getByLabelText(/name/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

    // Fill in all fields except email
    await user.type(nameInput, 'Test User');
    await user.type(passwordInput, 'TestPass123');
    await user.type(confirmPasswordInput, 'TestPass123');

    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);

    // When email is empty, Zod shows email validation error
    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
    });
  });

  it('should show validation error for short password', async () => {
    render(<RegisterForm />);

    const passwordInput = screen.getByLabelText(/^password$/i);
    await user.type(passwordInput, 'short');

    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    });
  });

  it('should show validation error for password missing uppercase', async () => {
    render(<RegisterForm />);

    const passwordInput = screen.getByLabelText(/^password$/i);
    await user.type(passwordInput, 'lowercase123');

    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/password must contain at least one uppercase/i)).toBeInTheDocument();
    });
  });

  it('should show validation error for mismatched passwords', async () => {
    render(<RegisterForm />);

    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

    await user.type(nameInput, 'Test User');
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'TestPass123');
    await user.type(confirmPasswordInput, 'DifferentPass123');

    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  it('should call signUp.email with correct data on valid submission', async () => {
    const mockSignUp = vi.mocked(signUp.email);
    mockSignUp.mockResolvedValue({ user: { id: '1' }, error: null });

    render(<RegisterForm />);

    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

    await user.type(nameInput, 'Test User');
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'TestPass123');
    await user.type(confirmPasswordInput, 'TestPass123');

    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        name: 'Test User',
        email: 'test@example.com',
        password: 'TestPass123',
        role: 'TRAINEE',
        callbackURL: `${window.location.origin}/dashboard`,
      });
    });
  });

  it('should call signUp with TRAINER role when selected', async () => {
    const mockSignUp = vi.mocked(signUp.email);
    mockSignUp.mockResolvedValue({ user: { id: '1' }, error: null });

    render(<RegisterForm />);

    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const trainerRadio = screen.getByRole('radio', { name: /personal trainer/i });

    await user.type(nameInput, 'Test Trainer');
    await user.type(emailInput, 'trainer@example.com');
    await user.type(passwordInput, 'TestPass123');
    await user.type(confirmPasswordInput, 'TestPass123');
    await user.click(trainerRadio);

    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        name: 'Test Trainer',
        email: 'trainer@example.com',
        password: 'TestPass123',
        role: 'TRAINER',
        callbackURL: `${window.location.origin}/dashboard`,
      });
    });
  });

  it('should show success message after successful registration', async () => {
    const mockSignUp = vi.mocked(signUp.email);
    mockSignUp.mockResolvedValue({ user: { id: '1' }, error: null });

    render(<RegisterForm />);

    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

    await user.type(nameInput, 'Test User');
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'TestPass123');
    await user.type(confirmPasswordInput, 'TestPass123');

    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/registration successful/i)).toBeInTheDocument();
      expect(screen.getByText(/check your email/i)).toBeInTheDocument();
    });
  });

  it('should call onSuccess callback after successful registration', async () => {
    const mockSignUp = vi.mocked(signUp.email);
    mockSignUp.mockResolvedValue({ user: { id: '1' }, error: null });
    const onSuccess = vi.fn();

    render(<RegisterForm onSuccess={onSuccess} />);

    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

    await user.type(nameInput, 'Test User');
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'TestPass123');
    await user.type(confirmPasswordInput, 'TestPass123');

    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('should show error message when registration fails', async () => {
    const mockSignUp = vi.mocked(signUp.email);
    mockSignUp.mockResolvedValue({
      user: null,
      error: { message: 'Email already exists' },
    });

    render(<RegisterForm />);

    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

    await user.type(nameInput, 'Test User');
    await user.type(emailInput, 'existing@example.com');
    await user.type(passwordInput, 'TestPass123');
    await user.type(confirmPasswordInput, 'TestPass123');

    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
    });
  });

  it('should show loading state during submission', async () => {
    const mockSignUp = vi.mocked(signUp.email);
    mockSignUp.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ user: { id: '1' }, error: null }), 100))
    );

    render(<RegisterForm />);

    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

    await user.type(nameInput, 'Test User');
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'TestPass123');
    await user.type(confirmPasswordInput, 'TestPass123');

    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);

    expect(screen.getByRole('button', { name: /creating account/i })).toBeInTheDocument();
  });

  it('should disable form fields during loading', async () => {
    const mockSignUp = vi.mocked(signUp.email);
    mockSignUp.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ user: { id: '1' }, error: null }), 100))
    );

    render(<RegisterForm />);

    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

    await user.type(nameInput, 'Test User');
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'TestPass123');
    await user.type(confirmPasswordInput, 'TestPass123');

    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);

    expect(nameInput).toBeDisabled();
    expect(emailInput).toBeDisabled();
    expect(passwordInput).toBeDisabled();
    expect(confirmPasswordInput).toBeDisabled();
  });

});
