# Frontend Integration Tests Plan

## Overview

This document outlines all integration tests needed for the frontend React application. These tests validate complete user workflows through the UI while interacting with the real backend API.

---

## Test Environment Setup

### Required Dependencies

```json
{
  "@testing-library/react": "^14.x",
  "@testing-library/jest-dom": "^6.x",
  "@testing-library/user-event": "^14.x",
  "msw": "^2.x",
  "jest": "^29.x"
}
```

### Test Configuration

- **Real Backend API**: Tests should run against a test backend instance
- **Real Supabase**: Use test Supabase project or mock Supabase auth
- **Router**: Use MemoryRouter for navigation testing
- **Cleanup**: Clear test data after each test suite

---

## 1. **User Authentication Flow**

### Test Suite: `frontend_authentication_flow.test.tsx`

**User Journey:** Complete signup → login → logout flow

#### Test Cases (15 tests)

**Signup Page Tests:**

1. **Successfully create new user account**

   - Fill all signup form fields with valid data
   - Submit form
   - Verify API call to `/api/create-user`
   - Verify navigation to `/login`

2. **Display validation error when passwords don't match**

   - Fill form with mismatched passwords
   - Blur password confirm field
   - Verify error message displayed
   - Verify submit button disabled

3. **Display API error on duplicate email**

   - Fill form with existing email
   - Submit form
   - Verify error message displayed
   - Verify all fields cleared

4. **Disable submit button with empty fields**

   - Leave fields empty
   - Verify submit button is disabled

5. **Handle network errors gracefully**
   - Mock network failure
   - Submit form
   - Verify error message displayed
   - Verify fields cleared

**Login Page Tests:**

6. **Successfully login with valid credentials**

   - Fill login form with valid credentials
   - Submit form
   - Verify Supabase auth called
   - Verify navigation to `/menu`

7. **Display error on invalid credentials**

   - Fill form with wrong password
   - Submit form
   - Verify error alert displayed
   - Verify fields cleared

8. **Redirect to menu if already logged in**

   - Mock existing session
   - Render login page
   - Verify immediate redirect to `/menu`

9. **Show loading state during login**

   - Fill form and submit
   - Verify "Signing In..." text displayed
   - Verify button disabled during loading

10. **Navigate to signup page when clicking signup button**

    - Click "Sign Up" button
    - Verify navigation to `/signup`

11. **Navigate to forgot password page**

    - Click "Forgot Password?" link
    - Verify navigation to `/forgot-password`

12. **Navigate to guest join page**
    - Click "Join meeting as guest" button
    - Verify navigation to `/join-as-guest`

**Complete Flow Tests:**

13. **Complete signup to login flow**

    - Register new user on signup page
    - Verify redirect to login
    - Login with same credentials
    - Verify successful login and redirect to menu

14. **Logout and re-login flow**

    - Login successfully
    - Navigate to account details
    - Logout
    - Verify redirect to login
    - Login again
    - Verify successful re-authentication

15. **Session persistence across page refreshes**
    - Login successfully
    - Simulate page refresh
    - Verify user remains authenticated
    - Verify no redirect to login

---

## 2. **Account Management Flow**

### Test Suite: `frontend_account_management.test.tsx`

**User Journey:** Profile viewing → name update → account deletion

#### Test Cases (12 tests)

**Profile Data Display:**

1. **Display user profile data on account details page**

   - Login as test user
   - Navigate to `/account-details`
   - Verify name displayed correctly
   - Verify email displayed correctly

2. **Load profile data on component mount**
   - Mock useAppData to track calls
   - Render AccountDetails
   - Verify refreshData called on mount

**Name Update:**

3. **Successfully update user full name**

   - Navigate to account details
   - Change name in input field
   - Click "Save" button
   - Verify success message displayed
   - Verify name persists after refresh

4. **Show save button only when name changed**

   - Navigate to account details
   - Verify save button disabled initially
   - Change name
   - Verify save button enabled

5. **Disable save button with empty name**

   - Navigate to account details
   - Clear name field
   - Verify save button disabled

6. **Handle name update API failure**

   - Mock API failure
   - Try to update name
   - Verify error alert displayed
   - Verify name not changed

