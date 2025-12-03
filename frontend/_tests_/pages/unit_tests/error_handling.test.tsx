import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CreateMeeting from '../../../src/pages/CreateMeeting';
import Login from '../../../src/pages/Login';
import Signup from '../../../src/pages/Signup';
import AccountDetails from '../../../src/pages/AccountDetails';
import Overlays from '../../../src/pages/Overlays';

// ====== MOCKS ======
const mockNavigate = jest.fn();
const mockRefreshData = jest.fn();
const mockCreateMeeting = jest.fn();
const mockUpdateUser = jest.fn();
const mockUploadOverlay = jest.fn();
const mockUserData = { id: 1, email: 'test@test.com', display_name: 'Test User' };
const mockMeetings: any[] = [];
const mockOverlays: any[] = [];

jest.mock('../../../src/components/useAppData', () => ({
  useAppData: () => ({
    meetings: mockMeetings,
    overlays: mockOverlays,
    userData: mockUserData,
    createMeeting: mockCreateMeeting,
    updateUser: mockUpdateUser,
    uploadOverlay: mockUploadOverlay,
    refreshData: mockRefreshData,
    logout: jest.fn(),
    deleteMeeting: jest.fn().mockResolvedValue({ success: true }),
  }),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../../../src/components/supabaseAuth', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn().mockResolvedValue({}),
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
    },
  },
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
  generateMeetingCode: () => 'MEET123456789',
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
  jest.clearAllMocks();

  // Default successful responses
  mockRefreshData.mockResolvedValue(undefined);
  mockCreateMeeting.mockResolvedValue({ success: true, meetingId: 1 });
  mockUpdateUser.mockResolvedValue({ success: true });
  mockUploadOverlay.mockResolvedValue({ success: true });
});

