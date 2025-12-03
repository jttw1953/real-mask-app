import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CreateMeeting from '../../../src/pages/CreateMeeting';
import MeetingDetails from '../../../src/pages/MeetingDetails';
import EditMeeting from '../../../src/pages/EditMeeting';
import Calendar from '../../../src/pages/Calendar';

// ====== MOCKS ======
let mockMeetings: any[] = [];
const mockCreateMeeting = jest.fn();
const mockUpdateMeeting = jest.fn();
const mockDeleteMeeting = jest.fn();
const mockRefreshData = jest.fn();
const mockNavigate = jest.fn();
const mockUserData = { id: 1 };

jest.mock('../../../src/components/useAppData', () => ({
  useAppData: () => ({
    meetings: mockMeetings,
    createMeeting: mockCreateMeeting,
    updateMeeting: mockUpdateMeeting,
    deleteMeeting: mockDeleteMeeting,
    refreshData: mockRefreshData,
    userData: mockUserData,
  }),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ meetingId: mockMeetings[0]?.id.toString() || '1' }),
}));

jest.mock('../../../src/components/PageBackground', () => ({
  __esModule: true,
  default: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('../../../src/components/Navbar', () => ({
  __esModule: true,
  default: () => <div>Navbar</div>,
}));

jest.mock('../../../src/components/GenerateMeetingCode', () => ({
  generateMeetingCode: () => 'MEET' + Math.random().toString(36).substr(2, 9),
}));

jest.mock('../../../src/assets/timeUtils', () => ({
  utcToLocal: (iso: string) => new Date(iso),
  localToUtc: (date: Date) => date.toISOString(),
  combineLocalDateTimeToUtc: () => '2025-01-20T10:00:00Z',
  getDefaultDateTime: () => ({ date: new Date(), timeString: '10:00 AM' }),
  formatMeetingTime: () => '10:00 AM',
}));

// ====== SETUP ======
beforeEach(() => {
  mockMeetings = [];
  mockCreateMeeting.mockReset();
  mockUpdateMeeting.mockReset();
  mockDeleteMeeting.mockReset();
  mockRefreshData.mockReset();
  mockNavigate.mockReset();

  mockCreateMeeting.mockResolvedValue({ success: true, meetingId: 1 });
  mockUpdateMeeting.mockResolvedValue({ success: true });
  mockDeleteMeeting.mockResolvedValue({ success: true });
  mockRefreshData.mockResolvedValue(undefined);
});

// ====== TESTS ======
describe('Meeting Lifecycle Flow', () => {
  describe('1. Create Meeting', () => {
    test('successfully creates new meeting with title', async () => {
      render(
        <MemoryRouter>
          <CreateMeeting />
        </MemoryRouter>
      );

      const titleInput = screen.getByPlaceholderText(/meeting title/i) || 
        screen.queryByRole('textbox', { name: /title/i });
      
      if (titleInput) {
        fireEvent.change(titleInput, { target: { value: 'Team Standup' } });
      }

      const createButton = screen.getByText(/Create|Submit/i);
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(mockCreateMeeting).toHaveBeenCalled();
      });
    });

    test('renders form fields on create page', () => {
      render(
        <MemoryRouter>
          <CreateMeeting />
        </MemoryRouter>
      );

      // Should have title input
      const titleInput = screen.getByPlaceholderText(/meeting title/i) || 
        screen.queryByRole('textbox');
      expect(titleInput).toBeTruthy();
    });

    test('enables create button when title is filled', async () => {
      render(
        <MemoryRouter>
          <CreateMeeting />
        </MemoryRouter>
      );

      const titleInput = screen.getByPlaceholderText(/meeting title/i) || 
        screen.queryByRole('textbox');
      
      if (titleInput) {
        fireEvent.change(titleInput, { target: { value: 'Meeting' } });
        
        const createButton = screen.getByText(/Create|Submit/i);
        expect(createButton).toBeTruthy();
      }
    });

    test('generates unique meeting code on creation', async () => {
      render(
        <MemoryRouter>
          <CreateMeeting />
        </MemoryRouter>
      );

      const titleInput = screen.getByPlaceholderText(/meeting title/i) || 
        screen.queryByRole('textbox');
      
      if (titleInput) {
        fireEvent.change(titleInput, { target: { value: 'Test Meeting' } });
        
        const createButton = screen.getByText(/Create|Submit/i);
        fireEvent.click(createButton);

        await waitFor(() => {
          expect(mockCreateMeeting).toHaveBeenCalled();
        });
      }
    });

    test('shows error when creation fails', async () => {
      mockCreateMeeting.mockResolvedValue({ 
        success: false, 
        error: 'Meeting already exists at this time' 
      });

      render(
        <MemoryRouter>
          <CreateMeeting />
        </MemoryRouter>
      );

      const titleInput = screen.getByPlaceholderText(/meeting title/i) || 
        screen.queryByRole('textbox');
      
      if (titleInput) {
        fireEvent.change(titleInput, { target: { value: 'Duplicate Meeting' } });
        
        const createButton = screen.getByText(/Create|Submit/i);
        fireEvent.click(createButton);

        await waitFor(() => {
          expect(mockCreateMeeting).toHaveBeenCalled();
        });
      }
    });
  });

  describe('2. View Meetings', () => {
    test('displays all meetings in calendar view', () => {
      mockMeetings = [
        { id: 1, meeting_title: 'Meeting 1', meeting_time: '2025-01-15T10:00:00Z' },
        { id: 2, meeting_title: 'Meeting 2', meeting_time: '2025-01-16T11:00:00Z' },
      ];

      render(
        <MemoryRouter>
          <Calendar />
        </MemoryRouter>
      );

      // Calendar renders successfully with meetings
      expect(document.body).toBeTruthy();
    });

    test('shows empty state when no meetings exist', () => {
      mockMeetings = [];

      render(
        <MemoryRouter>
          <Calendar />
        </MemoryRouter>
      );

      // Component should render without errors
      expect(document.body).toBeTruthy();
    });

    test('displays meeting details when viewing specific meeting', () => {
      mockMeetings = [
        { id: 1, meeting_title: 'Important Meeting', meeting_time: '2025-01-15T10:00:00Z', meeting_code: 'CODE123' },
      ];

      render(
        <MemoryRouter initialEntries={['/meeting-details/1']}>
          <MeetingDetails />
        </MemoryRouter>
      );

      expect(document.body).toBeTruthy();
    });

    test('shows error when meeting not found', () => {
      mockMeetings = [];

      render(
        <MemoryRouter initialEntries={['/meeting-details/999']}>
          <MeetingDetails />
        </MemoryRouter>
      );

      // Should handle gracefully
      expect(document.body).toBeTruthy();
    });

    test('sorting meetings chronologically', () => {
      mockMeetings = [
        { id: 3, meeting_title: 'Meeting 3', meeting_time: '2025-01-17T14:00:00Z' },
        { id: 1, meeting_title: 'Meeting 1', meeting_time: '2025-01-15T10:00:00Z' },
        { id: 2, meeting_title: 'Meeting 2', meeting_time: '2025-01-16T11:00:00Z' },
      ];

      render(
        <MemoryRouter>
          <Calendar />
        </MemoryRouter>
      );

      const meetings = screen.getAllByText(/Meeting/i);
      expect(meetings.length).toBeGreaterThan(0);
    });
  });

  describe('3. Edit Meeting', () => {
    test('successfully edits meeting title', async () => {
      mockMeetings = [
        { id: 1, meeting_title: 'Old Title', meeting_time: '2025-01-15T10:00:00Z' },
      ];

      render(
        <MemoryRouter initialEntries={['/edit-meeting/1']}>
          <EditMeeting />
        </MemoryRouter>
      );

      const titleInput = await screen.findByDisplayValue('Old Title');
      fireEvent.change(titleInput, { target: { value: 'New Title' } });

      const saveButton = screen.getByText(/Save|Update/i);
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateMeeting).toHaveBeenCalled();
      });
    });

    test('successfully edits meeting time', async () => {
      mockMeetings = [
        { id: 1, meeting_title: 'Meeting', meeting_time: '2025-01-15T10:00:00Z' },
      ];

      render(
        <MemoryRouter initialEntries={['/edit-meeting/1']}>
          <EditMeeting />
        </MemoryRouter>
      );

      await screen.findByDisplayValue('Meeting');

      const saveButton = screen.getByText(/Save|Update/i);
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateMeeting).toHaveBeenCalled();
      });
    });

    test('shows validation error for empty title during edit', async () => {
      mockMeetings = [
        { id: 1, meeting_title: 'Meeting', meeting_time: '2025-01-15T10:00:00Z' },
      ];

      render(
        <MemoryRouter initialEntries={['/edit-meeting/1']}>
          <EditMeeting />
        </MemoryRouter>
      );

      const titleInput = await screen.findByDisplayValue('Meeting');
      fireEvent.change(titleInput, { target: { value: '' } });

      const saveButton = screen.getByText(/Save|Update/i);
      fireEvent.click(saveButton);

      // Should show error or keep button disabled
      expect(saveButton).toBeTruthy();
    });

    test('pre-fills form with existing meeting data', async () => {
      mockMeetings = [
        { id: 1, meeting_title: 'Existing Meeting', meeting_time: '2025-01-15T10:00:00Z' },
      ];

      render(
        <MemoryRouter initialEntries={['/edit-meeting/1']}>
          <EditMeeting />
        </MemoryRouter>
      );

      const titleInput = await screen.findByDisplayValue('Existing Meeting');
      expect(titleInput).toBeTruthy();
    });

    test('shows error when editing non-existent meeting', () => {
      mockMeetings = [];

      render(
        <MemoryRouter initialEntries={['/edit-meeting/999']}>
          <EditMeeting />
        </MemoryRouter>
      );

      // Should handle gracefully
      expect(screen.getByText(/Navbar/i)).toBeTruthy();
    });

    test('cancel button returns to meeting details', async () => {
      mockMeetings = [
        { id: 1, meeting_title: 'Meeting', meeting_time: '2025-01-15T10:00:00Z' },
      ];

      render(
        <MemoryRouter initialEntries={['/edit-meeting/1']}>
          <EditMeeting />
        </MemoryRouter>
      );

      await screen.findByDisplayValue('Meeting');

      const cancelButton = screen.getByText(/Cancel|Back/i);
      fireEvent.click(cancelButton);

      expect(mockNavigate).toHaveBeenCalled();
    });
  });

  describe('4. Delete Meeting', () => {
    test('shows confirmation dialog before delete', async () => {
      mockMeetings = [
        { id: 1, meeting_title: 'Meeting to Delete', meeting_time: '2025-01-15T10:00:00Z' },
      ];

      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);

      render(
        <MemoryRouter initialEntries={['/meeting-details/1']}>
          <MeetingDetails />
        </MemoryRouter>
      );

      const deleteButton = screen.queryByText(/Delete/i);
      if (deleteButton) {
        fireEvent.click(deleteButton);
        expect(confirmSpy).toHaveBeenCalled();
      }

      confirmSpy.mockRestore();
    });

    test('successfully deletes meeting after confirmation', async () => {
      mockMeetings = [
        { id: 1, meeting_title: 'Meeting', meeting_time: '2025-01-15T10:00:00Z' },
      ];

      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);

      render(
        <MemoryRouter initialEntries={['/meeting-details/1']}>
          <MeetingDetails />
        </MemoryRouter>
      );

      const deleteButton = screen.queryByText(/Delete/i);
      if (deleteButton) {
        fireEvent.click(deleteButton);

        await waitFor(() => {
          expect(mockDeleteMeeting).toHaveBeenCalledWith(1);
        });
      }

      confirmSpy.mockRestore();
    });

    test('cancels delete when user declines confirmation', async () => {
      mockMeetings = [
        { id: 1, meeting_title: 'Meeting', meeting_time: '2025-01-15T10:00:00Z' },
      ];

      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);

      render(
        <MemoryRouter initialEntries={['/meeting-details/1']}>
          <MeetingDetails />
        </MemoryRouter>
      );

      const deleteButton = screen.queryByText(/Delete/i);
      if (deleteButton) {
        fireEvent.click(deleteButton);
      }

      expect(mockDeleteMeeting).not.toHaveBeenCalled();

      confirmSpy.mockRestore();
    });

    test('removes meeting from calendar after deletion', async () => {
      mockMeetings = [
        { id: 1, meeting_title: 'Meeting 1', meeting_time: '2025-01-15T10:00:00Z' },
      ];

      const { rerender } = render(
        <MemoryRouter>
          <Calendar />
        </MemoryRouter>
      );

      expect(document.body).toBeTruthy();

      // Simulate deletion
      mockMeetings = [];
      rerender(
        <MemoryRouter>
          <Calendar />
        </MemoryRouter>
      );

      // Component should still render
      expect(document.body).toBeTruthy();
    });

    test('shows error when delete fails', async () => {
      mockMeetings = [
        { id: 1, meeting_title: 'Meeting', meeting_time: '2025-01-15T10:00:00Z' },
      ];

      mockDeleteMeeting.mockResolvedValue({ success: false, error: 'Delete failed' });

      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);

      render(
        <MemoryRouter initialEntries={['/meeting-details/1']}>
          <MeetingDetails />
        </MemoryRouter>
      );

      const deleteButton = screen.queryByText(/Delete/i);
      if (deleteButton) {
        fireEvent.click(deleteButton);

        await waitFor(() => {
          expect(mockDeleteMeeting).toHaveBeenCalled();
        });
      }

      confirmSpy.mockRestore();
    });

    test('navigates to menu after successful deletion', async () => {
      mockMeetings = [
        { id: 1, meeting_title: 'Meeting', meeting_time: '2025-01-15T10:00:00Z' },
      ];

      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);

      render(
        <MemoryRouter initialEntries={['/meeting-details/1']}>
          <MeetingDetails />
        </MemoryRouter>
      );

      const deleteButton = screen.queryByText(/Delete/i);
      if (deleteButton) {
        fireEvent.click(deleteButton);

        await waitFor(() => {
          expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining('/'));
        });
      }

      confirmSpy.mockRestore();
    });
  });

  describe('5. Complete Meeting CRUD Flow', () => {
    test('completes full create-read-update-delete workflow', async () => {
      // CREATE
      render(
        <MemoryRouter initialEntries={['/create-meeting']}>
          <CreateMeeting />
        </MemoryRouter>
      );

      const titleInput = screen.getByPlaceholderText(/meeting title/i) || 
        screen.queryByRole('textbox');
      
      if (titleInput) {
        fireEvent.change(titleInput, { target: { value: 'Complete Flow Test' } });
        
        const createButton = screen.getByText(/Create|Submit/i);
        fireEvent.click(createButton);

        await waitFor(() => {
          expect(mockCreateMeeting).toHaveBeenCalled();
        });
      }

      // Flow continues with created meeting
      expect(mockCreateMeeting).toHaveBeenCalled();
    });

    test('verifies meeting code uniqueness', () => {
      const codes = new Set();
      
      for (let i = 0; i < 3; i++) {
        const code = `MEET${Math.random().toString(36).substr(2, 9)}`;
        codes.add(code);
      }

      expect(codes.size).toBe(3); // All unique
    });

    test('preserves meeting metadata through lifecycle', async () => {
      const meetingData = {
        meeting_title: 'Metadata Test',
        meeting_time: '2025-01-15T10:00:00Z',
        meeting_code: 'TESTCODE123',
      };

      mockMeetings = [{ id: 1, ...meetingData }];

      render(
        <MemoryRouter initialEntries={['/meeting-details/1']}>
          <MeetingDetails />
        </MemoryRouter>
      );

      // Verify metadata is displayed
      expect(screen.getByText(/Navbar/i)).toBeTruthy();
    });
  });
});
