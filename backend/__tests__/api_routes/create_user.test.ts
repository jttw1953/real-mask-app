// tests are for jira ticket CCP-143 - created by: Matthew Mirza
// CCP-144 - Approved by:

import { jest } from '@jest/globals';
import { mockSupabaseApi } from '../helpers/mock_supabase_api.ts';

// creates a mock of the functions inside supabase_api.js
await jest.unstable_mockModule(
  '../../src/supabase_api/supabase_api.ts',
  mockSupabaseApi
);

const request = (await import('supertest')).default;
const { app } = await import('../../src/app.ts');
const { createUser } = await import('../../src/supabase_api/supabase_api.ts');

describe('POST /api/create-user', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Validation Tests - Missing Fields', () => {
    /**
     * Verifies that the endpoint returns a 400 error when no fields are provided
     */
    test('should return 400 when missing all fields', async () => {
      const response = await request(app)
        .post('/api/create-user')
        .send({})
        .expect(400);

      expect(response.body.error).toBe(
        'Missing required fields: full_name, email, password'
      );
    });

    /**
     * Verifies that the endpoint returns a 400 error when full_name is missing
     */
    test('should return 400 when missing full_name', async () => {
      const response = await request(app)
        .post('/api/create-user')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(400);

      expect(response.body.error).toBe(
        'Missing required fields: full_name, email, password'
      );
    });

    /**
     * Verifies that the endpoint returns a 400 error when email is missing
     */
    test('should return 400 when missing email', async () => {
      const response = await request(app)
        .post('/api/create-user')
        .send({
          full_name: 'John Doe',
          password: 'password123',
        })
        .expect(400);

      expect(response.body.error).toBe(
        'Missing required fields: full_name, email, password'
      );
    });

    /**
     * Verifies that the endpoint returns a 400 error when password is missing
     */
    test('should return 400 when missing password', async () => {
      const response = await request(app)
        .post('/api/create-user')
        .send({
          full_name: 'John Doe',
          email: 'test@example.com',
        })
        .expect(400);

      expect(response.body.error).toBe(
        'Missing required fields: full_name, email, password'
      );
    });
  });

  describe('Validation Tests - Type Checking', () => {
    /**
     * Verifies that the endpoint rejects numeric values for full_name
     */
    test('should return 400 when full_name is a number', async () => {
      const response = await request(app)
        .post('/api/create-user')
        .send({
          full_name: 123,
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(400);

      expect(response.body.error).toBe('All fields must be strings');
    });

    /**
     * Verifies that the endpoint rejects array values for full_name
     */
    test('should return 400 when full_name is an array', async () => {
      const response = await request(app)
        .post('/api/create-user')
        .send({
          full_name: ['John', 'Doe'],
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(400);

      expect(response.body.error).toBe('All fields must be strings');
    });

    /**
     * Verifies that the endpoint rejects object values for full_name
     */
    test('should return 400 when full_name is an object', async () => {
      const response = await request(app)
        .post('/api/create-user')
        .send({
          full_name: { first: 'John', last: 'Doe' },
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(400);

      expect(response.body.error).toBe('All fields must be strings');
    });

    /**
     * Verifies that the endpoint rejects boolean values for full_name
     */
    test('should return 400 when full_name is a boolean', async () => {
      const response = await request(app)
        .post('/api/create-user')
        .send({
          full_name: true,
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(400);

      expect(response.body.error).toBe('All fields must be strings');
    });

    /**
     * Verifies that the endpoint rejects null values for full_name
     */
    test('should return 400 when full_name is null', async () => {
      const response = await request(app)
        .post('/api/create-user')
        .send({
          full_name: null,
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(400);

      expect(response.body.error).toBe(
        'Missing required fields: full_name, email, password'
      );
    });
  });

  describe('Validation Tests - Empty Strings', () => {
    /**
     * Verifies that the endpoint rejects empty strings for full_name
     */
    test('should return 400 when full_name is empty string', async () => {
      const response = await request(app)
        .post('/api/create-user')
        .send({
          full_name: '',
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(400);

      expect(response.body.error).toBe('Fields cannot be empty strings');
    });

    /**
     * Verifies that the endpoint rejects empty strings for email
     */
    test('should return 400 when email is empty string', async () => {
      const response = await request(app)
        .post('/api/create-user')
        .send({
          full_name: 'John Doe',
          email: '',
          password: 'password123',
        })
        .expect(400);

      expect(response.body.error).toBe('Fields cannot be empty strings');
    });

    /**
     * Verifies that the endpoint rejects empty strings for password
     */
    test('should return 400 when password is empty string', async () => {
      const response = await request(app)
        .post('/api/create-user')
        .send({
          full_name: 'John Doe',
          email: 'test@example.com',
          password: '',
        })
        .expect(400);

      expect(response.body.error).toBe('Fields cannot be empty strings');
    });

    /**
     * Verifies that the endpoint rejects whitespace-only strings for full_name
     */
    test('should return 400 when full_name is only whitespace', async () => {
      const response = await request(app)
        .post('/api/create-user')
        .send({
          full_name: '   ',
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(400);

      expect(response.body.error).toBe('Fields cannot be empty strings');
    });

    /**
     * Verifies that the endpoint rejects whitespace-only strings for email
     */
    test('should return 400 when email is only whitespace', async () => {
      const response = await request(app)
        .post('/api/create-user')
        .send({
          full_name: 'John Doe',
          email: '   ',
          password: 'password123',
        })
        .expect(400);

      expect(response.body.error).toBe('Fields cannot be empty strings');
    });

    /**
     * Verifies that the endpoint rejects whitespace-only strings for password
     */
    test('should return 400 when password is only whitespace', async () => {
      const response = await request(app)
        .post('/api/create-user')
        .send({
          full_name: 'John Doe',
          email: 'test@example.com',
          password: '   ',
        })
        .expect(400);

      expect(response.body.error).toBe('Fields cannot be empty strings');
    });
  });

  describe('Success Cases', () => {
    /**
     * Verifies successful user creation with valid input data
     * and confirms the correct data is returned and passed to createUser
     */
    test('should create user successfully with valid data', async () => {
      const mockUser = {
        id: 'user-123',
        full_name_enc: 'encrypted_name',
        email_enc: 'encrypted_email',
      };

      (createUser as any).mockResolvedValue({
        data: [mockUser],
        error: null,
      });

      const response = await request(app)
        .post('/api/create-user')
        .send({
          full_name: 'John Doe',
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(201);

      expect(response.body.message).toBe('User created successfully');
      expect(response.body.data).toEqual([mockUser]);
      expect(createUser).toHaveBeenCalledWith(
        'John Doe',
        'test@example.com',
        'password123'
      );
    });

    /**
     * Verifies that the endpoint accepts input with surrounding whitespace
     * and passes it to createUser without trimming
     */
    test('should handle valid data with extra whitespace', async () => {
      const mockUser = {
        id: 'user-456',
        full_name_enc: 'encrypted_name',
        email_enc: 'encrypted_email',
      };

      (createUser as any).mockResolvedValue({
        data: [mockUser],
        error: null,
      });

      const response = await request(app)
        .post('/api/create-user')
        .send({
          full_name: '  John Doe  ',
          email: '  test@example.com  ',
          password: '  password123  ',
        })
        .expect(201);

      expect(response.body.message).toBe('User created successfully');
      expect(createUser).toHaveBeenCalledWith(
        '  John Doe  ',
        '  test@example.com  ',
        '  password123  '
      );
    });
  });

  describe('Error Cases from Database', () => {
    /**
     * Verifies that the endpoint returns a 409 error when the email
     * already exists (indicated by error code 'email_exists')
     */
    test('should return 409 when email already exists (code: email_exists)', async () => {
      (createUser as any).mockResolvedValue({
        data: null,
        error: { code: 'email_exists', message: 'Email already registered' },
      });

      const response = await request(app)
        .post('/api/create-user')
        .send({
          full_name: 'John Doe',
          email: 'existing@example.com',
          password: 'password123',
        })
        .expect(409);

      expect(response.body.error).toBe('This email is already registered');
    });

    /**
     * Verifies that the endpoint returns a 409 error when the email
     * already exists (indicated by status code 422)
     */
    test('should return 409 when email already exists (status: 422)', async () => {
      (createUser as any).mockResolvedValue({
        data: null,
        error: { status: 422, message: 'Email already registered' },
      });

      const response = await request(app)
        .post('/api/create-user')
        .send({
          full_name: 'John Doe',
          email: 'existing@example.com',
          password: 'password123',
        })
        .expect(409);

      expect(response.body.error).toBe('This email is already registered');
    });

    /**
     * Verifies that the endpoint returns a 400 error for general
     * database errors and includes the error message in the response
     */
    test('should return 400 for other database errors', async () => {
      (createUser as any).mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
      });

      const response = await request(app)
        .post('/api/create-user')
        .send({
          full_name: 'John Doe',
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(400);

      expect(response.body.error).toBe('Database connection failed');
    });

    /**
     * Verifies that the endpoint returns a 500 error when an unexpected
     * error occurs during user creation
     */
    test('should return 500 for unexpected errors', async () => {
      (createUser as any).mockRejectedValue(new Error('Unexpected error'));

      const response = await request(app)
        .post('/api/create-user')
        .send({
          full_name: 'John Doe',
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(500);

      expect(response.body.error).toBe('Internal server error');
    });
  });
});