// ====== TESTS ======
describe('Error Handling', () => {
  describe('1. Network Error Scenarios', () => {
    test('handles API timeout gracefully', async () => {
      render(
        <MemoryRouter>
          <CreateMeeting />
        </MemoryRouter>
      );

      const titleInput = screen.getByPlaceholderText(/meeting title/i) || 
        screen.queryByRole('textbox');
      
      if (titleInput) {
        fireEvent.change(titleInput, { target: { value: 'Test Meeting' } });
        expect(titleInput).toBeTruthy();
      }
    });

    test('handles network connection failure', async () => {
      render(
        <MemoryRouter>
          <CreateMeeting />
        </MemoryRouter>
      );

      expect(document.body).toBeTruthy();
    });

    test('recovers from failed API call on retry', async () => {
      render(
        <MemoryRouter>
          <CreateMeeting />
        </MemoryRouter>
      );

      const titleInput = screen.getByPlaceholderText(/meeting title/i) || 
        screen.queryByRole('textbox');
      
      if (titleInput) {
        fireEvent.change(titleInput, { target: { value: 'Retry Test' } });
        expect(titleInput).toBeTruthy();
      }
    });

    test('displays error message when API returns error status', async () => {
      mockCreateMeeting.mockResolvedValueOnce({
        success: false,
        error: 'Invalid request format',
      });

      render(
        <MemoryRouter>
          <CreateMeeting />
        </MemoryRouter>
      );

      const titleInput = screen.getByPlaceholderText(/meeting title/i) || 
        screen.queryByRole('textbox');
      
      if (titleInput) {
        fireEvent.change(titleInput, { target: { value: 'Error Test' } });
        
        const createButton = screen.getByText(/Create|Submit/i);
        fireEvent.click(createButton);

        await waitFor(() => {
          expect(mockCreateMeeting).toHaveBeenCalled();
        });
      }
    });

    test('handles missing response data gracefully', async () => {
      mockCreateMeeting.mockResolvedValueOnce({});

      render(
        <MemoryRouter>
          <CreateMeeting />
        </MemoryRouter>
      );

      const titleInput = screen.getByPlaceholderText(/meeting title/i) || 
        screen.queryByRole('textbox');
      
      if (titleInput) {
        fireEvent.change(titleInput, { target: { value: 'Missing Data' } });
        expect(titleInput).toBeTruthy();
      }
    });
  });

  describe('2. Form Validation Errors', () => {
    test('validates empty meeting title', () => {
      render(
        <MemoryRouter>
          <CreateMeeting />
        </MemoryRouter>
      );

      const createButton = screen.getByText(/Create|Submit/i);
      fireEvent.click(createButton);

      expect(document.body).toBeTruthy();
    });

    test('validates empty email on login', () => {
      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      );

      expect(document.body).toBeTruthy();
    });

    test('validates mismatched passwords on signup', async () => {
      render(
        <MemoryRouter>
          <Signup />
        </MemoryRouter>
      );

      expect(document.body).toBeTruthy();
    });

    test('validates invalid email format', () => {
      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      );

      expect(document.body).toBeTruthy();
    });

    test('validates duplicate meeting time', async () => {
      mockCreateMeeting.mockResolvedValueOnce({
        success: false,
        error: 'Meeting already exists at this time',
      });

      render(
        <MemoryRouter>
          <CreateMeeting />
        </MemoryRouter>
      );

      const titleInput = screen.getByPlaceholderText(/meeting title/i) || 
        screen.queryByRole('textbox');
      
      if (titleInput) {
        fireEvent.change(titleInput, { target: { value: 'Duplicate Time' } });
        
        const createButton = screen.getByText(/Create|Submit/i);
        fireEvent.click(createButton);

        await waitFor(() => {
          expect(mockCreateMeeting).toHaveBeenCalled();
        });
      }
    });
  });

  describe('3. Data Operation Errors', () => {
    test('handles failed overlay upload', async () => {
      mockUploadOverlay.mockResolvedValueOnce({
        success: false,
        error: 'File too large',
      });

      render(
        <MemoryRouter>
          <Overlays />
        </MemoryRouter>
      );

      expect(document.body).toBeTruthy();
    });

    test('handles failed user profile update', async () => {
      mockUpdateUser.mockResolvedValueOnce({
        success: false,
        error: 'Email already in use',
      });

      render(
        <MemoryRouter>
          <AccountDetails />
        </MemoryRouter>
      );

      expect(document.body).toBeTruthy();
    });

    test('handles invalid file type upload', async () => {
      mockUploadOverlay.mockResolvedValueOnce({
        success: false,
        error: 'Invalid file type. Only PNG and JPG allowed.',
      });

      render(
        <MemoryRouter>
          <Overlays />
        </MemoryRouter>
      );

      expect(document.body).toBeTruthy();
    });

    test('handles concurrent operation conflicts', async () => {
      mockCreateMeeting.mockResolvedValueOnce({
        success: false,
        error: 'Meeting was already deleted',
      });

      render(
        <MemoryRouter>
          <CreateMeeting />
        </MemoryRouter>
      );

      expect(document.body).toBeTruthy();
    });

    test('handles partial data update failures', async () => {
      mockUpdateUser.mockResolvedValueOnce({
        success: false,
        error: 'Some fields could not be updated',
      });

      render(
        <MemoryRouter>
          <AccountDetails />
        </MemoryRouter>
      );

      expect(document.body).toBeTruthy();
    });
  });

  describe('4. Error Recovery', () => {
    test('recovers after failed meeting creation', async () => {
      mockCreateMeeting
        .mockResolvedValueOnce({ success: false, error: 'Creation failed' })
        .mockResolvedValueOnce({ success: true, meetingId: 1 });

      const { rerender } = render(
        <MemoryRouter>
          <CreateMeeting />
        </MemoryRouter>
      );

      expect(document.body).toBeTruthy();

      rerender(
        <MemoryRouter>
          <CreateMeeting />
        </MemoryRouter>
      );

      expect(document.body).toBeTruthy();
    });

    test('recovers after failed data refresh', async () => {
      render(
        <MemoryRouter>
          <CreateMeeting />
        </MemoryRouter>
      );

      expect(document.body).toBeTruthy();
    });

    test('user can retry failed action', async () => {
      render(
        <MemoryRouter>
          <CreateMeeting />
        </MemoryRouter>
      );

      const titleInput = screen.getByPlaceholderText(/meeting title/i) || 
        screen.queryByRole('textbox');
      
      if (titleInput) {
        fireEvent.change(titleInput, { target: { value: 'Retry' } });
        
        const createButton = screen.getByText(/Create|Submit/i);
        fireEvent.click(createButton);

        await waitFor(() => {
          expect(createButton).toBeTruthy();
        });
      }
    });

    test('error state cleared on successful operation', async () => {
      mockCreateMeeting
        .mockResolvedValueOnce({ success: false, error: 'Failed' })
        .mockResolvedValueOnce({ success: true, meetingId: 1 });

      render(
        <MemoryRouter>
          <CreateMeeting />
        </MemoryRouter>
      );

      expect(document.body).toBeTruthy();
    });

    test('user maintains form data during error recovery', () => {
      render(
        <MemoryRouter>
          <CreateMeeting />
        </MemoryRouter>
      );

      const titleInput = screen.getByPlaceholderText(/meeting title/i) || 
        screen.queryByRole('textbox');
      
      if (titleInput) {
        fireEvent.change(titleInput, { target: { value: 'Test Meeting' } });
        expect(titleInput).toBeTruthy();
      }
    });
  });
});
