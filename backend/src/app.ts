import express from 'express';
import formidable from 'formidable';
import { initializeMediasoup } from '../src/mediasoup/mediasoupServer.js';
import fs from 'fs';
import {
  createUser,
  getUserOverlays,
  deleteOverlay,
  uploadOverlay,
  scheduleMeeting,
  deleteMeeting,
  getAllMeetings,
  updateUserFullName,
  deleteUser,
  updateMeeting,
  supabase,
  getUserData,
} from './supabase_api/supabase_api.js';

// Helper function to verify auth tokens
async function verifyAuthToken(
  authToken: string | undefined
): Promise<{ userId: string | null; error: any }> {
  if (!authToken) {
    return {
      userId: null,
      error: new Error('No authorization token provided'),
    };
  }

  const token = authToken.replace('Bearer ', '');

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return { userId: null, error: error || new Error('Invalid token') };
  }

  return { userId: user.id, error: null };
}

// Create Express app
export const app = express();

// Middleware
app.use(express.json());

// CORS middleware
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'POST, OPTIONS, GET, DELETE, PUT'
  );
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  next();
});

// ============= ROUTES =============

// POST /api/create-user
app.post('/api/create-user', async (req, res) => {
  try {
    const { full_name, email, password } = req.body;

    if (
      full_name === undefined ||
      full_name === null ||
      email === undefined ||
      email === null ||
      password === undefined ||
      password === null
    ) {
      res.status(400).json({
        error: 'Missing required fields: full_name, email, password',
      });
      return;
    }

    if (
      typeof full_name !== 'string' ||
      typeof email !== 'string' ||
      typeof password !== 'string'
    ) {
      res.status(400).json({
        error: 'All fields must be strings',
      });
      return;
    }

    if (
      full_name.trim() === '' ||
      email.trim() === '' ||
      password.trim() === ''
    ) {
      res.status(400).json({
        error: 'Fields cannot be empty strings',
      });
      return;
    }

    const result = await createUser(full_name, email, password);

    if (result.error) {
      if (result.error.code === 'email_exists' || result.error.status === 422) {
        res.status(409).json({ error: 'This email is already registered' });
        return;
      }

      res.status(400).json({ error: result.error.message });
      return;
    }

    res.status(201).json({
      message: 'User created successfully',
      data: result.data,
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/get-all-overlays
app.get('/api/get-all-overlays', async (req, res) => {
  const { userId, error: authError } = await verifyAuthToken(
    req.headers.authorization
  );

  if (authError || !userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const result = await getUserOverlays(userId);

    if (result.error) {
      res.status(400).json({ error: result.error.message });
      return;
    }

    res.status(200).json({
      message: 'Overlays retrieved successfully',
      overlays: result.data,
    });
  } catch (error) {
    console.error('Error getting overlays:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/delete_overlay/:id
app.delete('/api/delete_overlay/:id', async (req, res) => {
  const { userId, error: authError } = await verifyAuthToken(
    req.headers.authorization
  );

  if (authError || !userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const overlayId = req.params.id;

    if (!overlayId) {
      res.status(400).json({ error: 'Overlay ID is required' });
      return;
    }

    const overlayIdNum = parseInt(overlayId, 10);

    if (isNaN(overlayIdNum)) {
      res.status(400).json({ error: 'Invalid overlay ID format' });
      return;
    }

    const error = await deleteOverlay(overlayIdNum, userId);

    if (error) {
      res.status(400).json({ error: error });
      return;
    }

    res.status(200).json({
      message: 'Overlay deleted successfully',
      overlayId: overlayId,
    });
  } catch (error) {
    console.error('Error deleting overlay:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/upload-overlay
app.post('/api/upload-overlay', async (req, res) => {
  const { userId, error: authError } = await verifyAuthToken(
    req.headers.authorization
  );

  if (authError || !userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024,
      keepExtensions: true,
    });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        res.status(400).json({ error: 'Error parsing form data' });
        return;
      }

      const file = files.file?.[0];

      if (!file) {
        res.status(400).json({ error: 'Missing required field: file' });
        return;
      }

      const filename = file.originalFilename;
      if (!filename || typeof filename !== 'string') {
        res.status(400).json({ error: 'Invalid filename' });
        return;
      }

      if (filename.trim() === '') {
        res.status(400).json({ error: 'Filename cannot be empty' });
        return;
      }

      if (file.size === 0) {
        res.status(400).json({ error: 'File cannot be empty' });
        return;
      }

      try {
        const fileBuffer = await fs.promises.readFile(file.filepath);
        const result = await uploadOverlay(userId, fileBuffer, filename);
        await fs.promises.unlink(file.filepath);

        if (result.error) {
          res.status(400).json({ error: result.error.message });
          return;
        }

        res.status(201).json({ message: 'Overlay uploaded successfully' });
      } catch (uploadError) {
        console.error('Error during upload:', uploadError);
        res.status(500).json({ error: 'Internal server error' });
      }
    });
  } catch (error) {
    console.error('Error uploading overlay:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/schedule-meeting
app.post('/api/schedule-meeting', async (req, res) => {
  const { userId, error: authError } = await verifyAuthToken(
    req.headers.authorization
  );

  if (authError || !userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const { meeting_code, meeting_time, meeting_title } = req.body;

    if (
      meeting_code === undefined ||
      meeting_code === null ||
      meeting_time === undefined ||
      meeting_time === null
    ) {
      res.status(400).json({
        error: 'Missing required fields: meeting_code, meeting_time',
      });
      return;
    }

    if (typeof meeting_code !== 'string' || typeof meeting_time !== 'string') {
      res.status(400).json({
        error: 'All fields must be strings',
      });
      return;
    }

    if (meeting_code.trim() === '' || meeting_time.trim() === '') {
      res.status(400).json({
        error: 'Fields cannot be empty strings',
      });
      return;
    }

    const isoDateTimeRegex =
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})$/;

    if (!isoDateTimeRegex.test(meeting_time)) {
      res.status(400).json({
        error: 'meeting_time must be a valid ISO datetime string',
      });
      return;
    }

    const parsedDate = new Date(meeting_time);
    if (isNaN(parsedDate.getTime())) {
      res.status(400).json({
        error: 'meeting_time must be a valid ISO datetime string',
      });
      return;
    }

    const result = await scheduleMeeting(
      userId,
      meeting_code,
      meeting_time,
      meeting_title
    );

    if (result.error) {
      res.status(400).json({ error: result.error.message });
      return;
    }

    res.status(201).json({
      message: 'Meeting scheduled successfully',
      meeting: {
        id: result.data?.id,
      },
    });
  } catch (error) {
    console.error('Error scheduling meeting:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/delete-meeting/:id
app.delete('/api/delete-meeting/:id', async (req, res) => {
  const { userId, error: authError } = await verifyAuthToken(
    req.headers.authorization
  );

  if (authError || !userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const meetingId = req.params.id;

    if (!meetingId) {
      res.status(400).json({ error: 'Meeting ID is required' });
      return;
    }

    if (!/^-?\d+$/.test(meetingId)) {
      res.status(400).json({ error: 'Invalid meeting ID format' });
      return;
    }

    const meetingIdNum = parseInt(meetingId, 10);

    if (isNaN(meetingIdNum)) {
      res.status(400).json({ error: 'Invalid meeting ID format' });
      return;
    }

    const error = await deleteMeeting(meetingIdNum, userId);

    if (error) {
      res.status(400).json({ error: error });
      return;
    }

    res.status(200).json({
      message: 'Meeting deleted successfully',
      meetingId: meetingId,
    });
  } catch (error) {
    console.error('Error deleting meeting:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/get-all-meetings
app.get('/api/get-all-meetings', async (req, res) => {
  const { userId, error: authError } = await verifyAuthToken(
    req.headers.authorization
  );

  if (authError || !userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const result = await getAllMeetings(userId);

    if (result.error) {
      res.status(400).json({ error: result.error.message });
      return;
    }

    res.status(200).json({
      message: 'Meetings retrieved successfully',
      meetings: result.data,
    });
  } catch (error) {
    console.error('Error getting meetings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/get-user-data
app.get('/api/get-user-data', async (req, res) => {
  const { userId, error: authError } = await verifyAuthToken(
    req.headers.authorization
  );

  if (authError || !userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const result = await getUserData(userId);

    if (result.error) {
      res.status(400).json({ error: result.error.message });
      return;
    }

    res.status(200).json({
      message: 'User data retrieved successfully',
      userData: result.data,
    });
  } catch (error) {
    console.error('Error getting user data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/update-user-name
app.put('/api/update-user-name', async (req, res) => {
  const { userId, error: authError } = await verifyAuthToken(
    req.headers.authorization
  );

  if (authError || !userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const { full_name } = req.body;

    if (!full_name) {
      res.status(400).json({
        error: 'Missing required field: full_name',
      });
      return;
    }

    if (typeof full_name !== 'string') {
      res.status(400).json({
        error: 'full_name must be a string',
      });
      return;
    }

    if (full_name.trim() === '') {
      res.status(400).json({
        error: 'full_name cannot be empty',
      });
      return;
    }

    const error = await updateUserFullName(userId, full_name.trim());

    if (error) {
      res.status(400).json({ error: error });
      return;
    }

    res.status(200).json({
      message: 'Full name updated successfully',
    });
  } catch (error) {
    console.error('Error updating full name:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/delete-user
app.delete('/api/delete-user', async (req, res) => {
  const { userId, error: authError } = await verifyAuthToken(
    req.headers.authorization
  );

  if (authError || !userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const error = await deleteUser(userId);

    if (error) {
      res.status(400).json({ error: error });
      return;
    }

    res.status(200).json({
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/update-meeting/:id
app.put('/api/update-meeting/:id', async (req, res) => {
  const { userId, error: authError } = await verifyAuthToken(
    req.headers.authorization
  );

  if (authError || !userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const meetingId = req.params.id;

    if (!meetingId) {
      res.status(400).json({ error: 'Meeting ID is required' });
      return;
    }

    const meetingIdNum = parseInt(meetingId, 10);

    if (isNaN(meetingIdNum)) {
      res.status(400).json({ error: 'Invalid meeting ID format' });
      return;
    }

    const { meeting_title, meeting_time, meeting_code } = req.body;

    if (!meeting_title || !meeting_time) {
      res.status(400).json({
        error: 'Missing required fields: meeting_title, meeting_time',
      });
      return;
    }

    if (typeof meeting_title !== 'string' || typeof meeting_time !== 'string') {
      res.status(400).json({
        error: 'meeting_title and meeting_time must be strings',
      });
      return;
    }

    if (meeting_code !== undefined && typeof meeting_code !== 'string') {
      res.status(400).json({
        error: 'meeting_code must be a string',
      });
      return;
    }

    if (meeting_title.trim() === '' || meeting_time.trim() === '') {
      res.status(400).json({
        error: 'meeting_title and meeting_time cannot be empty strings',
      });
      return;
    }

    if (meeting_code !== undefined && meeting_code.trim() === '') {
      res.status(400).json({
        error: 'meeting_code cannot be empty string',
      });
      return;
    }

    const parsedDate = new Date(meeting_time);
    if (isNaN(parsedDate.getTime())) {
      res.status(400).json({
        error: 'meeting_time must be a valid ISO datetime string',
      });
      return;
    }

    const error = await updateMeeting(
      meetingIdNum,
      userId,
      meeting_title,
      meeting_time,
      meeting_code
    );

    if (error) {
      res.status(400).json({ error: error });
      return;
    }

    res.status(200).json({
      message: 'Meeting updated successfully',
      meetingId: meetingId,
    });
  } catch (error) {
    console.error('Error updating meeting:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});