7. **Trim whitespace from name input**
   - Enter name with leading/trailing spaces
   - Save name
   - Verify spaces trimmed in display
   - Verify API called with trimmed name

**Account Deletion:**

8. **Show confirmation dialog before account deletion**

   - Click "Delete Account" button
   - Verify confirmation dialog appears
   - Cancel deletion
   - Verify still on account details page

9. **Successfully delete account**

   - Click "Delete Account" button
   - Confirm deletion in dialog
   - Verify API call to delete user
   - Verify logout called
   - Verify redirect to login page

10. **Handle account deletion API failure**
    - Mock API failure
    - Try to delete account
    - Verify error alert displayed
    - Verify still logged in
    - Verify still on account details page

**Logout:**

11. **Successfully logout from account details**

    - Navigate to account details
    - Click "Logout" button
    - Verify Supabase signOut called
    - Verify redirect to login page

12. **Call optional onLogout callback if provided**
    - Render with onLogout prop
    - Click logout
    - Verify callback was called

---

## 3. **Meeting Lifecycle Flow**

### Test Suite: `frontend_meeting_lifecycle.test.tsx`

**User Journey:** Create meeting → View in calendar → Edit meeting → Delete meeting

#### Test Cases (18 tests)

**Create Meeting:**

1. **Successfully create new meeting**

   - Navigate to `/create-meeting`
   - Fill meeting title
   - Select date and time
   - Submit form
   - Verify API call to create meeting
   - Verify navigation to meeting details

2. **Disable create button with empty title**

   - Navigate to create meeting page
   - Leave title empty
   - Verify button disabled

3. **Show error for duplicate meeting time**

   - Create meeting at specific time
   - Try to create another at same time
   - Verify error message displayed
   - Verify meeting not created

4. **Generate unique meeting code**

   - Create meeting
   - Verify meeting code generated
   - Verify code is unique

5. **Default to next 15-minute interval**
   - Navigate to create meeting page
   - Verify time defaults to next 15-min slot

**View Meetings:**

6. **Display meetings in calendar view**

   - Create 3 meetings on different dates
   - Navigate to `/calendar`
   - Verify all meetings displayed
   - Verify correct dates shown

7. **Display meetings in menu page**

   - Create 2 meetings
   - Navigate to `/menu`
   - Verify meetings listed
   - Verify sorted chronologically

8. **Show empty state when no meetings**

   - Delete all meetings
   - Navigate to calendar
   - Verify empty state displayed

9. **Click meeting navigates to details**
   - Create meeting
   - Click on meeting in calendar
   - Verify navigation to `/meeting-details/:id`
   - Verify meeting details displayed

**Edit Meeting:**

10. **Successfully edit meeting title**

    - Create meeting
    - Navigate to edit page
    - Change title
    - Save changes
    - Verify API call to update
    - Verify new title displayed

11. **Successfully edit meeting time**

    - Create meeting
    - Navigate to edit page
    - Change time
    - Save changes
    - Verify time updated in calendar

12. **Show error when editing to duplicate time**

    - Create meeting A at 10:00 AM
    - Create meeting B at 11:00 AM
    - Edit meeting B to 10:00 AM
    - Verify error displayed
    - Verify meeting not updated

13. **Load meeting data on edit page mount**

    - Create meeting
    - Navigate to edit page
    - Verify form pre-filled with meeting data

14. **Handle meeting not found on edit page**
    - Navigate to edit page with invalid ID
    - Verify error message displayed

**Delete Meeting:**

15. **Successfully delete meeting from details page**

    - Create meeting
    - Navigate to details page
    - Click delete button
    - Confirm deletion
    - Verify API call to delete
    - Verify navigation to menu

16. **Show confirmation before deleting meeting**

    - Navigate to meeting details
    - Click delete
    - Verify confirmation dialog
    - Cancel deletion
    - Verify still on details page

17. **Remove meeting from calendar after deletion**
    - Create meeting
    - View in calendar
    - Delete meeting
    - Navigate back to calendar
    - Verify meeting no longer displayed

**Complete Flow:**

18. **Complete meeting CRUD flow**
    - Create meeting
    - View in calendar
    - Edit meeting details
    - View updated details
    - Delete meeting
    - Verify no longer in calendar

---

## 4. **Overlay Management Flow**

### Test Suite: `frontend_overlay_management.test.tsx`

