# Habit X App 🎯

A modern, full-stack habit tracking application built with React Native, Expo Router, Node.js, Firebase Auth and MongoDB.

## Features ✨

- 🔐 **User Authentication** - Firebase-authenticated registration/login with MongoDB profile sync
- 📱 **Cross-Platform** - Works on iOS, Android, and Web
- 🎯 **Habit Management** - Create, track, and delete habits
- 📊 **Progress Tracking** - View streaks, success rates, and statistics
- 🎨 **Modern UI** - Clean, intuitive design with themed components
- 🔄 **Real-time Sync** - Data synced across devices
- 📈 **Analytics** - Visual charts and insights

## Tech Stack 🛠️

### Frontend

- **React Native** with Expo
- **Expo Router** for navigation
- **TypeScript** for type safety
- **Async Storage** for local caching
- **Linear Gradient** for UI effects

### Backend

- **Node.js** with Express
- **MongoDB** with Mongoose
- **JWT Authentication**
- **TypeScript**
- **Security middleware** (Helmet, CORS, Rate limiting)

## Quick Start 🚀

1. **Clone and Setup:**

   ```powershell
   # Backend (run in one terminal)
   cd backend
   npm install
   npm run dev

   # Frontend (run in another terminal from project root)
   npm install
   npm start
   ```

2. **Open the app** in Expo Go or web browser

3. **Create an account** and start tracking habits!

📖 For detailed setup instructions, see [setup.md](./setup.md)

IMPORTANT: Authentication and environment variables

- This project uses Firebase Authentication as the source of truth for passwords and email verification. MongoDB stores user profiles and app data only.
- The backend accepts Firebase ID tokens from either a custom header `X-Firebase-Token` or the standard `Authorization: Bearer <token>` header.
- The backend verifies ID tokens using the Firebase Admin SDK when a service account JSON is available. If not present (e.g. serverless hosts), the backend falls back to the Identity Toolkit REST API — this requires `FIREBASE_API_KEY` to be set in the environment.

Recommended environment variables (backend `.env` or Render/host settings):

- `MONGODB_URI` — your MongoDB connection string
- `JWT_SECRET` — secret used for issuing backend JWTs
- `FIREBASE_API_KEY` — **required** for REST fallback verification and dynamic links
- `FIREBASE_PROJECT_ID` — optional but helpful
- `FRONTEND_URL` or `APP_URL` — used when building verification/reset links
- `GMAIL_USER` / `GMAIL_APP_PASSWORD` or SMTP settings — if you use the built-in Nodemailer fallback for emails
- (Optional) `FIREBASE_ADMIN_SERVICE_ACCOUNT` / `credentials/firebase-adminsdk.json` — service account JSON for Admin SDK verification

Testing auth flows locally:

1.  Create a Firebase project and enable Email/Password sign-in.
2.  Set `FIREBASE_API_KEY` and (optionally) upload the Admin SDK JSON to `backend/credentials/firebase-adminsdk.json` or configure your host with that secret.
3.  Start the backend and frontend as shown above.
4.  Register in the app — registration creates a Firebase user and sends a verification email. The MongoDB user is only created after Firebase confirms the email and the client sends the ID token to `/api/auth/register` (this is handled automatically if you verify and then sign in).

Troubleshooting login failures:

- If Firebase authenticates but the backend returns 401 during auto-registration, ensure either the Admin SDK JSON is present or `FIREBASE_API_KEY` is configured (the backend will try Admin SDK first, then Identity Toolkit REST verify).
- Check backend logs — the server logs whether Admin or REST verification was used and prints debug lines when it receives the token.
- The frontend sends the Firebase ID token in both `X-Firebase-Token` and `Authorization: Bearer` headers to be robust across hosts/proxies.

UI note (auth screens):

- The login, register, forgot password and reset password screens have been updated to handle the on-screen keyboard better (dynamic bottom padding and safe-area awareness). If you still see layout gaps when the keyboard shows, run the app and report the `Keyboard did show, height:` console log line and device/OS so I can fine tune behavior.

## Screenshots 📱

- **Authentication Flow** - Secure login/register screens
- **Home Dashboard** - Today's habits with completion tracking
- **Statistics View** - Progress charts and streak analytics
- **Settings Panel** - App preferences and data management

## Project Structure 📁

```
├── app/                    # Expo Router screens
│   ├── (tabs)/            # Tab navigator (Home, Stats, Settings)
│   ├── habit/             # Habit management screens
│   └── _layout.tsx        # Root layout with auth wrapper
├── components/            # Reusable UI components
│   ├── auth/              # Authentication components
│   ├── habits/            # Habit-related components
│   └── Themed.tsx         # Themed component system
├── lib/                   # Core utilities
│   ├── auth.ts           # Authentication service
│   ├── habitsApi.ts      # API client for habits
│   ├── theme.ts          # Design system
│   └── config.ts         # Environment configuration
├── hooks/                 # Custom React hooks
└── backend/              # Node.js API server
    ├── src/
    │   ├── controllers/   # Route handlers
    │   ├── models/       # MongoDB schemas
    │   ├── middleware/   # Auth, validation, error handling
    │   └── routes/       # API endpoints
    └── dist/             # Compiled JavaScript
```

## Development 👩‍💻

### Prerequisites

- Node.js 18+
- MongoDB Atlas account
- Expo CLI (`npm install -g @expo/cli`)

### Running Locally

```bash
# Start backend
cd backend && npm run dev

# Start frontend (new terminal)
npm start
```

### Building for Production

```bash
# Build backend
cd backend && npm run build

# Build frontend
npx expo build:web
```

## Contributing 🤝

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Author

**aman1298**

## License 📄

MIT License - see [LICENSE](LICENSE) for details

## Support 💬

For questions or support, please open an issue on GitHub.

---

Built with ❤️ using React Native and Node.js
