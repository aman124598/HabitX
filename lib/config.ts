import { Platform } from 'react-native';

// Configuration for different platforms and environments
// 
// Environment Variables:
// - EXPO_PUBLIC_API_BASE_URL : Override API URL completely
// - EXPO_LOCAL_BACKEND=true : Use local backend (for development only)
// 
// Default behavior:
// - Uses the deployed Render backend by default (no localhost issues)
// - To use a custom backend, set EXPO_PUBLIC_API_BASE_URL
// - To use local backend set EXPO_LOCAL_BACKEND=true (development only)
// 
// Backend URLs:
// - Production (default): https://habit-tracker-backend.onrender.com/api
// - Local Dev: http://localhost:10000/api (when EXPO_LOCAL_BACKEND=true)
//
// Note: Using localhost/127.0.0.1 on Android/iOS can cause network failures.
// Always prefer the deployed Render backend unless you specifically need local debugging.

// Get local IP address for Android development
function getLocalUrl() {
  // For Android, we need to use the host machine's IP address if running a local backend.
  if (Platform.OS === 'android') {
    // Use your computer's actual IP address instead of emulator IP
    // Replace this with your machine IP when using a local backend
    return 'http://10.215.103.141:10000/api';
  }
  // For iOS simulator and web, localhost works fine
  return 'http://localhost:10000/api';
}

// Resolve base URL based on env flags
// Primary Railway backend URL (deployed service). Use this as the default production backend.
const REMOTE_RENDER_URL = 'https://habitx-production.up.railway.app/api';
const USE_LOCAL = String(process.env.EXPO_LOCAL_BACKEND).toLowerCase() === 'true';
const OVERRIDE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

// Configuration for different platforms and environments
const config = {
  development: {
    web: USE_LOCAL ? 'http://localhost:10000/api' : (OVERRIDE_URL || REMOTE_RENDER_URL),
    mobile: USE_LOCAL ? getLocalUrl() : (OVERRIDE_URL || REMOTE_RENDER_URL),
  },
  production: {
    web: OVERRIDE_URL || REMOTE_RENDER_URL,
    mobile: OVERRIDE_URL || REMOTE_RENDER_URL,
  },
};

const isDevelopment = __DEV__ || process.env.NODE_ENV === 'development';
const environment = isDevelopment ? 'development' : 'production';
const platform = Platform.OS === 'web' ? 'web' : 'mobile';

export const API_BASE_URL = config[environment][platform];

// Log the configuration on startup for debugging
console.log('🔧 API Configuration:', {
  isDevelopment,
  environment,
  platform: Platform.OS,
  apiBaseUrl: API_BASE_URL,
  useLocal: USE_LOCAL,
  override: OVERRIDE_URL || null,
});

// Additional debugging
console.log('🌐 Backend target:', { currentBackend: API_BASE_URL });

// Helper function to get the correct API URL
export function getApiUrl(endpoint: string = ''): string {
  if (!endpoint) {
    return API_BASE_URL;
  }
  return `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
}

// For debugging
export function getConfig() {
  return {
    environment,
    platform,
    apiBaseUrl: API_BASE_URL,
    isDevelopment,
    __DEV__,
    NODE_ENV: process.env.NODE_ENV,
  };
}

export default { API_BASE_URL, getApiUrl, getConfig };

// Feature flags
// Toggle friend-related UI/actions. Set to false to hide sending/accepting friend requests.
export const FEATURES = {
  friendRequests: false,
};
