# Real Mask - Technical Documentation

## Comprehensive Project Reference

---

## Table of Contents

1. [Backend Architecture](#backend-architecture)
   - [Express Server & API Endpoints](#express-server--api-endpoints)
   - [Supabase API Functions](#supabase-api-functions)
   - [Encryption Module](#encryption-module)
   - [Socket.IO & WebRTC Management](#socketio--webrtc-management)
2. [Frontend Architecture](#frontend-architecture)
   - [React Pages](#react-pages)
   - [React Components](#react-components)
   - [Custom Hooks](#custom-hooks)
   - [Type Definitions](#type-definitions)
   - [Utility Functions](#utility-functions)
3. [Testing Suite](#testing-suite)

---

## Backend Architecture

### Express Server & API Endpoints

#### **File: `index.ts`**

Entry point for the backend server combining Express HTTP server with Socket.IO for WebRTC signaling.

**Key Components:**

- **HTTP Server**: Created with Express app
- **Socket.IO Server**: Manages WebRTC signaling for peer-to-peer connections
- **User Manager**: Handles user connections and meeting room management
- **Port Configuration**: Listens on port 3000

**Server Initialization:**

```typescript
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'], credentials: true },
  transports: ['websocket', 'polling'],
});
```

---

#### **File: `app.ts`**

Core Express application with REST API endpoints for user management, meeting operations, and overlay handling.

### Authentication Endpoints

#### **POST `/api/create-user`**

Creates a new user account with encrypted data storage.

**Request Body:**

- `full_name` (string, required): User's full name
- `email` (string, required): User's email address
- `password` (string, required): User's password

**Response:**

- Success (201): `{ message: "User created successfully", userId: string }`
- Error (400/500): `{ error: string }`

**Implementation Details:**

- Creates Supabase auth user first to obtain UUID
- Encrypts full name and email before storage
- Inserts profile into profiles table with encrypted data

---

### User Management Endpoints

#### **GET `/api/get-user-data`**

Retrieves authenticated user's profile information with decrypted data.

**Headers:**

- `Authorization: Bearer <token>` (required)

**Response:**

- Success (200): `{ userData: { id: string, full_name_enc: string, email_enc: string } }`
- Error (401/500): `{ error: string }`

**Security:**

- Token-based authentication required
- Decrypts sensitive data before returning

---

#### **PUT `/api/update-user-name`**

Updates user's full name with encryption.

**Headers:**

- `Authorization: Bearer <token>` (required)

**Request Body:**

- `full_name` (string, required): New full name

**Response:**

- Success (200): `{ message: "User name updated successfully" }`
- Error (400/401/500): `{ error: string }`

---

#### **DELETE `/api/delete-user`**

Permanently deletes user account and all associated data.

**Headers:**

- `Authorization: Bearer <token>` (required)

**Response:**

- Success (200): `{ message: "User deleted successfully" }`
- Error (401/500): `{ error: string }`

**Cascade Operations:**

1. Deletes all overlay files from storage
2. Deletes profile record (cascades to meetings and overlay metadata)
3. Deletes auth user

---

### Meeting Management Endpoints

#### **POST `/api/schedule-meeting`**

Creates a new scheduled meeting.

**Headers:**

- `Authorization: Bearer <token>` (required)

**Request Body:**

- `meeting_code` (string, required): Unique meeting code
- `meeting_time` (string, required): ISO 8601 datetime string
- `meeting_title` (string, optional): Meeting title

**Response:**

- Success (201): `{ message: "Meeting scheduled successfully", meetingId: number }`
- Error (400/401/500): `{ error: string }`

---

#### **GET `/api/get-all-meetings`**

Retrieves all meetings for authenticated user.

**Headers:**

- `Authorization: Bearer <token>` (required)

**Response:**

- Success (200): `{ meetings: Meeting[] }`
- Error (401/500): `{ error: string }`

**Meeting Object:**

```typescript
{
  id: number,
  owner_id: string,
  meeting_time: string,
  meeting_code: string,
  meeting_title: string
}
```

---

#### **PUT `/api/update-meeting/:meetingId`**

Updates an existing meeting's details.

**Headers:**

- `Authorization: Bearer <token>` (required)

**Path Parameters:**

- `meetingId` (number): ID of meeting to update

**Request Body:**

- `meeting_title` (string, required): New meeting title
- `meeting_time` (string, required): New ISO 8601 datetime
- `meeting_code` (string, optional): New meeting code

**Response:**

- Success (200): `{ message: "Meeting updated successfully" }`
- Error (400/401/404/500): `{ error: string }`

---

#### **DELETE `/api/delete-meeting/:meetingId`**

Deletes a specific meeting.

**Headers:**

- `Authorization: Bearer <token>` (required)

**Path Parameters:**

- `meetingId` (number): ID of meeting to delete

**Response:**

- Success (200): `{ message: "Meeting deleted successfully" }`
- Error (401/404/500): `{ error: string }`

---

### Overlay Management Endpoints

#### **POST `/api/upload-overlay`**

Uploads a new overlay image file.

**Headers:**

- `Authorization: Bearer <token>` (required)
- `Content-Type: multipart/form-data`

**Form Data:**

- `file` (File, required): Image file to upload

**Response:**

- Success (201): `{ message: "Overlay uploaded successfully", overlayId: number }`
- Error (400/401/500): `{ error: string }`

**File Requirements:**

- Supported formats: PNG, JPG, JPEG, GIF, WEBP
- Stored in Supabase storage with user-specific path: `{ownerId}/{filename}`

---

#### **GET `/api/get-all-overlays`**

Retrieves all overlay images for authenticated user with presigned URLs.

**Headers:**

- `Authorization: Bearer <token>` (required)

**Response:**

- Success (200): `{ overlays: Overlay[] }`
- Error (401/500): `{ error: string }`

**Overlay Object:**

```typescript
{
  id: number,
  ownerId: string,
  url: string | null  // Presigned URL valid for 1 hour
}
```

---

#### **DELETE `/api/delete-overlay/:overlayId`**

Deletes a specific overlay image.

**Headers:**

- `Authorization: Bearer <token>` (required)

**Path Parameters:**

- `overlayId` (number): ID of overlay to delete

**Response:**

- Success (200): `{ message: "Overlay deleted successfully" }`
- Error (401/404/500): `{ error: string }`

**Operations:**

1. Removes file from Supabase storage
2. Deletes metadata record from database

---

### Supabase API Functions

#### **File: `supabase_api.ts`**

Database abstraction layer for all Supabase operations with encryption support.

### User Operations

#### **Function: `createUser`**

```typescript
async function createUser(
  fullName: string,
  email: string,
  password: string
): Promise<{ data: any | null; error: any }>;
```

**Purpose:** Creates a new user with encrypted profile data

**Process:**

1. Creates auth user via Supabase Admin API
2. Encrypts full name and email
3. Inserts encrypted profile into profiles table

**Returns:**

- Success: `{ data: profileRow, error: null }`
- Failure: `{ data: null, error: ErrorObject }`

---

#### **Function: `getUserData`**

```typescript
async function getUserData(
  userId: string
): Promise<{ data: any[] | null; error: any }>;
```

**Purpose:** Retrieves and decrypts user profile information

**Process:**

1. Queries profiles table for user
2. Decrypts full_name_enc and email_enc fields
3. Returns decrypted data

**Returns:**

- Success: `{ data: [{ id, full_name_enc, email_enc }], error: null }`
- Failure: `{ data: null, error: ErrorObject }`

---

#### **Function: `updateUserFullName`**

```typescript
async function updateUserFullName(
  userId: string,
  newFullName: string
): Promise<undefined | string>;
```

**Purpose:** Updates user's full name with encryption

**Process:**

1. Encrypts new full name
2. Updates profiles table

**Returns:**

- Success: `undefined`
- Failure: `error message string`

---

#### **Function: `deleteUser`**

```typescript
async function deleteUser(userId: string): Promise<undefined | string>;
```

**Purpose:** Permanently deletes user and all associated data

**Process:**

1. Lists and deletes all user files from storage
2. Deletes profile (cascades to meetings and overlays)
3. Deletes auth user

**Returns:**

- Success: `undefined`
- Failure: `error message string`

---

### Meeting Operations

#### **Function: `scheduleMeeting`**

```typescript
async function scheduleMeeting(
  ownerId: string,
  meetingCode: string,
  meetingTime: string,
  meetingTitle?: string
): Promise<{ data: any | null; error: any }>;
```

**Purpose:** Creates a new scheduled meeting

**Parameters:**

- `ownerId`: User UUID
- `meetingCode`: Unique meeting identifier
- `meetingTime`: ISO 8601 datetime string
- `meetingTitle`: Optional meeting title (defaults to "Untitled Meeting")

**Returns:**

- Success: `{ data: { id: meetingId }, error: null }`
- Failure: `{ data: null, error: ErrorObject }`

---

#### **Function: `getAllMeetings`**

```typescript
async function getAllMeetings(
  ownerId: string
): Promise<{ data: any[] | null; error: any }>;
```

**Purpose:** Retrieves all meetings for a user, sorted by time

**Returns:**

- Success: `{ data: Meeting[], error: null }`
- Failure: `{ data: null, error: ErrorObject }`

---

#### **Function: `updateMeeting`**

```typescript
async function updateMeeting(
  meetingId: number,
  ownerId: string,
  meetingTitle: string,
  meetingTime: string,
  meetingCode: string
): Promise<undefined | string>;
```

**Purpose:** Updates meeting details

**Returns:**

- Success: `undefined`
- Failure: `error message string`

---

#### **Function: `deleteMeeting`**

```typescript
async function deleteMeeting(
  meetingId: number,
  ownerId: string
): Promise<undefined | string>;
```

**Purpose:** Deletes a specific meeting

**Returns:**

- Success: `undefined`
- Failure: `error message string`

---

### Overlay Operations

#### **Function: `uploadOverlay`**

```typescript
async function uploadOverlay(
  ownerId: string,
  file: File | Buffer,
  filename: string
): Promise<{ error: any }>;
```

**Purpose:** Uploads overlay file and creates metadata record

**Process:**

1. Sanitizes filename (replaces special chars with underscores)
2. Uploads to Supabase storage at `{ownerId}/{filename}`
3. Creates metadata record in overlay-metadata table

**Returns:**

- Success: `{ error: null }`
- Failure: `{ error: ErrorObject }`

---

#### **Function: `getUserOverlays`**

```typescript
async function getUserOverlays(ownerId: string): Promise<{
  data: Array<{ id: number; ownerId: number; url: string | null }>;
  error: any;
}>;
```

**Purpose:** Retrieves all overlays for user with presigned URLs

**Process:**

1. Queries overlay-metadata table
2. Generates presigned URLs valid for 1 hour
3. Maps metadata to response format

**Returns:**

- Success: `{ data: Overlay[], error: null }`
- Failure: `{ data: [], error: ErrorObject }`

---

#### **Function: `deleteOverlay`**

```typescript
async function deleteOverlay(
  overlayId: number,
  ownerId: string
): Promise<undefined | string>;
```

**Purpose:** Deletes overlay file and metadata

**Process:**

1. Retrieves storage path from metadata
2. Removes file from storage
3. Deletes metadata record

**Returns:**

- Success: `undefined`
- Failure: `error message string`

---

### Encryption Module

#### **File: `encryption.ts`**

Provides AES-256-CBC encryption for sensitive user data.

#### **Function: `encrypt`**

```typescript
function encrypt(text: string): Buffer;
```

**Purpose:** Encrypts plaintext using AES-256-CBC

**Algorithm:**

- Cipher: AES-256-CBC
- Key derivation: SHA-256 hash of ENCRYPTION_KEY environment variable
- IV: 16 random bytes generated per encryption

**Process:**

1. Generates random 16-byte IV
2. Derives 32-byte key from environment variable
3. Encrypts text with cipher
4. Prepends IV to encrypted data
5. Returns combined Buffer

**Returns:** Buffer containing IV (16 bytes) + encrypted data

---

#### **Function: `decrypt`**

```typescript
function decrypt(buffer: Buffer): string;
```

**Purpose:** Decrypts buffer encrypted with encrypt() function

**Process:**

1. Extracts IV from first 16 bytes
2. Extracts encrypted data from remaining bytes
3. Derives same key from environment variable
4. Decrypts data with decipher
5. Returns plaintext string

**Returns:** Decrypted plaintext string

**Security Notes:**

- Uses random IV for each encryption (prevents pattern detection)
- Key never stored in database (only in environment variable)
- IV prepended to ciphertext (no need for separate storage)

---

### Socket.IO & WebRTC Management

#### **File: `userManager.ts`**

Manages user connections, meeting rooms, and WebRTC signaling.

#### **Class: `userManager`**

**Properties:**

- `users: User[]` - Array of connected users
- `roomManager: roomManager` - Handles WebRTC room creation and signaling
- `meetingRooms: Map<string, string[]>` - Maps meetingId to array of socketIds

**Constructor:**

```typescript
constructor() {
  this.users = [];
  this.roomManager = new roomManager();
  this.meetingRooms = new Map<string, string[]>();
}
```

---

#### **Method: `addUser`**

```typescript
addUser(name: string, socket: Socket): void
```

**Purpose:** Registers a new user connection and initializes event handlers

**Process:**

1. Adds user to users array
2. Calls initHandlers to set up Socket.IO event listeners

---

#### **Method: `initHandlers`**

```typescript
initHandlers(socket: Socket): void
```

**Purpose:** Sets up Socket.IO event handlers for a user connection

**Event Handlers:**

1. **`join-meeting`** - User joining a meeting room
2. **`offer`** - WebRTC offer from sender
3. **`answer`** - WebRTC answer from receiver
4. **`ice-candidate`** - ICE candidate for NAT traversal
5. **`overlay-data`** - Face landmarks and overlay data for peer

---

#### **Method: `handleJoinMeeting`**

```typescript
handleJoinMeeting(socket: Socket, meetingId: string, name: string): void
```

**Purpose:** Manages user joining a meeting with 2-person limit

**Logic:**

- **0 participants:** Create new meeting room
- **1 participant:** Add user and place in waiting state
- **2 participants:** Reject (meeting full)
- **On 2nd user join:** Create WebRTC room and initiate connection

**Emits:**

- `waiting` - To first user when alone in meeting
- `partner-connected` - To both users when second joins
- `error` - If meeting is full

---

#### **Method: `handleOverlayData`**

```typescript
handleOverlayData(
  socket: Socket,
  meetingId: string,
  landmarks: any,
  overlayUrl: string | null,
  opacity: number | null
): void
```

**Purpose:** Forwards face landmarks, overlay URL, and opacity to peer

**Process:**

1. Finds other participant in meeting
2. Emits overlay-data to peer with landmarks, URL, and opacity

**Use Case:** Enables real-time face overlay rendering on remote peer's video

---

#### **Method: `removeUser`**

```typescript
removeUser(socketId: string): void
```

**Purpose:** Cleans up user disconnection

**Process:**

1. Removes user from users array
2. Removes from all meeting rooms
3. Notifies remaining participants
4. Cleans up empty meetings

**Emits:**

- `user-disconnected` - To remaining participant when peer leaves

---

#### **File: `roomManager.ts`**

Manages WebRTC room creation and SDP/ICE signaling.

#### **Class: `roomManager`**

**Properties:**

- `rooms: Map<string, Room>` - Maps roomId to Room object containing two users

**Room Type:**

```typescript
type Room = {
  user1: User;
  user2: User;
};
```

---

#### **Method: `createRoom`**

```typescript
createRoom(user1: User, user2: User, meetingId: string): void
```

**Purpose:** Creates a WebRTC room and initiates connection

**Process:**

1. Creates room with both users
2. Waits 500ms for clients to be ready
3. Emits `send-offer` to user1 to create WebRTC offer

**Timing:** 500ms delay ensures clients have set up peer connections before signaling begins

---

#### **Method: `onOffer`**

```typescript
onOffer(roomId: string, sdp: string, sendingSocketId: string): void
```

**Purpose:** Forwards WebRTC offer from sender to receiver

**Process:**

1. Identifies which user sent the offer
2. Forwards offer SDP to the other user

**Emits:** `offer` event with SDP to receiving user

---

#### **Method: `onAnswer`**

```typescript
onAnswer(roomId: string, sdp: string, sendingSocketId: string): void
```

**Purpose:** Forwards WebRTC answer from receiver back to sender

**Process:**

1. Identifies which user sent the answer
2. Forwards answer SDP to the other user

**Emits:** `answer` event with SDP to original offer sender

---

#### **Method: `onIceCandidate`**

```typescript
onIceCandidate(
  roomId: string,
  sendingSocketId: string,
  candidate: any,
  type: "sender" | "receiver"
): void
```

**Purpose:** Forwards ICE candidates for NAT traversal

**Process:**

1. Identifies which user sent the candidate
2. Forwards to the other user for peer connection

**Emits:** `add-ice-candidate` event to receiving user

**ICE Candidate Purpose:** Enables peers to discover network paths through NATs and firewalls

---

#### **File: `user.ts`**

Type definition for user connections.

```typescript
import { Socket } from 'socket.io';

export type User = {
  name: string;
  socket: Socket;
};
```

---

#### **File: `room.ts`**

Type definition for WebRTC rooms.

```typescript
import type { User } from './user.js';

export type Room = {
  user1: User;
  user2: User;
};
```

---

## Frontend Architecture

### React Pages

#### **File: `Start.tsx`**

Landing page for unauthenticated users.

**Features:**

- Welcome message with gradient background
- "Get Started" button navigates to login
- Decorative background blobs for visual appeal

**Navigation:** Routes to `/login`

---

#### **File: `Login.tsx`**

User authentication page.

**Features:**

- Email and password input fields
- Supabase authentication integration
- Auto-redirect if already logged in
- Loading state during sign-in
- Error handling with alerts

**Navigation:**

- Success → `/menu`
- Sign Up link → `/signup`
- Forgot Password → `/forgot-password`
- Guest Join → `/join-as-guest`

**Authentication Flow:**

```typescript
const { error } = await supabase.auth.signInWithPassword({
  email: email.trim(),
  password: pw.trim(),
});
```

---

#### **File: `Signup.tsx`**

User registration page.

**Features:**

- Full name (split into first/last)
- Email and password fields
- Password confirmation with validation
- Real-time password match checking
- API call to create user

**Validation:**

- Passwords must match
- All fields required
- Submit button disabled until valid

**API Call:**

```typescript
POST / api / create - user;
Body: {
  full_name, email, password;
}
```

**Navigation:** Success → `/login`

---

#### **File: `Menu.tsx`**

Main dashboard for authenticated users.

**Features:**

- Create Meeting button
- Join Meeting button
- Calendar view button
- Overlays management button
- Profile button (top right)

**Navigation Routes:**

- Create Meeting → `/create-meeting`
- Join Meeting → `/join-meeting`
- Calendar → `/calendar`
- Overlays → `/overlays`
- Profile → `/account-details`

**Protected:** Requires authentication via `AuthComponent`

---

#### **File: `CreateMeeting.tsx`**

Meeting creation interface.

**Features:**

- Meeting title input
- Date picker (DateField component)
- Time selector (TimeSelect component)
- Auto-generates meeting code based on date, time, and user ID
- Creates meeting via API

**Props (Optional):**

- `onCreate?: (payload) => void` - Callback after successful creation
- `onBack?: () => void` - Custom back navigation

**Default Behavior:**

- Auto-generates title: "Untitled Meeting"
- Default time: 10:00 AM
- Default date: Today

**API Call:**

```typescript
POST / api / schedule - meeting;
Body: {
  meeting_code, meeting_time, meeting_title;
}
```

**Navigation:** Success → `/meeting-details/{meetingId}`

---

#### **File: `EditMeeting.tsx`**

Meeting editing interface.

**Route:** `/edit-meeting/:meetingId`

**Features:**

- Pre-fills form with existing meeting data
- Updates meeting title, date, and time
- Regenerates meeting code if date/time changes
- Timezone conversion (UTC ↔ Local)

**Data Loading:**

1. Finds meeting in context by ID
2. If not found, refreshes data once
3. Converts UTC time to local timezone for display

**API Call:**

```typescript
PUT /api/update-meeting/:meetingId
Body: { meeting_title, meeting_time, meeting_code }
```

**Navigation:** Success → `/meeting-details/{meetingId}`

---

#### **File: `MeetingDetails.tsx`**

Detailed view of a specific meeting.

**Route:** `/meeting-details/:meetingId`

**Features:**

- Displays meeting title, time, and code
- "Copy Meeting Link" button with success feedback
- "Join Meeting" button
- "Edit Meeting" button
- "Delete Meeting" button with confirmation dialog

**Time Display:**

- Converts UTC to local timezone
- Formats as: "Wednesday, December 25, 2024 at 3:30 PM"

**Meeting Link Format:**

```
{window.location.origin}/meet/{meeting_code}
```

**Delete Confirmation:**

- Modal overlay with "Are you sure?" prompt
- Prevents accidental deletion

---

#### **File: `Calendar.tsx`**

Monthly calendar view of all meetings.

**Features:**

- Full month grid layout
- Highlights current day
- Shows meetings on their scheduled dates
- Click date to view meeting details in sidebar
- Navigation between months (prev/next buttons)

**Time Conversion:**

- Stores meetings in UTC
- Displays in user's local timezone
- Groups meetings by local date

**Calendar Display:**

- 7 columns (Sunday - Saturday)
- Proper week alignment
- Previous/next month overflow dates
- Visual highlighting for today and selected date

---

#### **File: `JoinMeeting.tsx`**

Meeting joining interface for both authenticated and guest users.

**Features:**

- Text input for meeting link or code
- Link parsing (extracts meeting ID from various URL formats)
- Direct ID input support

**Link Formats Supported:**

- Full URL: `https://app.com/meet/abc123`
- Path only: `/meet/abc123`
- Query param: `?meetingId=abc123`
- Raw ID: `abc123`

**Validation:**

- Requires 6+ alphanumeric characters
- Extracts ID using regex patterns

**Navigation:** Success → `/meet/{meetingId}`

---

#### **File: `MeetingPage.tsx`**

Pre-meeting lobby with device preview.

**Route:** `/meet/:meetingId`

**Features:**

- Name input field
- Local video preview
- Audio/video toggle controls
- User icon when video disabled
- "Join Meeting" button
- Loads user overlays if authenticated

**Media Setup:**

```typescript
const stream = await navigator.mediaDevices.getUserMedia({
  video: { width: 1280, height: 720 },
  audio: true,
});
```

**Authentication Check:**

- Checks if user is logged in via Supabase
- If authenticated, loads user's custom overlays
- Guest users get default overlay only

**Navigation:** Join → Renders `Room` component

---

#### **File: `Overlays.tsx`**

Overlay management page for authenticated users.

**Features:**

- Grid display of user's uploaded overlays
- File upload with drag & drop
- Delete overlay with confirmation
- Image preview in grid
- File type validation

**Upload Process:**

1. User selects/drops image file
2. Validates file type (PNG, JPG, GIF, WEBP)
3. Uploads via FormData to API
4. Refreshes overlay list on success

**API Calls:**

```typescript
POST /api/upload-overlay (FormData with file)
DELETE /api/delete-overlay/:overlayId
```

**Grid Layout:**

- Responsive grid (2-4 columns)
- Hover effects
- Delete button overlay

---

#### **File: `AccountDetails.tsx`**

User account management page.

**Features:**

- Display current full name and email
- Edit full name functionality
- Sign out button
- Delete account button with confirmation

**Edit Name Flow:**

1. Click "Edit Name" → Shows input field
2. Enter new name
3. Save → Updates via API
4. Cancel → Reverts to original

**API Calls:**

```typescript
PUT / api / update - user - name;
Body: {
  full_name;
}

DELETE / api / delete -user;
```

**Danger Zone:**

- Delete account button in red
- Confirmation dialog before deletion
- Permanently removes all user data

---

#### **File: `ForgotPassword.tsx`**

Password reset request page.

**Features:**

- Email input field
- Sends password reset email via Supabase
- Success/error message display
- Back to login link

**Supabase Call:**

```typescript
await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/reset-password`,
});
```

---

#### **File: `ResetPassword.tsx`**

Password reset confirmation page (accessed via email link).

**Route:** `/reset-password?token=<token>`

**Features:**

- New password input
- Confirm password input
- Password validation (8+ characters)
- Match validation
- Token extraction from URL

**API Call:**

```typescript
POST / api / auth / reset - password / confirm;
Body: {
  token, password;
}
```

**Navigation:** Success → `/login`

---

#### **File: `Landing.tsx`**

Alternative landing page with instant meeting creation.

**Features:**

- "Create Meeting" - Generates random meeting ID and navigates
- "Enter Code" - Shows input field for joining existing meeting
- Meeting code input with validation
- "Join" button (disabled until code entered)

**Random ID Generation:**

```typescript
const meetingId = Math.random().toString(36).substring(2, 15);
navigate(`/meet/${meetingId}`);
```

**Navigation:**

- Create → `/meet/{randomId}`
- Join → `/meet/{enteredCode}`

---

### React Components

#### **File: `Room.tsx`**

Core video meeting component with WebRTC and face overlay rendering.

**Props:**

- `name: string` - User's display name
- `localAudioTrack: MediaStreamTrack` - User's audio track
- `localVideoTrack: MediaStreamTrack` - User's video track
- `meetingId: string` - Meeting identifier
- `userOverlays: Overlay[]` - Available overlays

**States:**

- `lobby: boolean` - Waiting for second participant
- `connected: boolean` - WebRTC connection established
- `remoteLandmarks: any` - Peer's face landmarks for overlay
- `localOverlayEnabled: boolean` - Toggle local overlay
- `audioEnabled/videoEnabled: boolean` - Media controls
- `localOverlayOpacity: number` - Local overlay transparency (0-1)
- `remoteOverlayOpacity: number` - Remote overlay transparency
- `selectedOverlayUrl: string` - Currently selected overlay
- `remoteOverlayUrl: string` - Peer's selected overlay

**Key Features:**

**1. Socket.IO Connection**

```typescript
const socket = io(URL, {
  transports: ['websocket', 'polling'],
  withCredentials: true,
  reconnection: true,
});
```

**2. WebRTC Setup**

```typescript
const pc = new RTCPeerConnection({
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
});
```

**3. MediaPipe Face Detection**

```typescript
const faceMesh = new FaceMesh({
  locateFile: (file) =>
    `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
});

faceMesh.setOptions({
  maxNumFaces: 1,
  refineLandmarks: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5,
});
```

**4. Overlay Rendering**

- Extracts face bounding box from MediaPipe landmarks
- Draws overlay image scaled to face dimensions
- Applies opacity (0.7 default, adjustable 0.2-1.0)
- Separate canvases for local and remote video

**Socket Events Handled:**

- `waiting` - Alone in meeting
- `partner-connected` - Peer joined
- `send-offer` - Create WebRTC offer
- `offer` - Receive WebRTC offer
- `answer` - Receive WebRTC answer
- `add-ice-candidate` - Add ICE candidate
- `overlay-data` - Receive peer's face landmarks and overlay
- `user-disconnected` - Peer left

**Socket Events Emitted:**

- `join-meeting` - Enter meeting room
- `offer` - Send WebRTC offer
- `answer` - Send WebRTC answer
- `ice-candidate` - Send ICE candidate
- `overlay-data` - Send face landmarks, overlay URL, and opacity

**Media Controls:**

- Toggle audio (mute/unmute)
- Toggle video (show/hide)
- Leave meeting (stops all streams)

**Overlay Controls:**

- Toggle overlay on/off
- Select different overlay from OverlaySelector
- Adjust opacity with slider

**Lobby State:**

- Displays waiting message
- Shows meeting ID and copy link button
- Waiting for second participant

**Active Call State:**

- Local video with overlay (bottom left)
- Remote video with overlay (main view)
- Control buttons (audio, video, overlay, leave)
- Overlay selector button
- Opacity slider

---

#### **File: `Navbar.tsx`**

Top navigation bar for authenticated users.

**Features:**

- Brand logo ("Real Mask")
- Menu link
- Overlays link
- Profile button (circular avatar)

**Active State:**

- Underline effect on active route
- Text color change (slate-300 → white)

**Styling:**

- Fixed position at top
- Semi-transparent background with backdrop blur
- Z-index 9999 for overlay priority

---

#### **File: `GuestNavBar.tsx`**

Simplified navigation for non-authenticated users.

**Features:**

- Brand logo only
- No menu or profile links
- Same styling as main Navbar

---

#### **File: `PageBackground.tsx`**

Consistent background wrapper for all pages.

**Features:**

- Dark gradient background (#0F172A)
- Animated gradient blobs (indigo and fuchsia)
- Wraps page content as children

**Styling:**

```css
background: #0F172A (dark blue-gray)
Blob 1: Indigo gradient with blur
Blob 2: Fuchsia gradient with blur
```

---

#### **File: `AuthComponent.tsx`**

Authentication wrapper component.

**Purpose:** Protects routes requiring authentication

**Functionality:**

1. Checks for active Supabase session
2. If no session → Redirects to `/login`
3. If session exists → Renders children
4. Listens for auth state changes

**Usage:**

```tsx
<AuthComponent>
  <AppDataProvider>
    <ProtectedPage />
  </AppDataProvider>
</AuthComponent>
```

**Loading State:** Shows "Loading..." while checking auth

---

#### **File: `OverlaySelector.tsx`**

Modal for selecting overlays during a meeting.

**Props:**

- `overlays: Overlay[]` - Available overlays
- `currentSelected: string` - Currently active overlay URL
- `onSelect: (overlay) => void` - Selection callback
- `isOpen: boolean` - Modal visibility
- `onClose: () => void` - Close callback

**Features:**

- Modal overlay with backdrop
- Grid layout of overlay thumbnails
- Highlights currently selected
- Click to select
- ESC key to close
- Click backdrop to close

**Styling:**

- Semi-transparent backdrop
- Scrollable grid (if many overlays)
- Blue/purple gradient header
- Close button (X icon)

---

#### **File: `DateField.tsx`**

Date input component with custom styling.

**Props:**

- `value: Date` - Selected date
- `onChange: (date: Date) => void` - Change callback

**Features:**

- Date picker input
- Formats date as YYYY-MM-DD
- Custom dark theme styling

---

#### **File: `TimeSelect.tsx`**

Time selection dropdown component.

**Props:**

- `value: string` - Selected time (e.g., "10:00 AM")
- `onChange: (time: string) => void` - Change callback

**Features:**

- Dropdown with 30-minute intervals
- 12-hour format (AM/PM)
- Range: 12:00 AM - 11:30 PM

---

#### **File: `Field.tsx`**

Generic form field wrapper component.

**Props:**

- `label: string` - Field label
- `children: ReactNode` - Input element
- `error?: string` - Error message

**Features:**

- Consistent label styling
- Error message display
- Spacing and layout

---

#### **File: `TextField.tsx`**

Text input component with consistent styling.

**Props:**

- `value: string`
- `onChange: (value: string) => void`
- `placeholder?: string`
- `type?: string` - Input type (text, email, password)

**Features:**

- Dark theme styling
- Focus states
- Error states

---

#### **File: `CalendarWeek.tsx`**

Weekly calendar view component used in Calendar page.

**Props:**

- `meetings?: Meeting[]` - Array of meetings
- `heightClass?: string` - Custom height class
- `start?: Date` - Week start date
- `onDeleteMeeting?: (id) => Promise<>` - Delete callback

**Features:**

- Displays 7 days starting from `start` date
- Groups meetings by day
- Shows meeting time and title
- Click meeting to view details
- Delete button per meeting
- Highlights current day

**Time Conversion:**

- Converts UTC meeting times to local timezone
- Groups by local date

---

### Custom Hooks

#### **File: `useAppData.tsx`**

Context provider for global application state and API methods.

**Context Type:**

```typescript
type AppDataContextType = {
  meetings: Meeting[];
  overlays: Overlay[];
  userData: UserData;
  refreshData: () => Promise<void>;
  createMeeting: (code, time, title) => Promise<Result>;
  updateMeeting: (id, data) => Promise<Result>;
  deleteMeeting: (id) => Promise<Result>;
  uploadOverlay: (file) => Promise<Result>;
  deleteOverlay: (id) => Promise<Result>;
  updateUserName: (name) => Promise<Result>;
  deleteUser: () => Promise<Result>;
};
```

**State Management:**

- `meetings: Meeting[]` - User's scheduled meetings
- `overlays: Overlay[]` - User's custom overlays
- `userData: UserData` - User profile information

**API Methods:**

**1. `refreshData()`**
Fetches all user data from API and updates state.

**Process:**

1. Gets auth token from Supabase
2. Fetches meetings, overlays, and user data in parallel
3. Updates state with results

---

**2. `createMeeting()`**
Creates new meeting and updates local state.

**API:** `POST /api/schedule-meeting`

**Process:**

1. Sends meeting data to API
2. Adds new meeting to local state
3. Returns success/error result

---

**3. `updateMeeting()`**
Updates existing meeting.

**API:** `PUT /api/update-meeting/:id`

**Process:**

1. Sends updated data to API
2. Calls refreshData() to update state
3. Returns success/error result

---

**4. `deleteMeeting()`**
Deletes a meeting.

**API:** `DELETE /api/delete-meeting/:id`

**Process:**

1. Calls delete API
2. Removes meeting from local state
3. Returns success/error result

---

**5. `uploadOverlay()`**
Uploads new overlay file.

**API:** `POST /api/upload-overlay`

**Process:**

1. Creates FormData with file
2. Uploads to API
3. Calls refreshData() to get new overlay with URL
4. Returns success/error result

---

**6. `deleteOverlay()`**
Deletes an overlay.

**API:** `DELETE /api/delete-overlay/:id`

**Process:**

1. Calls delete API
2. Removes overlay from local state
3. Returns success/error result

---

**7. `updateUserName()`**
Updates user's full name.

**API:** `PUT /api/update-user-name`

**Process:**

1. Sends new name to API
2. Updates local userData state
3. Returns success/error result

---

**8. `deleteUser()`**
Permanently deletes user account.

**API:** `DELETE /api/delete-user`

**Process:**

1. Confirms deletion
2. Calls delete API
3. Signs out via Supabase
4. Navigates to start page
5. Returns success/error result

---

**Authentication Helper:**

```typescript
const getAuthToken = async (): Promise<string | null> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
};
```

**Data Loading:**

- Initial load on mount
- Automatic refresh after mutations
- Error handling for failed requests

**Provider Usage:**

```tsx
<AppDataProvider>
  <App />
</AppDataProvider>
```

**Hook Usage:**

```typescript
const { meetings, createMeeting, refreshData } = useAppData();
```

---

### Type Definitions

#### **File: `meetingType.ts`**

```typescript
export type Meeting = {
  id: number;
  owner_id: string;
  meeting_title: string;
  meeting_code: string;
  meeting_time: string; // ISO 8601 UTC string
};
```

**Usage:** Represents scheduled meetings throughout the application

---

#### **File: `overlayType.ts`**

```typescript
export type Overlay = {
  id?: number;
  title: string;
  url: string;
};

export const DEFAULT_OVERLAY: Overlay = {
  title: 'Default Mask',
  url: 'https://i.imgur.com/5Z8wBjV.png',
};
```

**Usage:**

- Represents overlay images for face masks
- Default overlay provided as fallback

---

#### **File: `userDataType.ts`**

```typescript
export type UserData = {
  id: string; // UUID
  full_name_enc: string; // Decrypted full name
  email_enc: string; // Decrypted email
};
```

**Note:** Despite `_enc` suffix, these are decrypted values returned from API (naming for DB consistency)

---

### Utility Functions

#### **File: `timeUtils.ts`**

Time conversion and formatting utilities.

#### **Function: `utcToLocal`**

```typescript
function utcToLocal(utcString: string): Date;
```

**Purpose:** Converts UTC datetime string to local Date object

**Example:**

```typescript
const local = utcToLocal('2024-12-25T15:30:00Z');
// Returns Date in user's timezone
```

---

#### **Function: `localToUtc`**

```typescript
function localToUtc(localDate: Date): string;
```

**Purpose:** Converts local Date to UTC ISO string

**Example:**

```typescript
const utc = localToUtc(new Date());
// Returns "2024-12-25T15:30:00.000Z"
```

---

#### **Function: `formatMeetingTime`**

```typescript
function formatMeetingTime(utcString: string): string;
```

**Purpose:** Formats UTC datetime as human-readable local time

**Example:**

```typescript
const formatted = formatMeetingTime('2024-12-25T15:30:00Z');
// Returns "Wednesday, December 25, 2024 at 3:30 PM"
```

---

#### **Function: `combineLocalDateTimeToUtc`**

```typescript
function combineLocalDateTimeToUtc(date: Date, timeString: string): string;
```

**Purpose:** Combines local date and time string into UTC ISO string

**Parameters:**

- `date` - Local Date object (date part only)
- `timeString` - Time string like "10:00 AM"

**Example:**

```typescript
const utc = combineLocalDateTimeToUtc(new Date(2024, 11, 25), '3:30 PM');
// Returns "2024-12-25T15:30:00.000Z"
```

---

#### **Function: `getDefaultDateTime`**

```typescript
function getDefaultDateTime(): { date: Date; timeString: string };
```

**Purpose:** Provides default date/time for meeting creation

**Returns:**

```typescript
{
  date: new Date(), // Today
  timeString: "10:00 AM"
}
```

---

#### **File: `GenerateMeetingCode.ts`**

Meeting code generation utility.

#### **Function: `generateMeetingCode`**

```typescript
function generateMeetingCode(date: Date, time: string, userId: number): string;
```

**Purpose:** Generates unique meeting code from date, time, and user ID

**Algorithm:**

1. Combines date + time + userId into string
2. Creates SHA-256 hash
3. Converts to base64
4. Takes first 8 characters
5. Replaces non-alphanumeric chars

**Example:**

```typescript
const code = generateMeetingCode(new Date(2024, 11, 25), '10:00 AM', 12345);
// Returns something like "aBcD1234"
```

**Uniqueness:** Same inputs always produce same code (deterministic)

---

#### **File: `supabaseAuth.tsx`**

Supabase client configuration.

```typescript
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

**Usage:** Provides configured Supabase client for authentication

---

## Testing Suite

### Backend Tests

#### **User Creation Tests** (`create_user.test.ts`)

- Missing field validation (full_name, email, password)
- Type validation (strings required)
- Empty string rejection
- Duplicate email handling
- Password validation
- Successful user creation

#### **User Data Tests** (`get_user_data.test.ts`)

- Authentication token validation
- Unauthorized access prevention
- User data retrieval
- Token stripping (Bearer prefix)
- Data decryption

#### **User Update Tests** (`update_user_name.test.ts`)

- Authentication required
- Name update validation
- Empty name rejection
- Type checking
- Successful update

#### **User Deletion Tests** (`delete_user.test.ts`)

- Authentication required
- Cascade deletion (files, profile, auth)
- Storage cleanup
- Error handling

#### **Meeting Creation Tests** (`schedule_meeting.test.ts`)

- Required field validation
- Authentication
- Successful creation
- Meeting code validation
- Optional title handling

#### **Meeting Retrieval Tests** (`get_all_meetings.test.ts`)

- Authentication required
- Meeting list retrieval
- Owner-specific filtering
- Time-based sorting

#### **Meeting Update Tests** (`update_meeting.test.ts`)

- Authentication and ownership validation
- Field update validation
- Type checking
- Optional meeting code
- Successful updates

#### **Meeting Deletion Tests** (`delete_meeting.test.ts`)

- Authentication and ownership validation
- Successful deletion
- Invalid ID handling

#### **Overlay Upload Tests** (`upload_overlay.test.ts`)

- File type validation
- Authentication required
- Successful upload
- Metadata creation
- Storage path sanitization

#### **Overlay Retrieval Tests** (`get_all_overlays.test.ts`)

- Authentication required
- Presigned URL generation
- Owner-specific filtering
- Empty overlay list handling

#### **Overlay Deletion Tests** (`delete_overlay.test.ts`)

- Authentication and ownership validation
- Storage and metadata deletion
- Invalid ID handling

#### **Encryption Tests** (`encrypt.test.ts`, `decrypt.test.ts`)

- Encryption output validation
- Random IV generation
- Decrypt-encrypt roundtrip
- Buffer format verification

---

### Frontend Tests

#### **Authentication Flow** (`user_authentication_flow.test.tsx`)

- Signup form validation
- Password matching
- Successful account creation
- Login with credentials
- Auto-redirect if logged in
- Complete signup → login → logout flow

#### **Account Management** (`accountDetails.test.tsx`)

- Name editing
- Save and cancel functionality
- Account deletion with confirmation

#### **Meeting Creation** (`createMeeting.test.tsx`)

- Form validation
- Meeting code generation
- Successful creation
- Navigation after creation

#### **Meeting Details** (`meetingDetails.test.tsx`)

- Meeting data display
- Copy link functionality
- Edit navigation
- Delete with confirmation

#### **Meeting Editing** (`editMeeting.test.tsx`)

- Pre-fill existing data
- Update validation
- Successful update
- Navigation after update

#### **Calendar** (`calendar.test.tsx`)

- Monthly view rendering
- Meeting display on dates
- Date selection
- Navigation between months

#### **Landing Page** (`landing.test.tsx`)

- Meeting ID generation
- Join code input
- Navigation to meeting

#### **Login Page** (`login.test.tsx`)

- Form validation
- Successful login
- Error handling
- Navigation

#### **Signup Page** (`signup.test.tsx`)

- Form validation
- Password matching
- Successful signup
- Navigation to login

#### **Overlay Management** (`overlays.test.tsx`)

- Overlay list display
- Upload functionality
- Delete with confirmation
- File validation

---

## Architecture Patterns

### Authentication Flow

1. User signs up → Backend creates auth user + encrypted profile
2. User logs in → Supabase returns session token
3. Token used in Authorization header for all API requests
4. AuthComponent checks session on route access

### Data Encryption

- Sensitive data (name, email) encrypted with AES-256-CBC
- Random IV per encryption
- Key derived from environment variable
- Encrypted data stored as JSON-stringified Buffer

### WebRTC Signaling

1. User A joins meeting → Socket connects → Sent to "waiting"
2. User B joins same meeting → Both receive "partner-connected"
3. Server triggers User A to create offer
4. User A creates offer → Sends to server → Server forwards to User B
5. User B creates answer → Sends to server → Server forwards to User A
6. Both exchange ICE candidates → NAT traversal established
7. Direct peer-to-peer connection formed

### Face Overlay Pipeline

1. MediaPipe processes video frames
2. Detects 478 face landmarks
3. Calculates bounding box from landmarks
4. Loads overlay image
5. Draws overlay scaled to face dimensions
6. Applies opacity (0.7 default)
7. Renders to canvas
8. Sends landmarks to peer via Socket.IO
9. Peer renders overlay using received landmarks

### State Management

- Global state in `AppDataContext`
- API methods co-located with state
- Automatic refresh after mutations
- Token management via Supabase session

---

## Security Measures

1. **Authentication**: Token-based with Supabase
2. **Authorization**: Owner-based access control for all operations
3. **Encryption**: AES-256-CBC for sensitive data at rest
4. **CORS**: Configured for specific origins
5. **Input Validation**: Type checking and required field validation
6. **SQL Injection Prevention**: Supabase parameterized queries
7. **Cascade Deletion**: Prevents orphaned records

---

## Database Schema

### Tables

**profiles**

- `id` (UUID, Primary Key) - Matches Supabase auth.users.id
- `full_name_enc` (JSONB) - Encrypted full name
- `email_enc` (JSONB) - Encrypted email
- `created_at` (Timestamp)

**meetings**

- `id` (Serial, Primary Key)
- `owner_id` (UUID, Foreign Key → profiles.id)
- `meeting_title` (Text)
- `meeting_code` (Text, Unique)
- `meeting_time` (Timestamp with Timezone)
- `created_at` (Timestamp)

**overlay-metadata**

- `id` (Serial, Primary Key)
- `owner_id` (UUID, Foreign Key → profiles.id)
- `title` (Text)
- `storage_path` (Text)
- `created_at` (Timestamp)

### Storage Buckets

**overlays**

- Path structure: `{owner_id}/{filename}`
- Supported formats: PNG, JPG, JPEG, GIF, WEBP
- Access: Presigned URLs (1 hour expiry)

---

## Environment Variables

### Backend

- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for admin operations
- `ENCRYPTION_KEY` - Secret key for data encryption

### Frontend

- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Anonymous/public key for client auth

---

## Dependencies

### Backend

- `express` - HTTP server framework
- `socket.io` - WebSocket server for WebRTC signaling
- `@supabase/supabase-js` - Supabase client
- `cors` - Cross-origin resource sharing
- `crypto` - Encryption (Node.js built-in)
- `multer` - File upload handling

### Frontend

- `react` - UI library
- `react-router-dom` - Client-side routing
- `@supabase/supabase-js` - Supabase client
- `socket.io-client` - WebSocket client
- `@mediapipe/face_mesh` - Face landmark detection
- `@mediapipe/camera_utils` - Camera utilities
- `lucide-react` - Icon library
- `date-fns` - Date formatting

---

## API Response Formats

### Success Responses

```typescript
{
  message: string,
  [dataKey]?: any
}
```

### Error Responses

```typescript
{
  error: string;
}
```

### Status Codes

- 200: Success
- 201: Created
- 400: Bad Request (validation error)
- 401: Unauthorized
- 404: Not Found
- 500: Internal Server Error

---

## WebRTC Connection States

1. **new** - Initial state
2. **connecting** - ICE candidates being exchanged
3. **connected** - Peer-to-peer connection established
4. **disconnected** - Connection lost (temporary)
5. **failed** - Connection failed permanently
6. **closed** - Connection intentionally closed

---

## MediaPipe Face Mesh

**Landmarks:** 478 3D points on face
**Key Points:**

- Eyes: 0-31
- Eyebrows: 70-105
- Nose: 1-9
- Mouth: 61-291
- Face Oval: 10-338

**Bounding Box Calculation:**

```typescript
const landmarks = results.multiFaceLandmarks[0];
const xs = landmarks.map((l) => l.x * videoWidth);
const ys = landmarks.map((l) => l.y * videoHeight);
const minX = Math.min(...xs);
const maxX = Math.max(...xs);
const minY = Math.min(...ys);
const maxY = Math.max(...ys);
```
