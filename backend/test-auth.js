#!/usr/bin/env node

/**
 * Auth Module Test Script
 * 
 * Run with: node test-auth.js
 * 
 * Tests signup and login endpoints
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000/api/auth';

async function test(name, method, path, body) {
  console.log(`\n📝 Test: ${name}`);
  console.log(`${method} ${path}`);
  console.log('Payload:', JSON.stringify(body, null, 2));

  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function runTests() {
  console.log('🧪 Auth Module Test Suite\n');

  // Test 1: Signup with email
  console.log('--- Test 1: Signup with email ---');
  const signup1 = await test('Signup with email', 'POST', '/signup', {
    name: 'Dr. Sharma',
    email: 'doctor@example.com',
    password: 'SecurePassword123',
  });

  // Test 2: Signup with phone
  console.log('\n--- Test 2: Signup with phone ---');
  const signup2 = await test('Signup with phone', 'POST', '/signup', {
    name: 'Priya Singh',
    phoneNumber: '+91 9876543210',
    password: 'Password456',
  });

  // Test 3: Signup with both
  console.log('\n--- Test 3: Signup with both email and phone ---');
  const signup3 = await test('Signup with both', 'POST', '/signup', {
    name: 'Patient A',
    email: 'patient@example.com',
    phoneNumber: '+91 9123456789',
    password: 'TestPass789',
  });

  // Test 4: Signup without email/phone (should fail)
  console.log('\n--- Test 4: Signup without email/phone (should fail) ---');
  await test('Signup missing email/phone', 'POST', '/signup', {
    name: 'Invalid User',
    password: 'Password123',
  });

  // Test 5: Signup with short password (should fail)
  console.log('\n--- Test 5: Signup with short password (should fail) ---');
  await test('Signup short password', 'POST', '/signup', {
    name: 'Another User',
    email: 'short@test.com',
    password: 'pass',
  });

  // Test 6: Duplicate email (should fail)
  console.log('\n--- Test 6: Duplicate email (should fail) ---');
  await test('Signup duplicate email', 'POST', '/signup', {
    name: 'Another Doctor',
    email: 'doctor@example.com',
    password: 'Password123',
  });

  // Test 7: Login with email
  console.log('\n--- Test 7: Login with email ---');
  await test('Login with email', 'POST', '/login', {
    identifier: 'doctor@example.com',
    password: 'SecurePassword123',
  });

  // Test 8: Login with phone
  console.log('\n--- Test 8: Login with phone ---');
  await test('Login with phone', 'POST', '/login', {
    identifier: '+91 9876543210',
    password: 'Password456',
  });

  // Test 9: Login with wrong password (should fail)
  console.log('\n--- Test 9: Login with wrong password (should fail) ---');
  await test('Login wrong password', 'POST', '/login', {
    identifier: 'doctor@example.com',
    password: 'WrongPassword',
  });

  // Test 10: Login with non-existent user (should fail)
  console.log('\n--- Test 10: Login with non-existent user (should fail) ---');
  await test('Login non-existent user', 'POST', '/login', {
    identifier: 'nonexistent@test.com',
    password: 'Password123',
  });

  console.log('\n✅ Test suite complete\n');
}

// Check if server is running
fetch(`${BASE_URL}/health`)
  .catch(() => {
    console.error('❌ Server is not running at http://localhost:5000');
    console.error('Start the server with: npm start');
    process.exit(1);
  })
  .then(() => runTests())
  .catch(console.error);
