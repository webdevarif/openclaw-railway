#!/usr/bin/env node

/**
 * Validation script to test Railway variables implementation
 * Usage: node validate-implementation.js
 */

import fs from 'fs';
import path from 'path';

console.log('🔍 Validating OpenClaw Railway implementation...\n');

// Test 1: Check server.js for all required variables
console.log('1️⃣ Checking server.js environment variable support...');

const serverJs = fs.readFileSync('src/server.js', 'utf8');
const requiredVars = [
  'SETUP_PASSWORD',
  'ENABLE_WEB_TUI', 
  'CONTROL_UI_ALLOWED_ORIGINS',
  'FORCE_WS_ORIGIN',
  'OPENCLAW_GATEWAY_TOKEN',
  'TELEGRAM_DM_POLICY',
  'TELEGRAM_GROUP_POLICY',
  'OPENCLAW_STATE_DIR',
  'OPENCLAW_WORKSPACE_DIR',
  'TUI_IDLE_TIMEOUT_MS',
  'TUI_MAX_SESSION_MS'
];

let missingVars = [];
for (const varName of requiredVars) {
  if (!serverJs.includes(`process.env.${varName}`)) {
    missingVars.push(varName);
  }
}

if (missingVars.length === 0) {
  console.log('✅ All required environment variables are supported in server.js');
} else {
  console.log(`❌ Missing environment variable support: ${missingVars.join(', ')}`);
}

// Test 2: Check for key functions
console.log('\n2️⃣ Checking implementation functions...');

const requiredFunctions = [
  'patchAllowedOrigins',
  'applyTelegramPolicies'
];

let missingFunctions = [];
for (const funcName of requiredFunctions) {
  if (!serverJs.includes(`function ${funcName}`) && !serverJs.includes(`async function ${funcName}`)) {
    missingFunctions.push(funcName);
  }
}

if (missingFunctions.length === 0) {
  console.log('✅ All required functions are implemented');
} else {
  console.log(`❌ Missing functions: ${missingFunctions.join(', ')}`);
}

// Test 3: Check debug endpoint
console.log('\n3️⃣ Checking debug endpoint...');
if (serverJs.includes('detectedEnvVars: detectedVars')) {
  console.log('✅ Debug endpoint includes environment variable detection');
} else {
  console.log('❌ Debug endpoint missing environment variable detection');
}

// Test 4: Check .env.example completeness
console.log('\n4️⃣ Checking .env.example completeness...');

const envExample = fs.readFileSync('.env.example', 'utf8');
const envVarsInExample = [];
const lines = envExample.split('\n');
for (const line of lines) {
  const match = line.match(/^([A-Z_]+)=/);
  if (match) {
    envVarsInExample.push(match[1]);
  }
}

const expectedEnvVars = [
  'SETUP_PASSWORD',
  'OPENCLAW_STATE_DIR',
  'OPENCLAW_WORKSPACE_DIR',
  'OPENCLAW_GATEWAY_TOKEN',
  'PORT',
  'INTERNAL_GATEWAY_PORT',
  'INTERNAL_GATEWAY_HOST',
  'OPENCLAW_CONFIG_PATH',
  'OPENCLAW_ENTRY',
  'OPENCLAW_NODE',
  'CONTROL_UI_ALLOWED_ORIGINS',
  'FORCE_WS_ORIGIN',
  'ENABLE_WEB_TUI',
  'TUI_IDLE_TIMEOUT_MS',
  'TUI_MAX_SESSION_MS',
  'TELEGRAM_DM_POLICY',
  'TELEGRAM_GROUP_POLICY'
];

let missingEnvVars = [];
for (const varName of expectedEnvVars) {
  if (!envVarsInExample.includes(varName)) {
    missingEnvVars.push(varName);
  }
}

if (missingEnvVars.length === 0) {
  console.log('✅ .env.example contains all expected variables');
} else {
  console.log(`❌ Missing from .env.example: ${missingEnvVars.join(', ')}`);
}

// Test 5: Check README documentation
console.log('\n5️⃣ Checking README documentation...');

const readme = fs.readFileSync('README.md', 'utf8');
const documentedVars = [];
for (const varName of expectedEnvVars) {
  if (readme.includes(`\`${varName}\``)) {
    documentedVars.push(varName);
  }
}

if (documentedVars.length === expectedEnvVars.length) {
  console.log('✅ All variables documented in README.md');
} else {
  const undocumented = expectedEnvVars.filter(v => !documentedVars.includes(v));
  console.log(`❌ Undocumented in README: ${undocumented.join(', ')}`);
}

// Summary
console.log('\n📋 Summary:');
const totalChecks = 5;
const passedChecks = [
  missingVars.length === 0,
  missingFunctions.length === 0,
  serverJs.includes('detectedEnvVars: detectedVars'),
  missingEnvVars.length === 0,
  documentedVars.length === expectedEnvVars.length
].filter(Boolean).length;

console.log(`✅ Passed: ${passedChecks}/${totalChecks} checks`);

if (passedChecks === totalChecks) {
  console.log('🎉 Implementation is complete and ready for deployment!');
} else {
  console.log('⚠️  Some issues found. Please review and fix before deploying.');
  process.exit(1);
}
