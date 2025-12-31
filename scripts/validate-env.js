#!/usr/bin/env node

/**
 * Environment Validation Script for Habit X Production Deployment
 * Validates that all required environment variables are set correctly
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('🔍 Validating Production Environment Configuration...\n');

const requiredEnvVars = {
  // Frontend Environment Variables
  'EXPO_PUBLIC_API_BASE_URL': {
    description: 'Backend API URL',
    example: 'https://habit-tracker-backend-2.onrender.com/api',
    production: true
  },
  'EXPO_PUBLIC_FIREBASE_API_KEY': {
    description: 'Firebase API Key',
    example: 'AIzaSyAM8alIeozHK0nrFhac8k05ntScfMzoLRY',
    production: true
  },
  'EXPO_PUBLIC_FIREBASE_PROJECT_ID': {
    description: 'Firebase Project ID',
    example: 'habitx-ba1d8',
    production: true
  }
};

const warnings = [];
const errors = [];
let validationPassed = true;

// Check required environment variables
console.log('📋 Checking Required Environment Variables:\n');

for (const [envVar, config] of Object.entries(requiredEnvVars)) {
  const value = process.env[envVar];
  const status = value ? '✅' : '❌';
  
  console.log(`${status} ${envVar}: ${value ? 'SET' : 'NOT SET'}`);
  
  if (!value) {
    errors.push(`Missing required environment variable: ${envVar}`);
    console.log(`   Description: ${config.description}`);
    console.log(`   Example: ${config.example}\n`);
    validationPassed = false;
  } else {
    // Additional validation for specific variables
    if (envVar === 'EXPO_PUBLIC_API_BASE_URL' && value.includes('localhost')) {
      warnings.push(`${envVar} contains localhost - this will not work in production`);
      console.log('   ⚠️  WARNING: Contains localhost URL\n');
    }
  }
}

// Check Firebase configuration file
console.log('\n🔥 Checking Firebase Configuration:\n');

const firebaseConfigPath = path.join(__dirname, '../backend/credentials/firebase-adminsdk.json');
if (fs.existsSync(firebaseConfigPath)) {
  console.log('✅ Firebase Admin SDK credentials file found');
  try {
    const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));
    if (firebaseConfig.project_id === 'habitx-ba1d8' || firebaseConfig.project_id === 'habitx') {
      console.log('✅ Firebase project ID matches expected value');
    } else {
      warnings.push('Firebase project ID does not match expected value');
    }
  } catch (error) {
    errors.push('Firebase credentials file is not valid JSON');
    validationPassed = false;
  }
} else {
  warnings.push('Firebase Admin SDK credentials file not found (backend might use API key fallback)');
}

// Check package.json version
console.log('\n📦 Checking App Version:\n');

const packageJsonPath = path.join(__dirname, '../package.json');
const appJsonPath = path.join(__dirname, '../app.json');

if (fs.existsSync(packageJsonPath) && fs.existsSync(appJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
  
  console.log(`✅ Package version: ${packageJson.version}`);
  console.log(`✅ App version: ${appJson.expo.version}`);
  console.log(`✅ Android version code: ${appJson.expo.android.versionCode}`);
  
  if (packageJson.version !== appJson.expo.version) {
    warnings.push('Package.json version does not match app.json version');
  }
} else {
  errors.push('Cannot find package.json or app.json');
  validationPassed = false;
}

// Check backend health (if available)
console.log('\n🏥 Backend Health Check:\n');

const backendUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
if (backendUrl && !backendUrl.includes('localhost')) {
  console.log(`Checking: ${backendUrl.replace('/api', '/health')}`);
  console.log('ℹ️  Run "npm run health-check" to test backend connectivity');
} else {
  console.log('⚠️  Skipping backend health check (localhost URL or missing)');
}

// Summary
console.log('\n' + '='.repeat(70));
console.log('📊 VALIDATION SUMMARY');
console.log('='.repeat(70));

if (validationPassed && errors.length === 0) {
  console.log('\n✅ All critical validations passed!');
} else {
  console.log(`\n❌ ${errors.length} critical error(s) found:`);
  errors.forEach(error => console.log(`   • ${error}`));
}

if (warnings.length > 0) {
  console.log(`\n⚠️  ${warnings.length} warning(s) found:`);
  warnings.forEach(warning => console.log(`   • ${warning}`));
}

console.log('\n📋 Next Steps:');
if (!validationPassed || errors.length > 0) {
  console.log('   1. Fix all critical errors listed above');
  console.log('   2. Set missing environment variables');
  console.log('   3. Run this validation script again');
  console.log('   4. Proceed with production build once all errors are resolved');
} else {
  console.log('   1. Review warnings if any');
  console.log('   2. Run "npm run health-check" to test backend');
  console.log('   3. Proceed with production build: "npm run build:production"');
}

console.log('\n🔗 Useful Commands:');
console.log('   • Test backend: npm run health-check');
console.log('   • Build production: npm run build:production'); 
console.log('   • Deploy to Play Store: npm run deploy:android');

// Exit with appropriate code
process.exit(validationPassed && errors.length === 0 ? 0 : 1);