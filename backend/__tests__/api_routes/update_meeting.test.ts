import { jest } from '@jest/globals';
import { mockSupabaseApi } from '../helpers/mock_supabase_api.js';

await jest.unstable_mockModule(
  '../../src/supabase_api/supabase_api.js',
  mockSupabaseApi
);

beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  jest.restoreAllMocks();
});

const request = (await import('supertest')).default;
const { app } = await import('../../src/app.js');
const { updateMeeting } = await import(
  '../../src/supabase_api/supabase_api.js'
);
const { supabase } = await import('../../src/supabase_api/supabase_api.js');

describe('PUT /api/update-meeting/:id', () => {
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
        .put('/api/update-meeting/1')
        .send({
          meeting_title: 'Updated Meeting',
          meeting_time: '2025-12-01T10:00:00Z',
        })
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
      expect(updateMeeting).not.toHaveBeenCalled();
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
        .put('/api/update-meeting/1')
        .set('Authorization', 'Bearer invalid-token')
        .send({
          meeting_title: 'Updated Meeting',
          meeting_time: '2025-12-01T10:00:00Z',
        })
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
      expect(updateMeeting).not.toHaveBeenCalled();
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
        .put('/api/update-meeting/1')
        .set('Authorization', validAuthToken)
        .send({
          meeting_title: 'Updated Meeting',
          meeting_time: '2025-12-01T10:00:00Z',
        })
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
      expect(updateMeeting).not.toHaveBeenCalled();
    });
  });

  describe('Validation Tests - Meeting ID', () => {
    /**
     * Verifies that the endpoint returns 400 when meeting ID is not a valid number
     */
    test('should return 400 when meeting ID is not a number', async () => {
      const response = await request(app)
        .put('/api/update-meeting/invalid-id')
        .set('Authorization', validAuthToken)
        .send({
          meeting_title: 'Updated Meeting',
          meeting_time: '2025-12-01T10:00:00Z',
        })
        .expect(400);

      expect(response.body.error).toBe('Invalid meeting ID format');
      expect(updateMeeting).not.toHaveBeenCalled();
    });

    /**
     * Verifies that the endpoint returns 400 when meeting ID contains letters
     */
    test('should return 400 when meeting ID contains letters', async () => {
      const response = await request(app)
        .put('/api/update-meeting/123abc')
        .set('Authorization', validAuthToken)
        .send({
          meeting_title: 'Updated Meeting',
          meeting_time: '2025-12-01T10:00:00Z',
        })
        .expect(400);

      expect(response.body.error).toBe('Invalid meeting ID format');
      expect(updateMeeting).not.toHaveBeenCalled();
    });

    /**
     * Verifies that the endpoint returns 400 when meeting ID is a decimal
     */
    test('should return 400 when meeting ID is a decimal', async () => {
      const response = await request(app)
        .put('/api/update-meeting/123.45')
        .set('Authorization', validAuthToken)
        .send({
          meeting_title: 'Updated Meeting',
          meeting_time: '2025-12-01T10:00:00Z',
        })
        .expect(400);

      expect(response.body.error).toBe('Invalid meeting ID format');
      expect(updateMeeting).not.toHaveBeenCalled();
    });

    /**
     * Verifies that the endpoint accepts negative meeting IDs
     */
    test('should accept negative meeting ID', async () => {
      (updateMeeting as any).mockResolvedValue(null);

      const response = await request(app)
        .put('/api/update-meeting/-1')
        .set('Authorization', validAuthToken)
        .send({
          meeting_title: 'Updated Meeting',
          meeting_time: '2025-12-01T10:00:00Z',
        })
        .expect(200);

      expect(response.body.message).toBe('Meeting updated successfully');
      expect(updateMeeting).toHaveBeenCalledWith(
        -1,
        mockUserId,
        'Updated Meeting',
        '2025-12-01T10:00:00Z',
        undefined
      );
    });

    /**
     * Verifies that the endpoint accepts zero as meeting ID
     */
    test('should accept zero as meeting ID', async () => {
      (updateMeeting as any).mockResolvedValue(null);

      const response = await request(app)
        .put('/api/update-meeting/0')
        .set('Authorization', validAuthToken)
        .send({
          meeting_title: 'Updated Meeting',
          meeting_time: '2025-12-01T10:00:00Z',
        })
        .expect(200);

      expect(response.body.message).toBe('Meeting updated successfully');
      expect(updateMeeting).toHaveBeenCalledWith(
        0,
        mockUserId,
        'Updated Meeting',
        '2025-12-01T10:00:00Z',
        undefined
      );
    });
  });

  describe('Validation Tests - Missing Required Fields', () => {
    /**
     * Verifies that the endpoint returns 400 when both required fields are missing
     */
    test('should return 400 when missing all required fields', async () => {
      const response = await request(app)
        .put('/api/update-meeting/1')
        .set('Authorization', validAuthToken)
        .send({})
        .expect(400);

      expect(response.body.error).toBe(
        'Missing required fields: meeting_title, meeting_time'
      );
      expect(updateMeeting).not.toHaveBeenCalled();
    });

    /**
     * Verifies that the endpoint returns 400 when meeting_title is missing
     */
    test('should return 400 when missing meeting_title', async () => {
      const response = await request(app)
        .put('/api/update-meeting/1')
        .set('Authorization', validAuthToken)
        .send({
          meeting_time: '2025-12-01T10:00:00Z',
        })
        .expect(400);

      expect(response.body.error).toBe(
        'Missing required fields: meeting_title, meeting_time'
      );
      expect(updateMeeting).not.toHaveBeenCalled();
    });

    /**
     * Verifies that the endpoint returns 400 when meeting_time is missing
     */
    test('should return 400 when missing meeting_time', async () => {
      const response = await request(app)
        .put('/api/update-meeting/1')
        .set('Authorization', validAuthToken)
        .send({
          meeting_title: 'Updated Meeting',
        })
        .expect(400);

      expect(response.body.error).toBe(
        'Missing required fields: meeting_title, meeting_time'
      );
      expect(updateMeeting).not.toHaveBeenCalled();
    });

    /**
     * Verifies that the endpoint accepts requests without meeting_code (optional)
     */
    test('should accept request without meeting_code (optional field)', async () => {
      (updateMeeting as any).mockResolvedValue(null);

      const response = await request(app)
        .put('/api/update-meeting/1')
        .set('Authorization', validAuthToken)
        .send({
          meeting_title: 'Updated Meeting',
          meeting_time: '2025-12-01T10:00:00Z',
        })
        .expect(200);

      expect(response.body.message).toBe('Meeting updated successfully');
      expect(updateMeeting).toHaveBeenCalledWith(
        1,
        mockUserId,
        'Updated Meeting',
        '2025-12-01T10:00:00Z',
        undefined
      );
    });
  });

  describe('Validation Tests - Type Checking', () => {
    /**
     * Verifies that the endpoint rejects numeric values for meeting_title
     */
    test('should return 400 when meeting_title is a number', async () => {
      const response = await request(app)
        .put('/api/update-meeting/1')
        .set('Authorization', validAuthToken)
        .send({
          meeting_title: 123456,
          meeting_time: '2025-12-01T10:00:00Z',
        })
        .expect(400);

      expect(response.body.error).toBe(
        'meeting_title and meeting_time must be strings'
      );
      expect(updateMeeting).not.toHaveBeenCalled();
    });

    /**
     * Verifies that the endpoint rejects numeric values for meeting_time
     */
    test('should return 400 when meeting_time is a number', async () => {
      const response = await request(app)
        .put('/api/update-meeting/1')
        .set('Authorization', validAuthToken)
        .send({
          meeting_title: 'Updated Meeting',
          meeting_time: 1234567890,
        })
        .expect(400);

      expect(response.body.error).toBe(
        'meeting_title and meeting_time must be strings'
      );
      expect(updateMeeting).not.toHaveBeenCalled();
    });

    /**
     * Verifies that the endpoint rejects boolean values for meeting_title
     */
    test('should return 400 when meeting_title is a boolean', async () => {
      const response = await request(app)
        .put('/api/update-meeting/1')
        .set('Authorization', validAuthToken)
        .send({
          meeting_title: true,
          meeting_time: '2025-12-01T10:00:00Z',
        })
        .expect(400);

      expect(response.body.error).toBe(
        'meeting_title and meeting_time must be strings'
      );
      expect(updateMeeting).not.toHaveBeenCalled();
    });

    /**
     * Verifies that the endpoint rejects array values for meeting_title
     */
    test('should return 400 when meeting_title is an array', async () => {
      const response = await request(app)
        .put('/api/update-meeting/1')
        .set('Authorization', validAuthToken)
        .send({
          meeting_title: ['Updated', 'Meeting'],
          meeting_time: '2025-12-01T10:00:00Z',
        })
        .expect(400);

      expect(response.body.error).toBe(
        'meeting_title and meeting_time must be strings'
      );
      expect(updateMeeting).not.toHaveBeenCalled();
    });

    /**
     * Verifies that the endpoint rejects object values for meeting_title
     */
    test('should return 400 when meeting_title is an object', async () => {
      const response = await request(app)
        .put('/api/update-meeting/1')
        .set('Authorization', validAuthToken)
        .send({
          meeting_title: { title: 'Updated Meeting' },
          meeting_time: '2025-12-01T10:00:00Z',
        })
        .expect(400);

      expect(response.body.error).toBe(
        'meeting_title and meeting_time must be strings'
      );
      expect(updateMeeting).not.toHaveBeenCalled();
    });

    /**
     * Verifies that the endpoint rejects numeric values for meeting_code
     */
    test('should return 400 when meeting_code is a number', async () => {
      const response = await request(app)
        .put('/api/update-meeting/1')
        .set('Authorization', validAuthToken)
        .send({
          meeting_title: 'Updated Meeting',
          meeting_time: '2025-12-01T10:00:00Z',
          meeting_code: 123456,
        })
        .expect(400);

      expect(response.body.error).toBe('meeting_code must be a string');
      expect(updateMeeting).not.toHaveBeenCalled();
    });

    /**
     * Verifies that the endpoint rejects boolean values for meeting_code
     */
    test('should return 400 when meeting_code is a boolean', async () => {
      const response = await request(app)
        .put('/api/update-meeting/1')
        .set('Authorization', validAuthToken)
        .send({
          meeting_title: 'Updated Meeting',
          meeting_time: '2025-12-01T10:00:00Z',
          meeting_code: false,
        })
        .expect(400);

      expect(response.body.error).toBe('meeting_code must be a string');
      expect(updateMeeting).not.toHaveBeenCalled();
    });

    /**
     * Verifies that the endpoint rejects array values for meeting_code
     */
    test('should return 400 when meeting_code is an array', async () => {
      const response = await request(app)
        .put('/api/update-meeting/1')
        .set('Authorization', validAuthToken)
        .send({
          meeting_title: 'Updated Meeting',
          meeting_time: '2025-12-01T10:00:00Z',
          meeting_code: ['ABC', '123'],
        })
        .expect(400);

      expect(response.body.error).toBe('meeting_code must be a string');
      expect(updateMeeting).not.toHaveBeenCalled();
    });
  });

  describe('Validation Tests - Empty Strings', () => {
    /**
     * Verifies that the endpoint rejects empty string for meeting_title (falsy value)
     */
    test('should return 400 when meeting_title is empty string', async () => {
      const response = await request(app)
        .put('/api/update-meeting/1')
        .set('Authorization', validAuthToken)
        .send({
          meeting_title: '',
          meeting_time: '2025-12-01T10:00:00Z',
        })
        .expect(400);

      expect(response.body.error).toBe(
        'Missing required fields: meeting_title, meeting_time'
      );
      expect(updateMeeting).not.toHaveBeenCalled();
    });

    /**
     * Verifies that the endpoint rejects empty string for meeting_time (falsy value)
     */
    test('should return 400 when meeting_time is empty string', async () => {
      const response = await request(app)
        .put('/api/update-meeting/1')
        .set('Authorization', validAuthToken)
        .send({
          meeting_title: 'Updated Meeting',
          meeting_time: '',
        })
        .expect(400);

      expect(response.body.error).toBe(
        'Missing required fields: meeting_title, meeting_time'
      );
      expect(updateMeeting).not.toHaveBeenCalled();
    });

    /**
     * Verifies that the endpoint rejects whitespace-only string for meeting_title
     */
    test('should return 400 when meeting_title is only whitespace', async () => {
      const response = await request(app)
        .put('/api/update-meeting/1')
        .set('Authorization', validAuthToken)
        .send({
          meeting_title: '   ',
          meeting_time: '2025-12-01T10:00:00Z',
        })
        .expect(400);

      expect(response.body.error).toBe(
        'meeting_title and meeting_time cannot be empty strings'
      );
      expect(updateMeeting).not.toHaveBeenCalled();
    });

    /**
     * Verifies that the endpoint rejects whitespace-only string for meeting_time
     */
    test('should return 400 when meeting_time is only whitespace', async () => {
      const response = await request(app)
        .put('/api/update-meeting/1')
        .set('Authorization', validAuthToken)
        .send({
          meeting_title: 'Updated Meeting',
          meeting_time: '   ',
        })
        .expect(400);

      expect(response.body.error).toBe(
        'meeting_title and meeting_time cannot be empty strings'
      );
      expect(updateMeeting).not.toHaveBeenCalled();
    });

    /**
     * Verifies that the endpoint rejects empty string for meeting_code
     */
    test('should return 400 when meeting_code is empty string', async () => {
      const response = await request(app)
        .put('/api/update-meeting/1')
        .set('Authorization', validAuthToken)
        .send({
          meeting_title: 'Updated Meeting',
          meeting_time: '2025-12-01T10:00:00Z',
          meeting_code: '',
        })
        .expect(400);

      expect(response.body.error).toBe('meeting_code cannot be empty string');
      expect(updateMeeting).not.toHaveBeenCalled();
    });

    /**
     * Verifies that the endpoint rejects whitespace-only string for meeting_code
     */
    test('should return 400 when meeting_code is only whitespace', async () => {
      const response = await request(app)
        .put('/api/update-meeting/1')
        .set('Authorization', validAuthToken)
        .send({
          meeting_title: 'Updated Meeting',
          meeting_time: '2025-12-01T10:00:00Z',
          meeting_code: '   ',
        })
        .expect(400);

      expect(response.body.error).toBe('meeting_code cannot be empty string');
      expect(updateMeeting).not.toHaveBeenCalled();
    });

    /**
     * Verifies that the endpoint rejects whitespace-only strings (uses whitespace to trigger trim check)
     */
    test('should return 400 when both meeting_title and meeting_time are whitespace', async () => {
      const response = await request(app)
        .put('/api/update-meeting/1')
        .set('Authorization', validAuthToken)
        .send({
          meeting_title: '   ',
          meeting_time: '   ',
        })
        .expect(400);

      expect(response.body.error).toBe(
        'meeting_title and meeting_time cannot be empty strings'
      );
      expect(updateMeeting).not.toHaveBeenCalled();
    });
  });

  describe('Validation Tests - Date Format', () => {
    /**
     * Verifies that the endpoint rejects invalid date strings
     */
    test('should return 400 when meeting_time is invalid date string', async () => {
      const response = await request(app)
        .put('/api/update-meeting/1')
        .set('Authorization', validAuthToken)
        .send({
          meeting_title: 'Updated Meeting',
          meeting_time: 'not-a-date',
        })
        .expect(400);

      expect(response.body.error).toBe(
        'meeting_time must be a valid ISO datetime string'
      );
      expect(updateMeeting).not.toHaveBeenCalled();
    });

    /**
     * Verifies that the endpoint rejects malformed ISO date strings
     */
    test('should return 400 when meeting_time is malformed ISO string', async () => {
      const response = await request(app)
        .put('/api/update-meeting/1')
        .set('Authorization', validAuthToken)
        .send({
          meeting_title: 'Updated Meeting',
          meeting_time: '2025-13-45T99:99:99Z',
        })
        .expect(400);

      expect(response.body.error).toBe(
        'meeting_time must be a valid ISO datetime string'
      );
      expect(updateMeeting).not.toHaveBeenCalled();
    });

    /**
     * Verifies that the endpoint accepts valid ISO 8601 datetime strings
     */
    test('should accept valid ISO 8601 datetime string', async () => {
      (updateMeeting as any).mockResolvedValue(null);

      const response = await request(app)
        .put('/api/update-meeting/1')
        .set('Authorization', validAuthToken)
        .send({
          meeting_title: 'Updated Meeting',
          meeting_time: '2025-12-01T10:00:00Z',
        })
        .expect(200);

      expect(response.body.message).toBe('Meeting updated successfully');
    });

    /**
     * Verifies that the endpoint accepts ISO datetime with timezone offset
     */
    test('should accept ISO datetime with timezone offset', async () => {
      (updateMeeting as any).mockResolvedValue(null);

      const response = await request(app)
        .put('/api/update-meeting/1')
        .set('Authorization', validAuthToken)
        .send({
          meeting_title: 'Updated Meeting',
          meeting_time: '2025-12-01T10:00:00-08:00',
        })
        .expect(200);

      expect(response.body.message).toBe('Meeting updated successfully');
    });

    /**
     * Verifies that the endpoint accepts ISO datetime with milliseconds
     */
    test('should accept ISO datetime with milliseconds', async () => {
      (updateMeeting as any).mockResolvedValue(null);

      const response = await request(app)
        .put('/api/update-meeting/1')
        .set('Authorization', validAuthToken)
        .send({
          meeting_title: 'Updated Meeting',
          meeting_time: '2025-12-01T10:00:00.123Z',
        })
        .expect(200);

      expect(response.body.message).toBe('Meeting updated successfully');
    });
  });

  describe('Success Cases - With meeting_code', () => {
    /**
     * Verifies successful meeting update with all fields
     */
    test('should update meeting successfully with all fields', async () => {
      (updateMeeting as any).mockResolvedValue(null);

      const response = await request(app)
        .put('/api/update-meeting/123')
        .set('Authorization', validAuthToken)
        .send({
          meeting_title: 'Updated Meeting',
          meeting_time: '2025-12-01T10:00:00Z',
          meeting_code: 'NEW-CODE-123',
        })
        .expect(200);

      expect(response.body.message).toBe('Meeting updated successfully');
      expect(response.body.meetingId).toBe('123');
      expect(updateMeeting).toHaveBeenCalledWith(
        123,
        mockUserId,
        'Updated Meeting',
        '2025-12-01T10:00:00Z',
        'NEW-CODE-123'
      );
      expect(updateMeeting).toHaveBeenCalledTimes(1);
    });

    /**
     * Verifies successful meeting update with only required fields
     */
    test('should update meeting successfully with only required fields', async () => {
      (updateMeeting as any).mockResolvedValue(null);

      const response = await request(app)
        .put('/api/update-meeting/456')
        .set('Authorization', validAuthToken)
        .send({
          meeting_title: 'Updated Meeting',
          meeting_time: '2025-12-15T14:30:00Z',
        })
        .expect(200);

      expect(response.body.message).toBe('Meeting updated successfully');
      expect(response.body.meetingId).toBe('456');
      expect(updateMeeting).toHaveBeenCalledWith(
        456,
        mockUserId,
        'Updated Meeting',
        '2025-12-15T14:30:00Z',
        undefined
      );
    });

    /**
     * Verifies that the endpoint handles various meeting code formats
     */
    test('should handle different meeting code formats', async () => {
      (updateMeeting as any).mockResolvedValue(null);

      const testCases = [
        'ABC-123-XYZ',
        '123456789',
        'meeting_2025',
        'zoom.us/j/123456',
      ];

      for (const code of testCases) {
        jest.clearAllMocks();

        await request(app)
          .put('/api/update-meeting/1')
          .set('Authorization', validAuthToken)
          .send({
            meeting_title: 'Updated Meeting',
            meeting_time: '2025-12-01T10:00:00Z',
            meeting_code: code,
          })
          .expect(200);

        expect(updateMeeting).toHaveBeenCalledWith(
          1,
          mockUserId,
          'Updated Meeting',
          '2025-12-01T10:00:00Z',
          code
        );
      }
    });

    /**
     * Verifies that the endpoint handles long meeting titles
     */
    test('should handle long meeting titles', async () => {
      (updateMeeting as any).mockResolvedValue(null);

      const longTitle = 'A'.repeat(500);

      const response = await request(app)
        .put('/api/update-meeting/1')
        .set('Authorization', validAuthToken)
        .send({
          meeting_title: longTitle,
          meeting_time: '2025-12-01T10:00:00Z',
        })
        .expect(200);

      expect(response.body.message).toBe('Meeting updated successfully');
      expect(updateMeeting).toHaveBeenCalledWith(
        1,
        mockUserId,
        longTitle,
        '2025-12-01T10:00:00Z',
        undefined
      );
    });

    /**
     * Verifies that the endpoint handles special characters in meeting data
     */
    test('should handle special characters in meeting data', async () => {
      (updateMeeting as any).mockResolvedValue(null);

      const response = await request(app)
        .put('/api/update-meeting/1')
        .set('Authorization', validAuthToken)
        .send({
          meeting_title: 'Meeting: Q&A Session (Urgent!)',
          meeting_time: '2025-12-01T10:00:00Z',
          meeting_code: 'ABC-123!@#$%',
        })
        .expect(200);

      expect(response.body.message).toBe('Meeting updated successfully');
    });

    /**
     * Verifies that the endpoint handles Unicode characters
     */
    test('should handle Unicode characters in meeting_title', async () => {
      (updateMeeting as any).mockResolvedValue(null);

      const response = await request(app)
        .put('/api/update-meeting/1')
        .set('Authorization', validAuthToken)
        .send({
          meeting_title: '会议 Meeting 🚀',
          meeting_time: '2025-12-01T10:00:00Z',
        })
        .expect(200);

      expect(response.body.message).toBe('Meeting updated successfully');
    });
  });

  describe('Error Cases from Database', () => {
    /**
     * Verifies that database errors are properly handled and returned
     */
    test('should return 400 for database errors', async () => {
      (updateMeeting as any).mockResolvedValue('Database constraint violation');

      const response = await request(app)
        .put('/api/update-meeting/1')
        .set('Authorization', validAuthToken)
        .send({
          meeting_title: 'Updated Meeting',
          meeting_time: '2025-12-01T10:00:00Z',
        })
        .expect(400);

      expect(response.body.error).toBe('Database constraint violation');
    });

    /**
     * Verifies that meeting not found error is handled
     */
    test('should return 400 when meeting not found', async () => {
      (updateMeeting as any).mockResolvedValue('Meeting not found');

      const response = await request(app)
        .put('/api/update-meeting/999')
        .set('Authorization', validAuthToken)
        .send({
          meeting_title: 'Updated Meeting',
          meeting_time: '2025-12-01T10:00:00Z',
        })
        .expect(400);

      expect(response.body.error).toBe('Meeting not found');
    });

    /**
     * Verifies that authorization errors are handled
     */
    test('should return 400 when user not authorized to update meeting', async () => {
      (updateMeeting as any).mockResolvedValue(
        'Not authorized to update this meeting'
      );

      const response = await request(app)
        .put('/api/update-meeting/123')
        .set('Authorization', validAuthToken)
        .send({
          meeting_title: 'Updated Meeting',
          meeting_time: '2025-12-01T10:00:00Z',
        })
        .expect(400);

      expect(response.body.error).toBe('Not authorized to update this meeting');
    });

    /**
     * Verifies that the endpoint returns 500 for unexpected errors
     */
    test('should return 500 for unexpected errors', async () => {
      (updateMeeting as any).mockRejectedValue(
        new Error('Unexpected database error')
      );

      const response = await request(app)
        .put('/api/update-meeting/1')
        .set('Authorization', validAuthToken)
        .send({
          meeting_title: 'Updated Meeting',
          meeting_time: '2025-12-01T10:00:00Z',
        })
        .expect(500);

      expect(response.body.error).toBe('Internal server error');
    });

    /**
     * Verifies that network errors during database operations are handled
     */
    test('should return 500 when network error occurs', async () => {
      (updateMeeting as any).mockRejectedValue(new Error('Network timeout'));

      const response = await request(app)
        .put('/api/update-meeting/1')
        .set('Authorization', validAuthToken)
        .send({
          meeting_title: 'Updated Meeting',
          meeting_time: '2025-12-01T10:00:00Z',
        })
        .expect(500);

      expect(response.body.error).toBe('Internal server error');
    });
  });

  describe('Authorization Token Variations', () => {
    /**
     * Verifies that the endpoint handles authorization header with 'Bearer ' prefix
     */
    test('should handle token with Bearer prefix', async () => {
      (updateMeeting as any).mockResolvedValue(null);

      const response = await request(app)
        .put('/api/update-meeting/1')
        .set('Authorization', 'Bearer valid-token-123')
        .send({
          meeting_title: 'Updated Meeting',
          meeting_time: '2025-12-01T10:00:00Z',
        })
        .expect(200);

      expect(response.body.message).toBe('Meeting updated successfully');
      expect(supabase.auth.getUser).toHaveBeenCalledWith('valid-token-123');
    });

    /**
     * Verifies that the endpoint strips Bearer prefix correctly
     */
    test('should strip Bearer prefix from token', async () => {
      (updateMeeting as any).mockResolvedValue(null);

      await request(app)
        .put('/api/update-meeting/1')
        .set('Authorization', 'Bearer my-token-456')
        .send({
          meeting_title: 'Updated Meeting',
          meeting_time: '2025-12-01T10:00:00Z',
        })
        .expect(200);

      expect(supabase.auth.getUser).toHaveBeenCalledWith('my-token-456');
    });

    /**
     * Verifies that different tokens are handled correctly
     */
    test('should use correct userId from different tokens', async () => {
      const customUserId = 'custom-user-456';

      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: { id: customUserId } },
        error: null,
      });

      (updateMeeting as any).mockResolvedValue(null);

      await request(app)
        .put('/api/update-meeting/1')
        .set('Authorization', validAuthToken)
        .send({
          meeting_title: 'Updated Meeting',
          meeting_time: '2025-12-01T10:00:00Z',
        })
        .expect(200);

      expect(updateMeeting).toHaveBeenCalledWith(
        1,
        customUserId,
        'Updated Meeting',
        '2025-12-01T10:00:00Z',
        undefined
      );
    });
  });

  describe('Edge Cases', () => {
    /**
     * Verifies that the endpoint handles past dates
     */
    test('should accept past dates', async () => {
      (updateMeeting as any).mockResolvedValue(null);

      const response = await request(app)
        .put('/api/update-meeting/1')
        .set('Authorization', validAuthToken)
        .send({
          meeting_title: 'Past Meeting',
          meeting_time: '2020-01-01T10:00:00Z',
        })
        .expect(200);

      expect(response.body.message).toBe('Meeting updated successfully');
    });

    /**
     * Verifies that the endpoint handles far future dates
     */
    test('should accept far future dates', async () => {
      (updateMeeting as any).mockResolvedValue(null);

      const response = await request(app)
        .put('/api/update-meeting/1')
        .set('Authorization', validAuthToken)
        .send({
          meeting_title: 'Future Meeting',
          meeting_time: '2099-12-31T23:59:59Z',
        })
        .expect(200);

      expect(response.body.message).toBe('Meeting updated successfully');
    });

    /**
     * Verifies that updateMeeting is not called on authentication failure
     */
    test('should not call updateMeeting on authentication failure', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: null },
        error: new Error('Invalid token'),
      });

      await request(app)
        .put('/api/update-meeting/1')
        .set('Authorization', 'Bearer invalid-token')
        .send({
          meeting_title: 'Updated Meeting',
          meeting_time: '2025-12-01T10:00:00Z',
        })
        .expect(401);

      expect(updateMeeting).not.toHaveBeenCalled();
    });

    /**
     * Verifies that updateMeeting is not called on validation failure
     */
    test('should not call updateMeeting on validation failure', async () => {
      await request(app)
        .put('/api/update-meeting/invalid')
        .set('Authorization', validAuthToken)
        .send({
          meeting_title: 'Updated Meeting',
          meeting_time: '2025-12-01T10:00:00Z',
        })
        .expect(400);

      expect(updateMeeting).not.toHaveBeenCalled();
    });

    /**
     * Verifies that extra fields in request body are ignored
     */
    test('should ignore extra fields in request body', async () => {
      (updateMeeting as any).mockResolvedValue(null);

      const response = await request(app)
        .put('/api/update-meeting/1')
        .set('Authorization', validAuthToken)
        .send({
          meeting_title: 'Updated Meeting',
          meeting_time: '2025-12-01T10:00:00Z',
          extra_field: 'should be ignored',
          another_field: 12345,
        })
        .expect(200);

      expect(response.body.message).toBe('Meeting updated successfully');
      expect(updateMeeting).toHaveBeenCalledWith(
        1,
        mockUserId,
        'Updated Meeting',
        '2025-12-01T10:00:00Z',
        undefined
      );
    });

    /**
     * Verifies that meeting ID string is preserved in response
     */
    test('should preserve meeting ID as string in response', async () => {
      (updateMeeting as any).mockResolvedValue(null);

      const response = await request(app)
        .put('/api/update-meeting/00123')
        .set('Authorization', validAuthToken)
        .send({
          meeting_title: 'Updated Meeting',
          meeting_time: '2025-12-01T10:00:00Z',
        })
        .expect(200);

      expect(response.body.meetingId).toBe('00123');
      expect(updateMeeting).toHaveBeenCalledWith(
        123,
        mockUserId,
        'Updated Meeting',
        '2025-12-01T10:00:00Z',
        undefined
      );
    });

    /**
     * Verifies that very large meeting IDs are handled
     */
    test('should handle very large meeting ID', async () => {
      (updateMeeting as any).mockResolvedValue(null);

      const largeId = '999999999999';

      const response = await request(app)
        .put(`/api/update-meeting/${largeId}`)
        .set('Authorization', validAuthToken)
        .send({
          meeting_title: 'Updated Meeting',
          meeting_time: '2025-12-01T10:00:00Z',
        })
        .expect(200);

      expect(response.body.message).toBe('Meeting updated successfully');
      expect(updateMeeting).toHaveBeenCalledWith(
        parseInt(largeId, 10),
        mockUserId,
        'Updated Meeting',
        '2025-12-01T10:00:00Z',
        undefined
      );
    });
  });

  describe('Response Format Tests', () => {
    /**
     * Verifies that success response has correct structure
     */
    test('should return correct response structure on success', async () => {
      (updateMeeting as any).mockResolvedValue(null);

      const response = await request(app)
        .put('/api/update-meeting/123')
        .set('Authorization', validAuthToken)
        .send({
          meeting_title: 'Updated Meeting',
          meeting_time: '2025-12-01T10:00:00Z',
        })
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('meetingId');
      expect(response.body.message).toBe('Meeting updated successfully');
      expect(response.body.meetingId).toBe('123');
      expect(Object.keys(response.body)).toEqual(['message', 'meetingId']);
    });

    /**
     * Verifies that error response has correct structure
     */
    test('should return correct response structure on error', async () => {
      (updateMeeting as any).mockResolvedValue('Some error message');

      const response = await request(app)
        .put('/api/update-meeting/1')
        .set('Authorization', validAuthToken)
        .send({
          meeting_title: 'Updated Meeting',
          meeting_time: '2025-12-01T10:00:00Z',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Some error message');
      expect(response.body).not.toHaveProperty('message');
      expect(response.body).not.toHaveProperty('meetingId');
    });

    /**
     * Verifies that authentication error response has correct structure
     */
    test('should return correct response structure on auth error', async () => {
      const response = await request(app)
        .put('/api/update-meeting/1')
        .send({
          meeting_title: 'Updated Meeting',
          meeting_time: '2025-12-01T10:00:00Z',
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Unauthorized');
      expect(Object.keys(response.body)).toEqual(['error']);
    });
  });

  describe('Data Integrity Tests', () => {
    /**
     * Verifies that all provided data is passed correctly to updateMeeting
     */
    test('should pass all parameters correctly to updateMeeting', async () => {
      (updateMeeting as any).mockResolvedValue(null);

      await request(app)
        .put('/api/update-meeting/789')
        .set('Authorization', validAuthToken)
        .send({
          meeting_title: 'Important Meeting',
          meeting_time: '2025-06-15T15:30:00Z',
          meeting_code: 'TEST-CODE-456',
        })
        .expect(200);

      expect(updateMeeting).toHaveBeenCalledWith(
        789,
        mockUserId,
        'Important Meeting',
        '2025-06-15T15:30:00Z',
        'TEST-CODE-456'
      );
      expect(updateMeeting).toHaveBeenCalledTimes(1);
    });

    /**
     * Verifies that meeting_code undefined is passed correctly
     */
    test('should pass undefined for missing meeting_code', async () => {
      (updateMeeting as any).mockResolvedValue(null);

      await request(app)
        .put('/api/update-meeting/1')
        .set('Authorization', validAuthToken)
        .send({
          meeting_title: 'Updated Meeting',
          meeting_time: '2025-12-01T10:00:00Z',
        })
        .expect(200);

      expect(updateMeeting).toHaveBeenCalledWith(
        1,
        mockUserId,
        'Updated Meeting',
        '2025-12-01T10:00:00Z',
        undefined
      );
    });

    /**
     * Verifies that updateMeeting is called with exactly 5 parameters
     */
    test('should call updateMeeting with 5 parameters', async () => {
      (updateMeeting as any).mockResolvedValue(null);

      await request(app)
        .put('/api/update-meeting/1')
        .set('Authorization', validAuthToken)
        .send({
          meeting_title: 'Updated Meeting',
          meeting_time: '2025-12-01T10:00:00Z',
        })
        .expect(200);

      expect((updateMeeting as any).mock.calls[0]).toHaveLength(5);
    });
  });

  describe('HTTP Method Tests', () => {
    /**
     * Verifies that GET method is not allowed
     */
    test('should not allow GET method', async () => {
      const response = await request(app)
        .get('/api/update-meeting/1')
        .set('Authorization', validAuthToken)
        .expect(404);

      expect(response.body.error).toBe('Not found');
    });

    /**
     * Verifies that POST method is not allowed
     */
    test('should not allow POST method', async () => {
      const response = await request(app)
        .post('/api/update-meeting/1')
        .set('Authorization', validAuthToken)
        .send({
          meeting_title: 'Updated Meeting',
          meeting_time: '2025-12-01T10:00:00Z',
        })
        .expect(404);

      expect(response.body.error).toBe('Not found');
    });

    /**
     * Verifies that DELETE method is not allowed
     */
    test('should not allow DELETE method', async () => {
      const response = await request(app)
        .delete('/api/update-meeting/1')
        .set('Authorization', validAuthToken)
        .expect(404);

      expect(response.body.error).toBe('Not found');
    });

    /**
     * Verifies that OPTIONS method returns correct CORS headers
     */
    test('should handle OPTIONS request for CORS', async () => {
      const response = await request(app)
        .options('/api/update-meeting/1')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('*');
      expect(response.headers['access-control-allow-methods']).toContain('PUT');
    });
  });
});
