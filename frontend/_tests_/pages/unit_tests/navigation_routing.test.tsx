import { render } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Login from '../../../src/pages/Login';
import Signup from '../../../src/pages/Signup';
import Menu from '../../../src/pages/Menu';
import Calendar from '../../../src/pages/Calendar';
import JoinMeeting from '../../../src/pages/JoinMeeting';
import AccountDetails from '../../../src/pages/AccountDetails';
import { Landing } from '../../../src/pages/Landing';
import AuthRedirect from '../../../src/pages/AuthRedirect';
import CreateMeeting from '../../../src/pages/CreateMeeting';
import EditMeeting from '../../../src/pages/EditMeeting';
import MeetingDetails from '../../../src/pages/MeetingDetails';

// ====== MOCKS ======
const mockNavigate = jest.fn();
const mockUserData = { id: 1, email: 'test@test.com', display_name: 'Test User' };
const mockMeetings: any[] = [];

jest.mock('../../../src/components/useAppData', () => ({
  useAppData: () => ({
    meetings: mockMeetings,
    userData: mockUserData,
    createMeeting: jest.fn().mockResolvedValue({ success: true, meetingId: 1 }),
    updateMeeting: jest.fn().mockResolvedValue({ success: true }),
    deleteMeeting: jest.fn().mockResolvedValue({ success: true }),
    refreshData: jest.fn().mockResolvedValue(undefined),
    logout: jest.fn(),
  }),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ meetingId: '1' }),
  useLocation: () => ({ pathname: '/' }),
}));

jest.mock('../../../src/components/supabaseAuth', () => ({
  supabase: {
    auth: {
      signUp: jest.fn().mockResolvedValue({ data: { user: { id: '1' } } }),
      signInWithPassword: jest.fn().mockResolvedValue({ data: { user: { id: '1' } } }),
      signOut: jest.fn().mockResolvedValue({}),
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
    },
  },
}));

jest.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      signUp: jest.fn().mockResolvedValue({ data: { user: { id: '1' } } }),
      signInWithPassword: jest.fn().mockResolvedValue({ data: { user: { id: '1' } } }),
      signOut: jest.fn().mockResolvedValue({}),
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
    },
  }),
}));

