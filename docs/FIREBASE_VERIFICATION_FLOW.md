# Firebase Email Verification Flow

## Overview

This app uses **Firebase Client SDK** for email verification with **MongoDB** as the authoritative user database. Users must verify their email before being added to MongoDB.

## Architecture

### Registration Flow

```
User signs up
  → Firebase creates user (client SDK)
  → Firebase sends verification email
  → User stored in pending state (AsyncStorage)
  → User clicks email link
  → Firebase marks email as verified
  → App syncs user to MongoDB (backend validates emailVerified=true)
  → User can now log in
```

### Key Points

- **Firebase manages**: User creation, email verification
- **MongoDB stores**: User profile, habits, XP, etc. (only after verification)
- **Backend validates**: Every registration requires verified Firebase email
- **Password**: Optional in MongoDB for Firebase users

## Environment Setup

### Frontend (.env)

```bash
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyBwaH0WenuV_DNmSNM6gPz8QtxiIj6X_gk
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=habitx-ba1d8.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=habitx-ba1d8
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=habitx-ba1d8.firebasestorage.app
EXPO_PUBLIC_FIREBASE_APP_ID=1:1011701747502:android:e8d4eba5498b90eae674bf
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1011701747502
```

### Backend (.env)

```bash
# Frontend URL for verification links
FRONTEND_URL=https://your-production-frontend.example.com

# Firebase Admin SDK (place JSON in backend/credentials/firebase-adminsdk.json)
```

## Implementation Details

### 1. Registration (Frontend)

```typescript
// User registers → Firebase user created → verification email sent
// User NOT added to MongoDB until verified

await createFirebaseUser(email, password);
await sendVerificationToUser(firebaseUser);

// Store pending registration locally
await AsyncStorage.setItem(
  "pending_registration",
  JSON.stringify({
    username,
    email,
    firebaseUid,
    timestamp: Date.now(),
  })
);
```

### 2. Verification (User clicks email link)

```typescript
// Apply Firebase verification code
await applyFirebaseAction(oobCode);

// Get fresh ID token (emailVerified=true now)
const idToken = await getCurrentIdToken(true);

// Sync to MongoDB
await fetch("/auth/register", {
  headers: { Authorization: `Bearer ${idToken}` },
  body: JSON.stringify({ username, email, firebaseUid }),
});
```

### 3. Backend Validation

```typescript
// Backend ONLY creates MongoDB user if Firebase email verified
const firebaseUser = await admin.auth().getUser(decoded.uid);

if (!firebaseUser.emailVerified) {
  throw new Error("Email not verified");
}

// Create MongoDB user
const user = await User.create({
  username,
  email,
  firebaseUid,
  emailVerified: true,
});
```

## Testing Steps

1. **Register**: Enter credentials → Firebase user created, email sent
2. **Check Email**: Click verification link
3. **Verify**: App syncs to MongoDB
4. **Login**: Now can log in with credentials

## Security

- ✅ `firebase-adminsdk.json` never committed (in `.gitignore`)
- ✅ Backend validates `emailVerified=true` before MongoDB sync
- ✅ Firebase API key is public (safe in client)
- ✅ ID tokens verified with Admin SDK on backend

## Files Changed

### Frontend

- `lib/firebase.ts` - Firebase client init
- `lib/auth.ts` - Registration flow (pending → verified)
- `lib/authContext.tsx` - No auto-login on register
- `app/verify-email.tsx` - Verification handler
- `components/auth/RegisterScreen.tsx` - "Check email" alert

### Backend

- `backend/src/controllers/authController.ts` - Email verification gate
- `backend/src/models/User.ts` - Password optional, firebaseUid field
- `backend/credentials/firebase-adminsdk.json` - Service account (add manually)
