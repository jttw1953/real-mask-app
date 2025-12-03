import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Signup from '../../src/pages/Signup';

// Mock the navigate function
const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock the GuestNavbar component
jest.mock('../../src/components/GuestNavBar', () => ({
  __esModule: true,
  default: () => <div data-testid="guest-navbar">GuestNavbar</div>,
}));

describe('Signup Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    // Reset fetch mock
    global.fetch = jest.fn();
  });

  it('should redirect to /login after successful signup', async () => {
    // Mock successful API response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(
      <BrowserRouter>
        <Signup />
      </BrowserRouter>
    );

    // Fill in the form
    const firstNameInput = screen.getByLabelText(/first name/i);
    const lastNameInput = screen.getByLabelText(/last name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password:/i);
    const confirmPasswordInput = screen.getByLabelText(/reconfirm password/i);

    fireEvent.change(firstNameInput, { target: { value: 'John' } });
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john.doe@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'Password123!' } });

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitButton);

    // Wait for the navigation to be called
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    // Verify the API was called with correct data
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/create-user',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: 'John Doe',
          email: 'john.doe@example.com',
          password: 'Password123!',
        }),
      }
    );
  });

  it('should not redirect when signup fails', async () => {
    // Mock failed API response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Email already exists' }),
    });

    render(
      <BrowserRouter>
        <Signup />
      </BrowserRouter>
    );

    // Fill in the form
    fireEvent.change(screen.getByLabelText(/first name/i), {
      target: { value: 'John' },
    });
    fireEvent.change(screen.getByLabelText(/last name/i), {
      target: { value: 'Doe' },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'john.doe@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/^password:/i), {
      target: { value: 'Password123!' },
    });
    fireEvent.change(screen.getByLabelText(/reconfirm password/i), {
      target: { value: 'Password123!' },
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
    });

    // Verify navigation was NOT called
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('should not redirect when network error occurs', async () => {
    // Mock network error
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(
      <BrowserRouter>
        <Signup />
      </BrowserRouter>
    );

    // Fill in the form
    fireEvent.change(screen.getByLabelText(/first name/i), {
      target: { value: 'John' },
    });
    fireEvent.change(screen.getByLabelText(/last name/i), {
      target: { value: 'Doe' },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'john.doe@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/^password:/i), {
      target: { value: 'Password123!' },
    });
    fireEvent.change(screen.getByLabelText(/reconfirm password/i), {
      target: { value: 'Password123!' },
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    // Wait for error message to appear
    await waitFor(() => {
      expect(
        screen.getByText(/an unexpected error occurred/i)
      ).toBeInTheDocument();
    });

    // Verify navigation was NOT called
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});