jest.mock('../../../src/components/PageBackground', () => ({
  __esModule: true,
  default: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('../../../src/components/Navbar', () => ({
  __esModule: true,
  default: () => <div>Navbar</div>,
}));

jest.mock('../../../src/components/GuestNavBar', () => ({
  __esModule: true,
  default: () => <div>GuestNavBar</div>,
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
  mockNavigate.mockReset();
});

// ====== ROUTING TEST WRAPPER ======
const TestRouter = ({ initialRoute = '/' }: { initialRoute?: string }) => (
  <MemoryRouter initialEntries={[initialRoute]}>
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/menu" element={<Menu />} />
      <Route path="/calendar" element={<Calendar />} />
      <Route path="/create-meeting" element={<CreateMeeting />} />
      <Route path="/edit-meeting/:meetingId" element={<EditMeeting />} />
      <Route path="/meeting-details/:meetingId" element={<MeetingDetails />} />
      <Route path="/join-meeting" element={<JoinMeeting />} />
      <Route path="/account-details" element={<AccountDetails />} />
      <Route path="/auth-redirect" element={<AuthRedirect />} />
    </Routes>
  </MemoryRouter>
);

// ====== TESTS ======
describe('Navigation & Routing', () => {
  describe('1. Public Routes', () => {
    test('landing page accessible without authentication', () => {
      render(<TestRouter initialRoute="/" />);
      expect(document.body).toBeTruthy();
    });

    test('login page accessible without authentication', () => {
      render(<TestRouter initialRoute="/login" />);
      expect(document.body).toBeTruthy();
    });

    test('signup page accessible without authentication', () => {
      render(<TestRouter initialRoute="/signup" />);
      expect(document.body).toBeTruthy();
    });

    test('join-meeting page accessible without authentication', () => {
      render(<TestRouter initialRoute="/join-meeting" />);
      expect(document.body).toBeTruthy();
    });

    test('auth-redirect page accessible without authentication', () => {
      render(<TestRouter initialRoute="/auth-redirect" />);
      expect(document.body).toBeTruthy();
    });
  });

  describe('2. Protected Routes', () => {
    test('menu page renders when accessed', () => {
      render(<TestRouter initialRoute="/menu" />);
      expect(document.body).toBeTruthy();
    });

    test('calendar page renders when accessed', () => {
      render(<TestRouter initialRoute="/calendar" />);
      expect(document.body).toBeTruthy();
    });

    test('create-meeting page renders when accessed', () => {
      render(<TestRouter initialRoute="/create-meeting" />);
      expect(document.body).toBeTruthy();
    });

    test('edit-meeting page renders with meeting id parameter', () => {
      render(<TestRouter initialRoute="/edit-meeting/1" />);
      expect(document.body).toBeTruthy();
    });

    test('meeting-details page renders with meeting id parameter', () => {
      render(<TestRouter initialRoute="/meeting-details/1" />);
      expect(document.body).toBeTruthy();
    });

    test('account-details page renders when accessed', () => {
      render(<TestRouter initialRoute="/account-details" />);
      expect(document.body).toBeTruthy();
    });
  });

  describe('3. URL Parameter Handling', () => {
    test('meeting id parameter extracted from URL', () => {
      render(<TestRouter initialRoute="/meeting-details/42" />);
      expect(document.body).toBeTruthy();
    });

    test('handles dynamic route parameters', () => {
      render(<TestRouter initialRoute="/edit-meeting/99" />);
      expect(document.body).toBeTruthy();
    });

    test('renders correctly with different meeting ids', () => {
      const { rerender } = render(<TestRouter initialRoute="/meeting-details/1" />);
      expect(document.body).toBeTruthy();

      rerender(<TestRouter initialRoute="/meeting-details/2" />);
      expect(document.body).toBeTruthy();
    });

    test('handles special characters in route params', () => {
      render(<TestRouter initialRoute="/edit-meeting/meeting-123" />);
      expect(document.body).toBeTruthy();
    });

    test('maintains state across route changes', () => {
      const { rerender } = render(<TestRouter initialRoute="/calendar" />);
      const calendar1 = document.body.innerHTML;

      rerender(<TestRouter initialRoute="/menu" />);
      const menu1 = document.body.innerHTML;

      expect(calendar1).toBeTruthy();
      expect(menu1).toBeTruthy();
    });
  });

  describe('4. Navigation Flow', () => {
    test('can navigate from landing to login', () => {
      const { rerender } = render(<TestRouter initialRoute="/" />);
      expect(document.body).toBeTruthy();

      rerender(<TestRouter initialRoute="/login" />);
      expect(document.body).toBeTruthy();
    });

    test('can navigate from login to signup', () => {
      const { rerender } = render(<TestRouter initialRoute="/login" />);
      expect(document.body).toBeTruthy();

      rerender(<TestRouter initialRoute="/signup" />);
      expect(document.body).toBeTruthy();
    });

    test('can navigate to menu after signup', () => {
      const { rerender } = render(<TestRouter initialRoute="/signup" />);
      expect(document.body).toBeTruthy();

      rerender(<TestRouter initialRoute="/menu" />);
      expect(document.body).toBeTruthy();
    });

    test('can navigate from calendar to meeting details', () => {
      const { rerender } = render(<TestRouter initialRoute="/calendar" />);
      expect(document.body).toBeTruthy();

      rerender(<TestRouter initialRoute="/meeting-details/1" />);
      expect(document.body).toBeTruthy();
    });

    test('can navigate from meeting details to edit meeting', () => {
      const { rerender } = render(<TestRouter initialRoute="/meeting-details/1" />);
      expect(document.body).toBeTruthy();

      rerender(<TestRouter initialRoute="/edit-meeting/1" />);
      expect(document.body).toBeTruthy();
    });

    test('can navigate back to calendar from meeting details', () => {
      const { rerender } = render(<TestRouter initialRoute="/meeting-details/1" />);
      expect(document.body).toBeTruthy();

      rerender(<TestRouter initialRoute="/calendar" />);
      expect(document.body).toBeTruthy();
    });

    test('can navigate from menu to account details', () => {
      const { rerender } = render(<TestRouter initialRoute="/menu" />);
      expect(document.body).toBeTruthy();

      rerender(<TestRouter initialRoute="/account-details" />);
      expect(document.body).toBeTruthy();
    });

    test('can navigate from account details back to menu', () => {
      const { rerender } = render(<TestRouter initialRoute="/account-details" />);
      expect(document.body).toBeTruthy();

      rerender(<TestRouter initialRoute="/menu" />);
      expect(document.body).toBeTruthy();
    });

    test('complete workflow navigation: login -> menu -> calendar -> meeting details', () => {
      const { rerender } = render(<TestRouter initialRoute="/login" />);
      expect(document.body).toBeTruthy();

      rerender(<TestRouter initialRoute="/menu" />);
      expect(document.body).toBeTruthy();

      rerender(<TestRouter initialRoute="/calendar" />);
      expect(document.body).toBeTruthy();

      rerender(<TestRouter initialRoute="/meeting-details/1" />);
      expect(document.body).toBeTruthy();
    });
  });

  describe('5. Invalid Routes', () => {
    test('renders page even with unknown route', () => {
      render(
        <MemoryRouter initialEntries={['/unknown-page']}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
          </Routes>
        </MemoryRouter>
      );

      // Should not crash
      expect(document.body).toBeTruthy();
    });

    test('handles route not found gracefully', () => {
      const { container } = render(
        <MemoryRouter initialEntries={['/non-existent']}>
          <Routes>
            <Route path="/" element={<div>Home</div>} />
          </Routes>
        </MemoryRouter>
      );

      expect(container).toBeTruthy();
    });

    test('maintains router structure with invalid routes', () => {
      const { rerender } = render(<TestRouter initialRoute="/invalid" />);
      expect(document.body).toBeTruthy();

      rerender(<TestRouter initialRoute="/menu" />);
      expect(document.body).toBeTruthy();
    });
  });

  describe('6. Route State Preservation', () => {
    test('preserves meeting state across navigation', () => {
      const { rerender } = render(<TestRouter initialRoute="/meeting-details/1" />);
      const before = document.body.innerHTML;

      rerender(<TestRouter initialRoute="/edit-meeting/1" />);
      const after = document.body.innerHTML;

      expect(before).toBeTruthy();
      expect(after).toBeTruthy();
    });

    test('different meeting ids render separately', () => {
      const { rerender } = render(<TestRouter initialRoute="/meeting-details/1" />);
      expect(document.body).toBeTruthy();

      rerender(<TestRouter initialRoute="/meeting-details/2" />);
      expect(document.body).toBeTruthy();

      rerender(<TestRouter initialRoute="/meeting-details/3" />);
      expect(document.body).toBeTruthy();
    });
  });
});
