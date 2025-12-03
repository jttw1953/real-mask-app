import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabaseAuth';
import type { Meeting } from '../types/meetingType';
import type { Overlay } from '../types/overlayType';
import type { UserData } from '../types/userDataType';

type AppDataContextType = {
  meetings: Meeting[];
  overlays: Overlay[];
  userData: UserData;
  refreshData: () => Promise<void>;
  createMeeting: (
    meetingCode: string,
    meetingTime: string,
    meetingTitle: string
  ) => Promise<{ success: boolean; error?: string; meetingId?: number }>;
  updateMeeting: (
    meetingId: number,
    meetingData: {
      meeting_title: string;
      meeting_time: string;
      meeting_code?: string;
    }
  ) => Promise<{ success: boolean; error?: string }>;
  deleteMeeting: (
    meetingId: number
  ) => Promise<{ success: boolean; error?: string }>;
  uploadOverlay: (file: File) => Promise<{ success: boolean; error?: string }>;
  deleteOverlay: (
    overlayId: number
  ) => Promise<{ success: boolean; error?: string }>;
  updateUserName: (
    fullName: string
  ) => Promise<{ success: boolean; error?: string }>;
  deleteUser: () => Promise<{ success: boolean; error?: string }>;
};

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

const API_URL = 'http://localhost:3000';

