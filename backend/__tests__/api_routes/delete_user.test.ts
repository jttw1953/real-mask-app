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
const { deleteUser } = await import('../../src/supabase_api/supabase_api.js');
const { supabase } = await import('../../src/supabase_api/supabase_api.js');

describe('DELETE /api/delete-user', () => {
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
        .delete('/api/delete-user')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
      expect(deleteUser).not.toHaveBeenCalled();
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
        .delete('/api/delete-user')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
      expect(deleteUser).not.toHaveBeenCalled();
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
        .delete('/api/delete-user')
        .set('Authorization', validAuthToken)
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
      expect(deleteUser).not.toHaveBeenCalled();
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
        .delete('/api/delete-user')
        .set('Authorization', 'Bearer expired-token')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
      expect(deleteUser).not.toHaveBeenCalled();
    });

    /**
     * Verifies that the endpoint returns 401 with empty Authorization header
     */
    test('should return 401 when Authorization header is empty', async () => {
      const response = await request(app)
        .delete('/api/delete-user')
        .set('Authorization', '')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
      expect(deleteUser).not.toHaveBeenCalled();
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
        .delete('/api/delete-user')
        .set('Authorization', 'Bearer ')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
      expect(deleteUser).not.toHaveBeenCalled();
    });
  });

  describe('Success Cases', () => {
    /**
     * Verifies successful user deletion
     */
    test('should delete user successfully', async () => {
      (deleteUser as any).mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/delete-user')
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(response.body.message).toBe('User deleted successfully');
      expect(deleteUser).toHaveBeenCalledWith(mockUserId);
      expect(deleteUser).toHaveBeenCalledTimes(1);
    });

    /**
     * Verifies that the correct user ID is passed to deleteUser
     */
    test('should pass correct user ID to deleteUser', async () => {
      (deleteUser as any).mockResolvedValue(null);

      await request(app)
        .delete('/api/delete-user')
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(deleteUser).toHaveBeenCalledWith(mockUserId);
    });

    /**
     * Verifies that deleteUser is called with exactly one parameter
     */
    test('should call deleteUser with only userId', async () => {
      (deleteUser as any).mockResolvedValue(null);

      await request(app)
        .delete('/api/delete-user')
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(deleteUser).toHaveBeenCalledWith(mockUserId);
      expect(deleteUser).toHaveBeenCalledTimes(1);
      expect((deleteUser as any).mock.calls[0]).toHaveLength(1);
    });

    /**
     * Verifies that different users can delete their accounts
     */
    test('should delete different users with different tokens', async () => {
      const customUserId = 'custom-user-456';

      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: { id: customUserId } },
        error: null,
      });

      (deleteUser as any).mockResolvedValue(null);

      await request(app)
        .delete('/api/delete-user')
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(deleteUser).toHaveBeenCalledWith(customUserId);
    });

    /**
     * Verifies successful deletion returns only message property
     */
    test('should return only message in success response', async () => {
      (deleteUser as any).mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/delete-user')
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('User deleted successfully');
      expect(Object.keys(response.body)).toEqual(['message']);
    });
  });

  describe('Error Cases from Database', () => {
    /**
     * Verifies that database errors are properly handled and returned
     */
    test('should return 400 for database errors', async () => {
      (deleteUser as any).mockResolvedValue('Database error occurred');

      const response = await request(app)
        .delete('/api/delete-user')
        .set('Authorization', validAuthToken)
        .expect(400);

      expect(response.body.error).toBe('Database error occurred');
    });

    /**
     * Verifies handling of user not found error
     */
    test('should return 400 when user not found', async () => {
      (deleteUser as any).mockResolvedValue('User not found');

      const response = await request(app)
        .delete('/api/delete-user')
        .set('Authorization', validAuthToken)
        .expect(400);

      expect(response.body.error).toBe('User not found');
    });

    /**
     * Verifies handling of user already deleted error
     */
    test('should return 400 when user already deleted', async () => {
      (deleteUser as any).mockResolvedValue('User already deleted');

      const response = await request(app)
        .delete('/api/delete-user')
        .set('Authorization', validAuthToken)
        .expect(400);

      expect(response.body.error).toBe('User already deleted');
    });

    /**
     * Verifies that the endpoint returns 500 for unexpected errors
     */
    test('should return 500 for unexpected errors', async () => {
      (deleteUser as any).mockRejectedValue(
        new Error('Unexpected database error')
      );

      const response = await request(app)
        .delete('/api/delete-user')
        .set('Authorization', validAuthToken)
        .expect(500);

      expect(response.body.error).toBe('Internal server error');
    });

    /**
     * Verifies that network errors during database operations are handled
     */
    test('should return 500 when network error occurs', async () => {
      (deleteUser as any).mockRejectedValue(new Error('Network timeout'));

      const response = await request(app)
        .delete('/api/delete-user')
        .set('Authorization', validAuthToken)
        .expect(500);

      expect(response.body.error).toBe('Internal server error');
    });

    /**
     * Verifies handling of database connection failures
     */
    test('should return 500 when database connection fails', async () => {
      (deleteUser as any).mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await request(app)
        .delete('/api/delete-user')
        .set('Authorization', validAuthToken)
        .expect(500);

      expect(response.body.error).toBe('Internal server error');
    });

    /**
     * Verifies handling of constraint violations
     */
    test('should return 400 for constraint violations', async () => {
      (deleteUser as any).mockResolvedValue(
        'Cannot delete user with active subscriptions'
      );

      const response = await request(app)
        .delete('/api/delete-user')
        .set('Authorization', validAuthToken)
        .expect(400);

      expect(response.body.error).toBe(
        'Cannot delete user with active subscriptions'
      );
    });

    /**
     * Verifies handling of foreign key constraint errors
     */
    test('should return 400 for foreign key constraint errors', async () => {
      (deleteUser as any).mockResolvedValue(
        'Cannot delete user due to related records'
      );

      const response = await request(app)
        .delete('/api/delete-user')
        .set('Authorization', validAuthToken)
        .expect(400);

      expect(response.body.error).toBe(
        'Cannot delete user due to related records'
      );
    });

    /**
     * Verifies handling of permission errors
     */
    test('should return 400 for permission errors', async () => {
      (deleteUser as any).mockResolvedValue('Permission denied');

      const response = await request(app)
        .delete('/api/delete-user')
        .set('Authorization', validAuthToken)
        .expect(400);

      expect(response.body.error).toBe('Permission denied');
    });

    /**
     * Verifies handling of null pointer errors
     */
    test('should return 500 for null pointer errors', async () => {
      (deleteUser as any).mockRejectedValue(
        new Error('Cannot read property of null')
      );

      const response = await request(app)
        .delete('/api/delete-user')
        .set('Authorization', validAuthToken)
        .expect(500);

      expect(response.body.error).toBe('Internal server error');
    });
  });

  describe('Authorization Token Variations', () => {
    /**
     * Verifies that the endpoint handles authorization header with 'Bearer ' prefix
     */
    test('should handle token with Bearer prefix', async () => {
      (deleteUser as any).mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/delete-user')
        .set('Authorization', 'Bearer valid-token-123')
        .expect(200);

      expect(response.body.message).toBe('User deleted successfully');
      expect(supabase.auth.getUser).toHaveBeenCalledWith('valid-token-123');
    });

    /**
     * Verifies that the endpoint strips Bearer prefix correctly
     */
    test('should strip Bearer prefix from token', async () => {
      (deleteUser as any).mockResolvedValue(null);

      await request(app)
        .delete('/api/delete-user')
        .set('Authorization', 'Bearer my-token-456')
        .expect(200);

      expect(supabase.auth.getUser).toHaveBeenCalledWith('my-token-456');
    });

    /**
     * Verifies that different tokens delete different users
     */
    test('should delete correct user based on token', async () => {
      const customUserId = 'user-789';

      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: { id: customUserId } },
        error: null,
      });

      (deleteUser as any).mockResolvedValue(null);

      await request(app)
        .delete('/api/delete-user')
        .set('Authorization', 'Bearer different-token')
        .expect(200);

      expect(deleteUser).toHaveBeenCalledWith(customUserId);
    });

    /**
     * Verifies that very long tokens are handled
     */
    test('should handle very long authorization tokens', async () => {
      const longToken = 'a'.repeat(1000);

      (deleteUser as any).mockResolvedValue(null);

      await request(app)
        .delete('/api/delete-user')
        .set('Authorization', `Bearer ${longToken}`)
        .expect(200);

      expect(supabase.auth.getUser).toHaveBeenCalledWith(longToken);
    });

    /**
     * Verifies that tokens with special characters are handled
     */
    test('should handle tokens with special characters', async () => {
      const specialToken = 'token-with-special!@#$%^&*()_+=chars';

      (deleteUser as any).mockResolvedValue(null);

      await request(app)
        .delete('/api/delete-user')
        .set('Authorization', `Bearer ${specialToken}`)
        .expect(200);

      expect(supabase.auth.getUser).toHaveBeenCalledWith(specialToken);
    });
  });

  describe('Edge Cases', () => {
    /**
     * Verifies that deleteUser is not called on authentication failure
     */
    test('should not call deleteUser on authentication failure', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: null },
        error: new Error('Invalid token'),
      });

      await request(app)
        .delete('/api/delete-user')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(deleteUser).not.toHaveBeenCalled();
    });

    /**
     * Verifies that the endpoint handles concurrent deletion requests
     */
    test('should handle concurrent deletion requests', async () => {
      (deleteUser as any).mockResolvedValue(null);

      const requests = [
        request(app)
          .delete('/api/delete-user')
          .set('Authorization', validAuthToken),
        request(app)
          .delete('/api/delete-user')
          .set('Authorization', validAuthToken),
        request(app)
          .delete('/api/delete-user')
          .set('Authorization', validAuthToken),
      ];

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('User deleted successfully');
      });

      expect(deleteUser).toHaveBeenCalledTimes(3);
    });

    /**
     * Verifies that multiple sequential deletions work
     */
    test('should handle multiple sequential deletion attempts', async () => {
      (deleteUser as any).mockResolvedValue(null);

      await request(app)
        .delete('/api/delete-user')
        .set('Authorization', validAuthToken)
        .expect(200);

      await request(app)
        .delete('/api/delete-user')
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(deleteUser).toHaveBeenCalledTimes(2);
    });

    /**
     * Verifies that attempting to delete with same token multiple times works
     */
    test('should allow multiple deletion attempts with same token', async () => {
      (deleteUser as any)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce('User already deleted');

      const response1 = await request(app)
        .delete('/api/delete-user')
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(response1.body.message).toBe('User deleted successfully');

      const response2 = await request(app)
        .delete('/api/delete-user')
        .set('Authorization', validAuthToken)
        .expect(400);

      expect(response2.body.error).toBe('User already deleted');
    });

    /**
     * Verifies that response structure is consistent
     */
    test('should have consistent response structure', async () => {
      (deleteUser as any).mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/delete-user')
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(Object.keys(response.body)).toEqual(['message']);
    });

    /**
     * Verifies that the endpoint handles empty userId from token
     */
    test('should return 401 when userId from token is empty string', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: { id: '' } },
        error: null,
      });

      const response = await request(app)
        .delete('/api/delete-user')
        .set('Authorization', validAuthToken)
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
      expect(deleteUser).not.toHaveBeenCalled();
    });

    /**
     * Verifies that request body is ignored (no body needed for delete)
     */
    test('should ignore request body if provided', async () => {
      (deleteUser as any).mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/delete-user')
        .set('Authorization', validAuthToken)
        .send({ extra_field: 'should be ignored', another: 123 })
        .expect(200);

      expect(response.body.message).toBe('User deleted successfully');
      expect(deleteUser).toHaveBeenCalledWith(mockUserId);
    });
  });

  describe('Response Format Tests', () => {
    /**
     * Verifies that success response has correct structure
     */
    test('should return correct response structure on success', async () => {
      (deleteUser as any).mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/delete-user')
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('User deleted successfully');
      expect(Object.keys(response.body)).toEqual(['message']);
    });

    /**
     * Verifies that error response has correct structure
     */
    test('should return correct response structure on error', async () => {
      (deleteUser as any).mockResolvedValue('Some error message');

      const response = await request(app)
        .delete('/api/delete-user')
        .set('Authorization', validAuthToken)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Some error message');
      expect(response.body).not.toHaveProperty('message');
      expect(Object.keys(response.body)).toEqual(['error']);
    });

    /**
     * Verifies that authentication error response has correct structure
     */
    test('should return correct response structure on auth error', async () => {
      const response = await request(app)
        .delete('/api/delete-user')
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Unauthorized');
      expect(Object.keys(response.body)).toEqual(['error']);
    });

    /**
     * Verifies that 500 error response has correct structure
     */
    test('should return correct response structure on 500 error', async () => {
      (deleteUser as any).mockRejectedValue(new Error('Unexpected error'));

      const response = await request(app)
        .delete('/api/delete-user')
        .set('Authorization', validAuthToken)
        .expect(500);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Internal server error');
      expect(Object.keys(response.body)).toEqual(['error']);
    });
  });

  describe('Data Integrity Tests', () => {
    /**
     * Verifies that the exact userId is passed to deleteUser
     */
    test('should pass exact user ID to deleteUser', async () => {
      (deleteUser as any).mockResolvedValue(null);

      await request(app)
        .delete('/api/delete-user')
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(deleteUser).toHaveBeenCalledWith(mockUserId);
    });

    /**
     * Verifies that userId from different tokens are handled correctly
     */
    test('should use correct userId from each token', async () => {
      const userId1 = 'user-abc';
      const userId2 = 'user-xyz';

      (supabase.auth.getUser as any)
        .mockResolvedValueOnce({
          data: { user: { id: userId1 } },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { user: { id: userId2 } },
          error: null,
        });

      (deleteUser as any).mockResolvedValue(null);

      await request(app)
        .delete('/api/delete-user')
        .set('Authorization', 'Bearer token1')
        .expect(200);

      expect(deleteUser).toHaveBeenCalledWith(userId1);

      await request(app)
        .delete('/api/delete-user')
        .set('Authorization', 'Bearer token2')
        .expect(200);

      expect(deleteUser).toHaveBeenCalledWith(userId2);
    });

    /**
     * Verifies that deleteUser is always called with string userId
     */
    test('should always call deleteUser with string userId', async () => {
      (deleteUser as any).mockResolvedValue(null);

      await request(app)
        .delete('/api/delete-user')
        .set('Authorization', validAuthToken)
        .expect(200);

      const callArg = (deleteUser as any).mock.calls[0][0];
      expect(typeof callArg).toBe('string');
      expect(callArg).toBe(mockUserId);
    });
  });

  describe('HTTP Method Tests', () => {
    /**
     * Verifies that GET method is not allowed
     */
    test('should not allow GET method', async () => {
      const response = await request(app)
        .get('/api/delete-user')
        .set('Authorization', validAuthToken)
        .expect(404);

      expect(response.body.error).toBe('Not found');
    });

    /**
     * Verifies that POST method is not allowed
     */
    test('should not allow POST method', async () => {
      const response = await request(app)
        .post('/api/delete-user')
        .set('Authorization', validAuthToken)
        .expect(404);

      expect(response.body.error).toBe('Not found');
    });

    /**
     * Verifies that PUT method is not allowed
     */
    test('should not allow PUT method', async () => {
      const response = await request(app)
        .put('/api/delete-user')
        .set('Authorization', validAuthToken)
        .expect(404);

      expect(response.body.error).toBe('Not found');
    });

    /**
     * Verifies that PATCH method is not allowed
     */
    test('should not allow PATCH method', async () => {
      const response = await request(app)
        .patch('/api/delete-user')
        .set('Authorization', validAuthToken)
        .expect(404);

      expect(response.body.error).toBe('Not found');
    });

    /**
     * Verifies that OPTIONS method returns correct CORS headers
     */
    test('should handle OPTIONS request for CORS', async () => {
      const response = await request(app)
        .options('/api/delete-user')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('*');
      expect(response.headers['access-control-allow-methods']).toContain(
        'DELETE'
      );
    });
  });
});