**User Journey:** View overlays → Upload new overlay → Delete overlay

#### Test Cases (12 tests)

**View Overlays:**

1. **Display all user overlays on overlays page**

   - Upload 3 overlays
   - Navigate to `/overlays`
   - Verify all 3 overlays displayed
   - Verify images rendered correctly

2. **Show empty state when no overlays**

   - Navigate to overlays page with no overlays
   - Verify empty state message displayed

3. **Display overlay thumbnails with correct URLs**
   - Upload overlay
   - Navigate to overlays page
   - Verify image src uses presigned URL
   - Verify image loads correctly

**Upload Overlay:**

4. **Successfully upload new overlay**

   - Navigate to overlays page
   - Click upload button
   - Select image file
   - Verify upload progress indicator
   - Verify API call to upload
   - Verify new overlay appears in list

5. **Show file size validation error**

   - Try to upload file > 10MB
   - Verify error message displayed
   - Verify upload rejected

6. **Show file type validation error**

   - Try to upload non-image file
   - Verify error message displayed
   - Verify upload rejected

7. **Handle upload API failure**

   - Mock API failure
   - Try to upload overlay
   - Verify error message displayed
   - Verify overlay not added to list

8. **Display upload progress during upload**

   - Start overlay upload
   - Verify loading indicator shown
   - Verify upload button disabled during upload

9. **Refresh overlay list after successful upload**
   - Upload new overlay
   - Verify refreshData called
   - Verify new overlay in list with ID and URL

**Delete Overlay:**

10. **Successfully delete overlay**

    - Upload overlay
    - Click delete button on overlay
    - Confirm deletion
    - Verify API call to delete
    - Verify overlay removed from list

11. **Show confirmation before deleting overlay**

    - Click delete on overlay
    - Verify confirmation dialog appears
    - Cancel deletion
    - Verify overlay still in list

12. **Handle delete API failure**
    - Mock API failure
    - Try to delete overlay
    - Verify error message displayed
    - Verify overlay still in list

---

## 5. **Navigation & Routing Flow**

### Test Suite: `frontend_navigation_routing.test.tsx`

**User Journey:** Test all navigation paths and route protection

#### Test Cases (15 tests)

**Public Routes:**

1. **Access landing page without authentication**

   - Navigate to `/landing`
   - Verify page renders correctly
   - Verify no redirect

2. **Access login page without authentication**

   - Navigate to `/login`
   - Verify page renders
   - Verify no redirect

3. **Access signup page without authentication**
   - Navigate to `/signup`
   - Verify page renders
   - Verify no redirect

**Protected Routes:**

4. **Redirect to login when accessing menu without auth**

   - Navigate to `/menu` without session
   - Verify redirect to `/login`

5. **Redirect to login when accessing account details without auth**

   - Navigate to `/account-details` without session
   - Verify redirect to `/login`

6. **Redirect to login when accessing create meeting without auth**

   - Navigate to `/create-meeting` without session
   - Verify redirect to `/login`

7. **Redirect to login when accessing calendar without auth**

   - Navigate to `/calendar` without session
   - Verify redirect to `/login`

8. **Allow access to protected routes when authenticated**
   - Login successfully
   - Navigate to `/menu`
   - Verify page renders without redirect

**Guest Routes:**

9. **Allow guest access to meeting page**

   - Navigate to `/meet/:meetingId` without auth
   - Verify page renders
   - Verify lobby displayed

10. **Show limited features for guest users**
    - Access meeting as guest
    - Verify cannot create meetings
    - Verify cannot access overlays
    - Verify can only join meeting

**Navigation Between Pages:**

11. **Navigate from menu to create meeting**

    - Login and go to menu
    - Click create meeting button
    - Verify navigation to `/create-meeting`

12. **Navigate from menu to calendar**

    - Login and go to menu
    - Click calendar button
    - Verify navigation to `/calendar`

13. **Navigate from menu to overlays**

    - Login and go to menu
    - Click overlays button
    - Verify navigation to `/overlays`

14. **Navigate from menu to account details**

    - Login and go to menu
    - Click account/profile button
    - Verify navigation to `/account-details`

15. **Back button navigation works correctly**
    - Navigate menu → create meeting → back
    - Verify returned to menu
    - Verify state preserved

