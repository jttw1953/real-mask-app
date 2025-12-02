import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Login from '../../../src/pages/Login';
import { supabase } from '../../../src/components/supabaseAuth';

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock supabase
jest.mock('../../../src/components/supabaseAuth', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      signInWithPassword: jest.fn(),
    },
  },
}));

describe('Login Page', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    jest.clearAllMocks();
    
    // Default mock: no existing session
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: null },
    });
  });

  function setup() {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
  }

  test('renders login form with email and password inputs', () => {
    setup();

    const emailInput = screen.getByPlaceholderText(/Enter your email/i);
    const passwordInput = screen.getByPlaceholderText(/Enter your password/i);
    const signInButton = screen.getByRole('button', { name: /Sign In/i });

    expect(emailInput).toBeInTheDocument();
    expect(passwordInput).toBeInTheDocument();
    expect(signInButton).toBeInTheDocument();
  });

  test('renders title and description', () => {
    setup();

    const title = screen.getByText(/Welcome Back/i);
    const description = screen.getByText(/Sign in to your account/i);

    expect(title).toBeInTheDocument();
    expect(description).toBeInTheDocument();
  });

  test('sign in button is disabled when fields are empty', () => {
    setup();

    const signInButton = screen.getByRole('button', { name: /Sign In/i });
    expect(signInButton).toBeDisabled();
  });

  test('sign in button is enabled when both fields are filled', () => {
    setup();

    const emailInput = screen.getByPlaceholderText(/Enter your email/i);
    const passwordInput = screen.getByPlaceholderText(/Enter your password/i);
    const signInButton = screen.getByRole('button', { name: /Sign In/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(signInButton).toBeEnabled();
  });

  test('navigates to signup page when Sign Up button is clicked', () => {
    setup();

    const signUpButton = screen.getByRole('button', { name: /Sign Up/i });
    fireEvent.click(signUpButton);

    expect(mockNavigate).toHaveBeenCalledWith('/signup');
  });

  test('navigates to join-as-guest when guest button is clicked', () => {
    setup();

    const guestButton = screen.getByRole('button', { name: /Join meeting as guest/i });
    fireEvent.click(guestButton);

    expect(mockNavigate).toHaveBeenCalledWith('/join-as-guest');
  });

  test('navigates to forgot password page when link is clicked', () => {
    setup();

    const forgotPasswordLink = screen.getByText(/Forgot Password\?/i);
    fireEvent.click(forgotPasswordLink);

    expect(mockNavigate).toHaveBeenCalledWith('/forgot-password');
  });

  test('successful login navigates to menu', async () => {
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      error: null,
      data: { user: { id: '123' } },
    });

    setup();

    const emailInput = screen.getByPlaceholderText(/Enter your email/i);
    const passwordInput = screen.getByPlaceholderText(/Enter your password/i);
    const signInButton = screen.getByRole('button', { name: /Sign In/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(signInButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/menu');
    });
  });

  test('shows loading state during sign in', async () => {
    (supabase.auth.signInWithPassword as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ error: null }), 100))
    );

    setup();

    const emailInput = screen.getByPlaceholderText(/Enter your email/i);
    const passwordInput = screen.getByPlaceholderText(/Enter your password/i);
    const signInButton = screen.getByRole('button', { name: /Sign In/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(signInButton);

    expect(screen.getByText(/Signing In\.\.\./i)).toBeInTheDocument();
  });
});