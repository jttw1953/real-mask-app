// tests for jira ticket CCP-153 - created by: [Your Name]
// CCP-154 - approved by:

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
const { updateUserFullName } = await import(
  '../../src/supabase_api/supabase_api.js'
);
const { supabase } = await import('../../src/supabase_api/supabase_api.js');

describe('PUT /api/update-user-name', () => {
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
        .put('/api/update-user-name')
        .send({ full_name: 'John Doe' })
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
      expect(updateUserFullName).not.toHaveBeenCalled();
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
        .put('/api/update-user-name')
        .set('Authorization', 'Bearer invalid-token')
        .send({ full_name: 'John Doe' })
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
      expect(updateUserFullName).not.toHaveBeenCalled();
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
        .put('/api/update-user-name')
        .set('Authorization', validAuthToken)
        .send({ full_name: 'John Doe' })
        .expect(401);

      expect(response.body.error).toBe('Unauthorized');
      expect(updateUserFullName).not.toHaveBeenCalled();
    });
  });

  describe('Validation Tests - Missing Field', () => {
    /**
     * Verifies that the endpoint returns 400 when full_name is missing
     */
    test('should return 400 when full_name is missing', async () => {
      const response = await request(app)
        .put('/api/update-user-name')
        .set('Authorization', validAuthToken)
        .send({})
        .expect(400);

      expect(response.body.error).toBe('Missing required field: full_name');
      expect(updateUserFullName).not.toHaveBeenCalled();
    });

    /**
     * Verifies that the endpoint returns 400 when full_name is undefined
     */
    test('should return 400 when full_name is undefined', async () => {
      const response = await request(app)
        .put('/api/update-user-name')
        .set('Authorization', validAuthToken)
        .send({ full_name: undefined })
        .expect(400);

      expect(response.body.error).toBe('Missing required field: full_name');
      expect(updateUserFullName).not.toHaveBeenCalled();
    });

    /**
     * Verifies that the endpoint returns 400 when full_name is null
     */
    test('should return 400 when full_name is null', async () => {
      const response = await request(app)
        .put('/api/update-user-name')
        .set('Authorization', validAuthToken)
        .send({ full_name: null })
        .expect(400);

      expect(response.body.error).toBe('Missing required field: full_name');
      expect(updateUserFullName).not.toHaveBeenCalled();
    });

    /**
     * Verifies that the endpoint returns 500 when request body is completely missing
     * (causes req.body to be undefined, leading to destructuring error)
     */
    test('should return 500 when request body is completely missing', async () => {
      const response = await request(app)
        .put('/api/update-user-name')
        .set('Authorization', validAuthToken)
        .send()
        .expect(500);

      expect(response.body.error).toBe('Internal server error');
    });
  });

  describe('Validation Tests - Type Checking', () => {
    /**
     * Verifies that the endpoint rejects numeric values for full_name
     */
    test('should return 400 when full_name is a number', async () => {
      const response = await request(app)
        .put('/api/update-user-name')
        .set('Authorization', validAuthToken)
        .send({ full_name: 12345 })
        .expect(400);

      expect(response.body.error).toBe('full_name must be a string');
      expect(updateUserFullName).not.toHaveBeenCalled();
    });

    /**
     * Verifies that the endpoint rejects boolean values for full_name
     */
    test('should return 400 when full_name is a boolean', async () => {
      const response = await request(app)
        .put('/api/update-user-name')
        .set('Authorization', validAuthToken)
        .send({ full_name: true })
        .expect(400);

      expect(response.body.error).toBe('full_name must be a string');
      expect(updateUserFullName).not.toHaveBeenCalled();
    });

    /**
     * Verifies that the endpoint rejects zero as full_name
     */
    test('should return 400 when full_name is zero', async () => {
      const response = await request(app)
        .put('/api/update-user-name')
        .set('Authorization', validAuthToken)
        .send({ full_name: 0 })
        .expect(400);

      expect(response.body.error).toBe('full_name must be a string');
      expect(updateUserFullName).not.toHaveBeenCalled();
    });

    /**
     * Verifies that the endpoint rejects array values for full_name
     */
    test('should return 400 when full_name is an array', async () => {
      const response = await request(app)
        .put('/api/update-user-name')
        .set('Authorization', validAuthToken)
        .send({ full_name: ['John', 'Doe'] })
        .expect(400);

      expect(response.body.error).toBe('full_name must be a string');
      expect(updateUserFullName).not.toHaveBeenCalled();
    });

    /**
     * Verifies that the endpoint rejects object values for full_name
     */
    test('should return 400 when full_name is an object', async () => {
      const response = await request(app)
        .put('/api/update-user-name')
        .set('Authorization', validAuthToken)
        .send({ full_name: { first: 'John', last: 'Doe' } })
        .expect(400);

      expect(response.body.error).toBe('full_name must be a string');
      expect(updateUserFullName).not.toHaveBeenCalled();
    });
  });

  describe('Validation Tests - Empty Strings', () => {
    /**
     * Verifies that the endpoint rejects whitespace-only strings for full_name
     */
    test('should return 400 when full_name is only spaces', async () => {
      const response = await request(app)
        .put('/api/update-user-name')
        .set('Authorization', validAuthToken)
        .send({ full_name: '   ' })
        .expect(400);

      expect(response.body.error).toBe('full_name cannot be empty');
      expect(updateUserFullName).not.toHaveBeenCalled();
    });

    /**
     * Verifies that the endpoint rejects tab-only strings for full_name
     */
    test('should return 400 when full_name is only tabs', async () => {
      const response = await request(app)
        .put('/api/update-user-name')
        .set('Authorization', validAuthToken)
        .send({ full_name: '\t\t\t' })
        .expect(400);

      expect(response.body.error).toBe('full_name cannot be empty');
      expect(updateUserFullName).not.toHaveBeenCalled();
    });

    /**
     * Verifies that the endpoint rejects newline-only strings for full_name
     */
    test('should return 400 when full_name is only newlines', async () => {
      const response = await request(app)
        .put('/api/update-user-name')
        .set('Authorization', validAuthToken)
        .send({ full_name: '\n\n\n' })
        .expect(400);

      expect(response.body.error).toBe('full_name cannot be empty');
      expect(updateUserFullName).not.toHaveBeenCalled();
    });

    /**
     * Verifies that the endpoint rejects mixed whitespace strings for full_name
     */
    test('should return 400 when full_name is mixed whitespace', async () => {
      const response = await request(app)
        .put('/api/update-user-name')
        .set('Authorization', validAuthToken)
        .send({ full_name: ' \t\n\r ' })
        .expect(400);

      expect(response.body.error).toBe('full_name cannot be empty');
      expect(updateUserFullName).not.toHaveBeenCalled();
    });
  });

  describe('Success Cases - Basic Names', () => {
    /**
     * Verifies successful update with simple name
     */
    test('should update full name successfully with simple name', async () => {
      (updateUserFullName as any).mockResolvedValue(null);

      const response = await request(app)
        .put('/api/update-user-name')
        .set('Authorization', validAuthToken)
        .send({ full_name: 'John Doe' })
        .expect(200);

      expect(response.body.message).toBe('Full name updated successfully');
      expect(updateUserFullName).toHaveBeenCalledWith(mockUserId, 'John Doe');
      expect(updateUserFullName).toHaveBeenCalledTimes(1);
    });

    /**
     * Verifies successful update with single name
     */
    test('should update full name successfully with single name', async () => {
      (updateUserFullName as any).mockResolvedValue(null);

      const response = await request(app)
        .put('/api/update-user-name')
        .set('Authorization', validAuthToken)
        .send({ full_name: 'Madonna' })
        .expect(200);

      expect(response.body.message).toBe('Full name updated successfully');
      expect(updateUserFullName).toHaveBeenCalledWith(mockUserId, 'Madonna');
    });

    /**
     * Verifies successful update with single character name
     */
    test('should accept single character name', async () => {
      (updateUserFullName as any).mockResolvedValue(null);

      const response = await request(app)
        .put('/api/update-user-name')
        .set('Authorization', validAuthToken)
        .send({ full_name: 'X' })
        .expect(200);

      expect(response.body.message).toBe('Full name updated successfully');
      expect(updateUserFullName).toHaveBeenCalledWith(mockUserId, 'X');
    });

    /**
     * Verifies successful update with multiple part names
     */
    test('should accept names with multiple parts', async () => {
      (updateUserFullName as any).mockResolvedValue(null);

      const response = await request(app)
        .put('/api/update-user-name')
        .set('Authorization', validAuthToken)
        .send({ full_name: 'Jean-Baptiste de la Salle' })
        .expect(200);

      expect(response.body.message).toBe('Full name updated successfully');
      expect(updateUserFullName).toHaveBeenCalledWith(
        mockUserId,
        'Jean-Baptiste de la Salle'
      );
    });
  });

  describe('Success Cases - Whitespace Trimming', () => {
    /**
     * Verifies that leading whitespace is trimmed
     */
    test('should trim leading whitespace from full_name', async () => {
      (updateUserFullName as any).mockResolvedValue(null);

      const response = await request(app)
        .put('/api/update-user-name')
        .set('Authorization', validAuthToken)
        .send({ full_name: '   John Doe' })
        .expect(200);

      expect(response.body.message).toBe('Full name updated successfully');
      expect(updateUserFullName).toHaveBeenCalledWith(mockUserId, 'John Doe');
    });

    /**
     * Verifies that trailing whitespace is trimmed
     */
    test('should trim trailing whitespace from full_name', async () => {
      (updateUserFullName as any).mockResolvedValue(null);

      const response = await request(app)
        .put('/api/update-user-name')
        .set('Authorization', validAuthToken)
        .send({ full_name: 'John Doe   ' })
        .expect(200);

      expect(response.body.message).toBe('Full name updated successfully');
      expect(updateUserFullName).toHaveBeenCalledWith(mockUserId, 'John Doe');
    });

    /**
     * Verifies that leading and trailing whitespace is trimmed
     */
    test('should trim both leading and trailing whitespace', async () => {
      (updateUserFullName as any).mockResolvedValue(null);

      const response = await request(app)
        .put('/api/update-user-name')
        .set('Authorization', validAuthToken)
        .send({ full_name: '   John Doe   ' })
        .expect(200);

      expect(response.body.message).toBe('Full name updated successfully');
      expect(updateUserFullName).toHaveBeenCalledWith(mockUserId, 'John Doe');
    });

    /**
     * Verifies that tabs and newlines are trimmed
     */
    test('should trim tabs and newlines', async () => {
      (updateUserFullName as any).mockResolvedValue(null);

      const response = await request(app)
        .put('/api/update-user-name')
        .set('Authorization', validAuthToken)
        .send({ full_name: '\t\nJohn Doe\n\t' })
        .expect(200);

      expect(response.body.message).toBe('Full name updated successfully');
      expect(updateUserFullName).toHaveBeenCalledWith(mockUserId, 'John Doe');
    });

    /**
     * Verifies that internal whitespace is preserved
     */
    test('should preserve internal whitespace', async () => {
      (updateUserFullName as any).mockResolvedValue(null);

      const response = await request(app)
        .put('/api/update-user-name')
        .set('Authorization', validAuthToken)
        .send({ full_name: '  John   Doe  ' })
        .expect(200);

      expect(response.body.message).toBe('Full name updated successfully');
      expect(updateUserFullName).toHaveBeenCalledWith(mockUserId, 'John   Doe');
    });

    /**
     * Verifies that single character with whitespace is trimmed correctly
     */
    test('should trim whitespace around single character', async () => {
      (updateUserFullName as any).mockResolvedValue(null);

      const response = await request(app)
        .put('/api/update-user-name')
        .set('Authorization', validAuthToken)
        .send({ full_name: '   X   ' })
        .expect(200);

      expect(response.body.message).toBe('Full name updated successfully');
      expect(updateUserFullName).toHaveBeenCalledWith(mockUserId, 'X');
    });
  });

  describe('Success Cases - Special Characters', () => {
    /**
     * Verifies handling of names with hyphens
     */
    test('should accept names with hyphens', async () => {
      (updateUserFullName as any).mockResolvedValue(null);

      const response = await request(app)
        .put('/api/update-user-name')
        .set('Authorization', validAuthToken)
        .send({ full_name: 'Mary-Jane Watson-Parker' })
        .expect(200);

      expect(response.body.message).toBe('Full name updated successfully');
      expect(updateUserFullName).toHaveBeenCalledWith(
        mockUserId,
        'Mary-Jane Watson-Parker'
      );
    });

    /**
     * Verifies handling of names with apostrophes
     */
    test('should accept names with apostrophes', async () => {
      (updateUserFullName as any).mockResolvedValue(null);

      const response = await request(app)
        .put('/api/update-user-name')
        .set('Authorization', validAuthToken)
        .send({ full_name: "O'Brien" })
        .expect(200);

      expect(response.body.message).toBe('Full name updated successfully');
      expect(updateUserFullName).toHaveBeenCalledWith(mockUserId, "O'Brien");
    });

    /**
     * Verifies handling of names with periods
     */
    test('should accept names with periods', async () => {
      (updateUserFullName as any).mockResolvedValue(null);

      const response = await request(app)
        .put('/api/update-user-name')
        .set('Authorization', validAuthToken)
        .send({ full_name: 'Dr. John A. Doe Jr.' })
        .expect(200);

      expect(response.body.message).toBe('Full name updated successfully');
      expect(updateUserFullName).toHaveBeenCalledWith(
        mockUserId,
        'Dr. John A. Doe Jr.'
      );
    });

    /**
     * Verifies handling of names with parentheses
     */
    test('should accept names with parentheses', async () => {
      (updateUserFullName as any).mockResolvedValue(null);

      const response = await request(app)
        .put('/api/update-user-name')
        .set('Authorization', validAuthToken)
        .send({ full_name: 'John Doe (PhD)' })
        .expect(200);

      expect(response.body.message).toBe('Full name updated successfully');
      expect(updateUserFullName).toHaveBeenCalledWith(
        mockUserId,
        'John Doe (PhD)'
      );
    });

    /**
     * Verifies handling of names with commas
     */
    test('should accept names with commas', async () => {
      (updateUserFullName as any).mockResolvedValue(null);

      const response = await request(app)
        .put('/api/update-user-name')
        .set('Authorization', validAuthToken)
        .send({ full_name: 'Doe, John' })
        .expect(200);

      expect(response.body.message).toBe('Full name updated successfully');
      expect(updateUserFullName).toHaveBeenCalledWith(mockUserId, 'Doe, John');
    });

    /**
     * Verifies handling of names with numbers
     */
    test('should accept names with numbers', async () => {
      (updateUserFullName as any).mockResolvedValue(null);

      const response = await request(app)
        .put('/api/update-user-name')
        .set('Authorization', validAuthToken)
        .send({ full_name: 'John Doe 3rd' })
        .expect(200);

      expect(response.body.message).toBe('Full name updated successfully');
      expect(updateUserFullName).toHaveBeenCalledWith(
        mockUserId,
        'John Doe 3rd'
      );
    });

    /**
     * Verifies handling of names with special symbols
     */
    test('should accept names with special symbols', async () => {
      (updateUserFullName as any).mockResolvedValue(null);

      const response = await request(app)
        .put('/api/update-user-name')
        .set('Authorization', validAuthToken)
        .send({ full_name: 'John & Jane Doe' })
        .expect(200);

      expect(response.body.message).toBe('Full name updated successfully');
      expect(updateUserFullName).toHaveBeenCalledWith(
        mockUserId,
        'John & Jane Doe'
      );
    });
  });

  describe('Success Cases - Unicode and International Names', () => {
    /**
     * Verifies handling of names with accented characters
     */
    test('should accept names with accented characters', async () => {
      (updateUserFullName as any).mockResolvedValue(null);

      const response = await request(app)
        .put('/api/update-user-name')
        .set('Authorization', validAuthToken)
        .send({ full_name: 'José García Müller' })
        .expect(200);

      expect(response.body.message).toBe('Full name updated successfully');
      expect(updateUserFullName).toHaveBeenCalledWith(
        mockUserId,
        'José García Müller'
      );
    });

    /**
     * Verifies handling of Chinese names
     */
    test('should accept Chinese names', async () => {
      (updateUserFullName as any).mockResolvedValue(null);

      const response = await request(app)
        .put('/api/update-user-name')
        .set('Authorization', validAuthToken)
        .send({ full_name: '张伟' })
        .expect(200);

      expect(response.body.message).toBe('Full name updated successfully');
      expect(updateUserFullName).toHaveBeenCalledWith(mockUserId, '张伟');
    });

    /**
     * Verifies handling of Japanese names
     */
    test('should accept Japanese names', async () => {
      (updateUserFullName as any).mockResolvedValue(null);

      const response = await request(app)
        .put('/api/update-user-name')
        .set('Authorization', validAuthToken)
        .send({ full_name: '田中太郎' })
        .expect(200);

      expect(response.body.message).toBe('Full name updated successfully');
      expect(updateUserFullName).toHaveBeenCalledWith(mockUserId, '田中太郎');
    });

    /**
     * Verifies handling of Arabic names
     */
    test('should accept Arabic names', async () => {
      (updateUserFullName as any).mockResolvedValue(null);

      const response = await request(app)
        .put('/api/update-user-name')
        .set('Authorization', validAuthToken)
        .send({ full_name: 'محمد علي' })
        .expect(200);

      expect(response.body.message).toBe('Full name updated successfully');
      expect(updateUserFullName).toHaveBeenCalledWith(mockUserId, 'محمد علي');
    });

    /**
     * Verifies handling of Cyrillic names
     */
    test('should accept Cyrillic names', async () => {
      (updateUserFullName as any).mockResolvedValue(null);

      const response = await request(app)
        .put('/api/update-user-name')
        .set('Authorization', validAuthToken)
        .send({ full_name: 'Иван Петров' })
        .expect(200);

      expect(response.body.message).toBe('Full name updated successfully');
      expect(updateUserFullName).toHaveBeenCalledWith(
        mockUserId,
        'Иван Петров'
      );
    });

    /**
     * Verifies handling of names with emojis
     */
    test('should accept names with emojis', async () => {
      (updateUserFullName as any).mockResolvedValue(null);

      const response = await request(app)
        .put('/api/update-user-name')
        .set('Authorization', validAuthToken)
        .send({ full_name: 'John Doe 🎉' })
        .expect(200);

      expect(response.body.message).toBe('Full name updated successfully');
      expect(updateUserFullName).toHaveBeenCalledWith(
        mockUserId,
        'John Doe 🎉'
      );
    });

    /**
     * Verifies handling of mixed script names
     */
    test('should accept mixed script names', async () => {
      (updateUserFullName as any).mockResolvedValue(null);

      const response = await request(app)
        .put('/api/update-user-name')
        .set('Authorization', validAuthToken)
        .send({ full_name: 'John 张伟 Smith' })
        .expect(200);

      expect(response.body.message).toBe('Full name updated successfully');
      expect(updateUserFullName).toHaveBeenCalledWith(
        mockUserId,
        'John 张伟 Smith'
      );
    });
  });

  describe('Success Cases - Long Names', () => {
    /**
     * Verifies handling of moderately long names
     */
    test('should accept moderately long names', async () => {
      (updateUserFullName as any).mockResolvedValue(null);

      const longName = 'Hubert Blaine Wolfeschlegelsteinhausenbergerdorff Sr.';

      const response = await request(app)
        .put('/api/update-user-name')
        .set('Authorization', validAuthToken)
        .send({ full_name: longName })
        .expect(200);

      expect(response.body.message).toBe('Full name updated successfully');
      expect(updateUserFullName).toHaveBeenCalledWith(mockUserId, longName);
    });

    /**
     * Verifies handling of very long names (500 chars)
     */
    test('should accept very long names', async () => {
      (updateUserFullName as any).mockResolvedValue(null);

      const longName = 'A'.repeat(500);

      const response = await request(app)
        .put('/api/update-user-name')
        .set('Authorization', validAuthToken)
        .send({ full_name: longName })
        .expect(200);

      expect(response.body.message).toBe('Full name updated successfully');
      expect(updateUserFullName).toHaveBeenCalledWith(mockUserId, longName);
    });

    /**
     * Verifies handling of extremely long names (1000 chars)
     */
    test('should accept extremely long names', async () => {
      (updateUserFullName as any).mockResolvedValue(null);

      const longName = 'B'.repeat(1000);

      const response = await request(app)
        .put('/api/update-user-name')
        .set('Authorization', validAuthToken)
        .send({ full_name: longName })
        .expect(200);

      expect(response.body.message).toBe('Full name updated successfully');
      expect(updateUserFullName).toHaveBeenCalledWith(mockUserId, longName);
    });

    /**
     * Verifies handling of long names with whitespace that trims correctly
     */
    test('should trim long names with whitespace correctly', async () => {
      (updateUserFullName as any).mockResolvedValue(null);

      const longName = 'A'.repeat(500);
      const nameWithWhitespace = '   ' + longName + '   ';

      const response = await request(app)
        .put('/api/update-user-name')
        .set('Authorization', validAuthToken)
        .send({ full_name: nameWithWhitespace })
        .expect(200);

      expect(response.body.message).toBe('Full name updated successfully');
      expect(updateUserFullName).toHaveBeenCalledWith(mockUserId, longName);
    });
  });

  describe('Success Cases - HTML/Script Content', () => {
    /**
     * Verifies handling of names with HTML tags
     */
    test('should accept names with HTML tags', async () => {
      (updateUserFullName as any).mockResolvedValue(null);

      const response = await request(app)
        .put('/api/update-user-name')
        .set('Authorization', validAuthToken)
        .send({ full_name: '<b>John</b> Doe' })
        .expect(200);

      expect(response.body.message).toBe('Full name updated successfully');
      expect(updateUserFullName).toHaveBeenCalledWith(
        mockUserId,
        '<b>John</b> Doe'
      );
    });

    /**
     * Verifies handling of names with script tags
     */
    test('should accept names with script tags', async () => {
      (updateUserFullName as any).mockResolvedValue(null);

      const response = await request(app)
        .put('/api/update-user-name')
        .set('Authorization', validAuthToken)
        .send({ full_name: '<script>alert("XSS")</script>' })
        .expect(200);

      expect(response.body.message).toBe('Full name updated successfully');
      expect(updateUserFullName).toHaveBeenCalledWith(
        mockUserId,
        '<script>alert("XSS")</script>'
      );
    });

    /**
     * Verifies handling of SQL injection attempts
     */
    test('should accept SQL injection strings', async () => {
      (updateUserFullName as any).mockResolvedValue(null);

      const response = await request(app)
        .put('/api/update-user-name')
        .set('Authorization', validAuthToken)
        .send({ full_name: "'; DROP TABLE users; --" })
        .expect(200);

      expect(response.body.message).toBe('Full name updated successfully');
      expect(updateUserFullName).toHaveBeenCalledWith(
        mockUserId,
        "'; DROP TABLE users; --"
      );
    });
  });

  describe('Error Cases from Database', () => {
    /**
     * Verifies that database errors are properly handled and returned
     */
    test('should return 400 for database errors', async () => {
      (updateUserFullName as any).mockResolvedValue('Database error occurred');

      const response = await request(app)
        .put('/api/update-user-name')
        .set('Authorization', validAuthToken)
        .send({ full_name: 'John Doe' })
        .expect(400);

      expect(response.body.error).toBe('Database error occurred');
    });

    /**
     * Verifies handling of user not found error
     */
    test('should return 400 when user not found', async () => {
      (updateUserFullName as any).mockResolvedValue('User not found');

      const response = await request(app)
        .put('/api/update-user-name')
        .set('Authorization', validAuthToken)
        .send({ full_name: 'John Doe' })
        .expect(400);

      expect(response.body.error).toBe('User not found');
    });

    /**
     * Verifies handling of constraint violations
     */
    test('should return 400 for constraint violations', async () => {
      (updateUserFullName as any).mockResolvedValue(
        'Name exceeds maximum length'
      );

      const response = await request(app)
        .put('/api/update-user-name')
        .set('Authorization', validAuthToken)
        .send({ full_name: 'John Doe' })
        .expect(400);

      expect(response.body.error).toBe('Name exceeds maximum length');
    });

    /**
     * Verifies that the endpoint returns 500 for unexpected errors
     */
    test('should return 500 for unexpected errors', async () => {
      (updateUserFullName as any).mockRejectedValue(
        new Error('Unexpected database error')
      );

      const response = await request(app)
        .put('/api/update-user-name')
        .set('Authorization', validAuthToken)
        .send({ full_name: 'John Doe' })
        .expect(500);

      expect(response.body.error).toBe('Internal server error');
    });

    /**
     * Verifies that network errors during database operations are handled
     */
    test('should return 500 when network error occurs', async () => {
      (updateUserFullName as any).mockRejectedValue(
        new Error('Network timeout')
      );

      const response = await request(app)
        .put('/api/update-user-name')
        .set('Authorization', validAuthToken)
        .send({ full_name: 'John Doe' })
        .expect(500);

      expect(response.body.error).toBe('Internal server error');
    });

    /**
     * Verifies handling of permission errors
     */
    test('should return 400 for permission errors', async () => {
      (updateUserFullName as any).mockResolvedValue('Permission denied');

      const response = await request(app)
        .put('/api/update-user-name')
        .set('Authorization', validAuthToken)
        .send({ full_name: 'John Doe' })
        .expect(400);

      expect(response.body.error).toBe('Permission denied');
    });
  });

  describe('Authorization Token Variations', () => {
    /**
     * Verifies that the endpoint handles authorization header with 'Bearer ' prefix
     */
    test('should handle token with Bearer prefix', async () => {
      (updateUserFullName as any).mockResolvedValue(null);

      const response = await request(app)
        .put('/api/update-user-name')
        .set('Authorization', 'Bearer valid-token-123')
        .send({ full_name: 'John Doe' })
        .expect(200);

      expect(response.body.message).toBe('Full name updated successfully');
      expect(supabase.auth.getUser).toHaveBeenCalledWith('valid-token-123');
    });

    /**
     * Verifies that the endpoint strips Bearer prefix correctly
     */
    test('should strip Bearer prefix from token', async () => {
      (updateUserFullName as any).mockResolvedValue(null);

      await request(app)
        .put('/api/update-user-name')
        .set('Authorization', 'Bearer my-token-456')
        .send({ full_name: 'John Doe' })
        .expect(200);

      expect(supabase.auth.getUser).toHaveBeenCalledWith('my-token-456');
    });

    /**
     * Verifies that the correct user ID is used for updates
     */
    test('should update name for correct user', async () => {
      const customUserId = 'custom-user-456';

      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: { id: customUserId } },
        error: null,
      });

      (updateUserFullName as any).mockResolvedValue(null);

      await request(app)
        .put('/api/update-user-name')
        .set('Authorization', validAuthToken)
        .send({ full_name: 'John Doe' })
        .expect(200);

      expect(updateUserFullName).toHaveBeenCalledWith(customUserId, 'John Doe');
    });
  });

  describe('Edge Cases', () => {
    /**
     * Verifies that updateUserFullName is not called on authentication failure
     */
    test('should not call updateUserFullName on authentication failure', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: null },
        error: new Error('Invalid token'),
      });

      await request(app)
        .put('/api/update-user-name')
        .set('Authorization', 'Bearer invalid-token')
        .send({ full_name: 'John Doe' })
        .expect(401);

      expect(updateUserFullName).not.toHaveBeenCalled();
    });

    /**
     * Verifies that updateUserFullName is not called on validation failure
     */
    test('should not call updateUserFullName on validation failure', async () => {
      await request(app)
        .put('/api/update-user-name')
        .set('Authorization', validAuthToken)
        .send({ full_name: '' })
        .expect(400);

      expect(updateUserFullName).not.toHaveBeenCalled();
    });

    /**
     * Verifies that the endpoint handles concurrent requests correctly
     */
    test('should handle concurrent requests correctly', async () => {
      (updateUserFullName as any).mockResolvedValue(null);

      const requests = [
        request(app)
          .put('/api/update-user-name')
          .set('Authorization', validAuthToken)
          .send({ full_name: 'John Doe' }),
        request(app)
          .put('/api/update-user-name')
          .set('Authorization', validAuthToken)
          .send({ full_name: 'Jane Smith' }),
        request(app)
          .put('/api/update-user-name')
          .set('Authorization', validAuthToken)
          .send({ full_name: 'Bob Johnson' }),
      ];

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Full name updated successfully');
      });

      expect(updateUserFullName).toHaveBeenCalledTimes(3);
    });

    /**
     * Verifies that extra fields in request body are ignored
     */
    test('should ignore extra fields in request body', async () => {
      (updateUserFullName as any).mockResolvedValue(null);

      const response = await request(app)
        .put('/api/update-user-name')
        .set('Authorization', validAuthToken)
        .send({
          full_name: 'John Doe',
          extra_field: 'should be ignored',
          another_field: 12345,
        })
        .expect(200);

      expect(response.body.message).toBe('Full name updated successfully');
      expect(updateUserFullName).toHaveBeenCalledWith(mockUserId, 'John Doe');
    });

    /**
     * Verifies that the endpoint is called with exactly two parameters
     */
    test('should call updateUserFullName with userId and trimmed name', async () => {
      (updateUserFullName as any).mockResolvedValue(null);

      await request(app)
        .put('/api/update-user-name')
        .set('Authorization', validAuthToken)
        .send({ full_name: '  John Doe  ' })
        .expect(200);

      expect(updateUserFullName).toHaveBeenCalledWith(mockUserId, 'John Doe');
      expect(updateUserFullName).toHaveBeenCalledTimes(1);
      expect((updateUserFullName as any).mock.calls[0]).toHaveLength(2);
    });

    /**
     * Verifies that multiple updates can be performed sequentially
     */
    test('should handle multiple sequential updates', async () => {
      (updateUserFullName as any).mockResolvedValue(null);

      await request(app)
        .put('/api/update-user-name')
        .set('Authorization', validAuthToken)
        .send({ full_name: 'First Name' })
        .expect(200);

      await request(app)
        .put('/api/update-user-name')
        .set('Authorization', validAuthToken)
        .send({ full_name: 'Second Name' })
        .expect(200);

      await request(app)
        .put('/api/update-user-name')
        .set('Authorization', validAuthToken)
        .send({ full_name: 'Third Name' })
        .expect(200);

      expect(updateUserFullName).toHaveBeenCalledTimes(3);
      expect(updateUserFullName).toHaveBeenNthCalledWith(
        1,
        mockUserId,
        'First Name'
      );
      expect(updateUserFullName).toHaveBeenNthCalledWith(
        2,
        mockUserId,
        'Second Name'
      );
      expect(updateUserFullName).toHaveBeenNthCalledWith(
        3,
        mockUserId,
        'Third Name'
      );
    });
  });

  describe('Response Format Tests', () => {
    /**
     * Verifies that success response has correct structure
     */
    test('should return correct response structure on success', async () => {
      (updateUserFullName as any).mockResolvedValue(null);

      const response = await request(app)
        .put('/api/update-user-name')
        .set('Authorization', validAuthToken)
        .send({ full_name: 'John Doe' })
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Full name updated successfully');
      expect(Object.keys(response.body)).toEqual(['message']);
    });

    /**
     * Verifies that error response has correct structure
     */
    test('should return correct response structure on error', async () => {
      (updateUserFullName as any).mockResolvedValue('Some error message');

      const response = await request(app)
        .put('/api/update-user-name')
        .set('Authorization', validAuthToken)
        .send({ full_name: 'John Doe' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Some error message');
      expect(response.body).not.toHaveProperty('message');
    });

    /**
     * Verifies that authentication error response has correct structure
     */
    test('should return correct response structure on auth error', async () => {
      const response = await request(app)
        .put('/api/update-user-name')
        .send({ full_name: 'John Doe' })
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
        .put('/api/update-user-name')
        .set('Authorization', validAuthToken)
        .send({ full_name: '   ' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('full_name cannot be empty');
      expect(Object.keys(response.body)).toEqual(['error']);
    });
  });

  describe('HTTP Method Tests', () => {
    /**
     * Verifies that GET method is not allowed
     */
    test('should not allow GET method', async () => {
      const response = await request(app)
        .get('/api/update-user-name')
        .set('Authorization', validAuthToken)
        .expect(404);

      expect(response.body.error).toBe('Not found');
    });

    /**
     * Verifies that POST method is not allowed
     */
    test('should not allow POST method', async () => {
      const response = await request(app)
        .post('/api/update-user-name')
        .set('Authorization', validAuthToken)
        .send({ full_name: 'John Doe' })
        .expect(404);

      expect(response.body.error).toBe('Not found');
    });

    /**
     * Verifies that DELETE method is not allowed
     */
    test('should not allow DELETE method', async () => {
      const response = await request(app)
        .delete('/api/update-user-name')
        .set('Authorization', validAuthToken)
        .expect(404);

      expect(response.body.error).toBe('Not found');
    });

    /**
     * Verifies that PATCH method is not allowed
     */
    test('should not allow PATCH method', async () => {
      const response = await request(app)
        .patch('/api/update-user-name')
        .set('Authorization', validAuthToken)
        .send({ full_name: 'John Doe' })
        .expect(404);

      expect(response.body.error).toBe('Not found');
    });

    /**
     * Verifies that OPTIONS method returns correct CORS headers
     */
    test('should handle OPTIONS request for CORS', async () => {
      const response = await request(app)
        .options('/api/update-user-name')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('*');
      expect(response.headers['access-control-allow-methods']).toContain('PUT');
    });
  });
});
