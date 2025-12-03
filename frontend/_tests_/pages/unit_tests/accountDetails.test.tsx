import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AccountDetails from '../../../src/pages/AccountDetails';

// ---------- Define mocks BEFORE jest.mock to avoid hoisting issues ----------

const mockUpdateUserName = jest.fn();
const mockDeleteUser = jest.fn();
const mockRefreshData = jest.fn();
const mockNavigate = jest.fn();

const mockOnLogout = jest.fn();
const mockOnDelete = jest.fn();

// ---------- Shared mocks / state ----------

let mockUserData: any;

// ---------- Module mocks ----------

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

jest.mock('../../../src/components/useAppData', () => ({
  useAppData: () => ({
    userData: mockUserData,
    updateUserName: mockUpdateUserName,
    deleteUser: mockDeleteUser,
    refreshData: mockRefreshData,
  }),
}));

jest.mock('../../../src/components/supabaseAuth', () => ({
  supabase: {
    auth: {
      signOut: jest.fn(),
    },
  },
}));

// Simplify layout components so we don't depend on their implementation
jest.mock('../../../src/components/PageBackground', () => {
  return function MockPageBackground(props: any) {
    return <div>{props.children}</div>;
  };
});

jest.mock('../../../src/components/Navbar', () => {
  return function MockNavbar() {
    return <div>Navbar</div>;
  };
});

// Get reference to the mocked signOut function
import { supabase } from '../../../src/components/supabaseAuth';
const mockSignOut = supabase.auth.signOut as jest.Mock;

// Simplify layout components so we don't depend on their implementation
jest.mock('../../../src/components/PageBackground', () => {
  return function MockPageBackground(props: any) {
    return <div>{props.children}</div>;
  };
});

jest.mock('../../../src/components/Navbar', () => {
  return function MockNavbar() {
    return <div>Navbar</div>;
  };
});

// ---------- Reset before each test ----------

beforeEach(() => {
  mockUserData = {
    full_name_enc: 'Alice Example',
    email_enc: 'alice@example.com',
  };

  mockUpdateUserName.mockReset();
  mockUpdateUserName.mockResolvedValue({ success: true });

  mockDeleteUser.mockReset();
  mockDeleteUser.mockResolvedValue({ success: true });

  mockRefreshData.mockReset();
  mockRefreshData.mockResolvedValue(undefined);

  mockNavigate.mockReset();
  mockSignOut.mockReset();
  mockOnLogout.mockReset();
  mockOnDelete.mockReset();
});

// ---------- Tests ----------

describe('AccountDetails page', () => {
  test('loads user data and pre-fills name and email', async () => {
    render(
      <AccountDetails onLogout={mockOnLogout} onDelete={mockOnDelete} />
    );

    // refreshData should be called on mount
    expect(mockRefreshData).toHaveBeenCalled();

    // Name and email fields should reflect mockUserData
    const nameInput = await screen.findByDisplayValue('Alice Example');
    const emailInput = screen.getByDisplayValue('alice@example.com');

    expect(nameInput).toBeTruthy();
    expect(emailInput).toBeTruthy();
  });

  test('save button is disabled if name is unchanged', async () => {
    render(
      <AccountDetails onLogout={mockOnLogout} onDelete={mockOnDelete} />
    );

    await screen.findByDisplayValue('Alice Example');

    const saveButton = screen.getByText(/Save Details/i);
    // unchanged, so should be disabled
    expect((saveButton as HTMLButtonElement).disabled).toBe(true);
  });

  test('enables save button when name is changed and calls updateUserName on submit', async () => {
    render(
      <AccountDetails onLogout={mockOnLogout} onDelete={mockOnDelete} />
    );

    const nameInput = await screen.findByDisplayValue('Alice Example');
    const saveButton = screen.getByText(/Save Details/i);

    // Change name
    fireEvent.change(nameInput, { target: { value: 'Alice NewName' } });

    // Button should now be enabled
    expect((saveButton as HTMLButtonElement).disabled).toBe(false);

    // Submit form
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateUserName).toHaveBeenCalledWith('Alice NewName');
    });

    // After success, button text briefly becomes "Saved ✓"
    await waitFor(() => {
      const savedButton = screen.getByText(/Saved ✓/i);
      expect(savedButton).toBeTruthy();
    });
  });

  test('logout calls supabase signOut and onLogout callback', async () => {
    render(
      <AccountDetails onLogout={mockOnLogout} onDelete={mockOnDelete} />
    );

    const logoutButton = await screen.findByText(/Logout/i);
    fireEvent.click(logoutButton);

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
      expect(mockOnLogout).toHaveBeenCalled();
    });

    // We do NOT expect navigate here; comment says redirect handled by AuthComponent
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('delete account: cancel from confirm does not call deleteUser', async () => {
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);

    render(
      <AccountDetails onLogout={mockOnLogout} onDelete={mockOnDelete} />
    );

    const deleteButton = await screen.findByText(/Delete account/i);
    fireEvent.click(deleteButton);

    expect(confirmSpy).toHaveBeenCalled();
    expect(mockDeleteUser).not.toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  test('delete account: confirm then deleteUser succeeds, calls onDelete and navigates home', async () => {
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);

    render(
      <AccountDetails onLogout={mockOnLogout} onDelete={mockOnDelete} />
    );

    const deleteButton = await screen.findByText(/Delete account/i);
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(mockDeleteUser).toHaveBeenCalled();
    });

    expect(mockOnDelete).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/');

    confirmSpy.mockRestore();
  });

  test('reset password button navigates to /reset-password', async () => {
    render(
      <AccountDetails onLogout={mockOnLogout} onDelete={mockOnDelete} />
    );

    const resetButton = await screen.findByText(/Reset Password/i);
    fireEvent.click(resetButton);

    expect(mockNavigate).toHaveBeenCalledWith('/reset-password');
  });
});