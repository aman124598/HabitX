# Friends Feature

The Friends feature allows users to connect with other habit trackers, view each other's profiles, and stay motivated together.

## Features

### 🔍 **User Search**
- Search for users by username or email
- View basic profile information (level, XP, bio)
- Send friend requests to public users

### 👥 **Friend Management**
- Send and receive friend requests
- Accept or decline incoming requests
- Remove friends when needed
- View friendship status for all users

### 📊 **Friend Profiles**
- View detailed friend profiles with habit statistics
- See friend's level, XP, total habits, active streaks
- Profile privacy controls (public/private)
- Beautiful avatar generation based on username

### 🏆 **Leaderboard Integration**
- Tap on users in the global leaderboard to view profiles
- Enhanced profile viewing for friends vs public users
- Visual indicators for tappable entries

## User Experience

### Clean & Intuitive UI
- **Friends Tab**: Central hub for all friend-related activities
- **Search Interface**: Easy-to-use search with real-time results
- **Profile Screens**: Detailed user profiles with habit stats
- **Request Management**: Clear accept/decline actions

### Visual Enhancements
- **Custom Avatars**: Colorful gradient avatars generated from usernames
- **Level Badges**: Show user levels on avatars
- **Status Indicators**: Clear friendship status display
- **Notification Badges**: Visual indicators for pending requests

### Polished Interactions
- **Confirmation Dialogs**: Prevent accidental actions
- **Loading States**: Smooth user experience during API calls
- **Error Handling**: Graceful error messages and recovery
- **Refresh Controls**: Pull-to-refresh functionality

## Technical Implementation

### Backend (Node.js/TypeScript)
- **Friend Model**: Mongoose schema for friend relationships
- **User Extensions**: Added bio, avatar, privacy settings
- **API Endpoints**: Complete REST API for friend operations
- **Authentication**: Secure endpoints with JWT tokens

### Frontend (React Native/TypeScript)
- **Friends Context**: Global state management for friends
- **Custom Hooks**: Reusable friend action handlers
- **Reusable Components**: UserAvatar, notification badges
- **Navigation**: Seamless modal presentations

### API Endpoints
```
GET    /api/friends/search          - Search users
POST   /api/friends/request         - Send friend request
PUT    /api/friends/request/:id     - Accept/decline request
GET    /api/friends/requests        - Get pending requests
GET    /api/friends                 - Get friends list
DELETE /api/friends/:id             - Remove friend
GET    /api/friends/profile/:id     - Get user profile
```

## Privacy & Security

- **Public/Private Profiles**: Users can control profile visibility
- **Friend-Only Content**: Detailed stats only visible to friends
- **Request Validation**: Prevent duplicate/invalid requests
- **Authentication**: All endpoints require valid user tokens

## Getting Started

1. **Navigate to Friends Tab**: Tap the "Friends" icon in bottom navigation
2. **Search for Friends**: Tap the search icon to find users
3. **Send Requests**: Tap "Add Friend" on user profiles
4. **Manage Requests**: Accept/decline from the Friends main screen
5. **View Profiles**: Tap on friends to see detailed profiles

The friends feature integrates seamlessly with the existing habit tracking system, encouraging social motivation and friendly competition!