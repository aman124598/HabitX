# Email Verification — Setup & Manual Testing

This project supports a secure Firebase-based email verification flow where:

- The client uses the Firebase Web SDK to create users and send verification emails.
- When the user clicks the verification link, the app applies the Firebase action code and then calls the backend with a Firebase ID token. The backend (using Firebase Admin SDK) verifies the ID token and marks the server-side user as verified.

Prerequisites
- A Firebase project with Web app configuration (API key, authDomain, projectId, appId).
- A Firebase service account JSON file placed at `backend/credentials/firebase-adminsdk.json` for the Admin SDK.
- Environment variables set for the frontend and backend (see below).

Environment variables (example)

Frontend (.env or Expo config):
- EXPO_PUBLIC_FIREBASE_API_KEY
- EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN
- EXPO_PUBLIC_FIREBASE_PROJECT_ID
- EXPO_PUBLIC_FIREBASE_APP_ID
- EXPO_PUBLIC_APP_URL (e.g. `exp://...` or `http://localhost:19006`)

Backend / Hosted configuration:
- FRONTEND_URL — (recommended) absolute URL of the frontend web/app used in verification links, e.g. `https://habit-tracker-frontend-2.onrender.com`. If set, verification/reset links in emails will point here instead of localhost. If omitted, the code falls back to a sensible production URL.

Backend (.env):
- FIREBASE_API_KEY (optional, for Dynamic Links)
- FIREBASE_DYNAMIC_LINK_DOMAIN (optional)
- BACKEND_URL (e.g. `http://localhost:10000`)
- Ensure `backend/credentials/firebase-adminsdk.json` exists and is a valid Firebase service account file.

How it works (high-level)
1. User registers in the app.
2. Frontend creates a Firebase user and sends a Firebase verification email (actionCodeSettings continue URL points to the app/web `verify-email` route).
3. Frontend then sends the Firebase ID token to the backend to create the server-side user record (backend stores `firebaseUid`).
4. When user clicks verification link, the app runs `applyActionCode(oobCode)` and then obtains a fresh ID token and POSTs it to `/api/auth/verify-email`.
5. Backend verifies the ID token with Firebase Admin SDK and marks the server user as verified.

Manual test steps (development)

1. Install dependencies (repo root):

```powershell
# from repo root (PowerShell)
yarn install
cd backend
npm install
```

2. Ensure `backend/credentials/firebase-adminsdk.json` exists.
3. Start backend in dev mode (requires env vars):

```powershell
cd backend
npm run dev
```

4. Start the app (Expo):

```powershell
# repo root
yarn start
```

5. Register a new user in the app with a real email you can access.
6. Check the verification email and click the link from a device/browser that opens the app (or open the link in the web/Expo web view). It should hit the app's `verify-email` route.
7. The app will apply the Firebase action code and call the backend `/api/auth/verify-email` endpoint with your Firebase ID token. The backend will verify the token and mark your account as verified.
8. Confirm by calling `GET /api/auth/me` (from the app or API client) to see `emailVerified: true` on the user record.

Troubleshooting
- If you get `Invalid Firebase verification token`, ensure the backend `firebase-adminsdk.json` is correct and the Admin SDK can be initialized.
- If verification email doesn't arrive, check backend logs for email send errors. The backend uses configured SMTP or SendGrid; ensure those env vars are set.
- For Dynamic Links: configure `FIREBASE_DYNAMIC_LINK_DOMAIN` and `FIREBASE_API_KEY` and follow Firebase Dynamic Links setup in the repo docs.

Security notes
- The backend verifies Firebase ID tokens using the Admin SDK — this prevents the frontend from forging verification.
- Keep `firebase-adminsdk.json` and other secrets out of source control.

If you want, I can now run the dependency installs and a backend build here and fix any TypeScript issues seen; say "run installs & build" and I'll execute the commands and iterate on any failures (I will report results and next steps).