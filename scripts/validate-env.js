#!/usr/bin/env node

/**
 * Environment Validation Script for Habit X Production Deployment
 * Validates that all required environment variables are set correctly.
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('🔍 Validating Production Environment Configuration...\n');

const requiredEnvVars = {
  EXPO_PUBLIC_API_BASE_URL: {
    description: 'Backend API URL',
    example: 'https://habitx.onrender.com/api',
  },
  EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: {
    description: 'Clerk publishable key (starts with pk_)',
    example: 'pk_live_...',
  },
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
    if (envVar === 'EXPO_PUBLIC_API_BASE_URL' && value.includes('localhost')) {
      warnings.push(`${envVar} contains localhost — this will not work in production`);
      console.log('   ⚠️  WARNING: Contains localhost URL\n');
    }
    if (envVar === 'EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY' && !value.startsWith('pk_')) {
      warnings.push(`${envVar} does not look like a valid Clerk publishable key`);
    }
  }
}

// Check Firestore credentials
console.log('\n🔥 Checking Firestore (Firebase Admin) Credentials:\n');

const localCreds = path.join(__dirname, '../backend/credentials/firebase-adminsdk.json');
const hasBase64 = !!process.env.FIREBASE_CREDENTIALS_BASE64;
const hasLocalFile = fs.existsSync(localCreds);

if (hasLocalFile) {
  console.log('✅ Local firebase-adminsdk.json found');
  try {
    const creds = JSON.parse(fs.readFileSync(localCreds, 'utf8'));
    if (creds.project_id) {
      console.log(`✅ Project ID: ${creds.project_id}`);
    } else {
      warnings.push('firebase-adminsdk.json is missing project_id');
    }
  } catch {
    errors.push('firebase-adminsdk.json is not valid JSON');
    validationPassed = false;
  }
} else if (hasBase64) {
  console.log('✅ FIREBASE_CREDENTIALS_BASE64 env var is set (production mode)');
} else {
  warnings.push('No Firestore credentials found. Set FIREBASE_CREDENTIALS_BASE64 in production or place firebase-adminsdk.json locally.');
  console.log('⚠️  No Firestore credentials found');
}

// Check Backend Clerk secret key (for backend env)
console.log('\n🔑 Checking Backend Clerk Configuration:\n');
const backendEnvPath = path.join(__dirname, '../backend/.env');
if (fs.existsSync(backendEnvPath)) {
  const backendEnv = fs.readFileSync(backendEnvPath, 'utf8');
  if (backendEnv.includes('CLERK_SECRET_KEY=sk_')) {
    console.log('✅ CLERK_SECRET_KEY appears to be set in backend/.env');
  } else {
    warnings.push('CLERK_SECRET_KEY not found in backend/.env — required for Clerk JWT verification');
    console.log('⚠️  CLERK_SECRET_KEY not found in backend/.env');
  }
}

// Check package versions
console.log('\n📦 Checking App Version:\n');

const packageJsonPath = path.join(__dirname, '../package.json');
const appJsonPath = path.join(__dirname, '../app.json');

if (fs.existsSync(packageJsonPath) && fs.existsSync(appJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));

  console.log(`✅ Package version: ${packageJson.version}`);
  console.log(`✅ App version: ${appJson.expo.version}`);

  if (packageJson.version !== appJson.expo.version) {
    warnings.push('package.json version does not match app.json version');
  }
} else {
  errors.push('Cannot find package.json or app.json');
  validationPassed = false;
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
  console.log('   2. Run this validation script again');
} else {
  console.log('   1. Review warnings if any');
  console.log('   2. Run "npm run build:production" to build');
}

process.exit(validationPassed && errors.length === 0 ? 0 : 1);