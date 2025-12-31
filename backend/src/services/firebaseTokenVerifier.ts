import axios from 'axios';

export interface FirebaseTokenInfo {
  uid: string;
  email?: string;
  emailVerified: boolean;
}

/**
 * Verify Firebase ID token using Firebase Identity Toolkit REST API.
 * This does not require service account credentials and works in serverless/hosted envs.
 */
export async function verifyIdTokenViaRest(idToken: string): Promise<FirebaseTokenInfo> {
  const apiKey = process.env.FIREBASE_API_KEY;
  if (!apiKey) {
    throw new Error('FIREBASE_API_KEY not configured');
  }

  const url = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`;
  try {
    const resp = await axios.post(url, { idToken });
    const users = resp.data?.users;
    if (!Array.isArray(users) || users.length === 0) {
      throw new Error('No user found for token');
    }
    const u = users[0];
    return {
      uid: u.localId,
      email: u.email,
      emailVerified: !!u.emailVerified,
    };
  } catch (err: any) {
    const msg = err?.response?.data?.error?.message || err?.message || String(err);
    throw new Error(`Firebase REST verify failed: ${msg}`);
  }
}
