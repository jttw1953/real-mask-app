import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ForgotPassword from '../../../src/pages/ForgotPassword';

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('ForgotPassword Page', () => {
  const mockOnSubmit = jest.fn();
  const mockOnBack = jest.fn();

  beforeEach(() => {
    mockNavigate.mockClear();
    mockOnSubmit.mockClear();
    mockOnBack.mockClear();
  });

  function setup(props = {}) {
    render(
      <MemoryRouter>
        <ForgotPassword {...props} />
      </MemoryRouter>
    );
  }

  test('renders forgot password form with email input', () => {
    setup();

    const emailInput = screen.getByPlaceholderText(/Enter Email/i);
    const getPasswordButton = screen.getByRole('button', { name: /Get Password/i });

    expect(emailInput).toBeInTheDocument();
    expect(getPasswordButton).toBeInTheDocument();
  });

  test('renders instruction text', () => {
    setup();

    const instruction = screen.getByText(/Enter your email to get a link to reset your password/i);
    expect(instruction).toBeInTheDocument();
  });

  test('Get Password button is disabled when email is empty', () => {
    setup();

    const getPasswordButton = screen.getByRole('button', { name: /Get Password/i });
    expect(getPasswordButton).toBeDisabled();
  });

  test('Get Password button is disabled with invalid email', () => {
    setup();

    const emailInput = screen.getByPlaceholderText(/Enter Email/i);
    const getPasswordButton = screen.getByRole('button', { name: /Get Password/i });

    fireEvent.change(emailInput, { target: { value: 'invalidemail' } });

    expect(getPasswordButton).toBeDisabled();
  });

  test('Get Password button is enabled with valid email', () => {
    setup();

    const emailInput = screen.getByPlaceholderText(/Enter Email/i);
    const getPasswordButton = screen.getByRole('button', { name: /Get Password/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    expect(getPasswordButton).toBeEnabled();
  });

  test('calls onSubmit prop when form is submitted with valid email', async () => {
    mockOnSubmit.mockResolvedValue(undefined);
    setup({ onSubmit: mockOnSubmit });

    const emailInput = screen.getByPlaceholderText(/Enter Email/i);
    const getPasswordButton = screen.getByRole('button', { name: /Get Password/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(getPasswordButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith('test@example.com');
    });
  });

  test('shows loading state during submission', async () => {
    mockOnSubmit.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );
    setup({ onSubmit: mockOnSubmit });

    const emailInput = screen.getByPlaceholderText(/Enter Email/i);
    const getPasswordButton = screen.getByRole('button', { name: /Get Password/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(getPasswordButton);

    expect(screen.getByText(/Sending\.\.\./i)).toBeInTheDocument();
  });

  test('calls onBack prop when Go Back button is clicked', () => {
    setup({ onBack: mockOnBack });

    const goBackButton = screen.getByRole('button', { name: /Go Back/i });
    fireEvent.click(goBackButton);

    expect(mockOnBack).toHaveBeenCalled();
  });

  test('uses window.history.back when onBack prop is not provided', () => {
    const mockHistoryBack = jest.fn();
    window.history.back = mockHistoryBack;

    setup();

    const goBackButton = screen.getByRole('button', { name: /Go Back/i });
    fireEvent.click(goBackButton);

    expect(mockHistoryBack).toHaveBeenCalled();
  });

  test('prevents submission when email is invalid', () => {
    setup({ onSubmit: mockOnSubmit });

    const emailInput = screen.getByPlaceholderText(/Enter Email/i);
    const form = emailInput.closest('form');

    fireEvent.change(emailInput, { target: { value: 'invalidemail' } });
    fireEvent.submit(form!);

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  test('trims email before submission', async () => {
    mockOnSubmit.mockResolvedValue(undefined);
    setup({ onSubmit: mockOnSubmit });

    const emailInput = screen.getByPlaceholderText(/Enter Email/i);
    const getPasswordButton = screen.getByRole('button', { name: /Get Password/i });

    fireEvent.change(emailInput, { target: { value: '  test@example.com  ' } });
    fireEvent.click(getPasswordButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith('test@example.com');
    });
  });
});