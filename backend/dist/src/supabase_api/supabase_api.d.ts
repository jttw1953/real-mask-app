export declare const supabase: import("@supabase/supabase-js").SupabaseClient<any, "public", "public", any, any>;
export declare function createUser(fullName: string, email: string, password: string): Promise<{
    data: any | null;
    error: any;
}>;
export declare function getUserOverlays(ownerId: string): Promise<{
    data: Array<{
        id: number;
        ownerId: number;
        url: string | null;
    }>;
    error: any;
}>;
export declare function deleteOverlay(overlayId: number, ownerId: string): Promise<undefined | string>;
export declare function uploadOverlay(ownerId: string, file: File | Buffer, filename: string): Promise<{
    error: any;
}>;
export declare function scheduleMeeting(ownerId: string, meetingCode: string, meetingTime: string, meetingTitle: string): Promise<{
    data: {
        id: number;
    } | null;
    error: any;
}>;
export declare function deleteMeeting(meetingId: number, ownerId: string): Promise<undefined | string>;
export declare function getAllMeetings(ownerId: string): Promise<{
    data: any[] | null;
    error: any;
}>;
export declare function getUserData(userId: string): Promise<{
    data: any[] | null;
    error: any;
}>;
export declare function updateUserFullName(userId: string, newFullName: string): Promise<undefined | string>;
export declare function deleteUser(userId: string): Promise<undefined | string>;
export declare function updateMeeting(meetingId: number, ownerId: string, meetingTitle: string, meetingTime: string, meetingCode: string): Promise<undefined | string>;
//# sourceMappingURL=supabase_api.d.ts.map