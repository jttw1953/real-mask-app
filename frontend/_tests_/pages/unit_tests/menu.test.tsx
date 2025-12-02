import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MenuPage from '../../../src/pages/Menu';

// -------- Shared mocks / state --------

const mockNavigate = jest.fn();
const mockRefreshData = jest.fn();
const mockDeleteMeeting = jest.fn();

let mockMeetings: any[] = [];
let mockUserData: any = { id: 'user-123' };

let mockGenerateInstantMeetingCode: (userId: string) => string;

// Capture CalendarWeek props to assert they’re wired correctly
let lastCalendarWeekProps: any = null;

// -------- Module mocks --------

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

jest.mock('../../../src/components/useAppData', () => ({
  useAppData: () => ({
    meetings: mockMeetings,
    deleteMeeting: mockDeleteMeeting,
    userData: mockUserData,
    refreshData: mockRefreshData,
  }),
}));

jest.mock('../../../src/components/GenerateMeetingCode', () => ({
  generateInstantMeetingCode: (userId: string) =>
    mockGenerateInstantMeetingCode(userId),
}));

jest.mock('../../../src/components/PageBackground', () => {
  return function MockPageBackground(props: any) {
    return <div>{props.children}</div>;
  };
});

jest.mock('../../../src/components/CalendarWeek', () => {
  return function MockCalendarWeek(props: any) {
    lastCalendarWeekProps = props;
    return <div>CalendarWeekMock</div>;
  };
});

// -------- Reset before each test --------

beforeEach(() => {
  mockNavigate.mockReset();
  mockRefreshData.mockReset();
  mockDeleteMeeting.mockReset();

  mockMeetings = [
    { id: 1, meeting_title: 'A', meeting_time: '2025-01-10T10:00:00Z' },
    { id: 2, meeting_title: 'B', meeting_time: '2025-01-11T10:00:00Z' },
  ];

  mockUserData = { id: 'user-123' };

  mockGenerateInstantMeetingCode = jest.fn(() => 'INSTANT123');
  lastCalendarWeekProps = null;
});

// -------- Tests --------

describe('MenuPage', () => {
  test('calls refreshData on mount', () => {
    render(<MenuPage />);

    expect(mockRefreshData).toHaveBeenCalled();
  });

  test('wires CalendarWeek with meetings and deleteMeeting callback', () => {
    render(<MenuPage />);

    expect(lastCalendarWeekProps).not.toBeNull();
    expect(lastCalendarWeekProps.meetings).toBe(mockMeetings);
    expect(lastCalendarWeekProps.onDeleteMeeting).toBe(mockDeleteMeeting);
  });

  test('Join Meeting tile navigates to /join', () => {
    render(<MenuPage />);

    const joinTile = screen.getByRole('button', { name: /Join Meeting/i });
    fireEvent.click(joinTile);

    expect(mockNavigate).toHaveBeenCalledWith('/join');
  });

  test('Create Meeting tile toggles options menu, and "Create Now" generates instant code and navigates', () => {
    render(<MenuPage />);

    const createTile = screen.getByRole('button', { name: /Create Meeting/i });
    fireEvent.click(createTile);

    const createNowButton = screen.getByText(/Create Now/i);
    expect(createNowButton).toBeTruthy();

    fireEvent.click(createNowButton);

    // generateInstantMeetingCode should be called with userData.id
    expect(mockGenerateInstantMeetingCode).toHaveBeenCalledWith('user-123');

    // Should navigate to /meet/:generatedCode
    expect(mockNavigate).toHaveBeenCalledWith('/meet/INSTANT123');
  });

  test('"Schedule for Later" navigates to /create-meeting and does not generate instant code', () => {
    render(<MenuPage />);

    const createTile = screen.getByRole('button', { name: /Create Meeting/i });
    fireEvent.click(createTile);

    const scheduleButton = screen.getByText(/Schedule for Later/i);
    fireEvent.click(scheduleButton);

    expect(mockGenerateInstantMeetingCode).not.toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/create-meeting');
  });

  test('Schedule tile navigates to /calendar', () => {
    render(<MenuPage />);

    const scheduleTile = screen.getByRole('button', { name: /^Schedule$/i });
    fireEvent.click(scheduleTile);

    expect(mockNavigate).toHaveBeenCalledWith('/calendar');
  });
});
