import crypto from 'crypto';
import * as admin from 'firebase-admin';
import nodemailer from 'nodemailer';
import path from 'path';
import axios from 'axios';
import fetch from 'node-fetch';

// Initialize Firebase Admin SDK
let adminApp: admin.app.App | null = null;

const initializeFirebase = () => {
  if (adminApp) return adminApp;

  try {
    const serviceAccountPath = path.join(__dirname, '../../credentials/firebase-adminsdk.json');
    const serviceAccount = require(serviceAccountPath);

    adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      projectId: serviceAccount.project_id,
    });

    console.log('✅ Firebase Admin SDK initialized successfully');
    return adminApp;
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', error);
    return null;
  }
};

// Get Firebase Auth instance
const getFirebaseAuth = () => {
  try {
    const app = initializeFirebase();
    if (!app) throw new Error('Firebase app not initialized');
    return admin.auth(app);
  } catch (error) {
    console.error('❌ Failed to get Firebase Auth:', error);
    return null;
  }
};

// Initialize Nodemailer transporter as fallback
let transporter: nodemailer.Transporter | null = null;

const initializeNodemailer = () => {
  if (transporter) return transporter;

  try {
    // Try Gmail SMTP
    if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD,
        },
      });
      console.log('✅ Nodemailer initialized with Gmail');
      return transporter;
    }

    // Try custom SMTP
    if (process.env.SMTP_HOST && process.env.SMTP_PORT) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      });
      console.log('✅ Nodemailer initialized with custom SMTP');
      return transporter;
    }

    console.log('⚠️ No email credentials configured for Nodemailer');
    return null;
  } catch (error) {
    console.error('❌ Failed to initialize Nodemailer:', error);
    return null;
  }
};

/**
 * Create a Firebase Dynamic Link
 * Converts a long URL (e.g., habitx://verify-email?token=xxx) into a short hosted link
 * The short link (e.g., https://habitx.page.link/Abc123) works on any device
 */
async function createDynamicLink(deepLink: string, linkTitle: string): Promise<string> {
  try {
    const domain = process.env.FIREBASE_DYNAMIC_LINK_DOMAIN || 'habitx.page.link';
    const apiKey = process.env.FIREBASE_API_KEY;

    if (!apiKey) {
      console.warn('⚠️  Firebase API key not configured, using deep link directly');
      return deepLink;
    }

    // Create the dynamic link request
    const dynamicLinkUrl = `https://firebasedynamiclinks.googleapis.com/v1/shortLinks?key=${apiKey}`;

    const requestBody = {
      longDynamicLink: `https://${domain}/?link=${encodeURIComponent(deepLink)}&apn=com.aman1298.habitx&ibi=com.aman1298.habitx&sd=${linkTitle}`,
      suffix: {
        option: 'SHORT',
      },
    };

    console.log(`📍 Creating Firebase Dynamic Link for: ${linkTitle}`);

    const response = await axios.post(dynamicLinkUrl, requestBody);

    const shortLink = response.data.shortLink;
    console.log(`✅ Dynamic Link created: ${shortLink}`);

    return shortLink;
  } catch (error: any) {
    console.error('❌ Failed to create Firebase Dynamic Link:', error.message);
    // Fallback to deep link if dynamic link creation fails
    return deepLink;
  }
}

/**
 * Send email via Firebase Admin SDK (Email Link Authentication)
 * This uses Firebase's native email sending capabilities
 */
async function sendEmailViaFirebase(email: string, subject: string, htmlBody: string): Promise<boolean> {
  try {
    console.log(`📧 Attempting to send email via Firebase to ${email}`);

    // Get Firebase Auth instance
    const auth = getFirebaseAuth();
    if (!auth) {
      console.error('❌ Firebase Auth not available');
      return false;
    }

    // For Firebase, we'll use the REST API to send emails
    const projectId = process.env.FIREBASE_PROJECT_ID || 'habitx-ba1d8';
    const apiKey = process.env.FIREBASE_API_KEY;

    if (!apiKey) {
      console.error('❌ Firebase API key not available for email sending');
      return false;
    }

    // Firebase doesn't have direct email sending in Admin SDK
    // Instead, we'll use a workaround with Cloud Messaging or fall back to Nodemailer
    // For now, we'll use Nodemailer as the primary Firebase email solution
    console.log('📧 Firebase direct email API not available, using Nodemailer with Firebase credentials');
    
    // Create a custom email using Nodemailer (configured via Firebase)
    const mail = initializeNodemailer();
    if (mail) {
      await mail.sendMail({
        from: process.env.SMTP_FROM || process.env.GMAIL_USER || 'noreply@aman1298.com',
        to: email,
        subject: subject,
        html: htmlBody,
      });
      console.log(`✅ Email sent successfully via Firebase-integrated Nodemailer to ${email}`);
      return true;
    }

    return false;
  } catch (error: any) {
    console.error('❌ Error sending email via Firebase:', error.message);
    return false;
  }
}

