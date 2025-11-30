// tests for jira ticket CCP-145 - created by: Matthew Mirza
// CCP-146 - approved by:
import { jest } from '@jest/globals';
import { mockSupabaseApi } from '../helpers/mock_supabase_api.js';
await jest.unstable_mockModule('../../src/supabase_api/supabase_api.js', mockSupabaseApi);
const request = (await import('supertest')).default;
const { app } = await import('../../src/app.js');
const { scheduleMeeting } = await import('../../src/supabase_api/supabase_api.js');
const { supabase } = await import('../../src/supabase_api/supabase_api.js');
describe('POST /api/schedule-meeting', () => {
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
            const response = await request(app)
                .post('/api/schedule-meeting')
                .send({
                meeting_code: 'ABC123',
                meeting_time: '2025-12-01T10:00:00Z',
                meeting_title: 'Team Meeting',
            })
                .expect(401);
            expect(response.body.error).toBe('Unauthorized');
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
                .post('/api/schedule-meeting')
                .set('Authorization', 'Bearer invalid-token')
                .send({
                meeting_code: 'ABC123',
                meeting_time: '2025-12-01T10:00:00Z',
                meeting_title: 'Team Meeting',
            })
                .expect(401);
            expect(response.body.error).toBe('Unauthorized');
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
                .post('/api/schedule-meeting')
                .set('Authorization', validAuthToken)
                .send({
                meeting_code: 'ABC123',
                meeting_time: '2025-12-01T10:00:00Z',
                meeting_title: 'Team Meeting',
            })
                .expect(401);
            expect(response.body.error).toBe('Unauthorized');
        });
    });
    describe('Validation Tests - Missing Fields', () => {
        /**
         * Verifies that the endpoint returns 400 when all required fields are missing
         */
        test('should return 400 when missing all fields', async () => {
            const response = await request(app)
                .post('/api/schedule-meeting')
                .set('Authorization', validAuthToken)
                .send({})
                .expect(400);
            expect(response.body.error).toBe('Missing required fields: meeting_code, meeting_time');
        });
        /**
         * Verifies that the endpoint returns 400 when meeting_code is missing
         */
        test('should return 400 when missing meeting_code', async () => {
            const response = await request(app)
                .post('/api/schedule-meeting')
                .set('Authorization', validAuthToken)
                .send({
                meeting_time: '2025-12-01T10:00:00Z',
                meeting_title: 'Team Meeting',
            })
                .expect(400);
            expect(response.body.error).toBe('Missing required fields: meeting_code, meeting_time');
        });
        /**
         * Verifies that the endpoint returns 400 when meeting_time is missing
         */
        test('should return 400 when missing meeting_time', async () => {
            const response = await request(app)
                .post('/api/schedule-meeting')
                .set('Authorization', validAuthToken)
                .send({
                meeting_code: 'ABC123',
                meeting_title: 'Team Meeting',
            })
                .expect(400);
            expect(response.body.error).toBe('Missing required fields: meeting_code, meeting_time');
        });
        /**
         * Verifies that the endpoint accepts requests without meeting_title
         * since it's an optional field
         */
        test('should accept request without meeting_title (optional field)', async () => {
            scheduleMeeting.mockResolvedValue({
                data: { id: 1 },
                error: null,
            });
            const response = await request(app)
                .post('/api/schedule-meeting')
                .set('Authorization', validAuthToken)
                .send({
                meeting_code: 'ABC123',
                meeting_time: '2025-12-01T10:00:00Z',
            })
                .expect(201);
            expect(response.body.message).toBe('Meeting scheduled successfully');
        });
    });
    describe('Validation Tests - Type Checking', () => {
        /**
         * Verifies that the endpoint rejects numeric values for meeting_code
         */
        test('should return 400 when meeting_code is a number', async () => {
            const response = await request(app)
                .post('/api/schedule-meeting')
                .set('Authorization', validAuthToken)
                .send({
                meeting_code: 123456,
                meeting_time: '2025-12-01T10:00:00Z',
                meeting_title: 'Team Meeting',
            })
                .expect(400);
            expect(response.body.error).toBe('All fields must be strings');
        });
        /**
         * Verifies that the endpoint rejects array values for meeting_code
         */
        test('should return 400 when meeting_code is an array', async () => {
            const response = await request(app)
                .post('/api/schedule-meeting')
                .set('Authorization', validAuthToken)
                .send({
                meeting_code: ['ABC', '123'],
                meeting_time: '2025-12-01T10:00:00Z',
                meeting_title: 'Team Meeting',
            })
                .expect(400);
            expect(response.body.error).toBe('All fields must be strings');
        });
        /**
         * Verifies that the endpoint rejects object values for meeting_code
         */
        test('should return 400 when meeting_code is an object', async () => {
            const response = await request(app)
                .post('/api/schedule-meeting')
                .set('Authorization', validAuthToken)
                .send({
                meeting_code: { code: 'ABC123' },
                meeting_time: '2025-12-01T10:00:00Z',
                meeting_title: 'Team Meeting',
            })
                .expect(400);
            expect(response.body.error).toBe('All fields must be strings');
        });
        /**
         * Verifies that the endpoint rejects boolean values for meeting_code
         */
        test('should return 400 when meeting_code is a boolean', async () => {
            const response = await request(app)
                .post('/api/schedule-meeting')
                .set('Authorization', validAuthToken)
                .send({
                meeting_code: true,
                meeting_time: '2025-12-01T10:00:00Z',
                meeting_title: 'Team Meeting',
            })
                .expect(400);
            expect(response.body.error).toBe('All fields must be strings');
        });
        /**
         * Verifies that the endpoint rejects numeric values for meeting_time
         */
        test('should return 400 when meeting_time is a number', async () => {
            const response = await request(app)
                .post('/api/schedule-meeting')
                .set('Authorization', validAuthToken)
                .send({
                meeting_code: 'ABC123',
                meeting_time: 1234567890,
                meeting_title: 'Team Meeting',
            })
                .expect(400);
            expect(response.body.error).toBe('All fields must be strings');
        });
        /**
         * Verifies that the endpoint rejects array values for meeting_time
         */
        test('should return 400 when meeting_time is an array', async () => {
            const response = await request(app)
                .post('/api/schedule-meeting')
                .set('Authorization', validAuthToken)
                .send({
                meeting_code: 'ABC123',
                meeting_time: ['2025-12-01', '10:00:00'],
                meeting_title: 'Team Meeting',
            })
                .expect(400);
            expect(response.body.error).toBe('All fields must be strings');
        });
        /**
         * Verifies that the endpoint rejects object values for meeting_time
         */
        test('should return 400 when meeting_time is an object', async () => {
            const response = await request(app)
                .post('/api/schedule-meeting')
                .set('Authorization', validAuthToken)
                .send({
                meeting_code: 'ABC123',
                meeting_time: { date: '2025-12-01', time: '10:00:00' },
                meeting_title: 'Team Meeting',
            })
                .expect(400);
            expect(response.body.error).toBe('All fields must be strings');
        });
        /**
         * Verifies that the endpoint rejects boolean values for meeting_time
         */
        test('should return 400 when meeting_time is a boolean', async () => {
            const response = await request(app)
                .post('/api/schedule-meeting')
                .set('Authorization', validAuthToken)
                .send({
                meeting_code: 'ABC123',
                meeting_time: false,
                meeting_title: 'Team Meeting',
            })
                .expect(400);
            expect(response.body.error).toBe('All fields must be strings');
        });
    });
    describe('Validation Tests - Empty Strings', () => {
        /**
         * Verifies that the endpoint rejects empty strings for meeting_code
         */
        test('should return 400 when meeting_code is empty string', async () => {
            const response = await request(app)
                .post('/api/schedule-meeting')
                .set('Authorization', validAuthToken)
                .send({
                meeting_code: '',
                meeting_time: '2025-12-01T10:00:00Z',
                meeting_title: 'Team Meeting',
            })
                .expect(400);
            expect(response.body.error).toBe('Fields cannot be empty strings');
        });
        /**
         * Verifies that the endpoint rejects empty strings for meeting_time
         */
        test('should return 400 when meeting_time is empty string', async () => {
            const response = await request(app)
                .post('/api/schedule-meeting')
                .set('Authorization', validAuthToken)
                .send({
                meeting_code: 'ABC123',
                meeting_time: '',
                meeting_title: 'Team Meeting',
            })
                .expect(400);
            expect(response.body.error).toBe('Fields cannot be empty strings');
        });
        /**
         * Verifies that the endpoint rejects whitespace-only strings for meeting_code
         */
        test('should return 400 when meeting_code is only whitespace', async () => {
            const response = await request(app)
                .post('/api/schedule-meeting')
                .set('Authorization', validAuthToken)
                .send({
                meeting_code: '   ',
                meeting_time: '2025-12-01T10:00:00Z',
                meeting_title: 'Team Meeting',
            })
                .expect(400);
            expect(response.body.error).toBe('Fields cannot be empty strings');
        });
        /**
         * Verifies that the endpoint rejects whitespace-only strings for meeting_time
         */
        test('should return 400 when meeting_time is only whitespace', async () => {
            const response = await request(app)
                .post('/api/schedule-meeting')
                .set('Authorization', validAuthToken)
                .send({
                meeting_code: 'ABC123',
                meeting_time: '   ',
                meeting_title: 'Team Meeting',
            })
                .expect(400);
            expect(response.body.error).toBe('Fields cannot be empty strings');
        });
        /**
         * Verifies that the endpoint rejects both empty strings simultaneously
         */
        test('should return 400 when both meeting_code and meeting_time are empty', async () => {
            const response = await request(app)
                .post('/api/schedule-meeting')
                .set('Authorization', validAuthToken)
                .send({
                meeting_code: '',
                meeting_time: '',
                meeting_title: 'Team Meeting',
            })
                .expect(400);
            expect(response.body.error).toBe('Fields cannot be empty strings');
        });
    });
    describe('Validation Tests - Date Format', () => {
        /**
         * Verifies that the endpoint rejects invalid date strings
         */
        test('should return 400 when meeting_time is invalid date string', async () => {
            const response = await request(app)
                .post('/api/schedule-meeting')
                .set('Authorization', validAuthToken)
                .send({
                meeting_code: 'ABC123',
                meeting_time: 'not-a-date',
                meeting_title: 'Team Meeting',
            })
                .expect(400);
            expect(response.body.error).toBe('meeting_time must be a valid ISO datetime string');
        });
        /**
         * Verifies that the endpoint rejects malformed ISO date strings
         */
        test('should return 400 when meeting_time is malformed ISO string', async () => {
            const response = await request(app)
                .post('/api/schedule-meeting')
                .set('Authorization', validAuthToken)
                .send({
                meeting_code: 'ABC123',
                meeting_time: '2025-13-45T99:99:99Z',
                meeting_title: 'Team Meeting',
            })
                .expect(400);
            expect(response.body.error).toBe('meeting_time must be a valid ISO datetime string');
        });
        /**
         * Verifies that the endpoint rejects date-only strings without time
         */
        test('should return 400 when meeting_time is date-only string', async () => {
            const response = await request(app)
                .post('/api/schedule-meeting')
                .set('Authorization', validAuthToken)
                .send({
                meeting_code: 'ABC123',
                meeting_time: '2025-12-01',
                meeting_title: 'Team Meeting',
            })
                .expect(400);
            expect(response.body.error).toBe('meeting_time must be a valid ISO datetime string');
        });
        /**
         * Verifies that the endpoint accepts valid ISO 8601 datetime strings
         */
        test('should accept valid ISO 8601 datetime string', async () => {
            scheduleMeeting.mockResolvedValue({
                data: { id: 1 },
                error: null,
            });
            const response = await request(app)
                .post('/api/schedule-meeting')
                .set('Authorization', validAuthToken)
                .send({
                meeting_code: 'ABC123',
                meeting_time: '2025-12-01T10:00:00Z',
                meeting_title: 'Team Meeting',
            })
                .expect(201);
            expect(response.body.message).toBe('Meeting scheduled successfully');
        });
        /**
         * Verifies that the endpoint accepts ISO datetime with timezone offset
         */
        test('should accept ISO datetime with timezone offset', async () => {
            scheduleMeeting.mockResolvedValue({
                data: { id: 1 },
                error: null,
            });
            const response = await request(app)
                .post('/api/schedule-meeting')
                .set('Authorization', validAuthToken)
                .send({
                meeting_code: 'ABC123',
                meeting_time: '2025-12-01T10:00:00-08:00',
                meeting_title: 'Team Meeting',
            })
                .expect(201);
            expect(response.body.message).toBe('Meeting scheduled successfully');
        });
        /**
         * Verifies that the endpoint accepts ISO datetime with milliseconds
         */
        test('should accept ISO datetime with milliseconds', async () => {
            scheduleMeeting.mockResolvedValue({
                data: { id: 1 },
                error: null,
            });
            const response = await request(app)
                .post('/api/schedule-meeting')
                .set('Authorization', validAuthToken)
                .send({
                meeting_code: 'ABC123',
                meeting_time: '2025-12-01T10:00:00.123Z',
                meeting_title: 'Team Meeting',
            })
                .expect(201);
            expect(response.body.message).toBe('Meeting scheduled successfully');
        });
    });
    describe('Success Cases', () => {
        /**
         * Verifies successful meeting scheduling with all required and optional fields
         */
        test('should schedule meeting successfully with all fields', async () => {
            const mockMeeting = { id: 1 };
            scheduleMeeting.mockResolvedValue({
                data: mockMeeting,
                error: null,
            });
            const response = await request(app)
                .post('/api/schedule-meeting')
                .set('Authorization', validAuthToken)
                .send({
                meeting_code: 'ABC123',
                meeting_time: '2025-12-01T10:00:00Z',
                meeting_title: 'Team Meeting',
            })
                .expect(201);
            expect(response.body.message).toBe('Meeting scheduled successfully');
            expect(response.body.meeting.id).toBe(1);
            expect(scheduleMeeting).toHaveBeenCalledWith(mockUserId, 'ABC123', '2025-12-01T10:00:00Z', 'Team Meeting');
        });
        /**
         * Verifies successful meeting scheduling with only required fields
         */
        test('should schedule meeting successfully with only required fields', async () => {
            const mockMeeting = { id: 2 };
            scheduleMeeting.mockResolvedValue({
                data: mockMeeting,
                error: null,
            });
            const response = await request(app)
                .post('/api/schedule-meeting')
                .set('Authorization', validAuthToken)
                .send({
                meeting_code: 'XYZ789',
                meeting_time: '2025-12-15T14:30:00Z',
            })
                .expect(201);
            expect(response.body.message).toBe('Meeting scheduled successfully');
            expect(response.body.meeting.id).toBe(2);
            expect(scheduleMeeting).toHaveBeenCalledWith(mockUserId, 'XYZ789', '2025-12-15T14:30:00Z', undefined);
        });
        /**
         * Verifies that the endpoint handles various meeting code formats
         */
        test('should handle different meeting code formats', async () => {
            scheduleMeeting.mockResolvedValue({
                data: { id: 3 },
                error: null,
            });
            const testCases = [
                'ABC-123-XYZ',
                '123456789',
                'meeting_2025',
                'zoom.us/j/123456',
            ];
            for (const code of testCases) {
                jest.clearAllMocks();
                await request(app)
                    .post('/api/schedule-meeting')
                    .set('Authorization', validAuthToken)
                    .send({
                    meeting_code: code,
                    meeting_time: '2025-12-01T10:00:00Z',
                })
                    .expect(201);
                expect(scheduleMeeting).toHaveBeenCalledWith(mockUserId, code, '2025-12-01T10:00:00Z', undefined);
            }
        });
        /**
         * Verifies that the endpoint handles long meeting titles
         */
        test('should handle long meeting titles', async () => {
            scheduleMeeting.mockResolvedValue({
                data: { id: 4 },
                error: null,
            });
            const longTitle = 'A'.repeat(500);
            const response = await request(app)
                .post('/api/schedule-meeting')
                .set('Authorization', validAuthToken)
                .send({
                meeting_code: 'ABC123',
                meeting_time: '2025-12-01T10:00:00Z',
                meeting_title: longTitle,
            })
                .expect(201);
            expect(response.body.message).toBe('Meeting scheduled successfully');
            expect(scheduleMeeting).toHaveBeenCalledWith(mockUserId, 'ABC123', '2025-12-01T10:00:00Z', longTitle);
        });
        /**
         * Verifies that the endpoint handles special characters in meeting data
         */
        test('should handle special characters in meeting data', async () => {
            scheduleMeeting.mockResolvedValue({
                data: { id: 5 },
                error: null,
            });
            const response = await request(app)
                .post('/api/schedule-meeting')
                .set('Authorization', validAuthToken)
                .send({
                meeting_code: 'ABC-123!@#$%',
                meeting_time: '2025-12-01T10:00:00Z',
                meeting_title: 'Meeting: Q&A Session (Urgent!)',
            })
                .expect(201);
            expect(response.body.message).toBe('Meeting scheduled successfully');
        });
    });
    describe('Error Cases from Database', () => {
        /**
         * Verifies that database errors are properly handled and returned
         */
        test('should return 400 for database errors', async () => {
            scheduleMeeting.mockResolvedValue({
                data: null,
                error: { message: 'Database constraint violation' },
            });
            const response = await request(app)
                .post('/api/schedule-meeting')
                .set('Authorization', validAuthToken)
                .send({
                meeting_code: 'ABC123',
                meeting_time: '2025-12-01T10:00:00Z',
                meeting_title: 'Team Meeting',
            })
                .expect(400);
            expect(response.body.error).toBe('Database constraint violation');
        });
        /**
         * Verifies that the endpoint returns 500 for unexpected errors
         */
        test('should return 500 for unexpected errors', async () => {
            scheduleMeeting.mockRejectedValue(new Error('Unexpected database error'));
            const response = await request(app)
                .post('/api/schedule-meeting')
                .set('Authorization', validAuthToken)
                .send({
                meeting_code: 'ABC123',
                meeting_time: '2025-12-01T10:00:00Z',
                meeting_title: 'Team Meeting',
            })
                .expect(500);
            expect(response.body.error).toBe('Internal server error');
        });
        /**
         * Verifies that network errors during database operations are handled
         */
        test('should return 500 when network error occurs', async () => {
            scheduleMeeting.mockRejectedValue(new Error('Network timeout'));
            const response = await request(app)
                .post('/api/schedule-meeting')
                .set('Authorization', validAuthToken)
                .send({
                meeting_code: 'ABC123',
                meeting_time: '2025-12-01T10:00:00Z',
                meeting_title: 'Team Meeting',
            })
                .expect(500);
            expect(response.body.error).toBe('Internal server error');
        });
    });
    describe('Edge Cases', () => {
        /**
         * Verifies that the endpoint handles past dates
         */
        test('should accept past dates', async () => {
            scheduleMeeting.mockResolvedValue({
                data: { id: 6 },
                error: null,
            });
            const response = await request(app)
                .post('/api/schedule-meeting')
                .set('Authorization', validAuthToken)
                .send({
                meeting_code: 'ABC123',
                meeting_time: '2020-01-01T10:00:00Z',
                meeting_title: 'Past Meeting',
            })
                .expect(201);
            expect(response.body.message).toBe('Meeting scheduled successfully');
        });
        /**
         * Verifies that the endpoint handles far future dates
         */
        test('should accept far future dates', async () => {
            scheduleMeeting.mockResolvedValue({
                data: { id: 7 },
                error: null,
            });
            const response = await request(app)
                .post('/api/schedule-meeting')
                .set('Authorization', validAuthToken)
                .send({
                meeting_code: 'ABC123',
                meeting_time: '2099-12-31T23:59:59Z',
                meeting_title: 'Future Meeting',
            })
                .expect(201);
            expect(response.body.message).toBe('Meeting scheduled successfully');
        });
        /**
         * Verifies that the endpoint handles Unicode characters in meeting_title
         */
        test('should handle Unicode characters in meeting_title', async () => {
            scheduleMeeting.mockResolvedValue({
                data: { id: 8 },
                error: null,
            });
            const response = await request(app)
                .post('/api/schedule-meeting')
                .set('Authorization', validAuthToken)
                .send({
                meeting_code: 'ABC123',
                meeting_time: '2025-12-01T10:00:00Z',
                meeting_title: '会议 Meeting 🚀',
            })
                .expect(201);
            expect(response.body.message).toBe('Meeting scheduled successfully');
        });
        /**
         * Verifies that the endpoint handles very short meeting codes
         */
        test('should handle single character meeting code', async () => {
            scheduleMeeting.mockResolvedValue({
                data: { id: 9 },
                error: null,
            });
            const response = await request(app)
                .post('/api/schedule-meeting')
                .set('Authorization', validAuthToken)
                .send({
                meeting_code: 'A',
                meeting_time: '2025-12-01T10:00:00Z',
            })
                .expect(201);
            expect(response.body.message).toBe('Meeting scheduled successfully');
        });
        /**
         * Verifies that the endpoint returns null id when database doesn't return one
         */
        test('should handle missing id in database response', async () => {
            scheduleMeeting.mockResolvedValue({
                data: null,
                error: null,
            });
            const response = await request(app)
                .post('/api/schedule-meeting')
                .set('Authorization', validAuthToken)
                .send({
                meeting_code: 'ABC123',
                meeting_time: '2025-12-01T10:00:00Z',
            })
                .expect(201);
            expect(response.body.message).toBe('Meeting scheduled successfully');
            expect(response.body.meeting.id).toBeUndefined();
        });
    });
    describe('Authorization Token Variations', () => {
        /**
         * Verifies that the endpoint handles authorization header without 'Bearer ' prefix
         */
        test('should handle token with Bearer prefix', async () => {
            scheduleMeeting.mockResolvedValue({
                data: { id: 10 },
                error: null,
            });
            const response = await request(app)
                .post('/api/schedule-meeting')
                .set('Authorization', 'Bearer valid-token-123')
                .send({
                meeting_code: 'ABC123',
                meeting_time: '2025-12-01T10:00:00Z',
            })
                .expect(201);
            expect(response.body.message).toBe('Meeting scheduled successfully');
            expect(supabase.auth.getUser).toHaveBeenCalledWith('valid-token-123');
        });
        /**
         * Verifies that the endpoint strips Bearer prefix correctly
         */
        test('should strip Bearer prefix from token', async () => {
            scheduleMeeting.mockResolvedValue({
                data: { id: 11 },
                error: null,
            });
            await request(app)
                .post('/api/schedule-meeting')
                .set('Authorization', 'Bearer my-token-456')
                .send({
                meeting_code: 'ABC123',
                meeting_time: '2025-12-01T10:00:00Z',
            })
                .expect(201);
            expect(supabase.auth.getUser).toHaveBeenCalledWith('my-token-456');
        });
    });
    describe('Data Integrity Tests', () => {
        /**
         * Verifies that all provided data is passed correctly to scheduleMeeting
         */
        test('should pass all parameters correctly to scheduleMeeting', async () => {
            scheduleMeeting.mockResolvedValue({
                data: { id: 12 },
                error: null,
            });
            await request(app)
                .post('/api/schedule-meeting')
                .set('Authorization', validAuthToken)
                .send({
                meeting_code: 'TEST-CODE-123',
                meeting_time: '2025-06-15T15:30:00Z',
                meeting_title: 'Important Meeting',
            })
                .expect(201);
            expect(scheduleMeeting).toHaveBeenCalledWith(mockUserId, 'TEST-CODE-123', '2025-06-15T15:30:00Z', 'Important Meeting');
            expect(scheduleMeeting).toHaveBeenCalledTimes(1);
        });
        /**
         * Verifies that extra fields in request body are ignored
         */
        test('should ignore extra fields in request body', async () => {
            scheduleMeeting.mockResolvedValue({
                data: { id: 13 },
                error: null,
            });
            const response = await request(app)
                .post('/api/schedule-meeting')
                .set('Authorization', validAuthToken)
                .send({
                meeting_code: 'ABC123',
                meeting_time: '2025-12-01T10:00:00Z',
                meeting_title: 'Team Meeting',
                extra_field: 'should be ignored',
                another_field: 12345,
            })
                .expect(201);
            expect(response.body.message).toBe('Meeting scheduled successfully');
            expect(scheduleMeeting).toHaveBeenCalledWith(mockUserId, 'ABC123', '2025-12-01T10:00:00Z', 'Team Meeting');
        });
        /**
         * Verifies that meeting_title undefined is passed correctly
         */
        test('should pass undefined for missing meeting_title', async () => {
            scheduleMeeting.mockResolvedValue({
                data: { id: 14 },
                error: null,
            });
            await request(app)
                .post('/api/schedule-meeting')
                .set('Authorization', validAuthToken)
                .send({
                meeting_code: 'ABC123',
                meeting_time: '2025-12-01T10:00:00Z',
            })
                .expect(201);
            expect(scheduleMeeting).toHaveBeenCalledWith(mockUserId, 'ABC123', '2025-12-01T10:00:00Z', undefined);
        });
    });
});
//# sourceMappingURL=schedule_meeting.test.js.map