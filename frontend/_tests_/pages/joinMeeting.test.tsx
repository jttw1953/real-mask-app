import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import JoinMeeting from '../../src/pages/JoinMeeting';

describe('US9: Join Meeting Page', () => {
  function setup() {
    render(
      <MemoryRouter>
        <JoinMeeting />
      </MemoryRouter>
    );
  }

  test('renders title and input field', () => {
    setup();

    expect(screen.getByText(/Join a Meeting/i)).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/paste link or enter id/i)
    ).toBeInTheDocument();
  });

  test('shows an error when submitting empty input', () => {
    setup();

    fireEvent.click(screen.getByText(/Continue/i));

    expect(
      screen.getByText(/Please paste a valid meeting link or ID/i)
    ).toBeInTheDocument();
  });

  test('accepts a valid bare meeting ID', () => {
    setup();

    fireEvent.change(screen.getByPlaceholderText(/paste link/i), {
      target: { value: 'abc1234' }
    });

    fireEvent.click(screen.getByText(/Continue/i));

    // We're not checking navigation — only that error is gone
    expect(
      screen.queryByText(/Please paste a valid meeting link/i)
    ).not.toBeInTheDocument();
  });

  test('accepts a full meeting link', () => {
    setup();

    fireEvent.change(screen.getByPlaceholderText(/paste link/i), {
      target: { value: 'https://yourapp.com/meet/abc1234' }
    });

    fireEvent.click(screen.getByText(/Continue/i));

    expect(
      screen.queryByText(/Please paste a valid meeting link/i)
    ).not.toBeInTheDocument();
  });
});
