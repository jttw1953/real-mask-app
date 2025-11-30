export declare const mockSupabaseApi: () => {
    createUser: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    getUserOverlays: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    deleteOverlay: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    uploadOverlay: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    scheduleMeeting: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    deleteMeeting: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    getAllMeetings: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    getUserData: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    updateUserFullName: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    deleteUser: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    updateMeeting: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    supabase: {
        auth: {
            getUser: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
            admin: {
                createUser: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
                deleteUser: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
            };
        };
    };
};
//# sourceMappingURL=mock_supabase_api.d.ts.map