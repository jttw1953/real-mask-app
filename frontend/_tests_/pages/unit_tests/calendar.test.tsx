import { render, screen, fireEvent } from '@testing-library/react';
import CalendarView from '../../../src/pages/Calendar';
import { MemoryRouter } from 'react-router-dom';

// --- Mocks ---

// We'll control meetings via this variable
let mockMeetings: any[] = [];

// Mock useAppData to return our mock meetings
jest.mock('../../../src/components/useAppData', () => ({
  useAppData: () => ({ meetings: mockMeetings }),
}));

// Mock time utils so we don't depend on real time formatting
jest.mock('../../../src/assets/timeUtils', () => ({
  utcToLocal: (iso: string) => new Date(iso),
  formatMeetingTime: (_iso: string) => '10:00 AM',
}));

// Mock date-fns format to avoid ESM issues; we don't assert on this text
jest.mock('date-fns', () => ({
  format: (_date: Date, _fmt: string) => 'Wed 1/15',
}));

// --- Setup global time so "today" is stable in tests ---

beforeAll(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2025-01-15T10:00:00Z')); // today = Jan 15, 2025
});

afterAll(() => {
  jest.useRealTimers();
});

beforeEach(() => {
  // reset meetings before each test
  mockMeetings = [];
});

// --- Tests ---

describe('US15: Calendar view scheduling', () => {
  test('shows "No meetings" when there are no meetings for the selected date', () => {
    // mockMeetings is empty
    render(
      <MemoryRouter>
        <CalendarView />
      </MemoryRouter>
    );


    
    const noMeetings = screen.getByText(/No meetings/i);
    expect(noMeetings).toBeTruthy();
  });

  test('shows meetings in sidebar when there is a meeting on the selected date', () => {
    // Meeting on 2025-01-15 (today / default selected)
    mockMeetings = [
      {
        id: '1',
        meeting_title: 'Team Standup',
        meeting_time: '2025-01-15T09:00:00Z',
      },
    ];

    render(
      <MemoryRouter>
        <CalendarView />
      </MemoryRouter>
    );

    // Sidebar should list this meeting instead of "No meetings"
    const title = screen.getByText('Team Standup');
    const time = screen.getByText('10:00 AM'); // from mocked formatMeetingTime

    expect(title).toBeTruthy();
    expect(time).toBeTruthy();

    const noMeetings = screen.queryByText(/No meetings/i);
    expect(noMeetings).toBeNull();
  });

  test('clicking another day updates the sidebar to show meetings for that day', () => {
    // Meeting on Jan 10, 2025 (not today)
    mockMeetings = [
      {
        id: '2',
        meeting_title: 'Client Call',
        meeting_time: '2025-01-10T14:00:00Z',
      },
    ];

    
    
    render(
      <MemoryRouter>
        <CalendarView />
      </MemoryRouter>
    );

    // Initially selected date is Jan 15; that date has no meetings
    const initialNoMeetings = screen.getByText(/No meetings/i);
    expect(initialNoMeetings).toBeTruthy();

    // Click on the "10" day button in the calendar
    const day10Button = screen.getByRole('button', { name: '10' });
    fireEvent.click(day10Button);

    // Now the sidebar should show the meeting for the 10th
    const title = screen.getByText('Client Call');
    const time = screen.getByText('10:00 AM');

    expect(title).toBeTruthy();
    expect(time).toBeTruthy();

    const noMeetings = screen.queryByText(/No meetings/i);
    expect(noMeetings).toBeNull();
  });
});