import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MeetingDetails from '../../../src/pages/MeetingDetails';

// -------- Shared mocks / state --------

let mockMeetings: any[] = [];
const mockRefreshData = jest.fn();
const mockNavigate = jest.fn();

let mockUserData: any = {
  full_name_enc: 'Host User',
};

let mockMeetingID = '1';

// -------- Module mocks --------

jest.mock('react-router-dom', () => ({
  useParams: () => ({ meetingID: mockMeetingID }),
  useNavigate: () => mockNavigate,
}));

jest.mock('../../../src/components/useAppData', () => ({
  useAppData: () => ({
    meetings: mockMeetings,
    userData: mockUserData,
    refreshData: mockRefreshData,
  }),
}));

// Simplify layout
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

// -------- Global clipboard mock --------

beforeAll(() => {
  // jsdom doesn't provide clipboard by default
  (globalThis as any).navigator = (globalThis as any).navigator || {};
  (globalThis as any).navigator.clipboard = {
    writeText: jest.fn().mockResolvedValue(undefined),
  };
});

// -------- Reset before each test --------

beforeEach(() => {
  mockMeetings = [];
  mockRefreshData.mockReset();
  mockNavigate.mockReset();
  mockUserData = {
    full_name_enc: 'Host User',
  };
  mockMeetingID = '1';
  (globalThis as any).navigator.clipboard.writeText.mockClear();
});

// -------- Tests --------

describe('MeetingDetails page', () => {
  test('shows fallback "Meeting not found" when no meeting matches', async () => {
    // No meetings at all
    mockMeetings = [];

    render(<MeetingDetails />);

    const notFoundText = await screen.findByText(/Meeting not found/i);
    expect(notFoundText).toBeTruthy();

    const backButton = screen.getByText(/Go Back to Menu/i);
    fireEvent.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith('/menu');
  });

  test('renders meeting details when meeting is found', async () => {
    mockMeetings = [
      {
        id: 1,
        meeting_title: 'Demo Meeting',
        meeting_time: '2025-01-10T09:30:00Z',
        meeting_code: 'ABC123',
      },
    ];

    render(<MeetingDetails />);

    // Wait for the component to load and set meeting state
    const heading = await screen.findByText(/Meeting Details/i);
    expect(heading).toBeTruthy();

    // Title row
    const titleRow = screen.getByText('Demo Meeting');
    expect(titleRow).toBeTruthy();

    // Host row (from userData.full_name_enc)
    const hostRow = screen.getByText('Host User');
    expect(hostRow).toBeTruthy();

    // It also renders a "Meeting Link" label
    const linkLabel = screen.getByText(/Meeting Link/i);
    expect(linkLabel).toBeTruthy();

    // And a link containing /meet/ABC123
    const linkText = screen.getByText((value) =>
      typeof value === 'string' && value.includes('/meet/ABC123')
    );
    expect(linkText).toBeTruthy();
  });

  test('Copy button writes meeting link to clipboard and shows "Copied"', async () => {
    mockMeetings = [
      {
        id: 1,
        meeting_title: 'Copy Test Meeting',
        meeting_time: '2025-01-10T09:30:00Z',
        meeting_code: 'COPY42',
      },
    ];

    render(<MeetingDetails />);

    await screen.findByText(/Meeting Details/i);

    const copyButton = screen.getByRole('button', { name: /Copy 📋/i });
    fireEvent.click(copyButton);

    const expectedLink = `${window.location.origin}/meet/COPY42`;
    expect(
      (globalThis as any).navigator.clipboard.writeText
    ).toHaveBeenCalledWith(expectedLink);

    // After clicking, button text should become "Copied"
    const copiedButton = await screen.findByText(/Copied/i);
    expect(copiedButton).toBeTruthy();
  });

  test('Join Meeting button navigates to /meet/:meetingCode', async () => {
    mockMeetings = [
      {
        id: 1,
        meeting_title: 'Joinable Meeting',
        meeting_time: '2025-01-10T09:30:00Z',
        meeting_code: 'JOIN789',
      },
    ];

    render(<MeetingDetails />);

    await screen.findByText(/Meeting Details/i);

    const joinButton = screen.getByText(/Join Meeting/i);
    fireEvent.click(joinButton);

    expect(mockNavigate).toHaveBeenCalledWith('/meet/JOIN789');
  });
});