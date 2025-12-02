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
