import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ResetPassword from '../../../src/pages/ResetPassword';

// -------- Shared mocks / state --------

const mockNavigate = jest.fn();
let mockToken: string | null = 'valid-token';

// -------- Router + layout mocks --------

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useSearchParams: () => [
    {
      get: (key: string) => (key === 'token' ? mockToken : null),
    },
    jest.fn(),
  ],
}));

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

// -------- Global fetch mock --------

beforeAll(() => {
  (globalThis as any).fetch = jest.fn();
});

// -------- Timers + reset between tests --------

beforeEach(() => {
  jest.useFakeTimers();
  mockNavigate.mockReset();
  mockToken = 'valid-token';
  (globalThis.fetch as jest.Mock).mockReset();
});

afterEach(() => {
  jest.useRealTimers();
});

// -------- Tests --------

describe('ResetPasswordConfirm page', () => {
  test('when token is missing: shows warning and disables reset button', async () => {
    mockToken = null;

    render(<ResetPassword />);

    const warning = await screen.findByText(/appears to be missing or invalid/i);
    expect(warning).toBeTruthy();

    const resetButton = screen.getByText(/Reset Password/i) as HTMLButtonElement;
    expect(resetButton.disabled).toBe(true);

    // No fetch call should happen
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  test('empty fields: shows validation error and does not call fetch', async () => {
    render(<ResetPassword />);

    const resetButton = screen.getByText(/Reset Password/i);
    fireEvent.click(resetButton);

    const error = await screen.findByText(
      /Please enter and confirm your new password/i
    );
    expect(error).toBeTruthy();

    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  test('short password: shows length error and does not call fetch', async () => {
    render(<ResetPassword />);

    const inputs = screen.getAllByPlaceholderText(/new password/i);
    const passwordInput = inputs[0]; // "Enter new password"
    const confirmInput = inputs[1];  // "Re-enter new password"
    const resetButton = screen.getByText(/Reset Password/i);

    fireEvent.change(passwordInput, { target: { value: '1234567' } });
    fireEvent.change(confirmInput, { target: { value: '1234567' } });
    fireEvent.click(resetButton);

    const error = await screen.findByText(
      /Password must be at least 8 characters/i
    );
    expect(error).toBeTruthy();

    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  test('mismatched passwords: shows mismatch error and does not call fetch', async () => {
    render(<ResetPassword />);

    const passwordInput = screen.getByLabelText(/New Password/i);
    const confirmInput = screen.getByLabelText(/Confirm Password/i);
    const resetButton = screen.getByText(/Reset Password/i);

    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmInput, { target: { value: 'different456' } });
    fireEvent.click(resetButton);

    const error = await screen.findByText(/Passwords do not match/i);
    expect(error).toBeTruthy();

    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  test('successful reset: calls API, shows success, then navigates to /login', async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    render(<ResetPassword />);

    const passwordInput = screen.getByLabelText(/New Password/i);
    const confirmInput = screen.getByLabelText(/Confirm Password/i);
    const resetButton = screen.getByText(/Reset Password/i);

    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmInput, { target: { value: 'password123' } });
    fireEvent.click(resetButton);

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalled();
    });

    const [url, options] = (globalThis.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe('/api/auth/reset-password/confirm');
    expect(options.method).toBe('POST');

    const body = JSON.parse(options.body);
    expect(body.token).toBe('valid-token');
    expect(body.password).toBe('password123');

    // Success message appears
    const successMessage = await screen.findByText(
      /Your password has been updated successfully/i
    );
    expect(successMessage).toBeTruthy();

    // After 1200ms, navigate to /login
    jest.advanceTimersByTime(1200);
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  test('API error: shows backend error message and does not navigate', async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Invalid or expired token' }),
    });

    render(<ResetPassword />);

    const passwordInput = screen.getByLabelText(/New Password/i);
    const confirmInput = screen.getByLabelText(/Confirm Password/i);
    const resetButton = screen.getByText(/Reset Password/i);

    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmInput, { target: { value: 'password123' } });
    fireEvent.click(resetButton);

    const error = await screen.findByText(/Invalid or expired token/i);
    expect(error).toBeTruthy();

    // Should not redirect to login
    expect(mockNavigate).not.toHaveBeenCalledWith('/login');
  });

  test('clicking "Back to Login" navigates to /login immediately', () => {
    render(<ResetPassword />);

    const backButton = screen.getByText(/Back to Login/i);
    fireEvent.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });
});