---

## 6. **Meeting Room & Video Flow**

### Test Suite: `frontend_meeting_room_video.test.tsx`

**User Journey:** Join meeting → Apply overlay → Toggle video/audio → Leave meeting

#### Test Cases (16 tests)

**Meeting Lobby:**

1. **Display meeting lobby with name input**

   - Navigate to meeting URL
   - Verify lobby displayed
   - Verify name input field present
   - Verify join button present

2. **Disable join button with empty name**

   - Enter meeting lobby
   - Leave name field empty
   - Verify join button disabled

3. **Request camera permissions on join**

   - Enter name and click join
   - Verify getUserMedia called
   - Verify camera permission requested

4. **Show error if camera permission denied**
   - Mock camera permission denied
   - Try to join meeting
   - Verify error message displayed
   - Verify stay in lobby

**Video Preview:**

5. **Display video preview in lobby**

   - Enter meeting lobby
   - Verify local video preview shown
   - Verify video stream active

6. **Toggle video in lobby**

   - Enter meeting lobby
   - Click video toggle button
   - Verify video preview stops
   - Verify button state changes

7. **Toggle audio in lobby**
   - Enter meeting lobby
   - Click audio toggle button
   - Verify microphone muted
   - Verify button state changes

**Overlay Selection:**

8. **Display available overlays in selector**

   - Upload 2 overlays as authenticated user
   - Join meeting
   - Open overlay selector
   - Verify overlays displayed
   - Verify default overlay shown

9. **Apply overlay to local video**

   - Join meeting
   - Select overlay
   - Verify overlay applied to local video
   - Verify face detection active

10. **Change overlay during meeting**

    - Join meeting with overlay A
    - Switch to overlay B
    - Verify overlay B applied
    - Verify peer sees updated overlay

11. **Remove overlay during meeting**
    - Join meeting with overlay
    - Select "No Overlay" option
    - Verify overlay removed
    - Verify clean video stream

**Meeting Room:**

12. **Successfully join meeting room**

    - Complete lobby flow
    - Click join
    - Verify entered meeting room
    - Verify local video displayed
    - Verify controls visible

13. **Display remote peer video**

    - User A joins meeting
    - User B joins same meeting
    - Verify User A sees User B's video
    - Verify User B sees User A's video

14. **Toggle video during meeting**

    - Join meeting
    - Click video toggle
    - Verify video stream stops
    - Verify peer sees video stopped
    - Toggle again
    - Verify video resumes

15. **Toggle audio during meeting**
    - Join meeting
    - Click audio toggle
    - Verify microphone muted
    - Verify peer doesn't hear audio
    - Toggle again
    - Verify audio resumes

**Leave Meeting:**

16. **Successfully leave meeting**
    - Join meeting
    - Click leave button
    - Verify media streams stopped
    - Verify WebRTC connection closed
    - Verify navigation away from meeting

---

## 7. **Error Handling & Edge Cases**

### Test Suite: `frontend_error_handling.test.tsx`

**User Journey:** Test error scenarios and edge cases

#### Test Cases (14 tests)

**Network Errors:**

1. **Handle API timeout gracefully**

   - Mock slow API response
   - Trigger API call
   - Verify loading state shown
   - Verify timeout error displayed

2. **Handle API 500 errors**

   - Mock server error
   - Trigger API call
   - Verify error message displayed
   - Verify user-friendly message shown

3. **Retry failed API requests**

   - Mock transient API failure
   - Trigger API call
   - Verify retry attempted
   - Verify eventual success or error

4. **Handle network disconnection**
   - Mock offline status
   - Try to submit form
   - Verify offline error displayed
   - Verify data not lost

**Session Expiry:**

5. **Handle expired auth token during API call**

   - Mock expired token
   - Make authenticated API call
   - Verify redirect to login
   - Verify session cleared

6. **Refresh token on expiry**
   - Mock token near expiry
   - Make API call
   - Verify token refreshed
   - Verify request succeeds

**Data Validation:**

7. **Handle invalid date/time selection**

   - Try to create meeting with past date
   - Verify error message displayed
   - Verify meeting not created

8. **Handle special characters in inputs**

   - Enter special characters in name field
   - Submit form
   - Verify characters handled correctly
   - Verify no crashes or errors

