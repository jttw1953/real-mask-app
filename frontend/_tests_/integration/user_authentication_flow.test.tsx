/**
 * Frontend Integration Test: User Authentication Flow
 *
 * Tests complete authentication flow through React components with mocked backend API.
 * Location: _tests_/integration/frontend_user_authentication_flow.test.tsx
 */

// Mock fetch globally before any imports
global.fetch = jest.fn();

jest.mock('../../src/components/supabaseAuth', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
      admin: {
        deleteUser: jest.fn(),
        getUserById: jest.fn(),
      },
    },
  },
}));

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import Signup from '../../src/pages/Signup';
import Login from '../../src/pages/Login';
import AccountDetails from '../../src/pages/AccountDetails';
import { AppDataProvider } from '../../src/components/useAppData';
import { supabase } from '../../src/components/supabaseAuth';

const API_URL = 'http://localhost:3000';
let testUserEmail: string;
let testPassword: string;

const mockSignInWithPassword = supabase.auth
  .signInWithPassword as jest.MockedFunction<any>;
const mockGetSession = supabase.auth.getSession as jest.MockedFunction<any>;
const mockSignOut = supabase.auth.signOut as jest.MockedFunction<any>;
const mockOnAuthStateChange = supabase.auth
  .onAuthStateChange as jest.MockedFunction<any>;

beforeAll(() => {
  const timestamp = Date.now();
  testUserEmail = `frontend_test_${timestamp}@example.com`;
  testPassword = 'TestPassword123!';

  mockGetSession.mockResolvedValue({
    data: { session: null },
    error: null,
  });

  mockOnAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: jest.fn() } },
  });
});

beforeEach(() => {
  (global.fetch as jest.Mock).mockClear();
});

