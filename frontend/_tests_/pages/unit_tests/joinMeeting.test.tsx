import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import JoinMeeting from '../../../src/pages/JoinMeeting';

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

    const heading = screen.getByText(/Join a Meeting/i);
    const input = screen.getByPlaceholderText(/https:\/\/yourapp\.com\/meeting\/abc123.*or.*abc123/i);

    expect(heading).toBeInTheDocument();
    expect(input).toBeInTheDocument();
  });

  test('shows an error when submitting empty input', () => {
    setup();

    const button = screen.getByText(/Continue/i);
    fireEvent.click(button);

    const error = screen.getByText(/Please paste a valid meeting link or ID/i);
    expect(error).toBeInTheDocument();
  });

  test('accepts a valid bare meeting ID (no error shown)', () => {
    setup();

    const input = screen.getByPlaceholderText(/https:\/\/yourapp\.com\/meeting\/abc123.*or.*abc123/i);
    fireEvent.change(input, { target: { value: 'abc1234' } });

    const button = screen.getByText(/Continue/i);
    fireEvent.click(button);

    expect(screen.queryByText(/Please paste a valid meeting link or ID/i)).not.toBeInTheDocument();
  });

  test('accepts a full meeting link (no error shown)', () => {
    setup();

    const input = screen.getByPlaceholderText(/https:\/\/yourapp\.com\/meeting\/abc123.*or.*abc123/i);
    fireEvent.change(input, {
      target: { value: 'https://yourapp.com/meet/abc1234' },
    });

    const button = screen.getByText(/Continue/i);
    fireEvent.click(button);

    expect(screen.queryByText(/Please paste a valid meeting link or ID/i)).not.toBeInTheDocument();
  });
});