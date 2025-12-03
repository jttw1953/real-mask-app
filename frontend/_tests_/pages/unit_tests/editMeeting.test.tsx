import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EditMeeting from '../../../src/pages/EditMeeting';

// ----- Shared mocks / state -----

let mockMeetings: any[] = [];
const mockUpdateMeeting = jest.fn();
const mockRefreshData = jest.fn();
const mockNavigate = jest.fn();
const mockUserData = { id: 42 };

// explicit function types instead of generic jest.fn with spread
let mockCombineLocalDateTimeToUtc: (date: Date, time: string) => string;
let mockGenerateMeetingCode: (date: Date, time: string, userId: number) => string;

// ----- Module mocks -----

jest.mock('react-router-dom', () => ({
  useParams: () => ({ meetingId: '1' }),
  useNavigate: () => mockNavigate,
}));

jest.mock('../../../src/components/useAppData', () => ({
  useAppData: () => ({
    meetings: mockMeetings,
    updateMeeting: mockUpdateMeeting,
    refreshData: mockRefreshData,
    userData: mockUserData,
  }),
}));

jest.mock('../../../src/assets/timeUtils', () => ({
  utcToLocal: (iso: string) => new Date(iso),
  combineLocalDateTimeToUtc: (date: Date, time: string) =>
    mockCombineLocalDateTimeToUtc(date, time),
}));

jest.mock('../../../src/components/GenerateMeetingCode', () => ({
  generateMeetingCode: (date: Date, time: string, userId: number) =>
    mockGenerateMeetingCode(date, time, userId),
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

// ----- Reset state before each test -----

beforeEach(() => {
  mockMeetings = [
    {
      id: 1,
      meeting_title: 'Original Title',
      meeting_time: '2025-01-10T09:00:00Z',
    },
  ];

  mockUpdateMeeting.mockReset();
  mockUpdateMeeting.mockResolvedValue({ success: true });

  mockRefreshData.mockReset();
  mockRefreshData.mockResolvedValue(undefined);

  mockNavigate.mockReset();

  mockCombineLocalDateTimeToUtc = jest.fn(
    () => '2025-01-10T09:00:00Z' // same as original (no change)
  );

  mockGenerateMeetingCode = jest.fn(() => 'NEWCODE123');
});

// ----- Tests -----

describe('EditMeeting page', () => {
  test('renders meeting data when component loads', async () => {
    render(<EditMeeting />);

    // Meeting data should appear
    const titleInput = await screen.findByDisplayValue('Original Title');
    expect(titleInput).toBeTruthy();
  });

  test('shows error if meeting is not found after refresh', async () => {
    mockMeetings = []; // no meetings
    render(<EditMeeting />);

    await waitFor(() => {
      expect(screen.getByText(/Meeting not found/i)).toBeTruthy();
    });
  });

  test('shows validation error if title is empty and save is clicked', async () => {
    render(<EditMeeting />);

    // Wait for meeting to load
    const titleInput = await screen.findByDisplayValue('Original Title');

    // Clear the title
    fireEvent.change(titleInput, { target: { value: '' } });

    // Click save
    const saveButton = screen.getByText(/Save Changes/i);
    fireEvent.click(saveButton);

    // Error should appear
    const error = await screen.findByText(/Please enter a meeting title/i);
    expect(error).toBeTruthy();
  });

  test('saves meeting with new title but same date/time (no code regeneration)', async () => {
    render(<EditMeeting />);

    const titleInput = await screen.findByDisplayValue('Original Title');

    // Change title only
    fireEvent.change(titleInput, { target: { value: 'Updated Title' } });

    const saveButton = screen.getByText(/Save Changes/i);
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateMeeting).toHaveBeenCalledWith(1, {
        meeting_title: 'Updated Title',
        meeting_time: '2025-01-10T09:00:00Z',
        // No meeting_code because date/time didn't change
      });
    });

    expect(mockNavigate).toHaveBeenCalledWith('/meeting-details/1');
  });

  test('saves meeting with changed date/time and regenerates meeting code', async () => {
    // Mock that date/time will change
    mockCombineLocalDateTimeToUtc = jest.fn(() => '2025-01-15T10:00:00Z');

    render(<EditMeeting />);

    await screen.findByDisplayValue('Original Title');

    const saveButton = screen.getByText(/Save Changes/i);
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateMeeting).toHaveBeenCalledWith(1, {
        meeting_title: 'Original Title',
        meeting_time: '2025-01-15T10:00:00Z',
        meeting_code: 'NEWCODE123', // Generated because time changed
      });
    });

    expect(mockNavigate).toHaveBeenCalledWith('/meeting-details/1');
  });

  test('cancel button navigates back to meeting details', async () => {
    render(<EditMeeting />);

    await screen.findByDisplayValue('Original Title');

    const cancelButton = screen.getByText(/Cancel/i);
    fireEvent.click(cancelButton);

    expect(mockNavigate).toHaveBeenCalledWith('/meeting-details/1');
  });

  test('shows error if updateMeeting fails', async () => {
    mockUpdateMeeting.mockResolvedValue({
      success: false,
      error: 'Database error',
    });

    render(<EditMeeting />);

    const titleInput = await screen.findByDisplayValue('Original Title');
    fireEvent.change(titleInput, { target: { value: 'Updated Title' } });

    const saveButton = screen.getByText(/Save Changes/i);
    fireEvent.click(saveButton);

    const error = await screen.findByText(/Database error/i);
    expect(error).toBeTruthy();

    // Should not navigate on error
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
