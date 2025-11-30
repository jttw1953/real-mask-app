import { createClient } from '@supabase/supabase-js';
import { encrypt, decrypt } from './encryption.js';
const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const profileTable = 'profiles';
const overlayTable = 'overlay-metadata';
const meetingTable = 'meetings';
const toBuffer = (stored) => Buffer.from(JSON.parse(stored).data);
export const supabase = createClient(url, serviceKey);
export async function createUser(fullName, email, password) {
    try {
        // Step 1: Create auth user first to get UUID
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true,
        });
        if (authError) {
            console.error('Error creating auth user:', authError);
            return { data: null, error: authError };
        }
        const userId = authData.user.id;
        // Step 2: Insert user into profiles table
        const encryptedData = {
            id: userId,
            full_name_enc: await encrypt(fullName),
            email_enc: await encrypt(email),
        };
        const { data: row, error } = await supabase
            .from(profileTable)
            .insert(encryptedData)
            .select();
        if (error) {
            console.error(`Error inserting into ${profileTable}:`, error);
            return { data: null, error };
        }
        return { data: row, error: null };
    }
    catch (encryptError) {
        console.error('Error in createUser:', encryptError);
        return { data: null, error: encryptError };
    }
}
export async function getUserOverlays(ownerId) {
    // get metadata fields for user
    const { data: rows, error: dbError } = await supabase
        .from(overlayTable)
        .select('id, owner_id, title, storage_path')
        .eq('owner_id', ownerId);
    if (dbError)
        return { data: [], error: dbError };
    if (!rows?.length)
        return { data: [], error: null };
    // create presigned url
    const paths = rows.map((r) => r.storage_path);
    const { data: signed, error: signErr } = await supabase.storage
        .from('overlays')
        .createSignedUrls(paths, 3600);
    if (signErr)
        return { data: [], error: signErr };
    const byPath = new Map();
    signed.forEach((s) => byPath.set(s.path, s.signedUrl ?? null));
    // returns important metadata with new presigned url for user to access in frontend
    const out = rows.map((r) => ({
        id: r.id,
        ownerId: r.owner_id,
        url: byPath.get(r.storage_path) ?? null,
    }));
    return { data: out, error: null };
}
export async function deleteOverlay(overlayId, ownerId) {
    const { data: row, error: dbError } = await supabase
        .from(overlayTable)
        .select('storage_path')
        .eq('id', overlayId)
        .eq('owner_id', ownerId)
        .maybeSingle();
    if (dbError)
        return dbError.message;
    if (!row)
        return 'Overlay not found';
    const { error: rmErr } = await supabase.storage
        .from('overlays')
        .remove([row.storage_path]);
    if (rmErr && rmErr.status !== 404)
        return rmErr.message;
    const { error } = await supabase
        .from(overlayTable)
        .delete()
        .eq('id', overlayId)
        .eq('owner_id', ownerId)
        .single();
    if (error)
        return error.message;
    return undefined;
}
export async function uploadOverlay(ownerId, file, filename) {
    try {
        const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
        const storagePath = `${ownerId}/${sanitizedFilename}`;
        // Upload to storage
        const { error: uploadError } = await supabase.storage
            .from('overlays')
            .upload(storagePath, file, {
            contentType: file instanceof File ? file.type : 'image/png',
            upsert: false,
        });
        if (uploadError) {
            console.error('Error uploading file to storage:', uploadError);
            return { error: uploadError };
        }
        // Insert metadata
        const { error: dbError } = await supabase.from(overlayTable).insert({
            owner_id: ownerId,
            storage_path: storagePath,
            title: sanitizedFilename,
        });
        if (dbError) {
            console.error(`Error inserting into ${overlayTable}:`, dbError);
            await supabase.storage.from('overlays').remove([storagePath]);
            return { error: dbError };
        }
        return { error: null };
    }
    catch (unexpectedError) {
        console.error('Unexpected error during upload:', unexpectedError);
        return { error: unexpectedError };
    }
}
export async function scheduleMeeting(ownerId, meetingCode, meetingTime, meetingTitle) {
    try {
        const { data, error } = await supabase
            .from(meetingTable)
            .insert({
            owner_id: ownerId,
            meeting_code: meetingCode,
            meeting_time: meetingTime,
            meeting_title: meetingTitle,
        })
            .select('id')
            .single();
        if (error) {
            console.error('Error inserting meeting:', error);
            return { data: null, error };
        }
        return { data, error: null };
    }
    catch (unexpectedError) {
        console.error('Unexpected error scheduling meeting:', unexpectedError);
        return { data: null, error: unexpectedError };
    }
}
export async function deleteMeeting(meetingId, ownerId) {
    const { error } = await supabase
        .from(meetingTable)
        .delete()
        .eq('owner_id', ownerId)
        .eq('id', meetingId);
    if (error)
        return error.message;
    return undefined;
}
export async function getAllMeetings(ownerId) {
    try {
        const { data, error } = await supabase
            .from(meetingTable)
            .select('id, owner_id, meeting_time, meeting_code, meeting_title')
            .eq('owner_id', ownerId)
            .order('meeting_time', { ascending: true });
        if (error) {
            console.error('Error fetching meetings:', error);
            return { data: null, error };
        }
        return { data, error: null };
    }
    catch (unexpectedError) {
        console.error('Unexpected error fetching meetings:', unexpectedError);
        return { data: null, error: unexpectedError };
    }
}
export async function getUserData(userId) {
    try {
        const { data, error } = await supabase
            .from(profileTable)
            .select('id, full_name_enc, email_enc')
            .eq('id', userId);
        if (error) {
            console.error('Error fetching user data:', error);
            return { data: null, error };
        }
        const decrypted = data.map((row) => ({
            id: row.id,
            full_name_enc: decrypt(toBuffer(row.full_name_enc)),
            email_enc: decrypt(toBuffer(row.email_enc)),
        }));
        return { data: decrypted, error: null };
    }
    catch (unexpectedError) {
        console.error('Unexpected error fetching user data:', unexpectedError);
        return { data: null, error: unexpectedError };
    }
}
export async function updateUserFullName(userId, newFullName) {
    try {
        const encryptedFullName = await encrypt(newFullName);
        const { error } = await supabase
            .from(profileTable)
            .update({ full_name_enc: encryptedFullName })
            .eq('id', userId);
        if (error) {
            console.error('Error updating full name:', error);
            return error.message;
        }
        return undefined;
    }
    catch (unexpectedError) {
        console.error('Unexpected error updating full name:', unexpectedError);
        return 'Unexpected error occurred';
    }
}
export async function deleteUser(userId) {
    try {
        // Step 1: Delete all files in the user's storage folder
        const { data: files, error: listError } = await supabase.storage
            .from('overlays')
            .list(userId);
        if (listError) {
            console.error('Error listing user files:', listError);
            return listError.message;
        }
        if (files && files.length > 0) {
            const filePaths = files.map((file) => `${userId}/${file.name}`);
            const { error: removeError } = await supabase.storage
                .from('overlays')
                .remove(filePaths);
            if (removeError) {
                console.error('Error deleting user files:', removeError);
                return removeError.message;
            }
        }
        // Step 2: Delete user from profiles table
        // This will cascade delete related records in overlay-metadata and meetings tables
        const { error: profileError } = await supabase
            .from(profileTable)
            .delete()
            .eq('id', userId);
        if (profileError) {
            console.error('Error deleting user profile:', profileError);
            return profileError.message;
        }
        // Step 3: Delete auth user
        const { error: authError } = await supabase.auth.admin.deleteUser(userId);
        if (authError) {
            console.error('Error deleting auth user:', authError);
            return authError.message;
        }
        return undefined;
    }
    catch (unexpectedError) {
        console.error('Unexpected error deleting user:', unexpectedError);
        return 'Unexpected error occurred';
    }
}
export async function updateMeeting(meetingId, ownerId, meetingTitle, meetingTime, meetingCode) {
    try {
        const { error } = await supabase
            .from(meetingTable)
            .update({
            meeting_title: meetingTitle,
            meeting_time: meetingTime,
            meeting_code: meetingCode,
        })
            .eq('id', meetingId)
            .eq('owner_id', ownerId);
        if (error) {
            console.error('Error updating meeting:', error);
            return error.message;
        }
        return undefined;
    }
    catch (unexpectedError) {
        console.error('Unexpected error updating meeting:', unexpectedError);
        return 'Unexpected error occurred';
    }
}
//# sourceMappingURL=supabase_api.js.map