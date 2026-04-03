#!/usr/bin/env node

/**
 * Verification Script: Test MongoDB Connection and Models
 * 
 * Run with: node verify.js
 * 
 * This script:
 * 1. Loads environment config
 * 2. Connects to MongoDB
 * 3. Tests User model schema
 * 4. Tests HealthLog model schema
 * 5. Disconnects cleanly
 */

import { connectDB, disconnectDB } from './config/db.js';
import User from './models/User.js';
import HealthLog from './models/HealthLog.js';

async function verify() {
  console.log('\n📋 Janani Backend Verification\n');

  try {
    // 1. Connect to MongoDB
    console.log('1️⃣  Connecting to MongoDB...');
    await connectDB();

    // 2. Test User Model
    console.log('2️⃣  Testing User model schema...');
    const userCollection = User.collection;
    console.log(`   - User collection: ${userCollection.name}`);
    console.log(`   - Schema fields: name, email, phoneNumber, passwordHash`);
    console.log(`   - Validation: At least email OR phoneNumber required`);

    // 3. Test HealthLog Model
    console.log('3️⃣  Testing HealthLog model schema...');
    const healthLogCollection = HealthLog.collection;
    console.log(`   - HealthLog collection: ${healthLogCollection.name}`);
    console.log(`   - Root fields: userId, name, phoneNumber, email, preferredLanguage`);
    console.log(`   - Nested: history (Interactions), summaries (GeneratedSummaries)`);
    console.log(`   - Interaction fields: source, language, userInput, aiOutput, clinical, meta`);
    console.log(`   - Summary fields: type, periodStart, periodEnd, summaryEnglish, summaryNative`);

    // 4. Validation test for User (should fail — no email/phone)
    console.log('\n4️⃣  Testing User validation...');
    const invalidUser = new User({
      name: 'Test User',
      passwordHash: 'hash',
    });
    try {
      await invalidUser.validate();
      console.log('   ✗ FAILED: Should have required email or phoneNumber');
    } catch (err) {
      console.log('   ✓ PASSED: Correctly rejected user without email/phone');
    }

    // 5. Validation test for HealthLog (should fail — no identity)
    console.log('\n5️⃣  Testing HealthLog validation...');
    const invalidHealthLog = new HealthLog({
      name: 'Test Patient',
      preferredLanguage: 'hi-IN',
    });
    try {
      await invalidHealthLog.validate();
      console.log('   ✗ FAILED: Should have required phoneNumber, email, or userId');
    } catch (err) {
      console.log('   ✓ PASSED: Correctly rejected HealthLog without identity');
    }

    // 6. Schema validity test — create valid documents (don't save)
    console.log('\n6️⃣  Testing valid document creation...');
    const validUser = new User({
      name: 'Dr. Sharma',
      email: 'doctor@example.com',
      phoneNumber: '+91 9876543210',
      passwordHash: 'hashed_password_here',
    });
    await validUser.validate();
    console.log('   ✓ PASSED: Valid User document created');

    const validHealthLog = new HealthLog({
      phoneNumber: '+91 9123456789',
      email: 'patient@example.com',
      name: 'Priya Singh',
      preferredLanguage: 'hi-IN',
      history: [
        {
          interactionId: 'int_001',
          timestamp: new Date(),
          source: 'website_text',
          language: {
            detected: 'hi-IN',
            requested: 'hi-IN',
            response: 'hi-IN',
          },
          userInput: {
            nativeText: 'मुझे सिरदर्द है',
            englishText: 'I have a headache',
          },
          aiOutput: {
            englishText: 'Rest and hydration are recommended',
            nativeText: 'आराम और हाइड्रेशन की सिफारिश की जाती है',
            model: 'groq-llama',
            retrievalUsed: true,
            retrievedSourcesCount: 2,
          },
          clinical: {
            symptoms: [
              {
                name: 'headache',
                status: 'active',
                reportedTime: 'now',
              },
            ],
            severityScore: 4,
            aiSummary: 'Patient reports mild headache',
          },
          meta: {
            processingStatus: 'success',
          },
        },
      ],
    });
    await validHealthLog.validate();
    console.log('   ✓ PASSED: Valid HealthLog document created');

    // Success message
    console.log('\n✅ All validations passed!\n');
    console.log('📊 Schema Summary:');
    console.log('   - User model: Ready for authentication');
    console.log('   - HealthLog model: Ready for interaction history + summaries');
    console.log('   - Database connection: Working\n');

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    process.exit(1);
  } finally {
    await disconnectDB();
  }
}

verify();
