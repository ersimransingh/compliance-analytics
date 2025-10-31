# Compliance Analytics - Setup Guide

## Project Setup Complete! ✓

### Installed Dependencies
- ✓ Firebase (for Firestore database)
- ✓ Axios (for API calls)
- ✓ Moment (for date formatting)
- ✓ React Router DOM (for navigation)

## Firebase Configuration

To complete the Firebase setup, you need to:

1. **Create a Firebase Project:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Add Project"
   - Follow the setup wizard

2. **Enable Firestore Database:**
   - In your Firebase project, go to "Firestore Database"
   - Click "Create Database"
   - Choose production mode or test mode
   - Select a location for your database

3. **Get Your Configuration:**
   - Go to Project Settings (gear icon)
   - Scroll down to "Your apps"
   - Click on the web app icon (</>)
   - Copy the Firebase configuration object

4. **Update the Configuration File:**
   - Open `src/firebaseConfig.ts`
   - Replace the placeholder values with your actual Firebase configuration:
     ```typescript
     const firebaseConfig = {
       apiKey: "YOUR_API_KEY",
       authDomain: "YOUR_AUTH_DOMAIN",
       projectId: "YOUR_PROJECT_ID",
       storageBucket: "YOUR_STORAGE_BUCKET",
       messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
       appId: "YOUR_APP_ID"
     };
     ```

## Running the Application

```bash
npm run dev
```

The application will start on `http://localhost:5173` (or another port if 5173 is busy).

## Features Implemented

### 1. Login Page (`/login`)
- Email and password input fields
- Beautiful Tailwind CSS styling with gradient background
- Form validation
- API integration with ComplianceSutra login endpoint
- Error handling and loading states
- Redirects to dashboard after successful login

### 2. Dashboard Page (`/dashboard`)
- Protected route (requires authentication)
- Welcome section
- Stats cards showing:
  - Total Compliance
  - Pending items
  - Completed items
  - Overdue items
- Recent Activity section
- Current date and time display using Moment.js
- Logout functionality

### 3. Authentication Flow
- Login redirects to `/dashboard` on success
- Protected routes redirect to `/login` if not authenticated
- User data stored in localStorage
- Root path (`/`) redirects to login

### 4. Firebase Integration
- Firestore database configured
- Authentication module ready
- Configuration file set up (needs your credentials)

## Project Structure

```
src/
├── pages/
│   ├── Login.tsx       # Login page with form
│   └── Dashboard.tsx   # Dashboard with stats
├── firebaseConfig.ts   # Firebase configuration
└── App.tsx            # Routing configuration
```

## API Integration

The login uses the ComplianceSutra API:
- **Endpoint:** `https://prd.compliancesutra.com/api/method/compliance.api.Login`
- **Method:** POST
- **Payload:** `{ email, password }`

## Next Steps

1. Add your Firebase configuration to `src/firebaseConfig.ts`
2. Run the development server with `npm run dev`
3. Test the login with your credentials
4. Customize the dashboard with real data from Firestore