describe('Frontend Integration: User Authentication Flow', () => {
  describe('Signup Page', () => {
    /**
     * Verifies successful user registration with all valid fields and navigation to login
     */
    it('should successfully create new user account and navigate to login', async () => {
      const user = userEvent.setup();

      // Mock successful signup
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(
        <MemoryRouter initialEntries={['/signup']}>
          <Routes>
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<div>Login Page</div>} />
          </Routes>
        </MemoryRouter>
      );

      const firstNameInput = screen.getByPlaceholderText(
        'Enter your first name'
      );
      const lastNameInput = screen.getByPlaceholderText('Enter your last name');
      const emailInput = screen.getByPlaceholderText('Enter your email');
      const passwordInput = screen.getByPlaceholderText('Create a password');
      const confirmPasswordInput = screen.getByPlaceholderText(
        'Re-enter your password'
      );

      await user.type(firstNameInput, 'Frontend');
      await user.type(lastNameInput, 'Test');
      await user.type(emailInput, testUserEmail);
      await user.type(passwordInput, testPassword);
      await user.type(confirmPasswordInput, testPassword);

      const createButton = screen.getByRole('button', {
        name: /Create account/i,
      });
      await user.click(createButton);

      await waitFor(
        () => {
          expect(screen.getByText('Login Page')).toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    });

    /**
     * Verifies password mismatch validation displays error message
     */
    it('should display validation error when passwords do not match', async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter initialEntries={['/signup']}>
          <Signup />
        </MemoryRouter>
      );

      const passwordInput = screen.getByPlaceholderText('Create a password');
      const confirmPasswordInput = screen.getByPlaceholderText(
        'Re-enter your password'
      );

      await user.type(passwordInput, 'Password123');
      await user.type(confirmPasswordInput, 'DifferentPassword');

      fireEvent.blur(confirmPasswordInput);

      await waitFor(() => {
        expect(screen.getByText("Passwords don't match.")).toBeInTheDocument();
      });
    });

    /**
     * Verifies submit button is disabled when required fields are empty
     */
    it('should disable submit button when fields are empty', () => {
      render(
        <MemoryRouter>
          <Signup />
        </MemoryRouter>
      );

      const createButton = screen.getByRole('button', {
        name: /Create account/i,
      });
      expect(createButton).toBeDisabled();
    });

    /**
     * Verifies submit button is disabled when only some fields are filled
     */
    it('should disable submit button when not all fields are filled', async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter>
          <Signup />
        </MemoryRouter>
      );

      const firstNameInput = screen.getByPlaceholderText(
        'Enter your first name'
      );
      const emailInput = screen.getByPlaceholderText('Enter your email');

      await user.type(firstNameInput, 'John');
      await user.type(emailInput, 'john@example.com');

      const createButton = screen.getByRole('button', {
        name: /Create account/i,
      });
      expect(createButton).toBeDisabled();
    });

    /**
     * Verifies API error for duplicate email displays error message and clears fields
     */
    it('should display error message on duplicate email and clear fields', async () => {
      const user = userEvent.setup();

      // Mock duplicate email error
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Email already registered' }),
      });

      render(
        <MemoryRouter initialEntries={['/signup']}>
          <Signup />
        </MemoryRouter>
      );

      const firstNameInput = screen.getByPlaceholderText(
        'Enter your first name'
      );
      const lastNameInput = screen.getByPlaceholderText('Enter your last name');
      const emailInput = screen.getByPlaceholderText('Enter your email');
      const passwordInput = screen.getByPlaceholderText('Create a password');
      const confirmPasswordInput = screen.getByPlaceholderText(
        'Re-enter your password'
      );

      await user.type(firstNameInput, 'Duplicate');
      await user.type(lastNameInput, 'User');
      await user.type(emailInput, testUserEmail);
      await user.type(passwordInput, testPassword);
      await user.type(confirmPasswordInput, testPassword);

      const createButton = screen.getByRole('button', {
        name: /Create account/i,
      });
      await user.click(createButton);

      await waitFor(
        () => {
          expect(screen.getByText(/already registered/i)).toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      expect(firstNameInput).toHaveValue('');
      expect(lastNameInput).toHaveValue('');
      expect(emailInput).toHaveValue('');
      expect(passwordInput).toHaveValue('');
      expect(confirmPasswordInput).toHaveValue('');
    });

    /**
     * Verifies Cancel button navigates to login page
     */
    it('should navigate to login when Cancel button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter initialEntries={['/signup']}>
          <Routes>
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<div>Login Page</div>} />
          </Routes>
        </MemoryRouter>
      );

      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.getByText('Login Page')).toBeInTheDocument();
      });
    });

    /**
     * Verifies password confirmation field border turns red on mismatch
     */
    it('should apply error styling to confirm password field on mismatch', async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter>
          <Signup />
        </MemoryRouter>
      );

      const passwordInput = screen.getByPlaceholderText('Create a password');
      const confirmPasswordInput = screen.getByPlaceholderText(
        'Re-enter your password'
      );

      await user.type(passwordInput, 'Password123');
      await user.type(confirmPasswordInput, 'Different');
      fireEvent.blur(confirmPasswordInput);

      await waitFor(() => {
        expect(confirmPasswordInput).toHaveClass('border-rose-500/70');
      });
    });

    /**
     * Verifies whitespace-only fields are treated as empty
     */
    it('should treat whitespace-only fields as empty', async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter>
          <Signup />
        </MemoryRouter>
      );

      const firstNameInput = screen.getByPlaceholderText(
        'Enter your first name'
      );
      const lastNameInput = screen.getByPlaceholderText('Enter your last name');
      const emailInput = screen.getByPlaceholderText('Enter your email');
      const passwordInput = screen.getByPlaceholderText('Create a password');
      const confirmPasswordInput = screen.getByPlaceholderText(
        'Re-enter your password'
      );

      await user.type(firstNameInput, '   ');
      await user.type(lastNameInput, '   ');
      await user.type(emailInput, '   ');
      await user.type(passwordInput, '   ');
      await user.type(confirmPasswordInput, '   ');

      const createButton = screen.getByRole('button', {
        name: /Create account/i,
      });
      expect(createButton).toBeDisabled();
    });
  });

  describe('Login Page', () => {
    beforeEach(() => {
      mockSignInWithPassword.mockReset();
      mockGetSession.mockReset();
      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });
    });

    /**
     * Verifies successful login with valid credentials and navigation to menu
     */
    it('should successfully login with valid credentials and navigate to menu', async () => {
      const user = userEvent.setup();

      mockSignInWithPassword.mockResolvedValueOnce({
        data: {
          session: { access_token: 'test-token' },
          user: { id: 'test-user-id' },
        },
        error: null,
      });

      render(
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/menu" element={<div>Menu Page</div>} />
          </Routes>
        </MemoryRouter>
      );

      const emailInput = screen.getByPlaceholderText('Enter your email:');
      const passwordInput = screen.getByPlaceholderText('Enter your password:');

      await user.type(emailInput, testUserEmail);
      await user.type(passwordInput, testPassword);

      const signInButton = screen.getByRole('button', { name: /Sign In/i });
      await user.click(signInButton);

      await waitFor(
        () => {
          expect(screen.getByText('Menu Page')).toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    });

    /**
     * Verifies login failure with incorrect password displays error and clears fields
     */
    it('should reject login with incorrect password and clear fields', async () => {
      const user = userEvent.setup();
      const alertMock = jest.spyOn(window, 'alert').mockImplementation();

      mockSignInWithPassword.mockResolvedValueOnce({
        data: { session: null, user: null },
        error: { message: 'Invalid credentials' },
      });

      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      );

      const emailInput = screen.getByPlaceholderText('Enter your email:');
      const passwordInput = screen.getByPlaceholderText('Enter your password:');

      await user.type(emailInput, testUserEmail);
      await user.type(passwordInput, 'WrongPassword123');

      const signInButton = screen.getByRole('button', { name: /Sign In/i });
      await user.click(signInButton);

      await waitFor(
        () => {
          expect(alertMock).toHaveBeenCalled();
        },
        { timeout: 5000 }
      );

      await waitFor(() => {
        expect(emailInput).toHaveValue('');
        expect(passwordInput).toHaveValue('');
      });

      alertMock.mockRestore();
    });

    /**
     * Verifies submit button is disabled when email or password is empty
     */
    it('should disable submit button when fields are empty', () => {
      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      );

      const signInButton = screen.getByRole('button', { name: /Sign In/i });
      expect(signInButton).toBeDisabled();
    });

    /**
     * Verifies loading state displays during login submission
     */
    it('should show loading state during login', async () => {
      const user = userEvent.setup();

      mockSignInWithPassword.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  data: { session: null, user: null },
                  error: { message: 'Test' },
                }),
              100
            )
          )
      );

      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      );

      const emailInput = screen.getByPlaceholderText('Enter your email:');
      const passwordInput = screen.getByPlaceholderText('Enter your password:');

      await user.type(emailInput, testUserEmail);
      await user.type(passwordInput, testPassword);

      const signInButton = screen.getByRole('button', { name: /Sign In/i });
      await user.click(signInButton);

      expect(screen.getByText('Signing In...')).toBeInTheDocument();
      expect(signInButton).toBeDisabled();
    });

    /**
     * Verifies navigation to signup page when Sign Up button is clicked
     */
    it('should navigate to signup page when Sign Up button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<div>Signup Page</div>} />
          </Routes>
        </MemoryRouter>
      );

      const signUpButton = screen.getByRole('button', { name: /Sign Up/i });
      await user.click(signUpButton);

      await waitFor(() => {
        expect(screen.getByText('Signup Page')).toBeInTheDocument();
      });
    });

    /**
     * Verifies navigation to forgot password page when link is clicked
     */
    it('should navigate to forgot password page when link is clicked', async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/forgot-password"
              element={<div>Forgot Password Page</div>}
            />
          </Routes>
        </MemoryRouter>
      );

      const forgotPasswordButton = screen.getByRole('button', {
        name: /Forgot Password/i,
      });
      await user.click(forgotPasswordButton);

      await waitFor(() => {
        expect(screen.getByText('Forgot Password Page')).toBeInTheDocument();
      });
    });

    /**
     * Verifies navigation to guest join page when button is clicked
     */
    it('should navigate to guest join page when button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/join-as-guest" element={<div>Guest Join Page</div>} />
          </Routes>
        </MemoryRouter>
      );

      const guestButton = screen.getByRole('button', {
        name: /Join meeting as guest/i,
      });
      await user.click(guestButton);

      await waitFor(() => {
        expect(screen.getByText('Guest Join Page')).toBeInTheDocument();
      });
    });

    /**
     * Verifies form inputs are disabled during login submission
     */
    it('should disable form inputs during login submission', async () => {
      const user = userEvent.setup();

      mockSignInWithPassword.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  data: { session: null, user: null },
                  error: { message: 'Test' },
                }),
              100
            )
          )
      );

      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      );

      const emailInput = screen.getByPlaceholderText('Enter your email:');
      const passwordInput = screen.getByPlaceholderText('Enter your password:');

      await user.type(emailInput, testUserEmail);
      await user.type(passwordInput, testPassword);

      const signInButton = screen.getByRole('button', { name: /Sign In/i });
      await user.click(signInButton);

      expect(emailInput).toBeDisabled();
      expect(passwordInput).toBeDisabled();
    });
  });

  describe('Complete Authentication Flow', () => {
    /**
     * Verifies complete flow from signup to login to accessing protected page
     */
    it('should complete full signup to login to menu flow', async () => {
      const user = userEvent.setup();
      const newEmail = `complete_flow_${Date.now()}@example.com`;

      // Mock successful signup
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      mockSignInWithPassword.mockResolvedValueOnce({
        data: {
          session: { access_token: 'test-token' },
          user: { id: 'test-user-id' },
        },
        error: null,
      });

      render(
        <MemoryRouter initialEntries={['/signup']}>
          <Routes>
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/menu" element={<div>Menu Page</div>} />
          </Routes>
        </MemoryRouter>
      );

      const firstNameInput = screen.getByPlaceholderText(
        'Enter your first name'
      );
      const lastNameInput = screen.getByPlaceholderText('Enter your last name');
      const emailInput = screen.getByPlaceholderText('Enter your email');
      const passwordInput = screen.getByPlaceholderText('Create a password');
      const confirmPasswordInput = screen.getByPlaceholderText(
        'Re-enter your password'
      );

      await user.type(firstNameInput, 'Complete');
      await user.type(lastNameInput, 'Flow');
      await user.type(emailInput, newEmail);
      await user.type(passwordInput, testPassword);
      await user.type(confirmPasswordInput, testPassword);

      const createButton = screen.getByRole('button', {
        name: /Create account/i,
      });
      await user.click(createButton);

      await waitFor(
        () => {
          expect(
            screen.getByPlaceholderText('Enter your email:')
          ).toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      const loginEmailInput = screen.getByPlaceholderText('Enter your email:');
      const loginPasswordInput = screen.getByPlaceholderText(
        'Enter your password:'
      );

      await user.type(loginEmailInput, newEmail);
      await user.type(loginPasswordInput, testPassword);

      const signInButton = screen.getByRole('button', { name: /Sign In/i });
      await user.click(signInButton);

      await waitFor(
        () => {
          expect(screen.getByText('Menu Page')).toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    });

    /**
     * Verifies user cannot login with non-existent email
     */
    it('should prevent login with non-existent email', async () => {
      const user = userEvent.setup();
      const alertMock = jest.spyOn(window, 'alert').mockImplementation();

      mockSignInWithPassword.mockResolvedValueOnce({
        data: { session: null, user: null },
        error: { message: 'Invalid credentials' },
      });

      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      );

      const emailInput = screen.getByPlaceholderText('Enter your email:');
      const passwordInput = screen.getByPlaceholderText('Enter your password:');

      await user.type(emailInput, 'nonexistent@example.com');
      await user.type(passwordInput, 'SomePassword123');

      const signInButton = screen.getByRole('button', { name: /Sign In/i });
      await user.click(signInButton);

      await waitFor(
        () => {
          expect(alertMock).toHaveBeenCalled();
        },
        { timeout: 5000 }
      );

      alertMock.mockRestore();
    });

    /**
     * Verifies session persists and redirects already-logged-in user from login page
     */
    it('should redirect to menu if already logged in when accessing login page', async () => {
      mockGetSession.mockResolvedValueOnce({
        data: {
          session: { access_token: 'existing-token' },
        },
        error: null,
      });

      render(
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/menu" element={<div>Menu Page</div>} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(
        () => {
          expect(screen.getByText('Menu Page')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });
  });

  describe('Account Management', () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue({
        data: {
          session: { access_token: 'test-token' },
        },
        error: null,
      });

      // Mock fetch for useAppData
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ meetings: [], userData: {} }),
      });
    });

    /**
     * Verifies user can successfully logout from account details page
     */
    it('should successfully logout from account details page', async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter initialEntries={['/account-details']}>
          <Routes>
            <Route
              path="/account-details"
              element={
                <AppDataProvider>
                  <AccountDetails />
                </AppDataProvider>
              }
            />
            <Route path="/login" element={<div>Login Page</div>} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(
        () => {
          expect(
            screen.getByRole('button', { name: /Logout/i })
          ).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      const logoutButton = screen.getByRole('button', { name: /Logout/i });
      await user.click(logoutButton);

      expect(mockSignOut).toHaveBeenCalled();
    });

    /**
     * Verifies confirmation dialog appears before account deletion
     */
    it('should show confirmation dialog before deleting account', async () => {
      const user = userEvent.setup();
      const confirmMock = jest.spyOn(window, 'confirm').mockReturnValue(false);

      render(
        <MemoryRouter>
          <AppDataProvider>
            <AccountDetails />
          </AppDataProvider>
        </MemoryRouter>
      );

      await waitFor(
        () => {
          expect(
            screen.getByRole('button', { name: /Delete account/i })
          ).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      const deleteButton = screen.getByRole('button', {
        name: /Delete account/i,
      });
      await user.click(deleteButton);

      expect(confirmMock).toHaveBeenCalledWith(
        expect.stringContaining(
          'Are you sure you want to permanently delete your account'
        )
      );

      confirmMock.mockRestore();
    });
  });
});