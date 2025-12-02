import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Signup from '../../../src/pages/Signup';

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock fetch
const mockFetch = jest.fn();
window.fetch = mockFetch;

describe('Signup Page', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockFetch.mockClear();
  });

  function setup() {
    render(
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    );
  }

  test('renders signup form with all input fields', () => {
    setup();

    const firstNameInput = screen.getByPlaceholderText(/Enter your first name/i);
    const lastNameInput = screen.getByPlaceholderText(/Enter your last name/i);
    const emailInput = screen.getByPlaceholderText(/Enter your email/i);
    const passwordInput = screen.getByPlaceholderText(/Create a password/i);
    const confirmPasswordInput = screen.getByPlaceholderText(/Re-enter your password/i);

    expect(firstNameInput).toBeInTheDocument();
    expect(lastNameInput).toBeInTheDocument();
    expect(emailInput).toBeInTheDocument();
    expect(passwordInput).toBeInTheDocument();
    expect(confirmPasswordInput).toBeInTheDocument();
  });

  test('renders title and description', () => {
    setup();

    const title = screen.getByText(/Create your account/i);
    const description = screen.getByText(/It takes less than a minute/i);

    expect(title).toBeInTheDocument();
    expect(description).toBeInTheDocument();
  });

  test('create account button is disabled when fields are empty', () => {
    setup();

    const createButton = screen.getByRole('button', { name: /Create account/i });
    expect(createButton).toBeDisabled();
  });

  test('shows error when passwords do not match', () => {
    setup();

    const passwordInput = screen.getByPlaceholderText(/Create a password/i);
    const confirmPasswordInput = screen.getByPlaceholderText(/Re-enter your password/i);

    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'different' } });
    fireEvent.blur(confirmPasswordInput);

    expect(screen.getByText(/Passwords don't match/i)).toBeInTheDocument();
  });

  test('create account button is enabled when all fields are valid and passwords match', () => {
    setup();

    const firstNameInput = screen.getByPlaceholderText(/Enter your first name/i);
    const lastNameInput = screen.getByPlaceholderText(/Enter your last name/i);
    const emailInput = screen.getByPlaceholderText(/Enter your email/i);
    const passwordInput = screen.getByPlaceholderText(/Create a password/i);
    const confirmPasswordInput = screen.getByPlaceholderText(/Re-enter your password/i);
    const createButton = screen.getByRole('button', { name: /Create account/i });

    fireEvent.change(firstNameInput, { target: { value: 'John' } });
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });

    expect(createButton).toBeEnabled();
  });

  test('navigates to login when "Already have an account" link is clicked', () => {
    setup();

    const loginLink = screen.getByRole('link', { name: /Already have an account\? Sign in/i });
    fireEvent.click(loginLink);

    // The link uses href="/login" so it won't call navigate()
    // Instead, we should verify the href attribute
    expect(loginLink).toHaveAttribute('href', '/login');
  });

  test('navigates to login when Cancel button is clicked', () => {
    setup();

    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelButton);

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  test('successful signup navigates to login', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    setup();

    const firstNameInput = screen.getByPlaceholderText(/Enter your first name/i);
    const lastNameInput = screen.getByPlaceholderText(/Enter your last name/i);
    const emailInput = screen.getByPlaceholderText(/Enter your email/i);
    const passwordInput = screen.getByPlaceholderText(/Create a password/i);
    const confirmPasswordInput = screen.getByPlaceholderText(/Re-enter your password/i);
    const createButton = screen.getByRole('button', { name: /Create account/i });

    fireEvent.change(firstNameInput, { target: { value: 'John' } });
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  test('displays error message when signup fails', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Email already exists' }),
    });

    setup();

    const firstNameInput = screen.getByPlaceholderText(/Enter your first name/i);
    const lastNameInput = screen.getByPlaceholderText(/Enter your last name/i);
    const emailInput = screen.getByPlaceholderText(/Enter your email/i);
    const passwordInput = screen.getByPlaceholderText(/Create a password/i);
    const confirmPasswordInput = screen.getByPlaceholderText(/Re-enter your password/i);
    const createButton = screen.getByRole('button', { name: /Create account/i });

    fireEvent.change(firstNameInput, { target: { value: 'John' } });
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByText(/Email already exists/i)).toBeInTheDocument();
    });
  });

  test('clears all fields after error', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Something went wrong' }),
    });

    setup();

    const firstNameInput = screen.getByPlaceholderText(/Enter your first name/i) as HTMLInputElement;
    const lastNameInput = screen.getByPlaceholderText(/Enter your last name/i) as HTMLInputElement;
    const emailInput = screen.getByPlaceholderText(/Enter your email/i) as HTMLInputElement;
    const passwordInput = screen.getByPlaceholderText(/Create a password/i) as HTMLInputElement;
    const confirmPasswordInput = screen.getByPlaceholderText(/Re-enter your password/i) as HTMLInputElement;
    const createButton = screen.getByRole('button', { name: /Create account/i });

    fireEvent.change(firstNameInput, { target: { value: 'John' } });
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(firstNameInput.value).toBe('');
      expect(lastNameInput.value).toBe('');
      expect(emailInput.value).toBe('');
      expect(passwordInput.value).toBe('');
      expect(confirmPasswordInput.value).toBe('');
    });
  });
});