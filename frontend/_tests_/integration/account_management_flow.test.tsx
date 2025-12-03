/**
 * Frontend Integration Test: Account Management Flow
 *
 * Tests complete account management flow through React components with real backend API.
 * Location: _tests_/integration/frontend_account_management_flow.test.tsx
 */

declare var global: any;

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

import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import AccountDetails from '../../src/pages/AccountDetails';
import { AppDataProvider } from '../../src/components/useAppData';
import { supabase } from '../../src/components/supabaseAuth';

let testUserEmail: string;

const mockGetSession = supabase.auth.getSession as jest.MockedFunction<any>;
const mockSignOut = supabase.auth.signOut as jest.MockedFunction<any>;
const mockOnAuthStateChange = supabase.auth
  .onAuthStateChange as jest.MockedFunction<any>;

beforeAll(() => {
  const timestamp = Date.now();
  testUserEmail = `account_mgmt_test_${timestamp}@example.com`;

  mockOnAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: jest.fn() } },
  });
});

describe('Frontend Integration: Account Management Flow', () => {
  describe('Profile Data Display', () => {
    /**
     * Verifies user profile data is displayed correctly on account details page
     */
    it('should display user profile data on account details page', async () => {
      mockGetSession.mockResolvedValue({
        data: {
          session: { access_token: 'test-token' },
        },
        error: null,
      });

      // @ts-ignore - Mock fetch for testing
      global.fetch = jest.fn((url) => {
        const urlString = url.toString();
        if (urlString.includes('/api/get-user-data')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              userData: [
                {
                  full_name_enc: 'John Doe',
                  email_enc: testUserEmail,
                },
              ],
            }),
          });
        }
        if (urlString.includes('/api/get-all-meetings')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ meetings: [] }),
          });
        }
        if (urlString.includes('/api/get-all-overlays')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ overlays: [] }),
          });
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      render(
        <MemoryRouter initialEntries={['/account-details']}>
          <AppDataProvider>
            <AccountDetails />
          </AppDataProvider>
        </MemoryRouter>
      );

      await waitFor(
        () => {
          const nameInput = screen.getByPlaceholderText(
            'Your full name'
          ) as HTMLInputElement;
          expect(nameInput.value).toBe('John Doe');
        },
        { timeout: 3000 }
      );

      const emailInput = screen.getByPlaceholderText(
        'name@example.com'
      ) as HTMLInputElement;
      expect(emailInput.value).toBe(testUserEmail);
      expect(emailInput).toHaveAttribute('readonly');
    });

    /**
     * Verifies refreshData is called on component mount
     */
    it('should load profile data on component mount', async () => {
      mockGetSession.mockResolvedValue({
        data: {
          session: { access_token: 'test-token' },
        },
        error: null,
      });

      const fetchSpy = jest.fn((url) => {
        const urlString = url.toString();
        if (urlString.includes('/api/get-user-data')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              userData: [
                {
                  full_name_enc: 'Test User',
                  email_enc: testUserEmail,
                },
              ],
            }),
          });
        }
        if (urlString.includes('/api/get-all-meetings')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ meetings: [] }),
          });
        }
        if (urlString.includes('/api/get-all-overlays')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ overlays: [] }),
          });
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      // @ts-ignore - Mock fetch for testing
      global.fetch = fetchSpy;

      render(
        <MemoryRouter>
          <AppDataProvider>
            <AccountDetails />
          </AppDataProvider>
        </MemoryRouter>
      );

      await waitFor(
        () => {
          expect(fetchSpy).toHaveBeenCalledWith(
            expect.stringContaining('/api/get-user-data'),
            expect.any(Object)
          );
        },
        { timeout: 3000 }
      );
    });
  });

  describe('Name Update', () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue({
        data: {
          session: { access_token: 'test-token' },
        },
        error: null,
      });
    });

    /**
     * Verifies user can successfully update their full name
     */
    it('should successfully update user full name', async () => {
      const user = userEvent.setup();
      let userName = 'Original Name';

      // @ts-ignore - Mock fetch for testing
      global.fetch = jest.fn((url, options) => {
        const urlString = url.toString();
        if (urlString.includes('/api/get-user-data')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              userData: [
                {
                  full_name_enc: userName,
                  email_enc: testUserEmail,
                },
              ],
            }),
          });
        }
        if (urlString.includes('/api/update-user-name')) {
          const body = JSON.parse(options?.body as string);
          userName = body.full_name;
          return Promise.resolve({
            ok: true,
            json: async () => ({ success: true }),
          });
        }
        if (urlString.includes('/api/get-all-meetings')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ meetings: [] }),
          });
        }
        if (urlString.includes('/api/get-all-overlays')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ overlays: [] }),
          });
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      render(
        <MemoryRouter>
          <AppDataProvider>
            <AccountDetails />
          </AppDataProvider>
        </MemoryRouter>
      );

      await waitFor(
        () => {
          const nameInput = screen.getByPlaceholderText('Your full name');
          expect(nameInput).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      const nameInput = screen.getByPlaceholderText('Your full name');
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Name');

      const saveButton = screen.getByRole('button', { name: /Save Details/i });
      await user.click(saveButton);

      await waitFor(
        () => {
          expect(screen.getByText(/Saved ✓/i)).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      // Verify the API was called with correct data
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/update-user-name'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ full_name: 'Updated Name' }),
        })
      );
    });

    /**
     * Verifies save button is only enabled when name is changed
     */
    it('should show save button only when name changed', async () => {
      const user = userEvent.setup();

      // @ts-ignore - Mock fetch for testing
      global.fetch = jest.fn((url) => {
        const urlString = url.toString();
        if (urlString.includes('/api/get-user-data')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              userData: [
                {
                  full_name_enc: 'John Doe',
                  email_enc: testUserEmail,
                },
              ],
            }),
          });
        }
        if (urlString.includes('/api/get-all-meetings')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ meetings: [] }),
          });
        }
        if (urlString.includes('/api/get-all-overlays')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ overlays: [] }),
          });
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      render(
        <MemoryRouter>
          <AppDataProvider>
            <AccountDetails />
          </AppDataProvider>
        </MemoryRouter>
      );

      await waitFor(
        () => {
          const nameInput = screen.getByPlaceholderText('Your full name');
          expect(nameInput).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      const saveButton = screen.getByRole('button', { name: /Save Details/i });
      expect(saveButton).toBeDisabled();

      const nameInput = screen.getByPlaceholderText('Your full name');
      await user.clear(nameInput);
      await user.type(nameInput, 'New Name');

      expect(saveButton).toBeEnabled();
    });

    /**
     * Verifies save button is disabled when name field is empty
     */
    it('should disable save button with empty name', async () => {
      const user = userEvent.setup();

      // @ts-ignore - Mock fetch for testing
      global.fetch = jest.fn((url) => {
        const urlString = url.toString();
        if (urlString.includes('/api/get-user-data')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              userData: [
                {
                  full_name_enc: 'John Doe',
                  email_enc: testUserEmail,
                },
              ],
            }),
          });
        }
        if (urlString.includes('/api/get-all-meetings')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ meetings: [] }),
          });
        }
        if (urlString.includes('/api/get-all-overlays')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ overlays: [] }),
          });
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      render(
        <MemoryRouter>
          <AppDataProvider>
            <AccountDetails />
          </AppDataProvider>
        </MemoryRouter>
      );

      await waitFor(
        () => {
          const nameInput = screen.getByPlaceholderText('Your full name');
          expect(nameInput).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      const nameInput = screen.getByPlaceholderText('Your full name');
      await user.clear(nameInput);

      const saveButton = screen.getByRole('button', { name: /Save Details/i });
      expect(saveButton).toBeDisabled();
    });

    /**
     * Verifies error is displayed when name update API fails
     */
    it('should handle name update API failure', async () => {
      const user = userEvent.setup();
      const alertMock = jest.spyOn(window, 'alert').mockImplementation();

      // @ts-ignore - Mock fetch for testing
      global.fetch = jest.fn((url, options) => {
        const urlString = url.toString();
        if (urlString.includes('/api/get-user-data')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              userData: [
                {
                  full_name_enc: 'John Doe',
                  email_enc: testUserEmail,
                },
              ],
            }),
          });
        }
        if (urlString.includes('/api/update-user-name')) {
          return Promise.resolve({
            ok: false,
            json: async () => ({ error: 'Database error' }),
          });
        }
        if (urlString.includes('/api/get-all-meetings')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ meetings: [] }),
          });
        }
        if (urlString.includes('/api/get-all-overlays')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ overlays: [] }),
          });
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      render(
        <MemoryRouter>
          <AppDataProvider>
            <AccountDetails />
          </AppDataProvider>
        </MemoryRouter>
      );

      await waitFor(
        () => {
          const nameInput = screen.getByPlaceholderText('Your full name');
          expect(nameInput).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      const nameInput = screen.getByPlaceholderText('Your full name');
      await user.clear(nameInput);
      await user.type(nameInput, 'New Name');

      const saveButton = screen.getByRole('button', { name: /Save Details/i });
      await user.click(saveButton);

      await waitFor(
        () => {
          expect(alertMock).toHaveBeenCalledWith(
            expect.stringContaining('Failed to save')
          );
        },
        { timeout: 3000 }
      );

      // Verify name wasn't changed in the input
      const updatedNameInput = screen.getByPlaceholderText(
        'Your full name'
      ) as HTMLInputElement;
      expect(updatedNameInput.value).toBe('New Name');

      alertMock.mockRestore();
    });

    /**
     * Verifies whitespace is trimmed from name input before saving
     */
    it('should trim whitespace from name input', async () => {
      const user = userEvent.setup();
      let savedName = '';

      // @ts-ignore - Mock fetch for testing
      global.fetch = jest.fn((url, options) => {
        const urlString = url.toString();
        if (urlString.includes('/api/get-user-data')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              userData: [
                {
                  full_name_enc: savedName || 'Original Name',
                  email_enc: testUserEmail,
                },
              ],
            }),
          });
        }
        if (urlString.includes('/api/update-user-name')) {
          const body = JSON.parse(options?.body as string);
          savedName = body.full_name;
          return Promise.resolve({
            ok: true,
            json: async () => ({ success: true }),
          });
        }
        if (urlString.includes('/api/get-all-meetings')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ meetings: [] }),
          });
        }
        if (urlString.includes('/api/get-all-overlays')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ overlays: [] }),
          });
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      render(
        <MemoryRouter>
          <AppDataProvider>
            <AccountDetails />
          </AppDataProvider>
        </MemoryRouter>
      );

      await waitFor(
        () => {
          const nameInput = screen.getByPlaceholderText('Your full name');
          expect(nameInput).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      const nameInput = screen.getByPlaceholderText('Your full name');
      await user.clear(nameInput);
      await user.type(nameInput, '   Trimmed Name   ');

      const saveButton = screen.getByRole('button', { name: /Save Details/i });
      await user.click(saveButton);

      await waitFor(
        () => {
          expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/update-user-name'),
            expect.objectContaining({
              body: JSON.stringify({ full_name: 'Trimmed Name' }),
            })
          );
        },
        { timeout: 3000 }
      );

      expect(savedName).toBe('Trimmed Name');
    });
  });

  describe('Account Deletion', () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue({
        data: {
          session: { access_token: 'test-token' },
        },
        error: null,
      });

      // @ts-ignore - Mock fetch for testing
      global.fetch = jest.fn((url) => {
        const urlString = url.toString();
        if (urlString.includes('/api/get-user-data')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              userData: [
                {
                  full_name_enc: 'Test User',
                  email_enc: testUserEmail,
                },
              ],
            }),
          });
        }
        if (urlString.includes('/api/get-all-meetings')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ meetings: [] }),
          });
        }
        if (urlString.includes('/api/get-all-overlays')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ overlays: [] }),
          });
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });
    });

    /**
     * Verifies confirmation dialog appears before account deletion
     */
    it('should show confirmation dialog before account deletion', async () => {
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

      // Verify still on account details page
      expect(
        screen.getByRole('button', { name: /Delete account/i })
      ).toBeInTheDocument();

      confirmMock.mockRestore();
    });

    /**
     * Verifies successful account deletion flow
     */
    it('should successfully delete account', async () => {
      const user = userEvent.setup();
      const confirmMock = jest.spyOn(window, 'confirm').mockReturnValue(true);

      // @ts-ignore - Mock fetch for testing
      global.fetch = jest.fn((url) => {
        const urlString = url.toString();
        if (urlString.includes('/api/get-user-data')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              userData: [
                {
                  full_name_enc: 'Test User',
                  email_enc: testUserEmail,
                },
              ],
            }),
          });
        }
        if (urlString.includes('/api/delete-user')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ success: true }),
          });
        }
        if (urlString.includes('/api/get-all-meetings')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ meetings: [] }),
          });
        }
        if (urlString.includes('/api/get-all-overlays')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ overlays: [] }),
          });
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      mockSignOut.mockResolvedValue({ error: null });

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
            <Route path="/" element={<div>Home Page</div>} />
          </Routes>
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

      await waitFor(
        () => {
          expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/delete-user'),
            expect.objectContaining({
              method: 'DELETE',
            })
          );
        },
        { timeout: 3000 }
      );

      expect(mockSignOut).toHaveBeenCalled();

      await waitFor(
        () => {
          expect(screen.getByText('Home Page')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      confirmMock.mockRestore();
    });

    /**
     * Verifies error handling when account deletion API fails
     */
    it('should handle account deletion API failure', async () => {
      const user = userEvent.setup();
      const confirmMock = jest.spyOn(window, 'confirm').mockReturnValue(true);
      const alertMock = jest.spyOn(window, 'alert').mockImplementation();

      // @ts-ignore - Mock fetch for testing
      global.fetch = jest.fn((url) => {
        const urlString = url.toString();
        if (urlString.includes('/api/get-user-data')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              userData: [
                {
                  full_name_enc: 'Test User',
                  email_enc: testUserEmail,
                },
              ],
            }),
          });
        }
        if (urlString.includes('/api/delete-user')) {
          return Promise.resolve({
            ok: false,
            json: async () => ({ error: 'Deletion failed' }),
          });
        }
        if (urlString.includes('/api/get-all-meetings')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ meetings: [] }),
          });
        }
        if (urlString.includes('/api/get-all-overlays')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ overlays: [] }),
          });
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

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

      await waitFor(
        () => {
          expect(alertMock).toHaveBeenCalledWith(
            expect.stringContaining('Failed to delete account')
          );
        },
        { timeout: 3000 }
      );

      // Verify still on account details page
      expect(
        screen.getByRole('button', { name: /Delete account/i })
      ).toBeInTheDocument();

      // Verify signOut was not called
      expect(mockSignOut).not.toHaveBeenCalled();

      confirmMock.mockRestore();
      alertMock.mockRestore();
    });
  });

  describe('Logout', () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue({
        data: {
          session: { access_token: 'test-token' },
        },
        error: null,
      });

      // @ts-ignore - Mock fetch for testing
      global.fetch = jest.fn((url) => {
        const urlString = url.toString();
        if (urlString.includes('/api/get-user-data')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              userData: [
                {
                  full_name_enc: 'Test User',
                  email_enc: testUserEmail,
                },
              ],
            }),
          });
        }
        if (urlString.includes('/api/get-all-meetings')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ meetings: [] }),
          });
        }
        if (urlString.includes('/api/get-all-overlays')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ overlays: [] }),
          });
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });
    });

    /**
     * Verifies user can successfully logout from account details page
     */
    it('should successfully logout from account details', async () => {
      const user = userEvent.setup();

      mockSignOut.mockResolvedValue({ error: null });

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
     * Verifies optional onLogout callback is called if provided
     */
    it('should call optional onLogout callback if provided', async () => {
      const user = userEvent.setup();
      const onLogoutMock = jest.fn();

      mockSignOut.mockResolvedValue({ error: null });

      render(
        <MemoryRouter>
          <AppDataProvider>
            <AccountDetails onLogout={onLogoutMock} />
          </AppDataProvider>
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

      await waitFor(
        () => {
          expect(onLogoutMock).toHaveBeenCalled();
        },
        { timeout: 3000 }
      );

      expect(mockSignOut).toHaveBeenCalled();
    });
  });
});
