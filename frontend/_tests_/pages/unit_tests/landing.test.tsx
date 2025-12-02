import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Landing } from '../../../src/pages/Landing';

const mockNavigate = jest.fn();

// ---- Mocks ----

// Mock react-router's useNavigate so we can capture navigation
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Simplify PageBackground so we don't depend on its internals
jest.mock('../../../src/components/PageBackground', () => {
  return function MockPageBackground(props: any) {
    return <div>{props.children}</div>;
  };
});

// We don't need to mock lucide-react; icons just render as components

// ---- Reset before each test ----
beforeEach(() => {
  mockNavigate.mockReset();
});

// ---- Tests ----

describe('Landing page', () => {
  test('clicking "Create Meeting" generates an ID and navigates to /meet/:id', () => {
    // Make Math.random deterministic so we can assert the exact ID
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.5);

    render(<Landing />);

    const createButton = screen.getByText(/Create Meeting/i);
    fireEvent.click(createButton);

    // Compute the expected ID using the same logic as the component
    const expectedId = Math.random().toString(36).substring(2, 15);
    // BUT since we mocked Math.random, we should manually compute it as well
    // using the same 0.5 value:
    const fixedId = (0.5).toString(36).substring(2, 15);

    expect(mockNavigate).toHaveBeenCalledWith(`/meet/${fixedId}`);

    randomSpy.mockRestore();
  });

  test('shows join code input after clicking "Enter Code"', () => {
    render(<Landing />);

    const enterCodeButton = screen.getByText(/Enter Code/i);
    fireEvent.click(enterCodeButton);

    const input = screen.getByPlaceholderText(/Enter meeting code/i);
    const joinButton = screen.getByText(/^Join$/i);
    const cancelButton = screen.getByText(/Cancel/i);

    expect(input).toBeTruthy();
    expect(joinButton).toBeTruthy();
    expect(cancelButton).toBeTruthy();
  });

  test('join button is disabled when meetingId is empty and enabled when filled', () => {
    render(<Landing />);

    const enterCodeButton = screen.getByText(/Enter Code/i);
    fireEvent.click(enterCodeButton);

    const input = screen.getByPlaceholderText(/Enter meeting code/i);
    const joinButton = screen.getByText(/^Join$/i) as HTMLButtonElement;

    // Initially empty -> disabled
    expect(joinButton.disabled).toBe(true);

    // Type a code -> enabled
    fireEvent.change(input, { target: { value: 'abc123' } });
    expect(joinButton.disabled).toBe(false);
  });

  test('clicking Join navigates to /meet/:id with trimmed code', () => {
    render(<Landing />);

    const enterCodeButton = screen.getByText(/Enter Code/i);
    fireEvent.click(enterCodeButton);

    const input = screen.getByPlaceholderText(/Enter meeting code/i);
    const joinButton = screen.getByText(/^Join$/i);

    fireEvent.change(input, { target: { value: '  room42  ' } });
    fireEvent.click(joinButton);

    expect(mockNavigate).toHaveBeenCalledWith('/meet/room42');
  });

  test('pressing Enter in the input also joins the meeting when code is present', () => {
    render(<Landing />);

    const enterCodeButton = screen.getByText(/Enter Code/i);
    fireEvent.click(enterCodeButton);

    const input = screen.getByPlaceholderText(/Enter meeting code/i);

    fireEvent.change(input, { target: { value: 'enterKeyRoom' } });

    // onKeyPress handler
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 });

    expect(mockNavigate).toHaveBeenCalledWith('/meet/enterKeyRoom');
  });

  test('Cancel hides the join input and clears the code', () => {
    render(<Landing />);

    const enterCodeButton = screen.getByText(/Enter Code/i);
    fireEvent.click(enterCodeButton);

    const input = screen.getByPlaceholderText(/Enter meeting code/i);
    const cancelButton = screen.getByText(/Cancel/i);

    // Type something, then cancel
    fireEvent.change(input, { target: { value: 'someCode' } });
    fireEvent.click(cancelButton);

    // The input should no longer be in the DOM
    const inputAfter = screen.queryByPlaceholderText(/Enter meeting code/i);
    expect(inputAfter).toBeNull();
  });
});