9. **Handle extremely long input values**
   - Enter 10,000 character name
   - Try to submit
   - Verify validation error or truncation
   - Verify no crashes

**Concurrent Operations:**

10. **Handle multiple simultaneous API calls**

    - Trigger 5 API calls at once
    - Verify all handled correctly
    - Verify no race conditions
    - Verify correct final state

11. **Handle rapid form submissions**
    - Submit form multiple times quickly
    - Verify duplicate submissions prevented
    - Verify button disabled during submission

**WebRTC Errors:**

12. **Handle WebRTC connection failure**

    - Mock WebRTC connection failure
    - Try to join meeting
    - Verify error message displayed
    - Verify user informed of issue

13. **Handle peer disconnection**
    - Join meeting with peer
    - Mock peer disconnect
    - Verify peer video removed
    - Verify local stream continues

**Missing Data:**

14. **Handle missing meeting data gracefully**
    - Navigate to meeting details with invalid ID
    - Verify error message displayed
    - Verify navigation to menu offered

---

## 8. **Accessibility & UX Flow**

### Test Suite: `frontend_accessibility_ux.test.tsx`

**User Journey:** Test keyboard navigation, screen readers, and UX patterns

#### Test Cases (12 tests)

**Keyboard Navigation:**

1. **Navigate signup form with keyboard only**

   - Tab through all form fields
   - Verify focus order correct
   - Verify can submit with Enter key

2. **Navigate menu with keyboard**

   - Use Tab and arrow keys
   - Verify all buttons accessible
   - Verify Enter key activates buttons

3. **Close modals with Escape key**
   - Open confirmation dialog
   - Press Escape
   - Verify modal closes

**Screen Reader Support:**

4. **Verify form labels properly associated**

   - Check all form inputs have labels
   - Verify label[for] matches input[id]
   - Verify screen reader can read labels

5. **Verify error messages announced**

   - Trigger validation error
   - Verify aria-live region updated
   - Verify error associated with field

6. **Verify button states announced**
   - Disable button
   - Verify aria-disabled attribute
   - Verify state change announced

**Focus Management:**

7. **Focus first field on page load**

   - Load signup page
   - Verify first name field focused

8. **Focus error message on validation failure**

   - Submit form with errors
   - Verify focus moves to error message

9. **Restore focus after modal close**
   - Open modal from button
   - Close modal
   - Verify focus returns to button

**Loading States:**

10. **Show loading indicator for async operations**

    - Trigger data fetch
    - Verify loading spinner displayed
    - Verify button disabled

11. **Disable interactions during loading**
    - Start form submission
    - Verify form fields disabled
    - Verify additional submissions blocked

**Responsive Design:**

12. **Verify mobile layout works correctly**
    - Set viewport to mobile size
    - Navigate through pages
    - Verify all features accessible
    - Verify no horizontal scroll

---

## 9. **State Management & Data Persistence**

### Test Suite: `frontend_state_management.test.tsx`

**User Journey:** Test state updates, data synchronization, and persistence

#### Test Cases (10 tests)

**AppDataProvider Context:**

1. **Provide user data to all child components**

   - Login successfully
   - Render components under AppDataProvider
   - Verify userData accessible in all components

2. **Refresh data updates all components**

   - Call refreshData
   - Verify API calls made
   - Verify all components re-render with new data

3. **Update operations refresh data automatically**
   - Update user name
   - Verify refreshData called automatically
   - Verify UI updates without manual refresh

**Local State Synchronization:**

4. **Sync meetings list after creation**

   - Create new meeting
   - Verify meetings list updated
   - Verify new meeting visible immediately

5. **Sync meetings list after deletion**

   - Delete meeting
   - Verify meetings list updated
   - Verify deleted meeting removed immediately

6. **Sync overlays list after upload**
   - Upload overlay
   - Verify overlays list updated
   - Verify new overlay visible immediately

**Cache Management:**

7. **Cache meeting details for fast access**

   - Load meeting details
   - Navigate away and back
   - Verify details load from cache
   - Verify no duplicate API call

8. **Invalidate cache after update**
   - Load meeting details
   - Update meeting
   - Load details again
   - Verify fresh data fetched

**Optimistic Updates:**

