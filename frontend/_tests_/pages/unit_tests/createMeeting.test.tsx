import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CreateMeeting from '../../../src/pages/CreateMeeting';

// ---------- Shared mocks / state ----------

let mockMeetings: any[] = [];
const mockCreateMeeting = jest.fn();
const mockRefreshData = jest.fn();
const mockNavigate = jest.fn();
const mockUserData = { id: 123 }; // pretend user UUID

let mockGetDefaultDateTime: () => { date: Date; timeString: string };
let mockCombineLocalDateTimeToUtc: (date: Date, time: string) => string;
let mockGenerateMeetingCode: (date: Date, time: string, userId: number) => string;

const mockOnCreate = jest.fn();
const mockOnBack = jest.fn();

// ---------- Module mocks ----------

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

jest.mock('../../../src/components/useAppData', () => ({
  useAppData: () => ({
    meetings: mockMeetings,
    createMeeting: mockCreateMeeting,
    userData: mockUserData,
    refreshData: mockRefreshData,
  }),
}));

jest.mock('../../../src/assets/timeUtils', () => ({
  getDefaultDateTime: () => mockGetDefaultDateTime(),
  combineLocalDateTimeToUtc: (date: Date, time: string) =>
    mockCombineLocalDateTimeToUtc(date, time),
}));

jest.mock('../../../src/components/GenerateMeetingCode', () => ({
  generateMeetingCode: (date: Date, time: string, userId: number) =>
    mockGenerateMeetingCode(date, time, userId),
}));

// Simplify layout components
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
  // Default date/time used in form
  mockGetDefaultDateTime = () => ({
    date: new Date('2025-01-10T09:00:00Z'),
    timeString: '10:00 AM',
  });

  mockCombineLocalDateTimeToUtc = jest.fn(
    () => '2025-01-10T09:00:00Z' // UTC string for that local date/time
  );

  mockGenerateMeetingCode = jest.fn(() => 'MEETCODE123');

  mockMeetings = [];

  mockCreateMeeting.mockReset();
  mockCreateMeeting.mockResolvedValue({ success: true, meetingId: 7 });

  mockRefreshData.mockReset();
  mockRefreshData.mockResolvedValue(undefined);

  mockNavigate.mockReset();
  mockOnCreate.mockReset();
  mockOnBack.mockReset();
});

// ---------- Tests ----------

describe('CreateMeeting page', () => {
  test('calls refreshData on mount', () => {
    render(<CreateMeeting />);

    expect(mockRefreshData).toHaveBeenCalled();
  });

  test('shows error when title is empty and does not call createMeeting', async () => {
    render(<CreateMeeting />);

    const button = screen.getByText(/Create Meeting/i);
    fireEvent.click(button);

    const error = await screen.findByText(/Please enter a meeting title/i);
    expect(error).toBeTruthy();

    expect(mockCreateMeeting).not.toHaveBeenCalled();
  });

  test('blocks creation when there is a duplicate meeting time', async () => {
    // Existing meeting at the same timestamp as the new one
    mockMeetings = [
      {
        id: 1,
        meeting_title: 'Existing Meeting',
        meeting_time: '2025-01-10T09:00:00Z',
      },
    ];

    render(<CreateMeeting />);

    const titleInput = screen.getByPlaceholderText(/Enter Meeting Title/i);
    fireEvent.change(titleInput, { target: { value: 'New Meeting' } });

    const button = screen.getByText(/Create Meeting/i);
    fireEvent.click(button);

    const error = await screen.findByText(
      /A meeting is already scheduled at this date and time/i
    );
    expect(error).toBeTruthy();

    expect(mockCreateMeeting).not.toHaveBeenCalled();
  });

  test('on success: calls createMeeting, onCreate, and navigates to meeting-details', async () => {
    render(
      <CreateMeeting onCreate={mockOnCreate} onBack={mockOnBack} />
    );

    const titleInput = screen.getByPlaceholderText(/Enter Meeting Title/i);
    fireEvent.change(titleInput, { target: { value: 'Strategy Sync' } });

    const button = screen.getByText(/Create Meeting/i);
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockCreateMeeting).toHaveBeenCalled();
    });

    // Check createMeeting args
    const [meetingCode, meetingTimeUtc, title] =
      mockCreateMeeting.mock.calls[0];

    expect(meetingCode).toBe('MEETCODE123');
    expect(meetingTimeUtc).toBe('2025-01-10T09:00:00Z');
    expect(title).toBe('Strategy Sync');

    // Meeting code generator uses date + time + userData.id
    expect(mockGenerateMeetingCode).toHaveBeenCalledWith(
      expect.any(Date),
      '10:00 AM',
      mockUserData.id
    );

    // onCreate callback called with payload
    expect(mockOnCreate).toHaveBeenCalled();

    const payload = mockOnCreate.mock.calls[0][0];
    expect(payload.title).toBe('Strategy Sync');
    expect(payload.timeLabel).toBe('10:00 AM');
    expect(payload.date instanceof Date).toBe(true);

    // Navigates to meeting-details with returned ID
    expect(mockNavigate).toHaveBeenCalledWith('/meeting-details/7');
  });

  test('shows error when createMeeting fails', async () => {
    mockCreateMeeting.mockResolvedValueOnce({
      success: false,
      error: 'Backend issue',
    });

    render(<CreateMeeting />);

    const titleInput = screen.getByPlaceholderText(/Enter Meeting Title/i);
    fireEvent.change(titleInput, { target: { value: 'Fail Meeting' } });

    const button = screen.getByText(/Create Meeting/i);
    fireEvent.click(button);

    const error = await screen.findByText(/Backend issue/i);
    expect(error).toBeTruthy();

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('Go Back uses onBack when provided', () => {
    render(
      <CreateMeeting onCreate={mockOnCreate} onBack={mockOnBack} />
    );

    const backButton = screen.getByText(/Go Back/i);
    fireEvent.click(backButton);

    expect(mockOnBack).toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('Go Back navigates to /menu when onBack is not provided', () => {
    render(<CreateMeeting />);

    const backButton = screen.getByText(/Go Back/i);
    fireEvent.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith('/menu');
  });
});
