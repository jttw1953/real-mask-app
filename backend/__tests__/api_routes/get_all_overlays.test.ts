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
const { getUserOverlays } = await import(
  '../../src/supabase_api/supabase_api.js'
);
const { supabase } = await import('../../src/supabase_api/supabase_api.js');

describe('GET /api/get-all-overlays', () => {
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
        .get('/api/get-all-overlays')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
      expect(getUserOverlays).not.toHaveBeenCalled();
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
        .get('/api/get-all-overlays')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
      expect(getUserOverlays).not.toHaveBeenCalled();
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
        .get('/api/get-all-overlays')
        .set('Authorization', validAuthToken)
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
      expect(getUserOverlays).not.toHaveBeenCalled();
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
        .get('/api/get-all-overlays')
        .set('Authorization', 'Bearer expired-token')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
      expect(getUserOverlays).not.toHaveBeenCalled();
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
        .get('/api/get-all-overlays')
        .set('Authorization', 'Bearer ')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
      expect(getUserOverlays).not.toHaveBeenCalled();
    });

    /**
     * Verifies that the endpoint returns 401 when Authorization header is empty
     */
    test('should return 401 when Authorization header is empty string', async () => {
      const response = await request(app)
        .get('/api/get-all-overlays')
        .set('Authorization', '')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
      expect(getUserOverlays).not.toHaveBeenCalled();
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
        .get('/api/get-all-overlays')
        .set('Authorization', 'valid-token-123')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
      expect(getUserOverlays).not.toHaveBeenCalled();
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
        .get('/api/get-all-overlays')
        .set('Authorization', 'Basic valid-token-123')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
      expect(getUserOverlays).not.toHaveBeenCalled();
    });
  });

  describe('Success Cases - Empty Results', () => {
    /**
     * Verifies that the endpoint returns empty array when user has no overlays
     */
    test('should return empty array when user has no overlays', async () => {
      (getUserOverlays as any).mockResolvedValue({
        data: [],
        error: null,
      });

      const response = await request(app)
        .get('/api/get-all-overlays')
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(response.body.message).toBe('Overlays retrieved successfully');
      expect(response.body.overlays).toEqual([]);
      expect(Array.isArray(response.body.overlays)).toBe(true);
      expect(getUserOverlays).toHaveBeenCalledWith(mockUserId);
      expect(getUserOverlays).toHaveBeenCalledTimes(1);
    });

    /**
     * Verifies that the endpoint handles null data gracefully
     */
    test('should handle null data response', async () => {
      (getUserOverlays as any).mockResolvedValue({
        data: null,
        error: null,
      });

      const response = await request(app)
        .get('/api/get-all-overlays')
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(response.body.message).toBe('Overlays retrieved successfully');
      expect(response.body.overlays).toBeNull();
    });
  });

  describe('Success Cases - Single Overlay', () => {
    /**
     * Verifies that the endpoint returns a single overlay correctly
     */
    test('should return single overlay successfully', async () => {
      const mockOverlay = {
        id: 1,
        file_name: 'overlay1.png',
        file_url: 'https://storage.example.com/overlays/overlay1.png',
        user_id: mockUserId,
        created_at: '2025-11-18T10:00:00Z',
      };

      (getUserOverlays as any).mockResolvedValue({
        data: [mockOverlay],
        error: null,
      });

      const response = await request(app)
        .get('/api/get-all-overlays')
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(response.body.message).toBe('Overlays retrieved successfully');
      expect(response.body.overlays).toHaveLength(1);
      expect(response.body.overlays[0]).toEqual(mockOverlay);
      expect(getUserOverlays).toHaveBeenCalledWith(mockUserId);
    });

    /**
     * Verifies that the endpoint handles overlay with different file types
     */
    test('should handle different file types', async () => {
      const mockOverlays = [
        {
          id: 1,
          file_name: 'image.png',
          file_url: 'https://storage.example.com/overlays/image.png',
          user_id: mockUserId,
        },
        {
          id: 2,
          file_name: 'graphics.jpg',
          file_url: 'https://storage.example.com/overlays/graphics.jpg',
          user_id: mockUserId,
        },
        {
          id: 3,
          file_name: 'animation.gif',
          file_url: 'https://storage.example.com/overlays/animation.gif',
          user_id: mockUserId,
        },
      ];

      (getUserOverlays as any).mockResolvedValue({
        data: mockOverlays,
        error: null,
      });

      const response = await request(app)
        .get('/api/get-all-overlays')
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(response.body.overlays).toHaveLength(3);
      expect(response.body.overlays[0].file_name).toBe('image.png');
      expect(response.body.overlays[1].file_name).toBe('graphics.jpg');
      expect(response.body.overlays[2].file_name).toBe('animation.gif');
    });

    /**
     * Verifies that the endpoint handles overlay with special characters in filename
     */
    test('should handle special characters in filename', async () => {
      const mockOverlay = {
        id: 1,
        file_name: 'overlay (1) - test_file.png',
        file_url:
          'https://storage.example.com/overlays/overlay%20(1)%20-%20test_file.png',
        user_id: mockUserId,
      };

      (getUserOverlays as any).mockResolvedValue({
        data: [mockOverlay],
        error: null,
      });

      const response = await request(app)
        .get('/api/get-all-overlays')
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(response.body.overlays[0].file_name).toBe(
        'overlay (1) - test_file.png'
      );
    });
  });

  describe('Success Cases - Multiple Overlays', () => {
    /**
     * Verifies that the endpoint returns multiple overlays correctly
     */
    test('should return multiple overlays successfully', async () => {
      const mockOverlays = [
        {
          id: 1,
          file_name: 'overlay1.png',
          file_url: 'https://storage.example.com/overlays/overlay1.png',
          user_id: mockUserId,
          created_at: '2025-11-18T10:00:00Z',
        },
        {
          id: 2,
          file_name: 'overlay2.png',
          file_url: 'https://storage.example.com/overlays/overlay2.png',
          user_id: mockUserId,
          created_at: '2025-11-18T11:00:00Z',
        },
        {
          id: 3,
          file_name: 'overlay3.png',
          file_url: 'https://storage.example.com/overlays/overlay3.png',
          user_id: mockUserId,
          created_at: '2025-11-18T12:00:00Z',
        },
      ];

      (getUserOverlays as any).mockResolvedValue({
        data: mockOverlays,
        error: null,
      });

      const response = await request(app)
        .get('/api/get-all-overlays')
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(response.body.message).toBe('Overlays retrieved successfully');
      expect(response.body.overlays).toHaveLength(3);
      expect(response.body.overlays).toEqual(mockOverlays);
      expect(getUserOverlays).toHaveBeenCalledWith(mockUserId);
      expect(getUserOverlays).toHaveBeenCalledTimes(1);
    });

    /**
     * Verifies that the endpoint handles large number of overlays
     */
    test('should handle large number of overlays', async () => {
      const mockOverlays = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        file_name: `overlay${i + 1}.png`,
        file_url: `https://storage.example.com/overlays/overlay${i + 1}.png`,
        user_id: mockUserId,
        created_at: '2025-11-18T10:00:00Z',
      }));

      (getUserOverlays as any).mockResolvedValue({
        data: mockOverlays,
        error: null,
      });

      const response = await request(app)
        .get('/api/get-all-overlays')
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(response.body.message).toBe('Overlays retrieved successfully');
      expect(response.body.overlays).toHaveLength(100);
      expect(response.body.overlays[0].id).toBe(1);
      expect(response.body.overlays[99].id).toBe(100);
    });

    /**
     * Verifies that overlays are returned in the order provided by database
     */
    test('should preserve overlay order from database', async () => {
      const mockOverlays = [
        {
          id: 5,
          file_name: 'fifth.png',
          file_url: 'url5',
          user_id: mockUserId,
        },
        {
          id: 2,
          file_name: 'second.png',
          file_url: 'url2',
          user_id: mockUserId,
        },
        {
          id: 8,
          file_name: 'eighth.png',
          file_url: 'url8',
          user_id: mockUserId,
        },
        {
          id: 1,
          file_name: 'first.png',
          file_url: 'url1',
          user_id: mockUserId,
        },
      ];

      (getUserOverlays as any).mockResolvedValue({
        data: mockOverlays,
        error: null,
      });

      const response = await request(app)
        .get('/api/get-all-overlays')
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(response.body.overlays[0].id).toBe(5);
      expect(response.body.overlays[1].id).toBe(2);
      expect(response.body.overlays[2].id).toBe(8);
      expect(response.body.overlays[3].id).toBe(1);
    });

    /**
     * Verifies that overlays with mixed file sizes are handled
     */
    test('should handle overlays with various metadata', async () => {
      const mockOverlays = [
        {
          id: 1,
          file_name: 'small.png',
          file_url: 'https://storage.example.com/small.png',
          user_id: mockUserId,
          file_size: 1024,
        },
        {
          id: 2,
          file_name: 'large.png',
          file_url: 'https://storage.example.com/large.png',
          user_id: mockUserId,
          file_size: 10485760,
        },
      ];

      (getUserOverlays as any).mockResolvedValue({
        data: mockOverlays,
        error: null,
      });

      const response = await request(app)
        .get('/api/get-all-overlays')
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(response.body.overlays).toHaveLength(2);
      expect(response.body.overlays[0].file_size).toBe(1024);
      expect(response.body.overlays[1].file_size).toBe(10485760);
    });
  });

  describe('Error Handling Tests', () => {
    /**
     * Verifies that the endpoint handles database errors gracefully
     */
    test('should return 400 when database returns error', async () => {
      (getUserOverlays as any).mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
      });

      const response = await request(app)
        .get('/api/get-all-overlays')
        .set('Authorization', validAuthToken)
        .expect(400);

      expect(response.body.error).toBe('Database connection failed');
      expect(response.body).not.toHaveProperty('overlays');
    });

    /**
     * Verifies that the endpoint handles generic error message
     */
    test('should handle generic error message', async () => {
      (getUserOverlays as any).mockResolvedValue({
        data: null,
        error: { message: 'An unexpected error occurred' },
      });

      const response = await request(app)
        .get('/api/get-all-overlays')
        .set('Authorization', validAuthToken)
        .expect(400);

      expect(response.body.error).toBe('An unexpected error occurred');
    });

    /**
     * Verifies that the endpoint handles error with custom error codes
     */
    test('should handle error with custom error code', async () => {
      (getUserOverlays as any).mockResolvedValue({
        data: null,
        error: { message: 'Query timeout', code: 'TIMEOUT' },
      });

      const response = await request(app)
        .get('/api/get-all-overlays')
        .set('Authorization', validAuthToken)
        .expect(400);

      expect(response.body.error).toBe('Query timeout');
    });

    /**
     * Verifies that the endpoint handles permission denied errors
     */
    test('should handle permission denied error', async () => {
      (getUserOverlays as any).mockResolvedValue({
        data: null,
        error: { message: 'Permission denied' },
      });

      const response = await request(app)
        .get('/api/get-all-overlays')
        .set('Authorization', validAuthToken)
        .expect(400);

      expect(response.body.error).toBe('Permission denied');
    });

    /**
     * Verifies internal server error handling when exception is thrown
     */
    test('should return 500 when getUserOverlays throws exception', async () => {
      (getUserOverlays as any).mockRejectedValue(new Error('Unexpected error'));

      const response = await request(app)
        .get('/api/get-all-overlays')
        .set('Authorization', validAuthToken)
        .expect(500);

      expect(response.body.error).toBe('Internal server error');
    });

    /**
     * Verifies internal server error handling for null pointer exceptions
     */
    test('should handle null pointer exception', async () => {
      (getUserOverlays as any).mockRejectedValue(
        new TypeError("Cannot read property 'data' of null")
      );

      const response = await request(app)
        .get('/api/get-all-overlays')
        .set('Authorization', validAuthToken)
        .expect(500);

      expect(response.body.error).toBe('Internal server error');
    });

    /**
     * Verifies that error responses don't leak sensitive information
     */
    test('should not leak sensitive information in error responses', async () => {
      (getUserOverlays as any).mockResolvedValue({
        data: null,
        error: {
          message: 'Database error',
          details: 'Connection string: postgresql://user:password@localhost',
        },
      });

      const response = await request(app)
        .get('/api/get-all-overlays')
        .set('Authorization', validAuthToken)
        .expect(400);

      expect(response.body.error).toBe('Database error');
      expect(response.body).not.toHaveProperty('details');
    });
  });

  describe('Edge Cases and Boundary Tests', () => {
    /**
     * Verifies handling of overlays with very long filenames
     */
    test('should handle very long filenames', async () => {
      const longFilename = 'a'.repeat(255) + '.png';
      const mockOverlay = {
        id: 1,
        file_name: longFilename,
        file_url: 'https://storage.example.com/overlays/long.png',
        user_id: mockUserId,
      };

      (getUserOverlays as any).mockResolvedValue({
        data: [mockOverlay],
        error: null,
      });

      const response = await request(app)
        .get('/api/get-all-overlays')
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(response.body.overlays[0].file_name).toBe(longFilename);
      expect(response.body.overlays[0].file_name.length).toBe(259);
    });

    /**
     * Verifies handling of overlays with unicode characters in filename
     */
    test('should handle unicode characters in filename', async () => {
      const mockOverlay = {
        id: 1,
        file_name: '覆盖图_叠加層_наложение_オーバーレイ.png',
        file_url: 'https://storage.example.com/overlays/unicode.png',
        user_id: mockUserId,
      };

      (getUserOverlays as any).mockResolvedValue({
        data: [mockOverlay],
        error: null,
      });

      const response = await request(app)
        .get('/api/get-all-overlays')
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(response.body.overlays[0].file_name).toBe(
        '覆盖图_叠加層_наложение_オーバーレイ.png'
      );
    });

    /**
     * Verifies handling of overlays with emoji in filename
     */
    test('should handle emoji in filename', async () => {
      const mockOverlay = {
        id: 1,
        file_name: '🎨_cool_overlay_🖼️.png',
        file_url: 'https://storage.example.com/overlays/emoji.png',
        user_id: mockUserId,
      };

      (getUserOverlays as any).mockResolvedValue({
        data: [mockOverlay],
        error: null,
      });

      const response = await request(app)
        .get('/api/get-all-overlays')
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(response.body.overlays[0].file_name).toBe(
        '🎨_cool_overlay_🖼️.png'
      );
    });

    /**
     * Verifies handling of overlays with null or undefined fields
     */
    test('should handle overlays with missing optional fields', async () => {
      const mockOverlays = [
        {
          id: 1,
          file_name: 'overlay1.png',
          file_url: 'https://storage.example.com/overlay1.png',
          user_id: mockUserId,
          created_at: null,
        },
        {
          id: 2,
          file_name: 'overlay2.png',
          file_url: 'https://storage.example.com/overlay2.png',
          user_id: mockUserId,
        },
      ];

      (getUserOverlays as any).mockResolvedValue({
        data: mockOverlays,
        error: null,
      });

      const response = await request(app)
        .get('/api/get-all-overlays')
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(response.body.overlays).toHaveLength(2);
      expect(response.body.overlays[0].created_at).toBeNull();
      expect(response.body.overlays[1].created_at).toBeUndefined();
    });

    /**
     * Verifies that getUserOverlays is called with correct parameter type
     */
    test('should call getUserOverlays with string userId', async () => {
      (getUserOverlays as any).mockResolvedValue({
        data: [],
        error: null,
      });

      await request(app)
        .get('/api/get-all-overlays')
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(getUserOverlays).toHaveBeenCalledWith(mockUserId);
      expect(typeof (getUserOverlays as any).mock.calls[0][0]).toBe('string');
    });

    /**
     * Verifies that getUserOverlays is only called once per request
     */
    test('should call getUserOverlays exactly once', async () => {
      (getUserOverlays as any).mockResolvedValue({
        data: [],
        error: null,
      });

      await request(app)
        .get('/api/get-all-overlays')
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(getUserOverlays).toHaveBeenCalledTimes(1);
      expect((getUserOverlays as any).mock.calls).toHaveLength(1);
    });

    /**
     * Verifies that getUserOverlays receives only the userId parameter
     */
    test('should pass only userId to getUserOverlays', async () => {
      (getUserOverlays as any).mockResolvedValue({
        data: [],
        error: null,
      });

      await request(app)
        .get('/api/get-all-overlays')
        .set('Authorization', validAuthToken)
        .expect(200);

      expect((getUserOverlays as any).mock.calls[0]).toHaveLength(1);
    });

    /**
     * Verifies that response structure is consistent even with empty results
     */
    test('should have consistent response structure', async () => {
      (getUserOverlays as any).mockResolvedValue({
        data: [],
        error: null,
      });

      const response = await request(app)
        .get('/api/get-all-overlays')
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('overlays');
      expect(Object.keys(response.body)).toEqual(['message', 'overlays']);
    });

    /**
     * Verifies handling of malformed database response
     */
    test('should handle malformed database response', async () => {
      (getUserOverlays as any).mockResolvedValue({
        data: [
          {
            id: 1,
            // Missing required fields
          },
          {
            id: 2,
            file_name: 'overlay.png',
            // Missing file_url
          },
        ],
        error: null,
      });

      const response = await request(app)
        .get('/api/get-all-overlays')
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(response.body.overlays).toHaveLength(2);
      // Should still return the malformed data as-is
      expect(response.body.overlays[0].id).toBe(1);
      expect(response.body.overlays[1].id).toBe(2);
    });
  });

  describe('Response Format Tests', () => {
    /**
     * Verifies that success response has correct structure
     */
    test('should return correct response structure on success', async () => {
      const mockOverlays = [
        {
          id: 1,
          file_name: 'overlay.png',
          file_url: 'https://storage.example.com/overlay.png',
          user_id: mockUserId,
        },
      ];

      (getUserOverlays as any).mockResolvedValue({
        data: mockOverlays,
        error: null,
      });

      const response = await request(app)
        .get('/api/get-all-overlays')
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('overlays');
      expect(response.body.message).toBe('Overlays retrieved successfully');
      expect(Array.isArray(response.body.overlays)).toBe(true);
    });

    /**
     * Verifies that error response has correct structure
     */
    test('should return correct response structure on error', async () => {
      (getUserOverlays as any).mockResolvedValue({
        data: null,
        error: { message: 'Some error message' },
      });

      const response = await request(app)
        .get('/api/get-all-overlays')
        .set('Authorization', validAuthToken)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Some error message');
      expect(response.body).not.toHaveProperty('message');
      expect(response.body).not.toHaveProperty('overlays');
    });

    /**
     * Verifies that authentication error response has correct structure
     */
    test('should return correct response structure on auth error', async () => {
      const response = await request(app)
        .get('/api/get-all-overlays')
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Unauthorized');
      expect(Object.keys(response.body)).toEqual(['error']);
    });

    /**
     * Verifies that overlays array is always present in successful responses
     */
    test('should always include overlays property in success response', async () => {
      (getUserOverlays as any).mockResolvedValue({
        data: [],
        error: null,
      });

      const response = await request(app)
        .get('/api/get-all-overlays')
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(response.body).toHaveProperty('overlays');
      expect(response.body.overlays).toBeDefined();
    });

    /**
     * Verifies that response contains proper JSON content type
     */
    test('should return JSON content type', async () => {
      (getUserOverlays as any).mockResolvedValue({
        data: [],
        error: null,
      });

      const response = await request(app)
        .get('/api/get-all-overlays')
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });

  describe('Data Integrity Tests', () => {
    /**
     * Verifies that overlay data is not modified by the endpoint
     */
    test('should not modify overlay data', async () => {
      const mockOverlays = [
        {
          id: 1,
          file_name: 'original.png',
          file_url: 'https://storage.example.com/original.png',
          user_id: mockUserId,
          extra_field: 'should be preserved',
          custom_metadata: { key: 'value' },
        },
      ];

      (getUserOverlays as any).mockResolvedValue({
        data: mockOverlays,
        error: null,
      });

      const response = await request(app)
        .get('/api/get-all-overlays')
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(response.body.overlays[0]).toEqual(mockOverlays[0]);
      expect(response.body.overlays[0].extra_field).toBe('should be preserved');
      expect(response.body.overlays[0].custom_metadata).toEqual({
        key: 'value',
      });
    });

    /**
     * Verifies that the endpoint passes the exact userId to getUserOverlays
     */
    test('should pass exact user ID to getUserOverlays', async () => {
      (getUserOverlays as any).mockResolvedValue({
        data: [],
        error: null,
      });

      await request(app)
        .get('/api/get-all-overlays')
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(getUserOverlays).toHaveBeenCalledWith(mockUserId);
    });

    /**
     * Verifies that multiple calls with same auth return consistent results
     */
    test('should return consistent results for same user', async () => {
      const mockOverlays = [
        {
          id: 1,
          file_name: 'overlay.png',
          file_url: 'https://storage.example.com/overlay.png',
          user_id: mockUserId,
        },
      ];

      (getUserOverlays as any).mockResolvedValue({
        data: mockOverlays,
        error: null,
      });

      const response1 = await request(app)
        .get('/api/get-all-overlays')
        .set('Authorization', validAuthToken)
        .expect(200);

      const response2 = await request(app)
        .get('/api/get-all-overlays')
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(response1.body.overlays).toEqual(response2.body.overlays);
    });

    /**
     * Verifies that different users get isolated results
     */
    test('should isolate results for different users', async () => {
      const user1Id = 'user-123';
      const user2Id = 'user-456';
      const user1Token = 'Bearer token-123';
      const user2Token = 'Bearer token-456';

      // Setup for user 1
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

      (getUserOverlays as any).mockImplementation((userId: string) => {
        if (userId === user1Id) {
          return Promise.resolve({
            data: [{ id: 1, file_name: 'user1_overlay.png', user_id: user1Id }],
            error: null,
          });
        } else if (userId === user2Id) {
          return Promise.resolve({
            data: [{ id: 2, file_name: 'user2_overlay.png', user_id: user2Id }],
            error: null,
          });
        }
      });

      const response1 = await request(app)
        .get('/api/get-all-overlays')
        .set('Authorization', user1Token)
        .expect(200);

      const response2 = await request(app)
        .get('/api/get-all-overlays')
        .set('Authorization', user2Token)
        .expect(200);

      expect(getUserOverlays).toHaveBeenCalledWith(user1Id);
      expect(getUserOverlays).toHaveBeenCalledWith(user2Id);
      expect(response1.body.overlays[0].user_id).toBe(user1Id);
      expect(response2.body.overlays[0].user_id).toBe(user2Id);
    });
  });

  describe('HTTP Method Tests', () => {
    /**
     * Verifies that POST method is not allowed
     */
    test('should not allow POST method', async () => {
      const response = await request(app)
        .post('/api/get-all-overlays')
        .set('Authorization', validAuthToken)
        .expect(404);

      expect(response.body.error).toBe('Not found');
      expect(getUserOverlays).not.toHaveBeenCalled();
    });

    /**
     * Verifies that PUT method is not allowed
     */
    test('should not allow PUT method', async () => {
      const response = await request(app)
        .put('/api/get-all-overlays')
        .set('Authorization', validAuthToken)
        .expect(404);

      expect(response.body.error).toBe('Not found');
      expect(getUserOverlays).not.toHaveBeenCalled();
    });

    /**
     * Verifies that DELETE method is not allowed
     */
    test('should not allow DELETE method', async () => {
      const response = await request(app)
        .delete('/api/get-all-overlays')
        .set('Authorization', validAuthToken)
        .expect(404);

      expect(response.body.error).toBe('Not found');
      expect(getUserOverlays).not.toHaveBeenCalled();
    });

    /**
     * Verifies that PATCH method is not allowed
     */
    test('should not allow PATCH method', async () => {
      const response = await request(app)
        .patch('/api/get-all-overlays')
        .set('Authorization', validAuthToken)
        .expect(404);

      expect(response.body.error).toBe('Not found');
      expect(getUserOverlays).not.toHaveBeenCalled();
    });

    /**
     * Verifies that OPTIONS method returns correct CORS headers
     */
    test('should handle OPTIONS request for CORS', async () => {
      const response = await request(app)
        .options('/api/get-all-overlays')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('*');
      expect(response.headers['access-control-allow-methods']).toContain('GET');
    });
  });

  describe('Concurrency and Performance Tests', () => {
    /**
     * Verifies that endpoint handles concurrent requests correctly
     */
    test('should handle concurrent requests from same user', async () => {
      const mockOverlays = [
        {
          id: 1,
          file_name: 'overlay.png',
          file_url: 'url',
          user_id: mockUserId,
        },
      ];

      (getUserOverlays as any).mockResolvedValue({
        data: mockOverlays,
        error: null,
      });

      const requests = Array.from({ length: 5 }, () =>
        request(app)
          .get('/api/get-all-overlays')
          .set('Authorization', validAuthToken)
      );

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body.overlays).toEqual(mockOverlays);
      });

      expect(getUserOverlays).toHaveBeenCalledTimes(5);
    });

    /**
     * Verifies that endpoint doesn't cache results inappropriately
     */
    test('should fetch fresh data on each request', async () => {
      // First request
      (getUserOverlays as any).mockResolvedValueOnce({
        data: [{ id: 1, file_name: 'v1.png', user_id: mockUserId }],
        error: null,
      });

      const response1 = await request(app)
        .get('/api/get-all-overlays')
        .set('Authorization', validAuthToken)
        .expect(200);

      // Second request with different data
      (getUserOverlays as any).mockResolvedValueOnce({
        data: [
          { id: 1, file_name: 'v1.png', user_id: mockUserId },
          { id: 2, file_name: 'v2.png', user_id: mockUserId },
        ],
        error: null,
      });

      const response2 = await request(app)
        .get('/api/get-all-overlays')
        .set('Authorization', validAuthToken)
        .expect(200);

      expect(response1.body.overlays).toHaveLength(1);
      expect(response2.body.overlays).toHaveLength(2);
      expect(getUserOverlays).toHaveBeenCalledTimes(2);
    });
  });

  describe('Security Tests', () => {
    /**
     * Verifies that endpoint doesn't expose userId in response
     */
    test('should not expose internal user IDs unnecessarily', async () => {
      const mockOverlays = [
        {
          id: 1,
          file_name: 'overlay.png',
          file_url: 'https://storage.example.com/overlay.png',
          user_id: mockUserId,
        },
      ];

      (getUserOverlays as any).mockResolvedValue({
        data: mockOverlays,
        error: null,
      });

      const response = await request(app)
        .get('/api/get-all-overlays')
        .set('Authorization', validAuthToken)
        .expect(200);

      // The overlay data contains user_id, which is expected from the database
      // but we verify the response doesn't add additional user identification
      expect(response.body.overlays[0].user_id).toBe(mockUserId);
      expect(response.body).not.toHaveProperty('userId');
      expect(response.body).not.toHaveProperty('user');
    });

    /**
     * Verifies that token is properly stripped of Bearer prefix
     */
    test('should properly extract token from Bearer header', async () => {
      (getUserOverlays as any).mockResolvedValue({
        data: [],
        error: null,
      });

      await request(app)
        .get('/api/get-all-overlays')
        .set('Authorization', 'Bearer test-token-with-special-chars-123_456')
        .expect(200);

      // Verify that supabase.auth.getUser was called with token without "Bearer "
      expect(supabase.auth.getUser).toHaveBeenCalledWith(
        'test-token-with-special-chars-123_456'
      );
    });

    /**
     * Verifies that multiple spaces after Bearer are handled
     */
    test('should handle multiple spaces after Bearer', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: null },
        error: new Error('Invalid token'),
      });

      const response = await request(app)
        .get('/api/get-all-overlays')
        .set('Authorization', 'Bearer   token-with-spaces')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
    });
  });
});