9. **Show optimistic update before API confirmation**

   - Update user name
   - Verify UI updates immediately
   - Verify API call made in background
   - Handle API failure and rollback

10. **Rollback optimistic update on API failure**
    - Update user name
    - Mock API failure
    - Verify update rolled back
    - Verify original data restored

---

## 10. **Performance & Load Testing**

### Test Suite: `frontend_performance.test.tsx`

**User Journey:** Test application performance under various conditions

#### Test Cases (8 tests)

**Large Data Sets:**

1. **Handle rendering 100+ meetings in calendar**

   - Create 100 meetings
   - Navigate to calendar
   - Verify page renders without lag
   - Verify no performance degradation

2. **Handle 50+ overlays in overlay list**
   - Upload 50 overlays
   - Navigate to overlays page
   - Verify page renders correctly
   - Verify images load efficiently

**Memory Management:**

3. **Clean up resources on unmount**

   - Mount component with timers/subscriptions
   - Unmount component
   - Verify no memory leaks
   - Verify timers cleared

4. **Clean up video streams on meeting exit**
   - Join meeting
   - Leave meeting
   - Verify all media streams stopped
   - Verify WebRTC connections closed

**Lazy Loading:**

5. **Lazy load meeting details on demand**

   - Navigate to calendar with many meetings
   - Verify not all details loaded initially
   - Click specific meeting
   - Verify details fetched only when needed

6. **Lazy load overlay images**
   - Navigate to overlays page
   - Verify images loaded progressively
   - Verify viewport-based loading

**Debouncing:**

7. **Debounce search/filter input**

   - Type rapidly in search field
   - Verify not every keystroke triggers API call
   - Verify final search executes after pause

8. **Throttle scroll events**
   - Scroll rapidly through meeting list
   - Verify scroll handler not called excessively
   - Verify smooth performance

---

## Summary

### Total Frontend Integration Tests: **132 tests**

| Test Suite                          | Test Count |
| ----------------------------------- | ---------- |
| User Authentication Flow            | 15         |
| Account Management Flow             | 12         |
| Meeting Lifecycle Flow              | 18         |
| Overlay Management Flow             | 12         |
| Navigation & Routing Flow           | 15         |
| Meeting Room & Video Flow           | 16         |
| Error Handling & Edge Cases         | 14         |
| Accessibility & UX Flow             | 12         |
| State Management & Data Persistence | 10         |
| Performance & Load Testing          | 8          |
| **TOTAL**                           | **132**    |

---

## Implementation Priority

### **High Priority** (Core User Flows)

1. User Authentication Flow ✅
2. Meeting Lifecycle Flow ✅
3. Account Management Flow ✅

### **Medium Priority** (Important Features)

4. Overlay Management Flow
5. Navigation & Routing Flow
6. Error Handling & Edge Cases

### **Low Priority** (Enhanced Testing)

7. Meeting Room & Video Flow (requires WebRTC mocking)
8. State Management & Data Persistence
9. Accessibility & UX Flow
10. Performance & Load Testing

---

## Testing Best Practices

### Test Structure

- Use descriptive test names with docstrings
- Group related tests in describe blocks
- Keep tests independent and isolated
- Clean up test data after each test

### Async Operations

- Always use `waitFor` for async updates
- Use `findBy` queries for async elements
- Set appropriate timeouts for API calls

### Mocking Strategy

- Mock external dependencies (WebRTC, getUserMedia)
- Use real backend API for integration tests
- Mock Supabase auth or use test instance
- Mock file uploads for overlay tests

### Assertions

- Verify API calls made with correct data
- Verify navigation occurred
- Verify UI updates correctly
- Verify error states handled

### Cleanup

- Delete test users after tests
- Clear test meetings and overlays
- Sign out after authenticated tests
- Reset mocks between tests

---

## Notes

- **WebRTC Testing**: Meeting room tests require sophisticated mocking of WebRTC APIs (`RTCPeerConnection`, `getUserMedia`, etc.)
- **Real Backend**: Tests assume a running backend server at `http://localhost:3000`
- **Test Data**: Use unique identifiers (timestamps) to avoid conflicts
- **Supabase Auth**: Tests may need to mock Supabase or use test credentials
- **File Uploads**: Overlay tests need to mock `File` objects and `FormData`

---

Would you like me to implement any specific test suite from this plan?