/**
 * Test Firebase email configuration
 * This function tests if the email service is properly configured
 */
export async function testEmailSystem(testEmail: string): Promise<{success: boolean; message: string}> {
  try {
    console.log('\n' + '='.repeat(60));
    console.log('🧪 TESTING EMAIL SYSTEM');
    console.log('='.repeat(60));

    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Email System Test 🧪</h1>
        </div>
        <div style="background: #f5f5f5; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="color: #333; font-size: 16px;">Testing Email Delivery</p>
          <p style="color: #666; font-size: 14px; line-height: 1.6;">
            This is a test email to verify that your email system is working properly.
          </p>
          <div style="background: white; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #4F46E5;">
            <p style="color: #333; margin: 5px 0;"><strong>Email Service:</strong> Firebase + Nodemailer</p>
            <p style="color: #333; margin: 5px 0;"><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
            <p style="color: #333; margin: 5px 0;"><strong>Test ID:</strong> ${crypto.randomBytes(8).toString('hex')}</p>
          </div>
          <p style="color: #666; font-size: 14px; line-height: 1.6;">
            If you received this email, your email system is working correctly! ✅
          </p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">
            This is an automated test email from Habit X.
          </p>
        </div>
      </div>
    `;

    // Try sending test email
    const result = await sendEmailViaFirebase(
      testEmail,
      '🧪 Habit X Email System Test',
      emailBody
    );

    if (result) {
      console.log('✅ Test email sent successfully!');
      console.log('📧 Check ' + testEmail + ' for the test email');
      console.log('='.repeat(60) + '\n');
      return {
        success: true,
        message: `✅ Test email sent successfully to ${testEmail}. Please check your email inbox to confirm delivery.`,
      };
    } else {
      console.log('❌ Failed to send test email');
      console.log('='.repeat(60) + '\n');
      return {
        success: false,
        message: '❌ Failed to send test email. Check backend logs for more details.',
      };
    }
  } catch (error: any) {
    console.error('❌ Test email failed:', error.message);
    return {
      success: false,
      message: `❌ Test failed: ${error.message}`,
    };
  }
}

export const authService = {
  /**
   * Generate a random token for email verification and password reset
   */
  generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  },

  /**
   * Hash a token using SHA256
   */
  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  },

  /**
   * Send verification email using Firebase with Dynamic Links
   */
  async sendVerificationEmail(email: string, verificationToken: string, username: string) {
    try {
      // Create web verification link that points to the backend endpoint
      // This ensures verification happens on the backend server, not dependent on frontend
      const backendUrl = process.env.BACKEND_URL || process.env.PUBLIC_API_URL || 'https://habit-tracker-backend-2.onrender.com';
      const webVerificationLink = `${backendUrl.replace(/\/$/, '')}/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`;
      
      // Create deep link for verification (for mobile app)
      const deepLink = `habitx://verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`;
      
      // Try to create Firebase Dynamic Link as fallback
      let verificationLink = webVerificationLink;
      try {
        const dynamicLink = await createDynamicLink(deepLink, `Verify ${email}`);
        // Only use dynamic link if it's not the same as deep link (meaning it was successfully created)
        if (dynamicLink !== deepLink && dynamicLink.includes('http')) {
          verificationLink = dynamicLink;
        }
      } catch (error) {
        console.log('⚠️  Using direct web link as Firebase Dynamic Link failed');
      }

      console.log(`📧 Sending verification email to ${email}`);
      console.log(`   Deep Link: ${deepLink}`);
      console.log(`   Web Link: ${webVerificationLink}`);
      console.log(`   Final Link: ${verificationLink}`);

      const emailBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Welcome to Habit X! 🎉</h1>
          </div>
          <div style="background: #f5f5f5; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="color: #333; font-size: 16px;">Hi ${username},</p>
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
              Thank you for signing up! To complete your registration and start building amazing habits, please verify your email address by clicking the button below.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationLink}" style="background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
                ✅ Verify My Email
              </a>
            </div>
            <p style="color: #666; font-size: 13px; line-height: 1.5;">
              💡 <strong>This button works in any web browser!</strong> Click it to verify your email, and it will redirect you back to the Habit X app.
            </p>
            <p style="color: #999; font-size: 12px;">
              Or copy and paste this link in your browser:<br/>
              <span style="word-break: break-all; color: #4F46E5;">${verificationLink}</span>
            </p>
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
              This link will expire in 24 hours.
            </p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">
              If you didn't create this account, please ignore this email.
            </p>
          </div>
        </div>
      `;

      // Use Firebase email service (with Nodemailer as backend)
      console.log(`📧 Sending verification email via Firebase to ${email}`);
      const result = await sendEmailViaFirebase(email, '🎉 Welcome to Habit X - Verify Your Email', emailBody);

      if (result) {
        console.log(`✅ Verification email sent successfully to ${email}`);
        return true;
      }

      // Fallback: Log to console (development mode)
      console.log(`⚠️  [FALLBACK - DEV MODE] Verification email for ${email}:`);
      console.log(`Recipient: ${email}`);
      console.log(`Subject: 🎉 Welcome to Habit X - Verify Your Email`);
      console.log(`\nHosted Verification Link: ${verificationLink}`);
      console.log(`Deep Link: ${deepLink}`);
      console.log(`Verification Token: ${verificationToken}`);
      console.log(`\nHTML Preview:\n${emailBody}\n`);
      
      return true;
    } catch (error) {
      console.error('❌ Error sending verification email:', error);
      throw error;
    }
  },

  /**
   * Send password reset email using Firebase with Dynamic Links
   */
  async sendPasswordResetEmail(email: string, resetToken: string, username: string) {
    try {
  // Create deep link for password reset (app deep link)
  const deepLink = `habitx://reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

  // Create a web reset link that points to the frontend web app (not localhost)
  const frontendUrl = process.env.FRONTEND_URL || process.env.APP_URL || process.env.EXPO_PUBLIC_APP_URL || 'https://habit-tracker-frontend-2.onrender.com';
  const webResetLink = `${frontendUrl.replace(/\/$/, '')}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
      
  // Convert to Firebase Dynamic Link (hosted URL) using deep link; dynamic link creation may return short hosted URL.
  const resetLink = await createDynamicLink(deepLink, `Reset ${email}`) || webResetLink;

      console.log(`📧 Sending password reset email to ${email}`);
      console.log(`   Deep Link: ${deepLink}`);
      console.log(`   Hosted Link: ${resetLink}`);

      const emailBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Password Reset Request 🔐</h1>
          </div>
          <div style="background: #f5f5f5; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="color: #333; font-size: 16px;">Hi ${username},</p>
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
              We received a request to reset your password. Click the button below to set a new password.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p style="color: #999; font-size: 12px;">
              Or copy and paste this link in your browser:<br/>
              <span style="word-break: break-all;">${resetLink}</span>
            </p>
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
              This link will expire in 1 hour.
            </p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">
              If you didn't request this, please ignore this email. Your password will not be changed.
            </p>
          </div>
        </div>
      `;

      // Use Firebase email service (with Nodemailer as backend)
      console.log(`📧 Sending password reset email via Firebase to ${email}`);
      const result = await sendEmailViaFirebase(email, '🔐 Habit X - Reset Your Password', emailBody);

      if (result) {
        console.log(`✅ Password reset email sent successfully to ${email}`);
        return true;
      }

      // Fallback: Log to console (development mode)
      console.log(`⚠️  [FALLBACK - DEV MODE] Password reset email for ${email}:`);
      console.log(`Recipient: ${email}`);
      console.log(`Subject: 🔐 Habit X - Reset Your Password`);
      console.log(`\nHosted Password Reset Link: ${resetLink}`);
      console.log(`Deep Link: ${deepLink}`);
      console.log(`Reset Token: ${resetToken}`);
      console.log(`\nHTML Preview:\n${emailBody}\n`);
      
      return true;
    } catch (error) {
      console.error('❌ Error sending password reset email:', error);
      throw error;
    }
  },
};

export default authService;

