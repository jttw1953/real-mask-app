import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Start from '../../../src/pages/Start';

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('Start Page', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  function setup() {
    render(
      <MemoryRouter>
        <Start />
      </MemoryRouter>
    );
  }

  test('renders welcome message and title', () => {
    setup();

    const mainHeading = screen.getByText(/Welcome to Real Mask!/i);
    const subHeading = screen.getByText(/Connect Instantly/i);

    expect(mainHeading).toBeInTheDocument();
    expect(subHeading).toBeInTheDocument();
  });

  test('renders Get Started button', () => {
    setup();

    const button = screen.getByRole('button', { name: /Get Started/i });
    expect(button).toBeInTheDocument();
  });

  test('navigates to login when Get Started button is clicked', () => {
    setup();

    const button = screen.getByRole('button', { name: /Get Started/i });
    fireEvent.click(button);

    expect(mockNavigate).toHaveBeenCalledWith('/login');
    expect(mockNavigate).toHaveBeenCalledTimes(1);
  });
});