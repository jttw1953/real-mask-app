import { jest } from '@jest/globals';
import { mockSupabaseApi } from '../helpers/mock_supabase_api.js';

await jest.unstable_mockModule(
  '../../src/supabase_api/supabase_api.js',
  mockSupabaseApi
);

const request = (await import('supertest')).default;
const { app } = await import('../../src/app.js');
const { getAllMeetings } = await import(
  '../../src/supabase_api/supabase_api.js'
);
const { supabase } = await import('../../src/supabase_api/supabase_api.js');

describe('GET /api/get-all-meetings', () => {
  const validAuthToken = 'Bearer valid-token-123';
  const mockUserId = 'user-123';

  beforeEach(() => {
    jest.clearAllMocks();

    (supabase.auth.getUser as any).mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null,
    });
  });

  describe('Authentication Tests', () => {
    /**
     * Verifies that the endpoint returns 401 when no authorization header is provided
     */
    test('should return 401 when no authorization header provided', async () => {
      const response = await request(app)
        .get('/api/get-all-meetings')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });

    /**
     * Verifies that the endpoint returns 401 when an invalid token is provided
     */
    test('should return 401 when invalid token provided', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: null },
        error: new Error('Invalid token'),
      });

      const response = await request(app)
        .get('/api/get-all-meetings')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });

    /**
     * Verifies that the endpoint returns 401 when token verification returns no user
     */
    test('should return 401 when token returns no user', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const response = await request(app)
        .get('/api/get-all-meetings')
        .set('Authorization', validAuthToken)
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });
  });

  describe('Success Cases - Empty Results', () => {
    /**
     * Verifies that the endpoint returns empty array when user has no meetings
     */
    test('should return empty array when user has no meetings', async () => {
      (getAllMeetings as any).mockResolvedValue({
        data: [],
        error: null,
      });

      const response = await request(app)
        .get('/api/get-all-meetings')
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(response.body.message).toBe('Meetings retrieved successfully');
      expect(response.body.meetings).toEqual([]);
      expect(Array.isArray(response.body.meetings)).toBe(true);
      expect(getAllMeetings).toHaveBeenCalledWith(mockUserId);
    });

    /**
     * Verifies that the endpoint handles null data gracefully
     */
    test('should handle null data response', async () => {
      (getAllMeetings as any).mockResolvedValue({
        data: null,
        error: null,
      });

      const response = await request(app)
        .get('/api/get-all-meetings')
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(response.body.message).toBe('Meetings retrieved successfully');
      expect(response.body.meetings).toBeNull();
    });
  });

  describe('Success Cases - Single Meeting', () => {
    /**
     * Verifies that the endpoint returns a single meeting correctly
     */
    test('should return single meeting successfully', async () => {
      const mockMeeting = {
        id: 1,
        meeting_code: 'ABC123',
        meeting_time: '2025-12-01T10:00:00Z',
        meeting_title: 'Team Meeting',
        user_id: mockUserId,
        created_at: '2025-11-18T10:00:00Z',
      };

      (getAllMeetings as any).mockResolvedValue({
        data: [mockMeeting],
        error: null,
      });

      const response = await request(app)
        .get('/api/get-all-meetings')
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(response.body.message).toBe('Meetings retrieved successfully');
      expect(response.body.meetings).toHaveLength(1);
      expect(response.body.meetings[0]).toEqual(mockMeeting);
      expect(getAllMeetings).toHaveBeenCalledWith(mockUserId);
    });

    /**
     * Verifies that the endpoint handles meeting without optional title
     */
    test('should handle meeting without title', async () => {
      const mockMeeting = {
        id: 1,
        meeting_code: 'ABC123',
        meeting_time: '2025-12-01T10:00:00Z',
        meeting_title: null,
        user_id: mockUserId,
      };

      (getAllMeetings as any).mockResolvedValue({
        data: [mockMeeting],
        error: null,
      });

      const response = await request(app)
        .get('/api/get-all-meetings')
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(response.body.message).toBe('Meetings retrieved successfully');
      expect(response.body.meetings[0].meeting_title).toBeNull();
    });
  });

  describe('Success Cases - Multiple Meetings', () => {
    /**
     * Verifies that the endpoint returns multiple meetings correctly
     */
    test('should return multiple meetings successfully', async () => {
      const mockMeetings = [
        {
          id: 1,
          meeting_code: 'ABC123',
          meeting_time: '2025-12-01T10:00:00Z',
          meeting_title: 'Team Meeting',
          user_id: mockUserId,
        },
        {
          id: 2,
          meeting_code: 'XYZ789',
          meeting_time: '2025-12-02T14:00:00Z',
          meeting_title: 'Client Call',
          user_id: mockUserId,
        },
        {
          id: 3,
          meeting_code: 'DEF456',
          meeting_time: '2025-12-03T09:00:00Z',
          meeting_title: 'Sprint Planning',
          user_id: mockUserId,
        },
      ];

      (getAllMeetings as any).mockResolvedValue({
        data: mockMeetings,
        error: null,
      });

      const response = await request(app)
        .get('/api/get-all-meetings')
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(response.body.message).toBe('Meetings retrieved successfully');
      expect(response.body.meetings).toHaveLength(3);
      expect(response.body.meetings).toEqual(mockMeetings);
      expect(getAllMeetings).toHaveBeenCalledWith(mockUserId);
      expect(getAllMeetings).toHaveBeenCalledTimes(1);
    });

    /**
     * Verifies that the endpoint handles large number of meetings
     */
    test('should handle large number of meetings', async () => {
      const mockMeetings = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        meeting_code: `CODE${i + 1}`,
        meeting_time: '2025-12-01T10:00:00Z',
        meeting_title: `Meeting ${i + 1}`,
        user_id: mockUserId,
      }));

      (getAllMeetings as any).mockResolvedValue({
        data: mockMeetings,
        error: null,
      });

      const response = await request(app)
        .get('/api/get-all-meetings')
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(response.body.message).toBe('Meetings retrieved successfully');
      expect(response.body.meetings).toHaveLength(100);
      expect(response.body.meetings[0].id).toBe(1);
      expect(response.body.meetings[99].id).toBe(100);
    });

    /**
     * Verifies that meetings are returned in the order provided by database
     */
    test('should preserve meeting order from database', async () => {
      const mockMeetings = [
        { id: 5, meeting_code: 'E', meeting_time: '2025-12-05T10:00:00Z' },
        { id: 2, meeting_code: 'B', meeting_time: '2025-12-02T10:00:00Z' },
        { id: 8, meeting_code: 'H', meeting_time: '2025-12-08T10:00:00Z' },
        { id: 1, meeting_code: 'A', meeting_time: '2025-12-01T10:00:00Z' },
      ];

      (getAllMeetings as any).mockResolvedValue({
        data: mockMeetings,
        error: null,
      });

      const response = await request(app)
        .get('/api/get-all-meetings')
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(response.body.meetings[0].id).toBe(5);
      expect(response.body.meetings[1].id).toBe(2);
      expect(response.body.meetings[2].id).toBe(8);
      expect(response.body.meetings[3].id).toBe(1);
    });
  });

  describe('Success Cases - Meeting Data Variations', () => {
    /**
     * Verifies handling of meetings with special characters
     */
    test('should handle meetings with special characters', async () => {
      const mockMeetings = [
        {
          id: 1,
          meeting_code: 'ABC-123!@#',
          meeting_time: '2025-12-01T10:00:00Z',
          meeting_title: 'Q&A Session: Year-End Review (2025)',
          user_id: mockUserId,
        },
      ];

      (getAllMeetings as any).mockResolvedValue({
        data: mockMeetings,
        error: null,
      });

      const response = await request(app)
        .get('/api/get-all-meetings')
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(response.body.meetings[0].meeting_title).toBe(
        'Q&A Session: Year-End Review (2025)'
      );
    });

    /**
     * Verifies handling of meetings with Unicode characters
     */
    test('should handle meetings with Unicode characters', async () => {
      const mockMeetings = [
        {
          id: 1,
          meeting_code: 'ABC123',
          meeting_time: '2025-12-01T10:00:00Z',
          meeting_title: '会议 Meeting 🚀',
          user_id: mockUserId,
        },
      ];

      (getAllMeetings as any).mockResolvedValue({
        data: mockMeetings,
        error: null,
      });

      const response = await request(app)
        .get('/api/get-all-meetings')
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(response.body.meetings[0].meeting_title).toBe('会议 Meeting 🚀');
    });

    /**
     * Verifies handling of meetings with very long titles
     */
    test('should handle meetings with very long titles', async () => {
      const longTitle = 'A'.repeat(500);
      const mockMeetings = [
        {
          id: 1,
          meeting_code: 'ABC123',
          meeting_time: '2025-12-01T10:00:00Z',
          meeting_title: longTitle,
          user_id: mockUserId,
        },
      ];

      (getAllMeetings as any).mockResolvedValue({
        data: mockMeetings,
        error: null,
      });

      const response = await request(app)
        .get('/api/get-all-meetings')
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(response.body.meetings[0].meeting_title).toBe(longTitle);
    });

    /**
     * Verifies handling of meetings with different timezone formats
     */
    test('should handle meetings with different timezone formats', async () => {
      const mockMeetings = [
        {
          id: 1,
          meeting_code: 'ABC123',
          meeting_time: '2025-12-01T10:00:00Z',
          meeting_title: 'UTC Meeting',
        },
        {
          id: 2,
          meeting_code: 'DEF456',
          meeting_time: '2025-12-01T10:00:00-08:00',
          meeting_title: 'PST Meeting',
        },
        {
          id: 3,
          meeting_code: 'GHI789',
          meeting_time: '2025-12-01T10:00:00.123Z',
          meeting_title: 'UTC with milliseconds',
        },
      ];

      (getAllMeetings as any).mockResolvedValue({
        data: mockMeetings,
        error: null,
      });

      const response = await request(app)
        .get('/api/get-all-meetings')
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(response.body.meetings).toHaveLength(3);
      expect(response.body.meetings[0].meeting_time).toBe(
        '2025-12-01T10:00:00Z'
      );
      expect(response.body.meetings[1].meeting_time).toBe(
        '2025-12-01T10:00:00-08:00'
      );
    });

    /**
     * Verifies handling of meetings with past and future dates
     */
    test('should handle meetings with past and future dates', async () => {
      const mockMeetings = [
        {
          id: 1,
          meeting_code: 'PAST',
          meeting_time: '2020-01-01T10:00:00Z',
          meeting_title: 'Past Meeting',
        },
        {
          id: 2,
          meeting_code: 'FUTURE',
          meeting_time: '2099-12-31T23:59:59Z',
          meeting_title: 'Future Meeting',
        },
      ];

      (getAllMeetings as any).mockResolvedValue({
        data: mockMeetings,
        error: null,
      });

      const response = await request(app)
        .get('/api/get-all-meetings')
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(response.body.meetings).toHaveLength(2);
    });

    /**
     * Verifies handling of meetings with mixed null and non-null titles
     */
    test('should handle meetings with mixed null and non-null titles', async () => {
      const mockMeetings = [
        {
          id: 1,
          meeting_code: 'ABC123',
          meeting_time: '2025-12-01T10:00:00Z',
          meeting_title: 'Team Meeting',
        },
        {
          id: 2,
          meeting_code: 'XYZ789',
          meeting_time: '2025-12-02T14:00:00Z',
          meeting_title: null,
        },
        {
          id: 3,
          meeting_code: 'DEF456',
          meeting_time: '2025-12-03T09:00:00Z',
          meeting_title: 'Sprint Planning',
        },
      ];

      (getAllMeetings as any).mockResolvedValue({
        data: mockMeetings,
        error: null,
      });

      const response = await request(app)
        .get('/api/get-all-meetings')
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(response.body.meetings[0].meeting_title).toBe('Team Meeting');
      expect(response.body.meetings[1].meeting_title).toBeNull();
      expect(response.body.meetings[2].meeting_title).toBe('Sprint Planning');
    });
  });

  describe('Error Cases from Database', () => {
    /**
     * Verifies that database errors are properly handled and returned
     */
    test('should return 400 for database errors', async () => {
      (getAllMeetings as any).mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
      });

      const response = await request(app)
        .get('/api/get-all-meetings')
        .set('Authorization', validAuthToken)
        .expect(400);

      expect(response.body.error).toBe('Database connection failed');
    });

    /**
     * Verifies that query timeout errors are handled
     */
    test('should return 400 for query timeout errors', async () => {
      (getAllMeetings as any).mockResolvedValue({
        data: null,
        error: { message: 'Query timeout exceeded' },
      });

      const response = await request(app)
        .get('/api/get-all-meetings')
        .set('Authorization', validAuthToken)
        .expect(400);

      expect(response.body.error).toBe('Query timeout exceeded');
    });

    /**
     * Verifies that the endpoint returns 500 for unexpected errors
     */
    test('should return 500 for unexpected errors', async () => {
      (getAllMeetings as any).mockRejectedValue(
        new Error('Unexpected database error')
      );

      const response = await request(app)
        .get('/api/get-all-meetings')
        .set('Authorization', validAuthToken)
        .expect(500);

      expect(response.body.error).toBe('Internal server error');
    });

    /**
     * Verifies that network errors during database operations are handled
     */
    test('should return 500 when network error occurs', async () => {
      (getAllMeetings as any).mockRejectedValue(new Error('Network timeout'));

      const response = await request(app)
        .get('/api/get-all-meetings')
        .set('Authorization', validAuthToken)
        .expect(500);

      expect(response.body.error).toBe('Internal server error');
    });

    /**
     * Verifies handling of permission errors
     */
    test('should return 400 for permission errors', async () => {
      (getAllMeetings as any).mockResolvedValue({
        data: null,
        error: { message: 'Permission denied' },
      });

      const response = await request(app)
        .get('/api/get-all-meetings')
        .set('Authorization', validAuthToken)
        .expect(400);

      expect(response.body.error).toBe('Permission denied');
    });
  });

  describe('Authorization Token Variations', () => {
    /**
     * Verifies that the endpoint handles authorization header with 'Bearer ' prefix
     */
    test('should handle token with Bearer prefix', async () => {
      (getAllMeetings as any).mockResolvedValue({
        data: [],
        error: null,
      });

      const response = await request(app)
        .get('/api/get-all-meetings')
        .set('Authorization', 'Bearer valid-token-123')
        .expect(200);

      expect(response.body.message).toBe('Meetings retrieved successfully');
      expect(supabase.auth.getUser).toHaveBeenCalledWith('valid-token-123');
    });

    /**
     * Verifies that the endpoint strips Bearer prefix correctly
     */
    test('should strip Bearer prefix from token', async () => {
      (getAllMeetings as any).mockResolvedValue({
        data: [],
        error: null,
      });

      await request(app)
        .get('/api/get-all-meetings')
        .set('Authorization', 'Bearer my-token-456')
        .expect(200);

      expect(supabase.auth.getUser).toHaveBeenCalledWith('my-token-456');
    });

    /**
     * Verifies that different users get their own meetings
     */
    test('should return meetings for correct user', async () => {
      const customUserId = 'custom-user-456';

      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: { id: customUserId } },
        error: null,
      });

      (getAllMeetings as any).mockResolvedValue({
        data: [],
        error: null,
      });

      await request(app)
        .get('/api/get-all-meetings')
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(getAllMeetings).toHaveBeenCalledWith(customUserId);
    });
  });

  describe('Edge Cases', () => {
    /**
     * Verifies that getAllMeetings is not called on authentication failure
     */
    test('should not call getAllMeetings on authentication failure', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: null },
        error: new Error('Invalid token'),
      });

      await request(app)
        .get('/api/get-all-meetings')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(getAllMeetings).not.toHaveBeenCalled();
    });

    /**
     * Verifies that the endpoint handles concurrent requests correctly
     */
    test('should handle concurrent requests correctly', async () => {
      (getAllMeetings as any).mockResolvedValue({
        data: [{ id: 1, meeting_code: 'ABC123' }],
        error: null,
      });

      const requests = [
        request(app)
          .get('/api/get-all-meetings')
          .set('Authorization', validAuthToken),
        request(app)
          .get('/api/get-all-meetings')
          .set('Authorization', validAuthToken),
        request(app)
          .get('/api/get-all-meetings')
          .set('Authorization', validAuthToken),
      ];

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Meetings retrieved successfully');
      });

      expect(getAllMeetings).toHaveBeenCalledTimes(3);
    });

    /**
     * Verifies that the endpoint is called with exactly one parameter
     */
    test('should call getAllMeetings with only userId', async () => {
      (getAllMeetings as any).mockResolvedValue({
        data: [],
        error: null,
      });

      await request(app)
        .get('/api/get-all-meetings')
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(getAllMeetings).toHaveBeenCalledWith(mockUserId);
      expect(getAllMeetings).toHaveBeenCalledTimes(1);
      expect((getAllMeetings as any).mock.calls[0]).toHaveLength(1);
    });

    /**
     * Verifies that response structure is consistent even with empty results
     */
    test('should have consistent response structure', async () => {
      (getAllMeetings as any).mockResolvedValue({
        data: [],
        error: null,
      });

      const response = await request(app)
        .get('/api/get-all-meetings')
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('meetings');
      expect(Object.keys(response.body)).toEqual(['message', 'meetings']);
    });

    /**
     * Verifies handling of malformed database response
     */
    test('should handle malformed database response', async () => {
      (getAllMeetings as any).mockResolvedValue({
        data: [
          {
            id: 1,
            // Missing required fields
          },
          {
            id: 2,
            meeting_code: 'ABC123',
            // Missing meeting_time
          },
        ],
        error: null,
      });

      const response = await request(app)
        .get('/api/get-all-meetings')
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(response.body.meetings).toHaveLength(2);
      // Should still return the malformed data as-is
      expect(response.body.meetings[0].id).toBe(1);
      expect(response.body.meetings[1].id).toBe(2);
    });
  });

  describe('Response Format Tests', () => {
    /**
     * Verifies that success response has correct structure
     */
    test('should return correct response structure on success', async () => {
      const mockMeetings = [
        {
          id: 1,
          meeting_code: 'ABC123',
          meeting_time: '2025-12-01T10:00:00Z',
        },
      ];

      (getAllMeetings as any).mockResolvedValue({
        data: mockMeetings,
        error: null,
      });

      const response = await request(app)
        .get('/api/get-all-meetings')
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('meetings');
      expect(response.body.message).toBe('Meetings retrieved successfully');
      expect(Array.isArray(response.body.meetings)).toBe(true);
    });

    /**
     * Verifies that error response has correct structure
     */
    test('should return correct response structure on error', async () => {
      (getAllMeetings as any).mockResolvedValue({
        data: null,
        error: { message: 'Some error message' },
      });

      const response = await request(app)
        .get('/api/get-all-meetings')
        .set('Authorization', validAuthToken)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Some error message');
      expect(response.body).not.toHaveProperty('message');
      expect(response.body).not.toHaveProperty('meetings');
    });

    /**
     * Verifies that authentication error response has correct structure
     */
    test('should return correct response structure on auth error', async () => {
      const response = await request(app)
        .get('/api/get-all-meetings')
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Unauthorized');
      expect(Object.keys(response.body)).toEqual(['error']);
    });

    /**
     * Verifies that meetings array is always present in successful responses
     */
    test('should always include meetings property in success response', async () => {
      (getAllMeetings as any).mockResolvedValue({
        data: [],
        error: null,
      });

      const response = await request(app)
        .get('/api/get-all-meetings')
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(response.body).toHaveProperty('meetings');
      expect(response.body.meetings).toBeDefined();
    });
  });

  describe('Data Integrity Tests', () => {
    /**
     * Verifies that meeting data is not modified by the endpoint
     */
    test('should not modify meeting data', async () => {
      const mockMeetings = [
        {
          id: 1,
          meeting_code: 'ABC123',
          meeting_time: '2025-12-01T10:00:00Z',
          meeting_title: 'Original Title',
          user_id: mockUserId,
          extra_field: 'should be preserved',
        },
      ];

      (getAllMeetings as any).mockResolvedValue({
        data: mockMeetings,
        error: null,
      });

      const response = await request(app)
        .get('/api/get-all-meetings')
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(response.body.meetings[0]).toEqual(mockMeetings[0]);
      expect(response.body.meetings[0].extra_field).toBe('should be preserved');
    });

    /**
     * Verifies that the endpoint passes the exact userId to getAllMeetings
     */
    test('should pass exact user ID to getAllMeetings', async () => {
      (getAllMeetings as any).mockResolvedValue({
        data: [],
        error: null,
      });

      await request(app)
        .get('/api/get-all-meetings')
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(getAllMeetings).toHaveBeenCalledWith(mockUserId);
    });

    /**
     * Verifies that multiple calls with same auth return consistent results
     */
    test('should return consistent results for same user', async () => {
      const mockMeetings = [
        { id: 1, meeting_code: 'ABC123', meeting_time: '2025-12-01T10:00:00Z' },
      ];

      (getAllMeetings as any).mockResolvedValue({
        data: mockMeetings,
        error: null,
      });

      const response1 = await request(app)
        .get('/api/get-all-meetings')
        .set('Authorization', validAuthToken)
        .expect(200);

      const response2 = await request(app)
        .get('/api/get-all-meetings')
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(response1.body.meetings).toEqual(response2.body.meetings);
    });
  });

  describe('HTTP Method Tests', () => {
    /**
     * Verifies that POST method is not allowed
     */
    test('should not allow POST method', async () => {
      const response = await request(app)
        .post('/api/get-all-meetings')
        .set('Authorization', validAuthToken)
        .expect(404);

      expect(response.body.error).toBe('Not found');
    });

    /**
     * Verifies that PUT method is not allowed
     */
    test('should not allow PUT method', async () => {
      const response = await request(app)
        .put('/api/get-all-meetings')
        .set('Authorization', validAuthToken)
        .expect(404);

      expect(response.body.error).toBe('Not found');
    });

    /**
     * Verifies that DELETE method is not allowed
     */
    test('should not allow DELETE method', async () => {
      const response = await request(app)
        .delete('/api/get-all-meetings')
        .set('Authorization', validAuthToken)
        .expect(404);

      expect(response.body.error).toBe('Not found');
    });

    /**
     * Verifies that OPTIONS method returns correct CORS headers
     */
    test('should handle OPTIONS request for CORS', async () => {
      const response = await request(app)
        .options('/api/get-all-meetings')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('*');
      expect(response.headers['access-control-allow-methods']).toContain('GET');
    });
  });
});