// Helper to get auth token
async function getAuthToken(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token || null;
}

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [overlays, setOverlays] = useState<Overlay[]>([]);
  const [userData, setUserData] = useState<UserData>({} as UserData);

  // Fetch all data
  const fetchData = async () => {
    try {
      const token = await getAuthToken();
      if (!token) return;

      // Fetch meetings
      const meetingsResponse = await fetch(`${API_URL}/api/get-all-meetings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (meetingsResponse.ok) {
        const meetingsData = await meetingsResponse.json();
        setMeetings(meetingsData.meetings || []);
      }

      // Fetch overlays
      const overlaysResponse = await fetch(`${API_URL}/api/get-all-overlays`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (overlaysResponse.ok) {
        const overlaysData = await overlaysResponse.json();
        setOverlays(overlaysData.overlays || []);
      }

      // Fetch user data
      const userDataResponse = await fetch(`${API_URL}/api/get-user-data`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (userDataResponse.ok) {
        const userDataResult = await userDataResponse.json();
        const userData = userDataResult.userData?.[0];
        if (userData) {
          setUserData(userData);
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  // Fetch on mount
  useEffect(() => {
    fetchData();
  }, []);

  // Create meeting - calls API and returns the new meeting ID
  const createMeeting = async (
    meetingCode: string,
    meetingTime: string,
    meetingTitle: string
  ): Promise<{ success: boolean; error?: string; meetingId?: number }> => {
    try {
      const token = await getAuthToken();
      if (!token) {
        return { success: false, error: 'Not authenticated' };
      }

      const response = await fetch(`${API_URL}/api/schedule-meeting`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          meeting_code: meetingCode,
          meeting_time: meetingTime,
          meeting_title: meetingTitle,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Failed to create meeting',
        };
      }

      // Refresh meetings to update the local state
      await fetchData();

      // Return the meeting ID from the API response
      return {
        success: true,
        meetingId: data.meeting?.id,
      };
    } catch (err) {
      console.error('Error creating meeting:', err);
      return { success: false, error: 'Network error' };
    }
  };

  // Update meeting - calls API and updates local state
  const updateMeeting = async (
    meetingId: number,
    meetingData: { meeting_title: string; meeting_time: string }
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const token = await getAuthToken();
      if (!token) {
        return { success: false, error: 'Not authenticated' };
      }

      const response = await fetch(
        `${API_URL}/api/update-meeting/${meetingId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(meetingData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Failed to update meeting',
        };
      }

      // Refresh meetings to update the local state
      await fetchData();

      return { success: true };
    } catch (err) {
      console.error('Error updating meeting:', err);
      return { success: false, error: 'Network error' };
    }
  };

  // Delete meeting - calls API and updates local state
  const deleteMeeting = async (
    meetingId: number
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const token = await getAuthToken();
      if (!token) {
        return { success: false, error: 'Not authenticated' };
      }

      const response = await fetch(
        `${API_URL}/api/delete-meeting/${meetingId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Failed to delete meeting',
        };
      }

      // Update local state
      setMeetings((prev) => prev.filter((m) => m.id !== meetingId));

      return { success: true };
    } catch (err) {
      console.error('Error deleting meeting:', err);
      return { success: false, error: 'Network error' };
    }
  };

  // Upload overlay - calls API and updates local state
  const uploadOverlay = async (
    file: File
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const token = await getAuthToken();
      if (!token) {
        return { success: false, error: 'Not authenticated' };
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_URL}/api/upload-overlay`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Failed to upload overlay',
        };
      }

      // Refresh overlays to get the new one with its ID and URL
      await fetchData();

      return { success: true };
    } catch (err) {
      console.error('Error uploading overlay:', err);
      return { success: false, error: 'Network error' };
    }
  };

  // Delete overlay - calls API and updates local state
  const deleteOverlay = async (
    overlayId: number
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const token = await getAuthToken();
      if (!token) {
        return { success: false, error: 'Not authenticated' };
      }

      const response = await fetch(
        `${API_URL}/api/delete_overlay/${overlayId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Failed to delete overlay',
        };
      }

      // Update local state
      setOverlays((prev) => prev.filter((o) => o.id !== overlayId));

      return { success: true };
    } catch (err) {
      console.error('Error deleting overlay:', err);
      return { success: false, error: 'Network error' };
    }
  };

  const updateUserName = async (
    fullName: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const token = await getAuthToken();
      if (!token) {
        return { success: false, error: 'Not authenticated' };
      }

      const response = await fetch(`${API_URL}/api/update-user-name`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          full_name: fullName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Failed to update name',
        };
      }

      // Refresh user data to display the updated name
      const userDataResponse = await fetch(`${API_URL}/api/get-user-data`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (userDataResponse.ok) {
        const userDataResult = await userDataResponse.json();
        const userData = userDataResult.userData?.[0];
        if (userData) {
          setUserData(userData);
        }
      }

      return { success: true };
    } catch (err) {
      console.error('Error updating user name:', err);
      return { success: false, error: 'Network error' };
    }
  };

  // Delete user - calls API, signs out, and clears local state
  const deleteUser = async (): Promise<{
    success: boolean;
    error?: string;
  }> => {
    try {
      const token = await getAuthToken();
      if (!token) {
        return { success: false, error: 'Not authenticated' };
      }

      const response = await fetch(`${API_URL}/api/delete-user`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Failed to delete user',
        };
      }

      // Sign out the user after successful deletion
      await supabase.auth.signOut();

      // Clear local state
      setMeetings([]);
      setOverlays([]);
      setUserData({} as UserData);

      return { success: true };
    } catch (err) {
      console.error('Error deleting user:', err);
      return { success: false, error: 'Network error' };
    }
  };

  const value = {
    meetings,
    overlays,
    userData,
    refreshData: fetchData,
    createMeeting,
    updateMeeting,
    deleteMeeting,
    uploadOverlay,
    deleteOverlay,
    updateUserName,
    deleteUser,
  };

  return (
    <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
  );
}

// UPDATED: Custom hook to use the context - now safe to call outside provider
export function useAppData() {
  const context = useContext(AppDataContext);

  // If context is undefined, return safe default values instead of throwing
  if (context === undefined) {
    console.warn(
      '⚠️ useAppData called outside AppDataProvider - returning empty defaults'
    );

    // Return default empty values that match the interface
    return {
      meetings: [] as Meeting[],
      overlays: [] as Overlay[],
      userData: {} as UserData,
      refreshData: async () => {},
      createMeeting: async () => ({
        success: false,
        error: 'Not authenticated',
      }),
      updateMeeting: async () => ({
        success: false,
        error: 'Not authenticated',
      }),
      deleteMeeting: async () => ({
        success: false,
        error: 'Not authenticated',
      }),
      uploadOverlay: async () => ({
        success: false,
        error: 'Not authenticated',
      }),
      deleteOverlay: async () => ({
        success: false,
        error: 'Not authenticated',
      }),
      updateUserName: async () => ({
        success: false,
        error: 'Not authenticated',
      }),
      deleteUser: async () => ({
        success: false,
        error: 'Not authenticated',
      }),
    };
  }

  return context;
}
