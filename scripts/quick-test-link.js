#!/usr/bin/env node
/**
 * Quick Test Magic Link Generator
 *
 * Run with: node scripts/quick-test-link.js [YOUR_VERCEL_URL]
 *
 * This generates a magic link for testing purposes.
 * The link will be valid for 7 days and set for immediate access.
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Configuration - MUST match what's in api/lib/jwt.ts
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const BASE_URL = process.argv[2] || 'http://localhost:5173';

// Test student data
const testStudent = {
  id_number: '123456789',
  first_name: 'טסט',
  last_name: 'בדיקה',
  email: 'lihi.cyn@gmail.com',
};

// Generate time window - starts NOW, ends in 2 hours
const now = new Date();
const slotStart = new Date(now.getTime() - 15 * 60 * 1000); // 15 min ago (so we're in window)
const slotEnd = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now

function hashStudentId(idNumber) {
  return crypto.createHash('sha256').update(idNumber).digest('hex');
}

const studentIdHash = hashStudentId(testStudent.id_number);
const idLast4 = testStudent.id_number.slice(-4);

const payload = {
  student_id_hash: studentIdHash,
  id_last4: idLast4,
  first_name: testStudent.first_name,
  last_name: testStudent.last_name,
  email: testStudent.email,
  slot_start: slotStart.toISOString(),
  slot_end: slotEnd.toISOString(),
  exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
  iat: Math.floor(Date.now() / 1000),
};

const token = jwt.sign(payload, JWT_SECRET);
const magicLink = `${BASE_URL}/exam?token=${token}`;

console.log('===========================================');
console.log('QUICK TEST MAGIC LINK GENERATOR');
console.log('===========================================\n');

console.log('Student Details:');
console.log(`  Name: ${testStudent.first_name} ${testStudent.last_name}`);
console.log(`  Email: ${testStudent.email}`);
console.log(`  ID Hash: ${studentIdHash}`);
console.log(`  ID Last 4: ${idLast4}`);
console.log(`  Time Window: ${slotStart.toISOString()} - ${slotEnd.toISOString()}`);
console.log();

console.log('MAGIC LINK (copy this):');
console.log('-------------------------------------------');
console.log(magicLink);
console.log('-------------------------------------------\n');

console.log('IMPORTANT NOTES:');
console.log('1. This link is valid for testing immediately');
console.log('2. Make sure JWT_SECRET in Vercel matches: "' + JWT_SECRET + '"');
console.log('3. You need to add this student to your Google Sheets roster with hash: ' + studentIdHash);
console.log('4. If you get TOKEN_INVALID, check that JWT_SECRET is the same in Vercel env vars');
console.log();

if (process.env.JWT_SECRET) {
  console.log('✅ Using JWT_SECRET from environment variable');
} else {
  console.log('⚠️  Using default JWT_SECRET - make sure Vercel uses the same default!');
}
