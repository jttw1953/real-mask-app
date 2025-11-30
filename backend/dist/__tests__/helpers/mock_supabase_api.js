import { jest } from '@jest/globals';
export const mockSupabaseApi = () => ({
    createUser: jest.fn(),
    getUserOverlays: jest.fn(),
    deleteOverlay: jest.fn(),
    uploadOverlay: jest.fn(),
    scheduleMeeting: jest.fn(),
    deleteMeeting: jest.fn(),
    getAllMeetings: jest.fn(),
    getUserData: jest.fn(),
    updateUserFullName: jest.fn(),
    deleteUser: jest.fn(),
    updateMeeting: jest.fn(),
    supabase: {
        auth: {
            getUser: jest.fn(),
            admin: {
                createUser: jest.fn(),
                deleteUser: jest.fn(),
            },
        },
    },
});
//# sourceMappingURL=mock_supabase_api.js.map