#!/usr/bin/env node

/**
 * Test script to validate external dashboard WebSocket connection
 * Usage: node test-external-client.js <railway-url> <gateway-token>
 * Example: node test-external-client.js https://your-app.railway.app your-token-here
 */

import WebSocket from 'ws';
import { createHash } from 'crypto';

const RAILWAY_URL = process.argv[2];
const GATEWAY_TOKEN = process.argv[3];

if (!RAILWAY_URL || !GATEWAY_TOKEN) {
  console.error('Usage: node test-external-client.js <railway-url> <gateway-token>');
  console.error('Example: node test-external-client.js https://your-app.railway.app your-token-here');
  process.exit(1);
}

const wsUrl = RAILWAY_URL.replace(/^http/, 'ws') + '/ws';

console.log(`Testing WebSocket connection to: ${wsUrl}`);
console.log(`Using token: ${GATEWAY_TOKEN.substring(0, 8)}...`);

const ws = new WebSocket(wsUrl, {
  headers: {
    'Authorization': `Bearer ${GATEWAY_TOKEN}`,
    'Origin': 'http://localhost:3001' // Simulate external dashboard
  }
});

ws.on('open', () => {
  console.log('✅ WebSocket connected successfully');
  
  // Send connect challenge
  ws.send(JSON.stringify({
    type: 'connect.challenge',
    data: {
      token: GATEWAY_TOKEN
    }
  }));
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    console.log('📨 Received:', JSON.stringify(message, null, 2));
    
    if (message.type === 'hello-ok') {
      console.log('🎉 Connection successful! External dashboard can connect.');
      ws.close();
    }
  } catch (err) {
    console.log('📨 Received (raw):', data.toString());
  }
});

ws.on('error', (err) => {
  console.error('❌ WebSocket error:', err.message);
  if (err.message.includes('origin not allowed')) {
    console.error('💡 This error means CONTROL_UI_ALLOWED_ORIGINS needs to be configured');
    console.error('💡 Or set FORCE_WS_ORIGIN=true as a fallback');
  }
});

ws.on('close', (code, reason) => {
  console.log(`🔌 WebSocket closed: ${code} ${reason}`);
});

// Timeout after 10 seconds
setTimeout(() => {
  if (ws.readyState === WebSocket.CONNECTING) {
    console.error('❌ Connection timeout');
    ws.close();
  } else if (ws.readyState === WebSocket.OPEN) {
    console.log('⏰ Test timeout - closing connection');
    ws.close();
  }
}, 10000);
