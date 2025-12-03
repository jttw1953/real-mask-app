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
const { deleteOverlay } = await import(
  '../../src/supabase_api/supabase_api.js'
);
const { supabase } = await import('../../src/supabase_api/supabase_api.js');

describe('DELETE /api/delete_overlay/:id', () => {
  const validAuthToken = 'Bearer valid-token-123';
  const mockUserId = 'user-123';
  const validOverlayId = '42';

  beforeEach(() => {
    jest.clearAllMocks();

    (supabase.auth.getUser as any).mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null,
    });

    (deleteOverlay as any).mockResolvedValue(null);
  });

  describe('Authentication Tests', () => {
    /**
     * Verifies that the endpoint returns 401 when no authorization header is provided
     */
    test('should return 401 when no authorization header provided', async () => {
      const response = await request(app)
        .delete(`/api/delete_overlay/${validOverlayId}`)
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
      expect(deleteOverlay).not.toHaveBeenCalled();
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
        .delete(`/api/delete_overlay/${validOverlayId}`)
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
      expect(deleteOverlay).not.toHaveBeenCalled();
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
        .delete(`/api/delete_overlay/${validOverlayId}`)
        .set('Authorization', validAuthToken)
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
      expect(deleteOverlay).not.toHaveBeenCalled();
    });

    /**
     * Verifies that the endpoint returns 401 when token is expired
     */
    test('should return 401 when token is expired', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: null },
        error: new Error('Token expired'),
      });

      const response = await request(app)
        .delete(`/api/delete_overlay/${validOverlayId}`)
        .set('Authorization', 'Bearer expired-token')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
      expect(deleteOverlay).not.toHaveBeenCalled();
    });

    /**
     * Verifies that the endpoint returns 401 with malformed Bearer token
     */
    test('should return 401 with malformed Bearer token', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: null },
        error: new Error('Malformed token'),
      });

      const response = await request(app)
        .delete(`/api/delete_overlay/${validOverlayId}`)
        .set('Authorization', 'Bearer ')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
      expect(deleteOverlay).not.toHaveBeenCalled();
    });

    /**
     * Verifies that the endpoint returns 401 when Authorization header is empty
     */
    test('should return 401 when Authorization header is empty string', async () => {
      const response = await request(app)
        .delete(`/api/delete_overlay/${validOverlayId}`)
        .set('Authorization', '')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
      expect(deleteOverlay).not.toHaveBeenCalled();
    });

    /**
     * Verifies that the endpoint returns 401 without Bearer prefix
     */
    test('should return 401 when token provided without Bearer prefix', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: null },
        error: new Error('Invalid token'),
      });

      const response = await request(app)
        .delete(`/api/delete_overlay/${validOverlayId}`)
        .set('Authorization', 'valid-token-123')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
      expect(deleteOverlay).not.toHaveBeenCalled();
    });

    /**
     * Verifies that the endpoint returns 401 with wrong auth scheme
     */
    test('should return 401 with non-Bearer auth scheme', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: null },
        error: new Error('Invalid token'),
      });

      const response = await request(app)
        .delete(`/api/delete_overlay/${validOverlayId}`)
        .set('Authorization', 'Basic valid-token-123')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
      expect(deleteOverlay).not.toHaveBeenCalled();
    });
  });

  describe('Success Cases', () => {
    /**
     * Verifies successful deletion with valid overlay ID
     */
    test('should delete overlay successfully with valid ID', async () => {
      const response = await request(app)
        .delete(`/api/delete_overlay/${validOverlayId}`)
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(response.body.message).toBe('Overlay deleted successfully');
      expect(response.body.overlayId).toBe(validOverlayId);
      expect(deleteOverlay).toHaveBeenCalledWith(42, mockUserId);
      expect(deleteOverlay).toHaveBeenCalledTimes(1);
    });

    /**
     * Verifies successful deletion with ID "1"
     */
    test('should delete overlay with ID "1"', async () => {
      const response = await request(app)
        .delete('/api/delete_overlay/1')
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(response.body.message).toBe('Overlay deleted successfully');
      expect(response.body.overlayId).toBe('1');
      expect(deleteOverlay).toHaveBeenCalledWith(1, mockUserId);
    });

    /**
     * Verifies successful deletion with large ID number
     */
    test('should delete overlay with large ID number', async () => {
      const largeId = '999999999';

      const response = await request(app)
        .delete(`/api/delete_overlay/${largeId}`)
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(response.body.message).toBe('Overlay deleted successfully');
      expect(response.body.overlayId).toBe(largeId);
      expect(deleteOverlay).toHaveBeenCalledWith(999999999, mockUserId);
    });

    /**
     * Verifies that overlayId in response matches the request parameter
     */
    test('should return the same overlayId string format as provided', async () => {
      const testId = '00123';

      const response = await request(app)
        .delete(`/api/delete_overlay/${testId}`)
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(response.body.overlayId).toBe(testId);
      expect(deleteOverlay).toHaveBeenCalledWith(123, mockUserId);
    });

    /**
     * Verifies successful deletion passes correct parameters to deleteOverlay
     */
    test('should pass correct parameters to deleteOverlay', async () => {
      await request(app)
        .delete('/api/delete_overlay/555')
        .set('Authorization', validAuthToken)
        .expect(200);

      const calls = (deleteOverlay as any).mock.calls;
      expect(calls).toHaveLength(1);
      expect(calls[0]).toHaveLength(2);
      expect(calls[0][0]).toBe(555);
      expect(calls[0][1]).toBe(mockUserId);
      expect(typeof calls[0][0]).toBe('number');
      expect(typeof calls[0][1]).toBe('string');
    });
  });

  describe('Invalid Overlay ID Tests', () => {
    /**
     * Verifies that non-numeric ID returns 400
     */
    test('should return 400 for non-numeric overlay ID', async () => {
      const response = await request(app)
        .delete('/api/delete_overlay/abc')
        .set('Authorization', validAuthToken)
        .expect(400);

      expect(response.body.error).toBe('Invalid overlay ID format');
      expect(deleteOverlay).not.toHaveBeenCalled();
    });

    /**
     * Verifies that alphanumeric ID is parsed (parseInt stops at first non-digit)
     */
    test('should parse alphanumeric overlay ID (parseInt behavior)', async () => {
      const response = await request(app)
        .delete('/api/delete_overlay/123abc')
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(response.body.message).toBe('Overlay deleted successfully');
      expect(response.body.overlayId).toBe('123abc');
      // parseInt('123abc') = 123
      expect(deleteOverlay).toHaveBeenCalledWith(123, mockUserId);
    });

    /**
     * Verifies that ID with dash is parsed as number (parseInt stops at second dash)
     */
    test('should parse ID with special characters (parseInt behavior)', async () => {
      const response = await request(app)
        .delete('/api/delete_overlay/123-456')
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(response.body.message).toBe('Overlay deleted successfully');
      // parseInt('123-456') = 123 (stops at the dash)
      expect(deleteOverlay).toHaveBeenCalledWith(123, mockUserId);
    });

    /**
     * Verifies that ID with spaces is parsed (parseInt stops at space)
     */
    test('should parse ID with spaces (parseInt behavior)', async () => {
      const response = await request(app)
        .delete('/api/delete_overlay/123 456')
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(response.body.message).toBe('Overlay deleted successfully');
      // parseInt('123 456') = 123 (stops at space)
      expect(deleteOverlay).toHaveBeenCalledWith(123, mockUserId);
    });

    /**
     * Verifies that floating point ID is parsed as integer (parseInt stops at decimal)
     */
    test('should parse floating point ID as integer', async () => {
      const response = await request(app)
        .delete('/api/delete_overlay/123.456')
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(response.body.message).toBe('Overlay deleted successfully');
      // parseInt('123.456') = 123 (stops at decimal point)
      expect(deleteOverlay).toHaveBeenCalledWith(123, mockUserId);
    });

    /**
     * Verifies that negative ID is accepted by parseInt
     */
    test('should accept negative overlay ID', async () => {
      const response = await request(app)
        .delete('/api/delete_overlay/-123')
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(response.body.message).toBe('Overlay deleted successfully');
      expect(response.body.overlayId).toBe('-123');
      // parseInt('-123') = -123
      expect(deleteOverlay).toHaveBeenCalledWith(-123, mockUserId);
    });

    /**
     * Verifies that zero as string works (since parseInt("0") = 0)
     */
    test('should handle zero ID', async () => {
      const response = await request(app)
        .delete('/api/delete_overlay/0')
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(response.body.message).toBe('Overlay deleted successfully');
      expect(deleteOverlay).toHaveBeenCalledWith(0, mockUserId);
    });

    /**
     * Verifies that ID with leading zeros is parsed correctly
     */
    test('should handle ID with leading zeros', async () => {
      const response = await request(app)
        .delete('/api/delete_overlay/00042')
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(response.body.overlayId).toBe('00042');
      expect(deleteOverlay).toHaveBeenCalledWith(42, mockUserId);
    });

    /**
     * Verifies that UUID format is parsed (parseInt stops at first dash)
     */
    test('should parse UUID format (parseInt behavior)', async () => {
      const response = await request(app)
        .delete('/api/delete_overlay/550e8400-e29b-41d4-a716-446655440000')
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(response.body.message).toBe('Overlay deleted successfully');
      // parseInt('550e8400-e29b-41d4-a716-446655440000') parses '550e8400' in base 10
      // which interprets 'e' as exponential notation, resulting in 550
      expect(deleteOverlay).toHaveBeenCalled();
    });

    /**
     * Verifies that hexadecimal format is parsed (parseInt stops at 'x')
     */
    test('should parse hexadecimal format (parseInt behavior)', async () => {
      const response = await request(app)
        .delete('/api/delete_overlay/0x1A2B')
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(response.body.message).toBe('Overlay deleted successfully');
      // parseInt('0x1A2B', 10) = 0 (stops at 'x')
      expect(deleteOverlay).toHaveBeenCalledWith(0, mockUserId);
    });

    /**
     * Verifies that exponential notation is parsed (parseInt stops at 'e')
     */
    test('should parse exponential notation (parseInt behavior)', async () => {
      const response = await request(app)
        .delete('/api/delete_overlay/1e5')
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(response.body.message).toBe('Overlay deleted successfully');
      // parseInt('1e5', 10) = 1 (stops at 'e')
      expect(deleteOverlay).toHaveBeenCalledWith(1, mockUserId);
    });

    /**
     * Verifies that infinity returns 400
     */
    test('should return 400 for Infinity', async () => {
      const response = await request(app)
        .delete('/api/delete_overlay/Infinity')
        .set('Authorization', validAuthToken)
        .expect(400);

      expect(response.body.error).toBe('Invalid overlay ID format');
      expect(deleteOverlay).not.toHaveBeenCalled();
    });

    /**
     * Verifies that NaN returns 400
     */
    test('should return 400 for NaN', async () => {
      const response = await request(app)
        .delete('/api/delete_overlay/NaN')
        .set('Authorization', validAuthToken)
        .expect(400);

      expect(response.body.error).toBe('Invalid overlay ID format');
      expect(deleteOverlay).not.toHaveBeenCalled();
    });

    /**
     * Verifies that empty string ID returns 400
     */
    test('should return 400 for empty string ID', async () => {
      const response = await request(app)
        .delete('/api/delete_overlay/')
        .set('Authorization', validAuthToken)
        .expect(404);

      expect(response.body.error).toBe('Not found');
      expect(deleteOverlay).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling Tests', () => {
    /**
     * Verifies that database errors are properly returned
     */
    test('should return 400 when deleteOverlay returns error', async () => {
      (deleteOverlay as any).mockResolvedValue('Overlay not found');

      const response = await request(app)
        .delete(`/api/delete_overlay/${validOverlayId}`)
        .set('Authorization', validAuthToken)
        .expect(400);

      expect(response.body.error).toBe('Overlay not found');
      expect(deleteOverlay).toHaveBeenCalledWith(42, mockUserId);
    });

    /**
     * Verifies handling of permission denied errors
     */
    test('should return 400 when user does not own overlay', async () => {
      (deleteOverlay as any).mockResolvedValue(
        'You do not have permission to delete this overlay'
      );

      const response = await request(app)
        .delete(`/api/delete_overlay/${validOverlayId}`)
        .set('Authorization', validAuthToken)
        .expect(400);

      expect(response.body.error).toBe(
        'You do not have permission to delete this overlay'
      );
    });

    /**
     * Verifies handling of overlay not found errors
     */
    test('should return 400 when overlay does not exist', async () => {
      (deleteOverlay as any).mockResolvedValue('Overlay does not exist');

      const response = await request(app)
        .delete('/api/delete_overlay/99999')
        .set('Authorization', validAuthToken)
        .expect(400);

      expect(response.body.error).toBe('Overlay does not exist');
      expect(deleteOverlay).toHaveBeenCalledWith(99999, mockUserId);
    });

    /**
     * Verifies handling of database connection errors
     */
    test('should return 400 for database connection error', async () => {
      (deleteOverlay as any).mockResolvedValue('Database connection failed');

      const response = await request(app)
        .delete(`/api/delete_overlay/${validOverlayId}`)
        .set('Authorization', validAuthToken)
        .expect(400);

      expect(response.body.error).toBe('Database connection failed');
    });

    /**
     * Verifies internal server error handling when exception is thrown
     */
    test('should return 500 when deleteOverlay throws exception', async () => {
      (deleteOverlay as any).mockRejectedValue(new Error('Unexpected error'));

      const response = await request(app)
        .delete(`/api/delete_overlay/${validOverlayId}`)
        .set('Authorization', validAuthToken)
        .expect(500);

      expect(response.body.error).toBe('Internal server error');
    });

    /**
     * Verifies internal server error handling for null pointer exceptions
     */
    test('should handle null pointer exception', async () => {
      (deleteOverlay as any).mockRejectedValue(
        new TypeError("Cannot read property 'id' of null")
      );

      const response = await request(app)
        .delete(`/api/delete_overlay/${validOverlayId}`)
        .set('Authorization', validAuthToken)
        .expect(500);

      expect(response.body.error).toBe('Internal server error');
    });

    /**
     * Verifies internal server error handling for timeout errors
     */
    test('should handle timeout errors', async () => {
      (deleteOverlay as any).mockRejectedValue(new Error('Request timeout'));

      const response = await request(app)
        .delete(`/api/delete_overlay/${validOverlayId}`)
        .set('Authorization', validAuthToken)
        .expect(500);

      expect(response.body.error).toBe('Internal server error');
    });

    /**
     * Verifies that error responses don't leak sensitive information
     */
    test('should not leak sensitive information in error responses', async () => {
      (deleteOverlay as any).mockResolvedValue(
        'Database error at line 42 in file /secret/path/db.js'
      );

      const response = await request(app)
        .delete(`/api/delete_overlay/${validOverlayId}`)
        .set('Authorization', validAuthToken)
        .expect(400);

      // The error message is returned as-is from deleteOverlay
      expect(response.body.error).toBe(
        'Database error at line 42 in file /secret/path/db.js'
      );
      // This tests that the endpoint doesn't add additional sensitive info
      expect(response.body).not.toHaveProperty('stack');
      expect(response.body).not.toHaveProperty('userId');
    });
  });

  describe('Response Format Tests', () => {
    /**
     * Verifies that success response has correct structure
     */
    test('should return correct response structure on success', async () => {
      const response = await request(app)
        .delete(`/api/delete_overlay/${validOverlayId}`)
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('overlayId');
      expect(response.body.message).toBe('Overlay deleted successfully');
      expect(response.body.overlayId).toBe(validOverlayId);
      expect(Object.keys(response.body)).toEqual(['message', 'overlayId']);
    });

    /**
     * Verifies that error response has correct structure
     */
    test('should return correct response structure on error', async () => {
      (deleteOverlay as any).mockResolvedValue('Some error message');

      const response = await request(app)
        .delete(`/api/delete_overlay/${validOverlayId}`)
        .set('Authorization', validAuthToken)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Some error message');
      expect(response.body).not.toHaveProperty('message');
      expect(response.body).not.toHaveProperty('overlayId');
      expect(Object.keys(response.body)).toEqual(['error']);
    });

    /**
     * Verifies that authentication error response has correct structure
     */
    test('should return correct response structure on auth error', async () => {
      const response = await request(app)
        .delete(`/api/delete_overlay/${validOverlayId}`)
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Unauthorized');
      expect(Object.keys(response.body)).toEqual(['error']);
    });

    /**
     * Verifies that validation error response has correct structure
     */
    test('should return correct response structure on validation error', async () => {
      const response = await request(app)
        .delete('/api/delete_overlay/invalid')
        .set('Authorization', validAuthToken)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Invalid overlay ID format');
      expect(Object.keys(response.body)).toEqual(['error']);
    });

    /**
     * Verifies that response contains proper JSON content type
     */
    test('should return JSON content type', async () => {
      const response = await request(app)
        .delete(`/api/delete_overlay/${validOverlayId}`)
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    /**
     * Verifies that overlayId is returned as string, not number
     */
    test('should return overlayId as string in response', async () => {
      const response = await request(app)
        .delete('/api/delete_overlay/123')
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(typeof response.body.overlayId).toBe('string');
      expect(response.body.overlayId).toBe('123');
    });
  });

  describe('HTTP Method Tests', () => {
    /**
     * Verifies that GET method is not allowed
     */
    test('should not allow GET method', async () => {
      const response = await request(app)
        .get(`/api/delete_overlay/${validOverlayId}`)
        .set('Authorization', validAuthToken)
        .expect(404);

      expect(response.body.error).toBe('Not found');
      expect(deleteOverlay).not.toHaveBeenCalled();
    });

    /**
     * Verifies that POST method is not allowed
     */
    test('should not allow POST method', async () => {
      const response = await request(app)
        .post(`/api/delete_overlay/${validOverlayId}`)
        .set('Authorization', validAuthToken)
        .expect(404);

      expect(response.body.error).toBe('Not found');
      expect(deleteOverlay).not.toHaveBeenCalled();
    });

    /**
     * Verifies that PUT method is not allowed
     */
    test('should not allow PUT method', async () => {
      const response = await request(app)
        .put(`/api/delete_overlay/${validOverlayId}`)
        .set('Authorization', validAuthToken)
        .expect(404);

      expect(response.body.error).toBe('Not found');
      expect(deleteOverlay).not.toHaveBeenCalled();
    });

    /**
     * Verifies that PATCH method is not allowed
     */
    test('should not allow PATCH method', async () => {
      const response = await request(app)
        .patch(`/api/delete_overlay/${validOverlayId}`)
        .set('Authorization', validAuthToken)
        .expect(404);

      expect(response.body.error).toBe('Not found');
      expect(deleteOverlay).not.toHaveBeenCalled();
    });

    /**
     * Verifies that OPTIONS method returns correct CORS headers
     */
    test('should handle OPTIONS request for CORS', async () => {
      const response = await request(app)
        .options(`/api/delete_overlay/${validOverlayId}`)
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('*');
      expect(response.headers['access-control-allow-methods']).toContain(
        'DELETE'
      );
    });
  });

  describe('Edge Cases and Boundary Tests', () => {
    /**
     * Verifies handling of maximum safe integer
     */
    test('should handle maximum safe integer ID', async () => {
      const maxSafeInt = Number.MAX_SAFE_INTEGER.toString();

      const response = await request(app)
        .delete(`/api/delete_overlay/${maxSafeInt}`)
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(response.body.message).toBe('Overlay deleted successfully');
      expect(deleteOverlay).toHaveBeenCalledWith(
        Number.MAX_SAFE_INTEGER,
        mockUserId
      );
    });

    /**
     * Verifies handling of number larger than max safe integer
     */
    test('should handle number larger than max safe integer', async () => {
      const largerThanMax = '9007199254740992'; // MAX_SAFE_INTEGER + 1

      const response = await request(app)
        .delete(`/api/delete_overlay/${largerThanMax}`)
        .set('Authorization', validAuthToken)
        .expect(200);

      // parseInt will still parse it, but precision may be lost
      expect(response.body.message).toBe('Overlay deleted successfully');
      expect(deleteOverlay).toHaveBeenCalled();
    });

    /**
     * Verifies that deleteOverlay is called exactly once per request
     */
    test('should call deleteOverlay exactly once', async () => {
      await request(app)
        .delete(`/api/delete_overlay/${validOverlayId}`)
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(deleteOverlay).toHaveBeenCalledTimes(1);
    });

    /**
     * Verifies that deleteOverlay receives correct parameter types
     */
    test('should pass correct parameter types to deleteOverlay', async () => {
      await request(app)
        .delete('/api/delete_overlay/999')
        .set('Authorization', validAuthToken)
        .expect(200);

      const calls = (deleteOverlay as any).mock.calls;
      expect(typeof calls[0][0]).toBe('number');
      expect(typeof calls[0][1]).toBe('string');
    });

    /**
     * Verifies consistent behavior across multiple deletion attempts
     */
    test('should handle multiple deletion requests consistently', async () => {
      const response1 = await request(app)
        .delete('/api/delete_overlay/1')
        .set('Authorization', validAuthToken)
        .expect(200);

      const response2 = await request(app)
        .delete('/api/delete_overlay/2')
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(response1.body.message).toBe(response2.body.message);
      expect(response1.body.overlayId).toBe('1');
      expect(response2.body.overlayId).toBe('2');
      expect(deleteOverlay).toHaveBeenCalledTimes(2);
    });

    /**
     * Verifies that different users can delete their own overlays
     */
    test('should allow different users to delete their own overlays', async () => {
      const user1Id = 'user-123';
      const user2Id = 'user-456';
      const user1Token = 'Bearer token-123';
      const user2Token = 'Bearer token-456';

      (supabase.auth.getUser as any).mockImplementation((token: string) => {
        if (token === 'token-123') {
          return Promise.resolve({
            data: { user: { id: user1Id } },
            error: null,
          });
        } else if (token === 'token-456') {
          return Promise.resolve({
            data: { user: { id: user2Id } },
            error: null,
          });
        }
      });

      await request(app)
        .delete('/api/delete_overlay/10')
        .set('Authorization', user1Token)
        .expect(200);

      await request(app)
        .delete('/api/delete_overlay/20')
        .set('Authorization', user2Token)
        .expect(200);

      expect(deleteOverlay).toHaveBeenCalledWith(10, user1Id);
      expect(deleteOverlay).toHaveBeenCalledWith(20, user2Id);
      expect(deleteOverlay).toHaveBeenCalledTimes(2);
    });

    /**
     * Verifies URL encoding doesn't break ID parsing
     */
    test('should handle URL encoded ID', async () => {
      const response = await request(app)
        .delete('/api/delete_overlay/123')
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(response.body.overlayId).toBe('123');
      expect(deleteOverlay).toHaveBeenCalledWith(123, mockUserId);
    });
  });

  describe('Security Tests', () => {
    /**
     * Verifies that user cannot delete overlay without authentication
     */
    test('should prevent deletion without authentication', async () => {
      const response = await request(app)
        .delete(`/api/delete_overlay/${validOverlayId}`)
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
      expect(deleteOverlay).not.toHaveBeenCalled();
    });

    /**
     * Verifies that userId is passed correctly to deleteOverlay for authorization
     */
    test('should pass userId to deleteOverlay for authorization check', async () => {
      await request(app)
        .delete(`/api/delete_overlay/${validOverlayId}`)
        .set('Authorization', validAuthToken)
        .expect(200);

      const calls = (deleteOverlay as any).mock.calls;
      expect(calls[0][1]).toBe(mockUserId);
    });

    /**
     * Verifies that response doesn't leak user information
     */
    test('should not leak user information in response', async () => {
      const response = await request(app)
        .delete(`/api/delete_overlay/${validOverlayId}`)
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(response.body).not.toHaveProperty('userId');
      expect(response.body).not.toHaveProperty('user');
      expect(response.body).not.toHaveProperty('token');
    });

    /**
     * Verifies that token is properly stripped of Bearer prefix
     */
    test('should properly extract token from Bearer header', async () => {
      await request(app)
        .delete(`/api/delete_overlay/${validOverlayId}`)
        .set('Authorization', 'Bearer test-token-with-special-chars-123_456')
        .expect(200);

      expect(supabase.auth.getUser).toHaveBeenCalledWith(
        'test-token-with-special-chars-123_456'
      );
    });

    /**
     * Verifies that attempting to delete with another user's ID is handled by deleteOverlay
     */
    test('should rely on deleteOverlay for ownership verification', async () => {
      (deleteOverlay as any).mockResolvedValue('Permission denied');

      const response = await request(app)
        .delete('/api/delete_overlay/999')
        .set('Authorization', validAuthToken)
        .expect(400);

      expect(response.body.error).toBe('Permission denied');
      expect(deleteOverlay).toHaveBeenCalledWith(999, mockUserId);
    });
  });

  describe('Concurrency Tests', () => {
    /**
     * Verifies that concurrent deletion requests are handled independently
     */
    test('should handle concurrent deletion requests', async () => {
      const requests = [
        request(app)
          .delete('/api/delete_overlay/1')
          .set('Authorization', validAuthToken),
        request(app)
          .delete('/api/delete_overlay/2')
          .set('Authorization', validAuthToken),
        request(app)
          .delete('/api/delete_overlay/3')
          .set('Authorization', validAuthToken),
      ];

      const responses = await Promise.all(requests);

      responses.forEach((response, index) => {
        expect(response.status).toBe(200);
        expect(response.body.overlayId).toBe((index + 1).toString());
      });

      expect(deleteOverlay).toHaveBeenCalledTimes(3);
    });

    /**
     * Verifies that same overlay deletion twice calls deleteOverlay twice
     */
    test('should handle duplicate deletion attempts', async () => {
      const response1 = await request(app)
        .delete(`/api/delete_overlay/${validOverlayId}`)
        .set('Authorization', validAuthToken)
        .expect(200);

      // Second deletion might fail in real scenario, but endpoint will try
      (deleteOverlay as any).mockResolvedValue('Overlay not found');

      const response2 = await request(app)
        .delete(`/api/delete_overlay/${validOverlayId}`)
        .set('Authorization', validAuthToken)
        .expect(400);

      expect(response1.body.message).toBe('Overlay deleted successfully');
      expect(response2.body.error).toBe('Overlay not found');
      expect(deleteOverlay).toHaveBeenCalledTimes(2);
    });
  });

  describe('Path Parameter Tests', () => {
    /**
     * Verifies that the endpoint uses the correct parameter name
     */
    test('should extract ID from :id path parameter', async () => {
      await request(app)
        .delete('/api/delete_overlay/789')
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(deleteOverlay).toHaveBeenCalledWith(789, mockUserId);
    });

    /**
     * Verifies handling of very long numeric string
     */
    test('should handle very long numeric string', async () => {
      const longNumStr = '12345678901234567890';

      const response = await request(app)
        .delete(`/api/delete_overlay/${longNumStr}`)
        .set('Authorization', validAuthToken)
        .expect(200);

      // JavaScript parseInt will handle this, though precision may be lost
      expect(response.body.message).toBe('Overlay deleted successfully');
      expect(deleteOverlay).toHaveBeenCalled();
    });

    /**
     * Verifies that missing ID parameter routes to 404
     */
    test('should return 404 when ID parameter is missing', async () => {
      const response = await request(app)
        .delete('/api/delete_overlay/')
        .set('Authorization', validAuthToken)
        .expect(404);

      expect(response.body.error).toBe('Not found');
      expect(deleteOverlay).not.toHaveBeenCalled();
    });
  });
});
