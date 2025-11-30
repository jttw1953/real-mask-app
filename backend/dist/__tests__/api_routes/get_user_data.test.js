import { jest } from '@jest/globals';
import { mockSupabaseApi } from '../helpers/mock_supabase_api.js';
await jest.unstable_mockModule('../../src/supabase_api/supabase_api.js', mockSupabaseApi);
const request = (await import('supertest')).default;
const { app } = await import('../../src/app.js');
const { getUserData } = await import('../../src/supabase_api/supabase_api.js');
const { supabase } = await import('../../src/supabase_api/supabase_api.js');
describe('GET /api/get-user-data', () => {
    const validAuthToken = 'Bearer valid-token-123';
    const mockUserId = 'user-123';
    beforeEach(() => {
        jest.clearAllMocks();
        supabase.auth.getUser.mockResolvedValue({
            data: { user: { id: mockUserId } },
            error: null,
        });
    });
    describe('Authentication Tests', () => {
        /**
         * Verifies that the endpoint returns 401 when no authorization header is provided
         */
        test('should return 401 when no authorization header provided', async () => {
            const response = await request(app).get('/api/get-user-data').expect(401);
            expect(response.body.error).toBe('Unauthorized');
            expect(getUserData).not.toHaveBeenCalled();
        });
        /**
         * Verifies that the endpoint returns 401 when an invalid token is provided
         */
        test('should return 401 when invalid token provided', async () => {
            supabase.auth.getUser.mockResolvedValue({
                data: { user: null },
                error: new Error('Invalid token'),
            });
            const response = await request(app)
                .get('/api/get-user-data')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);
            expect(response.body.error).toBe('Unauthorized');
            expect(getUserData).not.toHaveBeenCalled();
        });
        /**
         * Verifies that the endpoint returns 401 when token verification returns no user
         */
        test('should return 401 when token returns no user', async () => {
            supabase.auth.getUser.mockResolvedValue({
                data: { user: null },
                error: null,
            });
            const response = await request(app)
                .get('/api/get-user-data')
                .set('Authorization', validAuthToken)
                .expect(401);
            expect(response.body.error).toBe('Unauthorized');
            expect(getUserData).not.toHaveBeenCalled();
        });
        /**
         * Verifies that the endpoint returns 401 when token is expired
         */
        test('should return 401 when token is expired', async () => {
            supabase.auth.getUser.mockResolvedValue({
                data: { user: null },
                error: new Error('Token expired'),
            });
            const response = await request(app)
                .get('/api/get-user-data')
                .set('Authorization', 'Bearer expired-token')
                .expect(401);
            expect(response.body.error).toBe('Unauthorized');
        });
        /**
         * Verifies that the endpoint returns 401 with malformed Bearer token
         */
        test('should return 401 with malformed Bearer token', async () => {
            supabase.auth.getUser.mockResolvedValue({
                data: { user: null },
                error: new Error('Malformed token'),
            });
            const response = await request(app)
                .get('/api/get-user-data')
                .set('Authorization', 'Bearer ')
                .expect(401);
            expect(response.body.error).toBe('Unauthorized');
        });
        /**
         * Verifies that the endpoint returns 401 when Authorization header is empty
         */
        test('should return 401 when Authorization header is empty string', async () => {
            const response = await request(app)
                .get('/api/get-user-data')
                .set('Authorization', '')
                .expect(401);
            expect(response.body.error).toBe('Unauthorized');
        });
    });
    describe('Success Cases - Complete User Data', () => {
        /**
         * Verifies successful retrieval of complete user data
         */
        test('should retrieve complete user data successfully', async () => {
            const mockUserData = {
                id: mockUserId,
                email: 'user@example.com',
                full_name: 'John Doe',
                created_at: '2025-01-01T00:00:00Z',
                updated_at: '2025-01-15T00:00:00Z',
                profile_picture_url: 'https://example.com/profile.jpg',
                bio: 'Software Developer',
                phone_number: '+1234567890',
                location: 'New York, NY',
            };
            getUserData.mockResolvedValue({
                data: mockUserData,
                error: null,
            });
            const response = await request(app)
                .get('/api/get-user-data')
                .set('Authorization', validAuthToken)
                .expect(200);
            expect(response.body.message).toBe('User data retrieved successfully');
            expect(response.body.userData).toEqual(mockUserData);
            expect(getUserData).toHaveBeenCalledWith(mockUserId);
            expect(getUserData).toHaveBeenCalledTimes(1);
        });
        /**
         * Verifies successful retrieval with minimal user data
         */
        test('should retrieve minimal user data successfully', async () => {
            const mockUserData = {
                id: mockUserId,
                email: 'user@example.com',
                full_name: 'John Doe',
            };
            getUserData.mockResolvedValue({
                data: mockUserData,
                error: null,
            });
            const response = await request(app)
                .get('/api/get-user-data')
                .set('Authorization', validAuthToken)
                .expect(200);
            expect(response.body.message).toBe('User data retrieved successfully');
            expect(response.body.userData).toEqual(mockUserData);
        });
        /**
         * Verifies that user data with all fields null/undefined is handled
         */
        test('should handle user data with null optional fields', async () => {
            const mockUserData = {
                id: mockUserId,
                email: 'user@example.com',
                full_name: 'John Doe',
                profile_picture_url: null,
                bio: null,
                phone_number: null,
                location: null,
            };
            getUserData.mockResolvedValue({
                data: mockUserData,
                error: null,
            });
            const response = await request(app)
                .get('/api/get-user-data')
                .set('Authorization', validAuthToken)
                .expect(200);
            expect(response.body.userData.profile_picture_url).toBeNull();
            expect(response.body.userData.bio).toBeNull();
            expect(response.body.userData.phone_number).toBeNull();
            expect(response.body.userData.location).toBeNull();
        });
    });
    describe('Success Cases - User Data Variations', () => {
        /**
         * Verifies handling of user with very long name
         */
        test('should handle user with very long full name', async () => {
            const longName = 'A'.repeat(500);
            const mockUserData = {
                id: mockUserId,
                email: 'user@example.com',
                full_name: longName,
            };
            getUserData.mockResolvedValue({
                data: mockUserData,
                error: null,
            });
            const response = await request(app)
                .get('/api/get-user-data')
                .set('Authorization', validAuthToken)
                .expect(200);
            expect(response.body.userData.full_name).toBe(longName);
            expect(response.body.userData.full_name.length).toBe(500);
        });
        /**
         * Verifies handling of user with special characters in name
         */
        test('should handle user with special characters in name', async () => {
            const mockUserData = {
                id: mockUserId,
                email: 'user@example.com',
                full_name: "John O'Brien-Smith Jr. (PhD)",
            };
            getUserData.mockResolvedValue({
                data: mockUserData,
                error: null,
            });
            const response = await request(app)
                .get('/api/get-user-data')
                .set('Authorization', validAuthToken)
                .expect(200);
            expect(response.body.userData.full_name).toBe("John O'Brien-Smith Jr. (PhD)");
        });
        /**
         * Verifies handling of user with Unicode characters in name
         */
        test('should handle user with Unicode characters in name', async () => {
            const mockUserData = {
                id: mockUserId,
                email: 'user@example.com',
                full_name: '张伟 José García Müller 🎉',
            };
            getUserData.mockResolvedValue({
                data: mockUserData,
                error: null,
            });
            const response = await request(app)
                .get('/api/get-user-data')
                .set('Authorization', validAuthToken)
                .expect(200);
            expect(response.body.userData.full_name).toBe('张伟 José García Müller 🎉');
        });
        /**
         * Verifies handling of various email formats
         */
        test('should handle various valid email formats', async () => {
            const emailFormats = [
                'simple@example.com',
                'user.name+tag@example.co.uk',
                'user_123@sub.domain.example.com',
                'user@123.456.789.012',
            ];
            for (const email of emailFormats) {
                jest.clearAllMocks();
                const mockUserData = {
                    id: mockUserId,
                    email: email,
                    full_name: 'Test User',
                };
                getUserData.mockResolvedValue({
                    data: mockUserData,
                    error: null,
                });
                const response = await request(app)
                    .get('/api/get-user-data')
                    .set('Authorization', validAuthToken)
                    .expect(200);
                expect(response.body.userData.email).toBe(email);
            }
        });
        /**
         * Verifies handling of user with very long bio
         */
        test('should handle user with very long bio', async () => {
            const longBio = 'A'.repeat(5000);
            const mockUserData = {
                id: mockUserId,
                email: 'user@example.com',
                full_name: 'John Doe',
                bio: longBio,
            };
            getUserData.mockResolvedValue({
                data: mockUserData,
                error: null,
            });
            const response = await request(app)
                .get('/api/get-user-data')
                .set('Authorization', validAuthToken)
                .expect(200);
            expect(response.body.userData.bio).toBe(longBio);
            expect(response.body.userData.bio.length).toBe(5000);
        });
        /**
         * Verifies handling of various phone number formats
         */
        test('should handle various phone number formats', async () => {
            const phoneFormats = [
                '+1234567890',
                '+1-234-567-8900',
                '(123) 456-7890',
                '+44 20 1234 5678',
                '+81-3-1234-5678',
            ];
            for (const phone of phoneFormats) {
                jest.clearAllMocks();
                const mockUserData = {
                    id: mockUserId,
                    email: 'user@example.com',
                    full_name: 'Test User',
                    phone_number: phone,
                };
                getUserData.mockResolvedValue({
                    data: mockUserData,
                    error: null,
                });
                const response = await request(app)
                    .get('/api/get-user-data')
                    .set('Authorization', validAuthToken)
                    .expect(200);
                expect(response.body.userData.phone_number).toBe(phone);
            }
        });
        /**
         * Verifies handling of user with URL in profile picture
         */
        test('should handle various profile picture URL formats', async () => {
            const urlFormats = [
                'https://example.com/profile.jpg',
                'http://example.com/images/user/123.png',
                'https://cdn.example.com/avatars/user-abc-123.webp',
                'https://example.com/path/to/image.jpg?size=large&format=webp',
            ];
            for (const url of urlFormats) {
                jest.clearAllMocks();
                const mockUserData = {
                    id: mockUserId,
                    email: 'user@example.com',
                    full_name: 'Test User',
                    profile_picture_url: url,
                };
                getUserData.mockResolvedValue({
                    data: mockUserData,
                    error: null,
                });
                const response = await request(app)
                    .get('/api/get-user-data')
                    .set('Authorization', validAuthToken)
                    .expect(200);
                expect(response.body.userData.profile_picture_url).toBe(url);
            }
        });
        /**
         * Verifies handling of user with empty string fields
         */
        test('should handle user data with empty string fields', async () => {
            const mockUserData = {
                id: mockUserId,
                email: 'user@example.com',
                full_name: 'John Doe',
                bio: '',
                phone_number: '',
                location: '',
            };
            getUserData.mockResolvedValue({
                data: mockUserData,
                error: null,
            });
            const response = await request(app)
                .get('/api/get-user-data')
                .set('Authorization', validAuthToken)
                .expect(200);
            expect(response.body.userData.bio).toBe('');
            expect(response.body.userData.phone_number).toBe('');
            expect(response.body.userData.location).toBe('');
        });
        /**
         * Verifies handling of user with whitespace-only fields
         */
        test('should handle user data with whitespace-only fields', async () => {
            const mockUserData = {
                id: mockUserId,
                email: 'user@example.com',
                full_name: '   John Doe   ',
                bio: '   ',
                location: '\t\n',
            };
            getUserData.mockResolvedValue({
                data: mockUserData,
                error: null,
            });
            const response = await request(app)
                .get('/api/get-user-data')
                .set('Authorization', validAuthToken)
                .expect(200);
            expect(response.body.userData.full_name).toBe('   John Doe   ');
            expect(response.body.userData.bio).toBe('   ');
            expect(response.body.userData.location).toBe('\t\n');
        });
        /**
         * Verifies handling of user with HTML/script content in fields
         */
        test('should handle user data with HTML/script content', async () => {
            const mockUserData = {
                id: mockUserId,
                email: 'user@example.com',
                full_name: '<script>alert("XSS")</script>',
                bio: '<b>Bold text</b> and <i>italic</i>',
                location: '<img src="x" onerror="alert(1)">',
            };
            getUserData.mockResolvedValue({
                data: mockUserData,
                error: null,
            });
            const response = await request(app)
                .get('/api/get-user-data')
                .set('Authorization', validAuthToken)
                .expect(200);
            // Should return as-is without modification or sanitization
            expect(response.body.userData.full_name).toBe('<script>alert("XSS")</script>');
            expect(response.body.userData.bio).toBe('<b>Bold text</b> and <i>italic</i>');
        });
    });
    describe('Success Cases - Timestamp Handling', () => {
        /**
         * Verifies handling of various timestamp formats
         */
        test('should handle various ISO timestamp formats', async () => {
            const mockUserData = {
                id: mockUserId,
                email: 'user@example.com',
                full_name: 'John Doe',
                created_at: '2025-01-01T00:00:00Z',
                updated_at: '2025-01-15T12:30:45.123Z',
            };
            getUserData.mockResolvedValue({
                data: mockUserData,
                error: null,
            });
            const response = await request(app)
                .get('/api/get-user-data')
                .set('Authorization', validAuthToken)
                .expect(200);
            expect(response.body.userData.created_at).toBe('2025-01-01T00:00:00Z');
            expect(response.body.userData.updated_at).toBe('2025-01-15T12:30:45.123Z');
        });
        /**
         * Verifies handling of timestamps with timezone offsets
         */
        test('should handle timestamps with timezone offsets', async () => {
            const mockUserData = {
                id: mockUserId,
                email: 'user@example.com',
                full_name: 'John Doe',
                created_at: '2025-01-01T00:00:00-08:00',
                updated_at: '2025-01-15T12:30:45+05:30',
            };
            getUserData.mockResolvedValue({
                data: mockUserData,
                error: null,
            });
            const response = await request(app)
                .get('/api/get-user-data')
                .set('Authorization', validAuthToken)
                .expect(200);
            expect(response.body.userData.created_at).toBe('2025-01-01T00:00:00-08:00');
            expect(response.body.userData.updated_at).toBe('2025-01-15T12:30:45+05:30');
        });
    });
    describe('Success Cases - Null and Undefined Data', () => {
        /**
         * Verifies handling when getUserData returns null data
         */
        test('should handle null user data', async () => {
            getUserData.mockResolvedValue({
                data: null,
                error: null,
            });
            const response = await request(app)
                .get('/api/get-user-data')
                .set('Authorization', validAuthToken)
                .expect(200);
            expect(response.body.message).toBe('User data retrieved successfully');
            expect(response.body.userData).toBeNull();
        });
        /**
         * Verifies handling when getUserData returns undefined data
         */
        test('should handle undefined user data', async () => {
            getUserData.mockResolvedValue({
                data: undefined,
                error: null,
            });
            const response = await request(app)
                .get('/api/get-user-data')
                .set('Authorization', validAuthToken)
                .expect(200);
            expect(response.body.message).toBe('User data retrieved successfully');
            expect(response.body.userData).toBeUndefined();
        });
        /**
         * Verifies handling when user data has missing required fields
         */
        test('should handle user data with missing required fields', async () => {
            const mockUserData = {
                id: mockUserId,
                // Missing email and full_name
            };
            getUserData.mockResolvedValue({
                data: mockUserData,
                error: null,
            });
            const response = await request(app)
                .get('/api/get-user-data')
                .set('Authorization', validAuthToken)
                .expect(200);
            expect(response.body.userData.id).toBe(mockUserId);
            expect(response.body.userData.email).toBeUndefined();
            expect(response.body.userData.full_name).toBeUndefined();
        });
    });
    describe('Success Cases - Extra Fields', () => {
        /**
         * Verifies that extra fields in user data are preserved
         */
        test('should preserve extra fields in user data', async () => {
            const mockUserData = {
                id: mockUserId,
                email: 'user@example.com',
                full_name: 'John Doe',
                custom_field_1: 'value1',
                custom_field_2: 12345,
                custom_field_3: { nested: 'object' },
                custom_array: [1, 2, 3],
            };
            getUserData.mockResolvedValue({
                data: mockUserData,
                error: null,
            });
            const response = await request(app)
                .get('/api/get-user-data')
                .set('Authorization', validAuthToken)
                .expect(200);
            expect(response.body.userData).toEqual(mockUserData);
            expect(response.body.userData.custom_field_1).toBe('value1');
            expect(response.body.userData.custom_field_2).toBe(12345);
            expect(response.body.userData.custom_field_3).toEqual({
                nested: 'object',
            });
            expect(response.body.userData.custom_array).toEqual([1, 2, 3]);
        });
        /**
         * Verifies handling of nested objects in user data
         */
        test('should handle nested objects in user data', async () => {
            const mockUserData = {
                id: mockUserId,
                email: 'user@example.com',
                full_name: 'John Doe',
                preferences: {
                    theme: 'dark',
                    notifications: {
                        email: true,
                        push: false,
                        sms: true,
                    },
                    privacy: {
                        profile_visible: true,
                        show_email: false,
                    },
                },
            };
            getUserData.mockResolvedValue({
                data: mockUserData,
                error: null,
            });
            const response = await request(app)
                .get('/api/get-user-data')
                .set('Authorization', validAuthToken)
                .expect(200);
            expect(response.body.userData.preferences).toEqual(mockUserData.preferences);
            expect(response.body.userData.preferences.theme).toBe('dark');
            expect(response.body.userData.preferences.notifications.email).toBe(true);
        });
    });
    describe('Error Cases from Database', () => {
        /**
         * Verifies that database errors are properly handled and returned
         */
        test('should return 400 for database errors', async () => {
            getUserData.mockResolvedValue({
                data: null,
                error: { message: 'Database connection failed' },
            });
            const response = await request(app)
                .get('/api/get-user-data')
                .set('Authorization', validAuthToken)
                .expect(400);
            expect(response.body.error).toBe('Database connection failed');
        });
        /**
         * Verifies handling of user not found error
         */
        test('should return 400 when user not found', async () => {
            getUserData.mockResolvedValue({
                data: null,
                error: { message: 'User not found' },
            });
            const response = await request(app)
                .get('/api/get-user-data')
                .set('Authorization', validAuthToken)
                .expect(400);
            expect(response.body.error).toBe('User not found');
        });
        /**
         * Verifies that query timeout errors are handled
         */
        test('should return 400 for query timeout errors', async () => {
            getUserData.mockResolvedValue({
                data: null,
                error: { message: 'Query timeout exceeded' },
            });
            const response = await request(app)
                .get('/api/get-user-data')
                .set('Authorization', validAuthToken)
                .expect(400);
            expect(response.body.error).toBe('Query timeout exceeded');
        });
        /**
         * Verifies that the endpoint returns 500 for unexpected errors
         */
        test('should return 500 for unexpected errors', async () => {
            getUserData.mockRejectedValue(new Error('Unexpected database error'));
            const response = await request(app)
                .get('/api/get-user-data')
                .set('Authorization', validAuthToken)
                .expect(500);
            expect(response.body.error).toBe('Internal server error');
        });
        /**
         * Verifies that network errors during database operations are handled
         */
        test('should return 500 when network error occurs', async () => {
            getUserData.mockRejectedValue(new Error('Network timeout'));
            const response = await request(app)
                .get('/api/get-user-data')
                .set('Authorization', validAuthToken)
                .expect(500);
            expect(response.body.error).toBe('Internal server error');
        });
        /**
         * Verifies handling of permission errors
         */
        test('should return 400 for permission errors', async () => {
            getUserData.mockResolvedValue({
                data: null,
                error: { message: 'Permission denied' },
            });
            const response = await request(app)
                .get('/api/get-user-data')
                .set('Authorization', validAuthToken)
                .expect(400);
            expect(response.body.error).toBe('Permission denied');
        });
        /**
         * Verifies handling of database constraint errors
         */
        test('should return 400 for constraint errors', async () => {
            getUserData.mockResolvedValue({
                data: null,
                error: { message: 'Constraint violation' },
            });
            const response = await request(app)
                .get('/api/get-user-data')
                .set('Authorization', validAuthToken)
                .expect(400);
            expect(response.body.error).toBe('Constraint violation');
        });
        /**
         * Verifies handling of null pointer errors
         */
        test('should return 500 for null pointer errors', async () => {
            getUserData.mockRejectedValue(new Error('Cannot read property of null'));
            const response = await request(app)
                .get('/api/get-user-data')
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
            getUserData.mockResolvedValue({
                data: { id: mockUserId, email: 'user@example.com', full_name: 'John' },
                error: null,
            });
            const response = await request(app)
                .get('/api/get-user-data')
                .set('Authorization', 'Bearer valid-token-123')
                .expect(200);
            expect(response.body.message).toBe('User data retrieved successfully');
            expect(supabase.auth.getUser).toHaveBeenCalledWith('valid-token-123');
        });
        /**
         * Verifies that the endpoint strips Bearer prefix correctly
         */
        test('should strip Bearer prefix from token', async () => {
            getUserData.mockResolvedValue({
                data: { id: mockUserId, email: 'user@example.com', full_name: 'John' },
                error: null,
            });
            await request(app)
                .get('/api/get-user-data')
                .set('Authorization', 'Bearer my-token-456')
                .expect(200);
            expect(supabase.auth.getUser).toHaveBeenCalledWith('my-token-456');
        });
        /**
         * Verifies that different tokens return different user data
         */
        test('should return data for correct user based on token', async () => {
            const customUserId = 'custom-user-456';
            supabase.auth.getUser.mockResolvedValue({
                data: { user: { id: customUserId } },
                error: null,
            });
            getUserData.mockResolvedValue({
                data: { id: customUserId, email: 'custom@example.com' },
                error: null,
            });
            await request(app)
                .get('/api/get-user-data')
                .set('Authorization', validAuthToken)
                .expect(200);
            expect(getUserData).toHaveBeenCalledWith(customUserId);
        });
        /**
         * Verifies that very long tokens are handled
         */
        test('should handle very long authorization tokens', async () => {
            const longToken = 'a'.repeat(1000);
            getUserData.mockResolvedValue({
                data: { id: mockUserId, email: 'user@example.com', full_name: 'John' },
                error: null,
            });
            await request(app)
                .get('/api/get-user-data')
                .set('Authorization', `Bearer ${longToken}`)
                .expect(200);
            expect(supabase.auth.getUser).toHaveBeenCalledWith(longToken);
        });
    });
    describe('Edge Cases', () => {
        /**
         * Verifies that getUserData is not called on authentication failure
         */
        test('should not call getUserData on authentication failure', async () => {
            supabase.auth.getUser.mockResolvedValue({
                data: { user: null },
                error: new Error('Invalid token'),
            });
            await request(app)
                .get('/api/get-user-data')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);
            expect(getUserData).not.toHaveBeenCalled();
        });
        /**
         * Verifies that the endpoint handles concurrent requests correctly
         */
        test('should handle concurrent requests correctly', async () => {
            getUserData.mockResolvedValue({
                data: { id: mockUserId, email: 'user@example.com', full_name: 'John' },
                error: null,
            });
            const requests = [
                request(app)
                    .get('/api/get-user-data')
                    .set('Authorization', validAuthToken),
                request(app)
                    .get('/api/get-user-data')
                    .set('Authorization', validAuthToken),
                request(app)
                    .get('/api/get-user-data')
                    .set('Authorization', validAuthToken),
            ];
            const responses = await Promise.all(requests);
            responses.forEach((response) => {
                expect(response.status).toBe(200);
                expect(response.body.message).toBe('User data retrieved successfully');
            });
            expect(getUserData).toHaveBeenCalledTimes(3);
        });
        /**
         * Verifies that the endpoint is called with exactly one parameter
         */
        test('should call getUserData with only userId', async () => {
            getUserData.mockResolvedValue({
                data: { id: mockUserId, email: 'user@example.com', full_name: 'John' },
                error: null,
            });
            await request(app)
                .get('/api/get-user-data')
                .set('Authorization', validAuthToken)
                .expect(200);
            expect(getUserData).toHaveBeenCalledWith(mockUserId);
            expect(getUserData).toHaveBeenCalledTimes(1);
            expect(getUserData.mock.calls[0]).toHaveLength(1);
        });
        /**
         * Verifies that response structure is consistent
         */
        test('should have consistent response structure', async () => {
            getUserData.mockResolvedValue({
                data: { id: mockUserId, email: 'user@example.com', full_name: 'John' },
                error: null,
            });
            const response = await request(app)
                .get('/api/get-user-data')
                .set('Authorization', validAuthToken)
                .expect(200);
            expect(response.body).toHaveProperty('message');
            expect(response.body).toHaveProperty('userData');
            expect(Object.keys(response.body)).toEqual(['message', 'userData']);
        });
        /**
         * Verifies that multiple calls return consistent results for same user
         */
        test('should return consistent results for same user', async () => {
            const mockUserData = {
                id: mockUserId,
                email: 'user@example.com',
                full_name: 'John Doe',
            };
            getUserData.mockResolvedValue({
                data: mockUserData,
                error: null,
            });
            const response1 = await request(app)
                .get('/api/get-user-data')
                .set('Authorization', validAuthToken)
                .expect(200);
            const response2 = await request(app)
                .get('/api/get-user-data')
                .set('Authorization', validAuthToken)
                .expect(200);
            expect(response1.body.userData).toEqual(response2.body.userData);
        });
        /**
         * Verifies handling of extremely large user data objects
         */
        test('should handle extremely large user data objects', async () => {
            const largeData = {
                id: mockUserId,
                email: 'user@example.com',
                full_name: 'John Doe',
                large_field: 'A'.repeat(100000), // 100KB of data
            };
            getUserData.mockResolvedValue({
                data: largeData,
                error: null,
            });
            const response = await request(app)
                .get('/api/get-user-data')
                .set('Authorization', validAuthToken)
                .expect(200);
            expect(response.body.userData.large_field.length).toBe(100000);
        });
    });
    describe('Response Format Tests', () => {
        /**
         * Verifies that success response has correct structure
         */
        test('should return correct response structure on success', async () => {
            const mockUserData = {
                id: mockUserId,
                email: 'user@example.com',
                full_name: 'John Doe',
            };
            getUserData.mockResolvedValue({
                data: mockUserData,
                error: null,
            });
            const response = await request(app)
                .get('/api/get-user-data')
                .set('Authorization', validAuthToken)
                .expect(200);
            expect(response.body).toHaveProperty('message');
            expect(response.body).toHaveProperty('userData');
            expect(response.body.message).toBe('User data retrieved successfully');
            expect(response.body.userData).toEqual(mockUserData);
        });
        /**
         * Verifies that error response has correct structure
         */
        test('should return correct response structure on error', async () => {
            getUserData.mockResolvedValue({
                data: null,
                error: { message: 'Some error message' },
            });
            const response = await request(app)
                .get('/api/get-user-data')
                .set('Authorization', validAuthToken)
                .expect(400);
            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toBe('Some error message');
            expect(response.body).not.toHaveProperty('message');
            expect(response.body).not.toHaveProperty('userData');
        });
        /**
         * Verifies that authentication error response has correct structure
         */
        test('should return correct response structure on auth error', async () => {
            const response = await request(app).get('/api/get-user-data').expect(401);
            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toBe('Unauthorized');
            expect(Object.keys(response.body)).toEqual(['error']);
        });
        /**
         * Verifies that userData property is always present in successful responses
         */
        test('should always include userData property in success response', async () => {
            getUserData.mockResolvedValue({
                data: null,
                error: null,
            });
            const response = await request(app)
                .get('/api/get-user-data')
                .set('Authorization', validAuthToken)
                .expect(200);
            expect(response.body).toHaveProperty('userData');
            expect(response.body.userData).toBeNull();
        });
    });
    describe('Data Integrity Tests', () => {
        /**
         * Verifies that user data is not modified by the endpoint
         */
        test('should not modify user data', async () => {
            const mockUserData = {
                id: mockUserId,
                email: 'user@example.com',
                full_name: 'John Doe',
                extra_field: 'should be preserved',
                nested: {
                    value: 'also preserved',
                },
            };
            getUserData.mockResolvedValue({
                data: mockUserData,
                error: null,
            });
            const response = await request(app)
                .get('/api/get-user-data')
                .set('Authorization', validAuthToken)
                .expect(200);
            expect(response.body.userData).toEqual(mockUserData);
            expect(response.body.userData.extra_field).toBe('should be preserved');
            expect(response.body.userData.nested.value).toBe('also preserved');
        });
        /**
         * Verifies that the endpoint passes the exact userId to getUserData
         */
        test('should pass exact user ID to getUserData', async () => {
            getUserData.mockResolvedValue({
                data: { id: mockUserId },
                error: null,
            });
            await request(app)
                .get('/api/get-user-data')
                .set('Authorization', validAuthToken)
                .expect(200);
            expect(getUserData).toHaveBeenCalledWith(mockUserId);
        });
        /**
         * Verifies that user data with boolean values is preserved
         */
        test('should preserve boolean values in user data', async () => {
            const mockUserData = {
                id: mockUserId,
                email: 'user@example.com',
                full_name: 'John Doe',
                email_verified: true,
                phone_verified: false,
                is_active: true,
            };
            getUserData.mockResolvedValue({
                data: mockUserData,
                error: null,
            });
            const response = await request(app)
                .get('/api/get-user-data')
                .set('Authorization', validAuthToken)
                .expect(200);
            expect(response.body.userData.email_verified).toBe(true);
            expect(response.body.userData.phone_verified).toBe(false);
            expect(response.body.userData.is_active).toBe(true);
        });
        /**
         * Verifies that user data with numeric values is preserved
         */
        test('should preserve numeric values in user data', async () => {
            const mockUserData = {
                id: mockUserId,
                email: 'user@example.com',
                full_name: 'John Doe',
                age: 30,
                account_balance: 1234.56,
                login_count: 0,
                rating: -5,
            };
            getUserData.mockResolvedValue({
                data: mockUserData,
                error: null,
            });
            const response = await request(app)
                .get('/api/get-user-data')
                .set('Authorization', validAuthToken)
                .expect(200);
            expect(response.body.userData.age).toBe(30);
            expect(response.body.userData.account_balance).toBe(1234.56);
            expect(response.body.userData.login_count).toBe(0);
            expect(response.body.userData.rating).toBe(-5);
        });
    });
    describe('HTTP Method Tests', () => {
        /**
         * Verifies that POST method is not allowed
         */
        test('should not allow POST method', async () => {
            const response = await request(app)
                .post('/api/get-user-data')
                .set('Authorization', validAuthToken)
                .expect(404);
            expect(response.body.error).toBe('Not found');
        });
        /**
         * Verifies that PUT method is not allowed
         */
        test('should not allow PUT method', async () => {
            const response = await request(app)
                .put('/api/get-user-data')
                .set('Authorization', validAuthToken)
                .expect(404);
            expect(response.body.error).toBe('Not found');
        });
        /**
         * Verifies that DELETE method is not allowed
         */
        test('should not allow DELETE method', async () => {
            const response = await request(app)
                .delete('/api/get-user-data')
                .set('Authorization', validAuthToken)
                .expect(404);
            expect(response.body.error).toBe('Not found');
        });
        /**
         * Verifies that PATCH method is not allowed
         */
        test('should not allow PATCH method', async () => {
            const response = await request(app)
                .patch('/api/get-user-data')
                .set('Authorization', validAuthToken)
                .expect(404);
            expect(response.body.error).toBe('Not found');
        });
        /**
         * Verifies that OPTIONS method returns correct CORS headers
         */
        test('should handle OPTIONS request for CORS', async () => {
            const response = await request(app)
                .options('/api/get-user-data')
                .expect(200);
            expect(response.headers['access-control-allow-origin']).toBe('*');
            expect(response.headers['access-control-allow-methods']).toContain('GET');
        });
    });
});
//# sourceMappingURL=get_user_data.test.js.map