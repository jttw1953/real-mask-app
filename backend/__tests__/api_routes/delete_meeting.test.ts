// tests for jira ticket CCP-147 - created by: Matthew Mirza
// CCP-148 - approved by:

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
const { deleteMeeting } = await import(
  '../../src/supabase_api/supabase_api.js'
);
const { supabase } = await import('../../src/supabase_api/supabase_api.js');

describe('DELETE /api/delete-meeting/:id', () => {
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
        .delete('/api/delete-meeting/1')
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
        .delete('/api/delete-meeting/1')
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
        .delete('/api/delete-meeting/1')
        .set('Authorization', validAuthToken)
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });
  });

  describe('Validation Tests - Meeting ID', () => {
    /**
     * Verifies that the endpoint returns 400 when meeting ID is not a valid number
     */
    test('should return 400 when meeting ID is not a number', async () => {
      const response = await request(app)
        .delete('/api/delete-meeting/invalid-id')
        .set('Authorization', validAuthToken)
        .expect(400);

      expect(response.body.error).toBe('Invalid meeting ID format');
    });

    /**
     * Verifies that the endpoint returns 400 when meeting ID contains letters
     */
    test('should return 400 when meeting ID contains letters', async () => {
      const response = await request(app)
        .delete('/api/delete-meeting/123abc')
        .set('Authorization', validAuthToken)
        .expect(400);

      expect(response.body.error).toBe('Invalid meeting ID format');
    });

    /**
     * Verifies that the endpoint returns 400 when meeting ID is a decimal
     */
    test('should return 400 when meeting ID is a decimal', async () => {
      const response = await request(app)
        .delete('/api/delete-meeting/123.45')
        .set('Authorization', validAuthToken)
        .expect(400);

      expect(response.body.error).toBe('Invalid meeting ID format');
    });

    /**
     * Verifies that the endpoint returns 400 when meeting ID contains special characters
     */
    test('should return 400 when meeting ID contains special characters', async () => {
      const response = await request(app)
        .delete('/api/delete-meeting/123@456')
        .set('Authorization', validAuthToken)
        .expect(400);

      expect(response.body.error).toBe('Invalid meeting ID format');
    });

    /**
     * Verifies that the endpoint returns 404 when meeting ID is empty/space
     * (Express routing behavior - no :id match)
     */
    test('should return 404 when meeting ID is empty string', async () => {
      const response = await request(app)
        .delete('/api/delete-meeting/ ')
        .set('Authorization', validAuthToken)
        .expect(404);

      expect(response.body.error).toBe('Not found');
    });

    /**
     * Verifies that the endpoint accepts negative meeting IDs
     */
    test('should accept negative meeting ID', async () => {
      (deleteMeeting as any).mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/delete-meeting/-1')
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(response.body.message).toBe('Meeting deleted successfully');
      expect(deleteMeeting).toHaveBeenCalledWith(-1, mockUserId);
    });

    /**
     * Verifies that the endpoint accepts zero as meeting ID
     */
    test('should accept zero as meeting ID', async () => {
      (deleteMeeting as any).mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/delete-meeting/0')
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(response.body.message).toBe('Meeting deleted successfully');
      expect(deleteMeeting).toHaveBeenCalledWith(0, mockUserId);
    });

    /**
     * Verifies that the endpoint accepts very large meeting IDs
     */
    test('should accept very large meeting ID', async () => {
      (deleteMeeting as any).mockResolvedValue(null);

      const largeId = '999999999999';

      const response = await request(app)
        .delete(`/api/delete-meeting/${largeId}`)
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(response.body.message).toBe('Meeting deleted successfully');
      expect(deleteMeeting).toHaveBeenCalledWith(
        parseInt(largeId, 10),
        mockUserId
      );
    });

    /**
     * Verifies that the endpoint handles meeting ID with leading zeros
     */
    test('should handle meeting ID with leading zeros', async () => {
      (deleteMeeting as any).mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/delete-meeting/00123')
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(response.body.message).toBe('Meeting deleted successfully');
      expect(deleteMeeting).toHaveBeenCalledWith(123, mockUserId);
    });

    /**
     * Verifies that the endpoint returns 400 for meeting ID with spaces
     */
    test('should return 400 when meeting ID has spaces', async () => {
      const response = await request(app)
        .delete('/api/delete-meeting/1 2 3')
        .set('Authorization', validAuthToken)
        .expect(400);

      expect(response.body.error).toBe('Invalid meeting ID format');
    });
  });

  describe('Success Cases', () => {
    /**
     * Verifies successful meeting deletion with valid ID
     */
    test('should delete meeting successfully with valid ID', async () => {
      (deleteMeeting as any).mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/delete-meeting/123')
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(response.body.message).toBe('Meeting deleted successfully');
      expect(response.body.meetingId).toBe('123');
      expect(deleteMeeting).toHaveBeenCalledWith(123, mockUserId);
      expect(deleteMeeting).toHaveBeenCalledTimes(1);
    });

    /**
     * Verifies successful meeting deletion with single digit ID
     */
    test('should delete meeting successfully with single digit ID', async () => {
      (deleteMeeting as any).mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/delete-meeting/5')
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(response.body.message).toBe('Meeting deleted successfully');
      expect(response.body.meetingId).toBe('5');
      expect(deleteMeeting).toHaveBeenCalledWith(5, mockUserId);
    });

    /**
     * Verifies that the correct user ID is passed to deleteMeeting
     */
    test('should pass correct user ID to deleteMeeting', async () => {
      (deleteMeeting as any).mockResolvedValue(null);

      await request(app)
        .delete('/api/delete-meeting/456')
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(deleteMeeting).toHaveBeenCalledWith(456, mockUserId);
    });

    /**
     * Verifies that multiple delete requests work independently
     */
    test('should handle multiple delete requests independently', async () => {
      (deleteMeeting as any).mockResolvedValue(null);

      await request(app)
        .delete('/api/delete-meeting/1')
        .set('Authorization', validAuthToken)
        .expect(200);

      await request(app)
        .delete('/api/delete-meeting/2')
        .set('Authorization', validAuthToken)
        .expect(200);

      await request(app)
        .delete('/api/delete-meeting/3')
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(deleteMeeting).toHaveBeenCalledTimes(3);
      expect(deleteMeeting).toHaveBeenNthCalledWith(1, 1, mockUserId);
      expect(deleteMeeting).toHaveBeenNthCalledWith(2, 2, mockUserId);
      expect(deleteMeeting).toHaveBeenNthCalledWith(3, 3, mockUserId);
    });
  });

  describe('Error Cases from Database', () => {
    /**
     * Verifies that database errors are properly handled and returned
     */
    test('should return 400 when deleteMeeting returns error', async () => {
      (deleteMeeting as any).mockResolvedValue('Meeting not found');

      const response = await request(app)
        .delete('/api/delete-meeting/999')
        .set('Authorization', validAuthToken)
        .expect(400);

      expect(response.body.error).toBe('Meeting not found');
    });

    /**
     * Verifies that authorization errors are handled
     */
    test('should return 400 when user not authorized to delete meeting', async () => {
      (deleteMeeting as any).mockResolvedValue(
        'Not authorized to delete this meeting'
      );

      const response = await request(app)
        .delete('/api/delete-meeting/123')
        .set('Authorization', validAuthToken)
        .expect(400);

      expect(response.body.error).toBe('Not authorized to delete this meeting');
    });

    /**
     * Verifies that the endpoint returns 500 for unexpected errors
     */
    test('should return 500 for unexpected errors', async () => {
      (deleteMeeting as any).mockRejectedValue(
        new Error('Unexpected database error')
      );

      const response = await request(app)
        .delete('/api/delete-meeting/123')
        .set('Authorization', validAuthToken)
        .expect(500);

      expect(response.body.error).toBe('Internal server error');
    });

    /**
     * Verifies that network errors during database operations are handled
     */
    test('should return 500 when network error occurs', async () => {
      (deleteMeeting as any).mockRejectedValue(new Error('Network timeout'));

      const response = await request(app)
        .delete('/api/delete-meeting/123')
        .set('Authorization', validAuthToken)
        .expect(500);

      expect(response.body.error).toBe('Internal server error');
    });

    /**
     * Verifies that database connection errors are handled
     */
    test('should return 500 when database connection fails', async () => {
      (deleteMeeting as any).mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await request(app)
        .delete('/api/delete-meeting/123')
        .set('Authorization', validAuthToken)
        .expect(500);

      expect(response.body.error).toBe('Internal server error');
    });

    /**
     * Verifies handling of constraint violation errors
     */
    test('should return 400 for constraint violation', async () => {
      (deleteMeeting as any).mockResolvedValue(
        'Cannot delete meeting with active participants'
      );

      const response = await request(app)
        .delete('/api/delete-meeting/123')
        .set('Authorization', validAuthToken)
        .expect(400);

      expect(response.body.error).toBe(
        'Cannot delete meeting with active participants'
      );
    });
  });

  describe('Authorization Token Variations', () => {
    /**
     * Verifies that the endpoint handles authorization header with 'Bearer ' prefix
     */
    test('should handle token with Bearer prefix', async () => {
      (deleteMeeting as any).mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/delete-meeting/123')
        .set('Authorization', 'Bearer valid-token-123')
        .expect(200);

      expect(response.body.message).toBe('Meeting deleted successfully');
      expect(supabase.auth.getUser).toHaveBeenCalledWith('valid-token-123');
    });

    /**
     * Verifies that the endpoint strips Bearer prefix correctly
     */
    test('should strip Bearer prefix from token', async () => {
      (deleteMeeting as any).mockResolvedValue(null);

      await request(app)
        .delete('/api/delete-meeting/123')
        .set('Authorization', 'Bearer my-token-456')
        .expect(200);

      expect(supabase.auth.getUser).toHaveBeenCalledWith('my-token-456');
    });

    /**
     * Verifies that different tokens are handled correctly
     */
    test('should handle different tokens correctly', async () => {
      (deleteMeeting as any).mockResolvedValue(null);

      await request(app)
        .delete('/api/delete-meeting/1')
        .set('Authorization', 'Bearer token-abc')
        .expect(200);

      expect(supabase.auth.getUser).toHaveBeenCalledWith('token-abc');

      jest.clearAllMocks();
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      });

      await request(app)
        .delete('/api/delete-meeting/2')
        .set('Authorization', 'Bearer token-xyz')
        .expect(200);

      expect(supabase.auth.getUser).toHaveBeenCalledWith('token-xyz');
    });
  });

  describe('Edge Cases', () => {
    /**
     * Verifies behavior when attempting to delete already deleted meeting
     */
    test('should handle deletion of already deleted meeting', async () => {
      (deleteMeeting as any).mockResolvedValue('Meeting already deleted');

      const response = await request(app)
        .delete('/api/delete-meeting/123')
        .set('Authorization', validAuthToken)
        .expect(400);

      expect(response.body.error).toBe('Meeting already deleted');
    });

    /**
     * Verifies that meeting ID in response matches the requested ID
     */
    test('should return meeting ID in response', async () => {
      (deleteMeeting as any).mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/delete-meeting/789')
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(response.body.meetingId).toBe('789');
    });

    /**
     * Verifies that very large meeting IDs are returned correctly
     */
    test('should return very large meeting ID correctly', async () => {
      (deleteMeeting as any).mockResolvedValue(null);

      const largeId = '9007199254740991'; // JavaScript MAX_SAFE_INTEGER

      const response = await request(app)
        .delete(`/api/delete-meeting/${largeId}`)
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(response.body.meetingId).toBe(largeId);
    });

    /**
     * Verifies handling of concurrent delete requests for same meeting
     */
    test('should handle concurrent delete requests', async () => {
      (deleteMeeting as any).mockResolvedValue(null);

      const deletePromises = [
        request(app)
          .delete('/api/delete-meeting/123')
          .set('Authorization', validAuthToken),
        request(app)
          .delete('/api/delete-meeting/123')
          .set('Authorization', validAuthToken),
      ];

      const responses = await Promise.all(deletePromises);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Meeting deleted successfully');
      });
    });

    /**
     * Verifies that deleteMeeting is not called on authentication failure
     */
    test('should not call deleteMeeting on authentication failure', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: null },
        error: new Error('Invalid token'),
      });

      await request(app)
        .delete('/api/delete-meeting/123')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(deleteMeeting).not.toHaveBeenCalled();
    });

    /**
     * Verifies that deleteMeeting is not called on invalid ID format
     */
    test('should not call deleteMeeting on invalid ID format', async () => {
      await request(app)
        .delete('/api/delete-meeting/invalid')
        .set('Authorization', validAuthToken)
        .expect(400);

      expect(deleteMeeting).not.toHaveBeenCalled();
    });

    /**
     * Verifies proper cleanup after successful deletion
     */
    test('should properly cleanup after successful deletion', async () => {
      (deleteMeeting as any).mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/delete-meeting/123')
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(response.body.message).toBe('Meeting deleted successfully');
      expect(response.body.meetingId).toBe('123');

      // Verify no additional properties are returned
      expect(Object.keys(response.body)).toEqual(['message', 'meetingId']);
    });
  });

  describe('Response Format Tests', () => {
    /**
     * Verifies that success response has correct structure
     */
    test('should return correct response structure on success', async () => {
      (deleteMeeting as any).mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/delete-meeting/123')
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('meetingId');
      expect(response.body.message).toBe('Meeting deleted successfully');
      expect(response.body.meetingId).toBe('123');
    });

    /**
     * Verifies that error response has correct structure
     */
    test('should return correct response structure on error', async () => {
      (deleteMeeting as any).mockResolvedValue('Some error message');

      const response = await request(app)
        .delete('/api/delete-meeting/123')
        .set('Authorization', validAuthToken)
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
        .delete('/api/delete-meeting/123')
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Unauthorized');
      expect(Object.keys(response.body)).toEqual(['error']);
    });
  });

  describe('Data Integrity Tests', () => {
    /**
     * Verifies that the exact meeting ID is passed to deleteMeeting function
     */
    test('should pass exact meeting ID to deleteMeeting', async () => {
      (deleteMeeting as any).mockResolvedValue(null);

      await request(app)
        .delete('/api/delete-meeting/12345')
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(deleteMeeting).toHaveBeenCalledWith(12345, mockUserId);
      expect(deleteMeeting).toHaveBeenCalledTimes(1);
    });

    /**
     * Verifies that user ID from token is correctly used
     */
    test('should use user ID from authenticated token', async () => {
      const customUserId = 'custom-user-456';

      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: { id: customUserId } },
        error: null,
      });

      (deleteMeeting as any).mockResolvedValue(null);

      await request(app)
        .delete('/api/delete-meeting/123')
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(deleteMeeting).toHaveBeenCalledWith(123, customUserId);
    });

    /**
     * Verifies that meeting ID string is preserved in response
     */
    test('should preserve meeting ID as string in response', async () => {
      (deleteMeeting as any).mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/delete-meeting/00123')
        .set('Authorization', validAuthToken)
        .expect(200);

      // The response should preserve the original string format
      expect(response.body.meetingId).toBe('00123');
      // But the function should receive the parsed integer
      expect(deleteMeeting).toHaveBeenCalledWith(123, mockUserId);
    });
  });
});
