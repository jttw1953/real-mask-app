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
const { uploadOverlay } = await import(
  '../../src/supabase_api/supabase_api.js'
);
const { supabase } = await import('../../src/supabase_api/supabase_api.js');

describe('POST /api/upload-overlay', () => {
  const validAuthToken = 'Bearer valid-token-123';
  const mockUserId = 'user-123';

  beforeEach(() => {
    jest.clearAllMocks();

    (supabase.auth.getUser as any).mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null,
    });

    (uploadOverlay as any).mockResolvedValue({
      data: { id: 1, file_url: 'https://storage.example.com/overlay.png' },
      error: null,
    });
  });

  describe('Authentication Tests', () => {
    /**
     * Verifies that the endpoint returns 401 when no authorization header is provided
     */
    test('should return 401 when no authorization header provided', async () => {
      const response = await request(app)
        .post('/api/upload-overlay')
        .attach('file', Buffer.from('test file content'), 'test.png')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
      expect(uploadOverlay).not.toHaveBeenCalled();
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
        .post('/api/upload-overlay')
        .set('Authorization', 'Bearer invalid-token')
        .attach('file', Buffer.from('test file content'), 'test.png')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
      expect(uploadOverlay).not.toHaveBeenCalled();
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
        .post('/api/upload-overlay')
        .set('Authorization', validAuthToken)
        .attach('file', Buffer.from('test file content'), 'test.png')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
      expect(uploadOverlay).not.toHaveBeenCalled();
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
        .post('/api/upload-overlay')
        .set('Authorization', 'Bearer expired-token')
        .attach('file', Buffer.from('test file content'), 'test.png')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
      expect(uploadOverlay).not.toHaveBeenCalled();
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
        .post('/api/upload-overlay')
        .set('Authorization', 'Bearer ')
        .attach('file', Buffer.from('test file content'), 'test.png')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
      expect(uploadOverlay).not.toHaveBeenCalled();
    });

    /**
     * Verifies that the endpoint returns 401 when Authorization header is empty
     */
    test('should return 401 when Authorization header is empty string', async () => {
      const response = await request(app)
        .post('/api/upload-overlay')
        .set('Authorization', '')
        .attach('file', Buffer.from('test file content'), 'test.png')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
      expect(uploadOverlay).not.toHaveBeenCalled();
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
        .post('/api/upload-overlay')
        .set('Authorization', 'valid-token-123')
        .attach('file', Buffer.from('test file content'), 'test.png')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
      expect(uploadOverlay).not.toHaveBeenCalled();
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
        .post('/api/upload-overlay')
        .set('Authorization', 'Basic valid-token-123')
        .attach('file', Buffer.from('test file content'), 'test.png')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
      expect(uploadOverlay).not.toHaveBeenCalled();
    });
  });

  describe('Success Cases', () => {
    /**
     * Verifies successful upload with valid file
     */
    test('should upload overlay successfully with valid file', async () => {
      const response = await request(app)
        .post('/api/upload-overlay')
        .set('Authorization', validAuthToken)
        .attach('file', Buffer.from('test file content'), 'test.png')
        .expect(201);

      expect(response.body.message).toBe('Overlay uploaded successfully');
      expect(uploadOverlay).toHaveBeenCalledTimes(1);
      expect(uploadOverlay).toHaveBeenCalledWith(
        mockUserId,
        expect.any(Buffer),
        'test.png'
      );
    });

    /**
     * Verifies successful upload with PNG file
     */
    test('should upload PNG file successfully', async () => {
      const response = await request(app)
        .post('/api/upload-overlay')
        .set('Authorization', validAuthToken)
        .attach('file', Buffer.from('PNG file content'), 'overlay.png')
        .expect(201);

      expect(response.body.message).toBe('Overlay uploaded successfully');
      expect(uploadOverlay).toHaveBeenCalledWith(
        mockUserId,
        expect.any(Buffer),
        'overlay.png'
      );
    });

    /**
     * Verifies successful upload with JPG file
     */
    test('should upload JPG file successfully', async () => {
      const response = await request(app)
        .post('/api/upload-overlay')
        .set('Authorization', validAuthToken)
        .attach('file', Buffer.from('JPG file content'), 'image.jpg')
        .expect(201);

      expect(response.body.message).toBe('Overlay uploaded successfully');
      expect(uploadOverlay).toHaveBeenCalledWith(
        mockUserId,
        expect.any(Buffer),
        'image.jpg'
      );
    });

    /**
     * Verifies successful upload with GIF file
     */
    test('should upload GIF file successfully', async () => {
      const response = await request(app)
        .post('/api/upload-overlay')
        .set('Authorization', validAuthToken)
        .attach('file', Buffer.from('GIF file content'), 'animation.gif')
        .expect(201);

      expect(response.body.message).toBe('Overlay uploaded successfully');
      expect(uploadOverlay).toHaveBeenCalledWith(
        mockUserId,
        expect.any(Buffer),
        'animation.gif'
      );
    });

    /**
     * Verifies successful upload with long filename
     */
    test('should upload file with long filename', async () => {
      const longFilename = 'a'.repeat(200) + '.png';

      const response = await request(app)
        .post('/api/upload-overlay')
        .set('Authorization', validAuthToken)
        .attach('file', Buffer.from('test content'), longFilename)
        .expect(201);

      expect(response.body.message).toBe('Overlay uploaded successfully');
      expect(uploadOverlay).toHaveBeenCalledWith(
        mockUserId,
        expect.any(Buffer),
        longFilename
      );
    });

    /**
     * Verifies successful upload with special characters in filename
     */
    test('should upload file with special characters in filename', async () => {
      const filename = 'my-overlay_v2 (final).png';

      const response = await request(app)
        .post('/api/upload-overlay')
        .set('Authorization', validAuthToken)
        .attach('file', Buffer.from('test content'), filename)
        .expect(201);

      expect(response.body.message).toBe('Overlay uploaded successfully');
      expect(uploadOverlay).toHaveBeenCalledWith(
        mockUserId,
        expect.any(Buffer),
        filename
      );
    });

    /**
     * Verifies successful upload with unicode characters in filename
     */
    test('should upload file with unicode characters in filename', async () => {
      const filename = '覆盖图_叠加層.png';

      const response = await request(app)
        .post('/api/upload-overlay')
        .set('Authorization', validAuthToken)
        .attach('file', Buffer.from('test content'), filename)
        .expect(201);

      expect(response.body.message).toBe('Overlay uploaded successfully');
      expect(uploadOverlay).toHaveBeenCalledWith(
        mockUserId,
        expect.any(Buffer),
        filename
      );
    });

    /**
     * Verifies successful upload with emoji in filename
     */
    test('should upload file with emoji in filename', async () => {
      const filename = '🎨_overlay_🖼️.png';

      const response = await request(app)
        .post('/api/upload-overlay')
        .set('Authorization', validAuthToken)
        .attach('file', Buffer.from('test content'), filename)
        .expect(201);

      expect(response.body.message).toBe('Overlay uploaded successfully');
      expect(uploadOverlay).toHaveBeenCalledWith(
        mockUserId,
        expect.any(Buffer),
        filename
      );
    });

    /**
     * Verifies that uploadOverlay receives Buffer type
     */
    test('should pass Buffer to uploadOverlay', async () => {
      const fileContent = 'test file content';

      await request(app)
        .post('/api/upload-overlay')
        .set('Authorization', validAuthToken)
        .attach('file', Buffer.from(fileContent), 'test.png')
        .expect(201);

      const calls = (uploadOverlay as any).mock.calls;
      expect(calls[0][1]).toBeInstanceOf(Buffer);
    });

    /**
     * Verifies successful upload with large file (under limit)
     */
    test('should upload large file under size limit', async () => {
      // Create a 5MB file (under the 10MB limit)
      const largeBuffer = Buffer.alloc(5 * 1024 * 1024, 'a');

      const response = await request(app)
        .post('/api/upload-overlay')
        .set('Authorization', validAuthToken)
        .attach('file', largeBuffer, 'large.png')
        .expect(201);

      expect(response.body.message).toBe('Overlay uploaded successfully');
      expect(uploadOverlay).toHaveBeenCalled();
    });
  });

  describe('Missing File Tests', () => {
    /**
     * Verifies that endpoint returns 400 when no file is provided
     */
    test('should return 400 when no file provided', async () => {
      const response = await request(app)
        .post('/api/upload-overlay')
        .set('Authorization', validAuthToken)
        .expect(400);

      expect(response.body.error).toBe('Missing required field: file');
      expect(uploadOverlay).not.toHaveBeenCalled();
    });

    /**
     * Verifies that endpoint returns 400 when file field is empty
     */
    test('should return 400 when file field is present but empty', async () => {
      const response = await request(app)
        .post('/api/upload-overlay')
        .set('Authorization', validAuthToken)
        .field('file', '')
        .expect(400);

      expect(response.body.error).toBe('Missing required field: file');
      expect(uploadOverlay).not.toHaveBeenCalled();
    });

    /**
     * Verifies that endpoint returns 400 when wrong field name is used
     */
    test('should return 400 when wrong field name is used', async () => {
      const response = await request(app)
        .post('/api/upload-overlay')
        .set('Authorization', validAuthToken)
        .attach('document', Buffer.from('test content'), 'test.png')
        .expect(400);

      expect(response.body.error).toBe('Missing required field: file');
      expect(uploadOverlay).not.toHaveBeenCalled();
    });
  });

  describe('Invalid Filename Tests', () => {
    /**
     * Verifies that endpoint returns 400 when filename is empty string
     */
    test('should return 400 when filename is empty string', async () => {
      const response = await request(app)
        .post('/api/upload-overlay')
        .set('Authorization', validAuthToken)
        .attach('file', Buffer.from('test content'), '')
        .expect(400);

      // Empty string fails the (!filename || typeof filename !== 'string') check
      expect(response.body.error).toBe('Invalid filename');
      expect(uploadOverlay).not.toHaveBeenCalled();
    });

    /**
     * Verifies that endpoint returns 400 when filename is only whitespace
     */
    test('should return 400 when filename is only whitespace', async () => {
      const response = await request(app)
        .post('/api/upload-overlay')
        .set('Authorization', validAuthToken)
        .attach('file', Buffer.from('test content'), '   ')
        .expect(400);

      expect(response.body.error).toBe('Filename cannot be empty');
      expect(uploadOverlay).not.toHaveBeenCalled();
    });

    /**
     * Verifies that endpoint returns 400 when filename is only tabs and spaces
     */
    test('should return 400 when filename is only tabs and spaces', async () => {
      const response = await request(app)
        .post('/api/upload-overlay')
        .set('Authorization', validAuthToken)
        .attach('file', Buffer.from('test content'), '\t\n  \t')
        .expect(400);

      // Tabs/newlines may be treated as invalid by formidable
      expect(response.body.error).toBe('Invalid filename');
      expect(uploadOverlay).not.toHaveBeenCalled();
    });
  });

  describe('Empty File Tests', () => {
    /**
     * Verifies that endpoint returns 400 when file size is 0
     */
    test('should return 400 when file size is 0', async () => {
      const response = await request(app)
        .post('/api/upload-overlay')
        .set('Authorization', validAuthToken)
        .attach('file', Buffer.from(''), 'empty.png')
        .expect(400);

      // Formidable may reject empty files during parsing
      expect(response.body.error).toBe('Error parsing form data');
      expect(uploadOverlay).not.toHaveBeenCalled();
    });

    /**
     * Verifies that endpoint returns 400 when file is empty buffer
     */
    test('should return 400 when file is empty buffer', async () => {
      const emptyBuffer = Buffer.alloc(0);

      const response = await request(app)
        .post('/api/upload-overlay')
        .set('Authorization', validAuthToken)
        .attach('file', emptyBuffer, 'test.png')
        .expect(400);

      // Formidable may reject empty files during parsing
      expect(response.body.error).toBe('Error parsing form data');
      expect(uploadOverlay).not.toHaveBeenCalled();
    });
  });

  describe('File Size Limit Tests', () => {
    /**
     * Verifies that endpoint returns 400 when file exceeds size limit
     */
    test('should return 400 when file exceeds 10MB limit', async () => {
      // Create a file larger than 10MB
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024, 'a');

      const response = await request(app)
        .post('/api/upload-overlay')
        .set('Authorization', validAuthToken)
        .attach('file', largeBuffer, 'toolarge.png')
        .expect(400);

      expect(response.body.error).toBe('Error parsing form data');
      expect(uploadOverlay).not.toHaveBeenCalled();
    });

    /**
     * Verifies that endpoint accepts file at exact size limit
     */
    test('should accept file at exactly 10MB', async () => {
      // Create a file at exactly 10MB
      const exactSizeBuffer = Buffer.alloc(10 * 1024 * 1024, 'a');

      const response = await request(app)
        .post('/api/upload-overlay')
        .set('Authorization', validAuthToken)
        .attach('file', exactSizeBuffer, 'exact10mb.png')
        .expect(201);

      expect(response.body.message).toBe('Overlay uploaded successfully');
      expect(uploadOverlay).toHaveBeenCalled();
    });

    /**
     * Verifies that very small files are accepted
     */
    test('should accept very small file (1 byte)', async () => {
      const tinyBuffer = Buffer.from('a');

      const response = await request(app)
        .post('/api/upload-overlay')
        .set('Authorization', validAuthToken)
        .attach('file', tinyBuffer, 'tiny.png')
        .expect(201);

      expect(response.body.message).toBe('Overlay uploaded successfully');
      expect(uploadOverlay).toHaveBeenCalled();
    });
  });

  describe('Error Handling Tests', () => {
    /**
     * Verifies that database errors are properly returned
     */
    test('should return 400 when uploadOverlay returns error', async () => {
      (uploadOverlay as any).mockResolvedValue({
        data: null,
        error: { message: 'Database storage failed' },
      });

      const response = await request(app)
        .post('/api/upload-overlay')
        .set('Authorization', validAuthToken)
        .attach('file', Buffer.from('test content'), 'test.png')
        .expect(400);

      expect(response.body.error).toBe('Database storage failed');
      expect(uploadOverlay).toHaveBeenCalled();
    });

    /**
     * Verifies handling of storage quota exceeded errors
     */
    test('should return 400 when storage quota exceeded', async () => {
      (uploadOverlay as any).mockResolvedValue({
        data: null,
        error: { message: 'Storage quota exceeded' },
      });

      const response = await request(app)
        .post('/api/upload-overlay')
        .set('Authorization', validAuthToken)
        .attach('file', Buffer.from('test content'), 'test.png')
        .expect(400);

      expect(response.body.error).toBe('Storage quota exceeded');
    });

    /**
     * Verifies handling of duplicate filename errors
     */
    test('should return 400 when filename already exists', async () => {
      (uploadOverlay as any).mockResolvedValue({
        data: null,
        error: { message: 'File with this name already exists' },
      });

      const response = await request(app)
        .post('/api/upload-overlay')
        .set('Authorization', validAuthToken)
        .attach('file', Buffer.from('test content'), 'duplicate.png')
        .expect(400);

      expect(response.body.error).toBe('File with this name already exists');
    });

    /**
     * Verifies internal server error handling when uploadOverlay throws exception
     */
    test('should return 500 when uploadOverlay throws exception', async () => {
      (uploadOverlay as any).mockRejectedValue(new Error('Unexpected error'));

      const response = await request(app)
        .post('/api/upload-overlay')
        .set('Authorization', validAuthToken)
        .attach('file', Buffer.from('test content'), 'test.png')
        .expect(500);

      expect(response.body.error).toBe('Internal server error');
    });

    /**
     * Verifies internal server error handling for file system errors
     */
    test('should return 500 when file system error occurs', async () => {
      (uploadOverlay as any).mockRejectedValue(
        new Error('Failed to read temporary file')
      );

      const response = await request(app)
        .post('/api/upload-overlay')
        .set('Authorization', validAuthToken)
        .attach('file', Buffer.from('test content'), 'test.png')
        .expect(500);

      expect(response.body.error).toBe('Internal server error');
    });

    /**
     * Verifies that error responses don't leak sensitive information
     */
    test('should not leak sensitive information in error responses', async () => {
      (uploadOverlay as any).mockResolvedValue({
        data: null,
        error: {
          message: 'Upload failed',
          details: 'Internal path: /secret/uploads/user123',
        },
      });

      const response = await request(app)
        .post('/api/upload-overlay')
        .set('Authorization', validAuthToken)
        .attach('file', Buffer.from('test content'), 'test.png')
        .expect(400);

      expect(response.body.error).toBe('Upload failed');
      expect(response.body).not.toHaveProperty('details');
      expect(response.body).not.toHaveProperty('stack');
    });

    /**
     * Verifies handling of corrupted form data
     */
    test('should return 400 for corrupted form data', async () => {
      const response = await request(app)
        .post('/api/upload-overlay')
        .set('Authorization', validAuthToken)
        .set('Content-Type', 'multipart/form-data; boundary=----invalid')
        .send('----invalid\r\nCorrupted data\r\n----invalid--')
        .expect(400);

      expect(response.body.error).toBe('Error parsing form data');
      expect(uploadOverlay).not.toHaveBeenCalled();
    });
  });

  describe('Response Format Tests', () => {
    /**
     * Verifies that success response has correct structure
     */
    test('should return correct response structure on success', async () => {
      const response = await request(app)
        .post('/api/upload-overlay')
        .set('Authorization', validAuthToken)
        .attach('file', Buffer.from('test content'), 'test.png')
        .expect(201);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Overlay uploaded successfully');
      expect(Object.keys(response.body)).toEqual(['message']);
    });

    /**
     * Verifies that error response has correct structure
     */
    test('should return correct response structure on error', async () => {
      (uploadOverlay as any).mockResolvedValue({
        data: null,
        error: { message: 'Upload failed' },
      });

      const response = await request(app)
        .post('/api/upload-overlay')
        .set('Authorization', validAuthToken)
        .attach('file', Buffer.from('test content'), 'test.png')
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Upload failed');
      expect(response.body).not.toHaveProperty('message');
      expect(Object.keys(response.body)).toEqual(['error']);
    });

    /**
     * Verifies that authentication error response has correct structure
     */
    test('should return correct response structure on auth error', async () => {
      const response = await request(app)
        .post('/api/upload-overlay')
        .attach('file', Buffer.from('test content'), 'test.png')
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
        .post('/api/upload-overlay')
        .set('Authorization', validAuthToken)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Missing required field: file');
      expect(Object.keys(response.body)).toEqual(['error']);
    });

    /**
     * Verifies that response contains proper JSON content type
     */
    test('should return JSON content type', async () => {
      const response = await request(app)
        .post('/api/upload-overlay')
        .set('Authorization', validAuthToken)
        .attach('file', Buffer.from('test content'), 'test.png')
        .expect(201);

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    /**
     * Verifies that success response uses 201 status code
     */
    test('should return 201 status code on successful upload', async () => {
      const response = await request(app)
        .post('/api/upload-overlay')
        .set('Authorization', validAuthToken)
        .attach('file', Buffer.from('test content'), 'test.png');

      expect(response.status).toBe(201);
    });
  });

  describe('HTTP Method Tests', () => {
    /**
     * Verifies that GET method is not allowed
     */
    test('should not allow GET method', async () => {
      const response = await request(app)
        .get('/api/upload-overlay')
        .set('Authorization', validAuthToken)
        .expect(404);

      expect(response.body.error).toBe('Not found');
      expect(uploadOverlay).not.toHaveBeenCalled();
    });

    /**
     * Verifies that PUT method is not allowed
     */
    test('should not allow PUT method', async () => {
      const response = await request(app)
        .put('/api/upload-overlay')
        .set('Authorization', validAuthToken)
        .expect(404);

      expect(response.body.error).toBe('Not found');
      expect(uploadOverlay).not.toHaveBeenCalled();
    });

    /**
     * Verifies that DELETE method is not allowed
     */
    test('should not allow DELETE method', async () => {
      const response = await request(app)
        .delete('/api/upload-overlay')
        .set('Authorization', validAuthToken)
        .expect(404);

      expect(response.body.error).toBe('Not found');
      expect(uploadOverlay).not.toHaveBeenCalled();
    });

    /**
     * Verifies that PATCH method is not allowed
     */
    test('should not allow PATCH method', async () => {
      const response = await request(app)
        .patch('/api/upload-overlay')
        .set('Authorization', validAuthToken)
        .expect(404);

      expect(response.body.error).toBe('Not found');
      expect(uploadOverlay).not.toHaveBeenCalled();
    });

    /**
     * Verifies that OPTIONS method returns correct CORS headers
     */
    test('should handle OPTIONS request for CORS', async () => {
      const response = await request(app)
        .options('/api/upload-overlay')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('*');
      expect(response.headers['access-control-allow-methods']).toContain(
        'POST'
      );
    });
  });

  describe('Parameter Validation Tests', () => {
    /**
     * Verifies that uploadOverlay receives correct parameters
     */
    test('should pass correct parameters to uploadOverlay', async () => {
      const filename = 'test-file.png';
      const fileContent = 'test file content';

      await request(app)
        .post('/api/upload-overlay')
        .set('Authorization', validAuthToken)
        .attach('file', Buffer.from(fileContent), filename)
        .expect(201);

      const calls = (uploadOverlay as any).mock.calls;
      expect(calls).toHaveLength(1);
      expect(calls[0]).toHaveLength(3);
      expect(calls[0][0]).toBe(mockUserId);
      expect(calls[0][1]).toBeInstanceOf(Buffer);
      expect(calls[0][2]).toBe(filename);
    });

    /**
     * Verifies that uploadOverlay receives correct parameter types
     */
    test('should pass correct parameter types to uploadOverlay', async () => {
      await request(app)
        .post('/api/upload-overlay')
        .set('Authorization', validAuthToken)
        .attach('file', Buffer.from('content'), 'test.png')
        .expect(201);

      const calls = (uploadOverlay as any).mock.calls;
      expect(typeof calls[0][0]).toBe('string'); // userId
      expect(calls[0][1]).toBeInstanceOf(Buffer); // fileBuffer
      expect(typeof calls[0][2]).toBe('string'); // filename
    });

    /**
     * Verifies that uploadOverlay is called exactly once per upload
     */
    test('should call uploadOverlay exactly once', async () => {
      await request(app)
        .post('/api/upload-overlay')
        .set('Authorization', validAuthToken)
        .attach('file', Buffer.from('test content'), 'test.png')
        .expect(201);

      expect(uploadOverlay).toHaveBeenCalledTimes(1);
    });

    /**
     * Verifies that filename is preserved exactly as provided
     */
    test('should preserve filename exactly as provided', async () => {
      const filename = 'My File (1) - Final v2.png';

      await request(app)
        .post('/api/upload-overlay')
        .set('Authorization', validAuthToken)
        .attach('file', Buffer.from('test content'), filename)
        .expect(201);

      expect(uploadOverlay).toHaveBeenCalledWith(
        mockUserId,
        expect.any(Buffer),
        filename
      );
    });
  });

  describe('Edge Cases and Boundary Tests', () => {
    /**
     * Verifies handling of files with no extension
     */
    test('should handle file with no extension', async () => {
      const response = await request(app)
        .post('/api/upload-overlay')
        .set('Authorization', validAuthToken)
        .attach('file', Buffer.from('test content'), 'noextension')
        .expect(201);

      expect(response.body.message).toBe('Overlay uploaded successfully');
      expect(uploadOverlay).toHaveBeenCalledWith(
        mockUserId,
        expect.any(Buffer),
        'noextension'
      );
    });

    /**
     * Verifies handling of files with multiple extensions
     */
    test('should handle file with multiple extensions', async () => {
      const response = await request(app)
        .post('/api/upload-overlay')
        .set('Authorization', validAuthToken)
        .attach('file', Buffer.from('test content'), 'archive.tar.gz')
        .expect(201);

      expect(response.body.message).toBe('Overlay uploaded successfully');
      expect(uploadOverlay).toHaveBeenCalledWith(
        mockUserId,
        expect.any(Buffer),
        'archive.tar.gz'
      );
    });

    /**
     * Verifies handling of filename with leading/trailing spaces
     */
    test('should handle filename with spaces around it', async () => {
      const response = await request(app)
        .post('/api/upload-overlay')
        .set('Authorization', validAuthToken)
        .attach('file', Buffer.from('test content'), '  spaced.png  ')
        .expect(201);

      expect(response.body.message).toBe('Overlay uploaded successfully');
      // Filename is used as-is, including spaces
      expect(uploadOverlay).toHaveBeenCalled();
    });

    /**
     * Verifies that different users can upload files with same name
     */
    test('should allow different users to upload files with same name', async () => {
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
        .post('/api/upload-overlay')
        .set('Authorization', user1Token)
        .attach('file', Buffer.from('user1 content'), 'overlay.png')
        .expect(201);

      await request(app)
        .post('/api/upload-overlay')
        .set('Authorization', user2Token)
        .attach('file', Buffer.from('user2 content'), 'overlay.png')
        .expect(201);

      expect(uploadOverlay).toHaveBeenCalledWith(
        user1Id,
        expect.any(Buffer),
        'overlay.png'
      );
      expect(uploadOverlay).toHaveBeenCalledWith(
        user2Id,
        expect.any(Buffer),
        'overlay.png'
      );
      expect(uploadOverlay).toHaveBeenCalledTimes(2);
    });

    /**
     * Verifies handling of unusual but valid MIME types
     */
    test('should accept file regardless of MIME type', async () => {
      const response = await request(app)
        .post('/api/upload-overlay')
        .set('Authorization', validAuthToken)
        .attach('file', Buffer.from('test content'), 'file.webp')
        .expect(201);

      expect(response.body.message).toBe('Overlay uploaded successfully');
      expect(uploadOverlay).toHaveBeenCalled();
    });

    /**
     * Verifies handling of filenames with dots
     */
    test('should handle filename with multiple dots', async () => {
      const response = await request(app)
        .post('/api/upload-overlay')
        .set('Authorization', validAuthToken)
        .attach('file', Buffer.from('test content'), 'my.file.name.png')
        .expect(201);

      expect(response.body.message).toBe('Overlay uploaded successfully');
      expect(uploadOverlay).toHaveBeenCalledWith(
        mockUserId,
        expect.any(Buffer),
        'my.file.name.png'
      );
    });
  });

  describe('Security Tests', () => {
    /**
     * Verifies that user cannot upload without authentication
     */
    test('should prevent upload without authentication', async () => {
      const response = await request(app)
        .post('/api/upload-overlay')
        .attach('file', Buffer.from('test content'), 'test.png')
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
      expect(uploadOverlay).not.toHaveBeenCalled();
    });

    /**
     * Verifies that userId is passed correctly to uploadOverlay for authorization
     */
    test('should pass userId to uploadOverlay for authorization', async () => {
      await request(app)
        .post('/api/upload-overlay')
        .set('Authorization', validAuthToken)
        .attach('file', Buffer.from('test content'), 'test.png')
        .expect(201);

      const calls = (uploadOverlay as any).mock.calls;
      expect(calls[0][0]).toBe(mockUserId);
    });

    /**
     * Verifies that response doesn't leak user information
     */
    test('should not leak user information in response', async () => {
      const response = await request(app)
        .post('/api/upload-overlay')
        .set('Authorization', validAuthToken)
        .attach('file', Buffer.from('test content'), 'test.png')
        .expect(201);

      expect(response.body).not.toHaveProperty('userId');
      expect(response.body).not.toHaveProperty('user');
      expect(response.body).not.toHaveProperty('token');
      expect(response.body).not.toHaveProperty('filepath');
    });

    /**
     * Verifies that token is properly stripped of Bearer prefix
     */
    test('should properly extract token from Bearer header', async () => {
      await request(app)
        .post('/api/upload-overlay')
        .set('Authorization', 'Bearer test-token-with-special-chars-123_456')
        .attach('file', Buffer.from('test content'), 'test.png')
        .expect(201);

      expect(supabase.auth.getUser).toHaveBeenCalledWith(
        'test-token-with-special-chars-123_456'
      );
    });
  });

  describe('Concurrency Tests', () => {
    /**
     * Verifies that concurrent upload requests are handled independently
     */
    test('should handle concurrent upload requests', async () => {
      const requests = [
        request(app)
          .post('/api/upload-overlay')
          .set('Authorization', validAuthToken)
          .attach('file', Buffer.from('content1'), 'file1.png'),
        request(app)
          .post('/api/upload-overlay')
          .set('Authorization', validAuthToken)
          .attach('file', Buffer.from('content2'), 'file2.png'),
        request(app)
          .post('/api/upload-overlay')
          .set('Authorization', validAuthToken)
          .attach('file', Buffer.from('content3'), 'file3.png'),
      ];

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(201);
        expect(response.body.message).toBe('Overlay uploaded successfully');
      });

      expect(uploadOverlay).toHaveBeenCalledTimes(3);
    });

    /**
     * Verifies that sequential uploads work correctly
     */
    test('should handle sequential uploads', async () => {
      const response1 = await request(app)
        .post('/api/upload-overlay')
        .set('Authorization', validAuthToken)
        .attach('file', Buffer.from('content1'), 'file1.png')
        .expect(201);

      const response2 = await request(app)
        .post('/api/upload-overlay')
        .set('Authorization', validAuthToken)
        .attach('file', Buffer.from('content2'), 'file2.png')
        .expect(201);

      expect(response1.body.message).toBe('Overlay uploaded successfully');
      expect(response2.body.message).toBe('Overlay uploaded successfully');
      expect(uploadOverlay).toHaveBeenCalledTimes(2);
    });
  });
});
