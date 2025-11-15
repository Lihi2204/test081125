#!/usr/bin/env node
/**
 * Generate a magic link for testing the exam system
 *
 * Usage:
 *   node scripts/generate-magic-link.js
 *
 * Or with custom values:
 *   node scripts/generate-magic-link.js --first-name "ישראל" --last-name "ישראלי" --email "test@example.com"
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Parse command line arguments
const args = process.argv.slice(2);
const getArg = (name) => {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
};

// Default test values
const firstName = getArg('first-name') || 'Test';
const lastName = getArg('last-name') || 'Student';
const email = getArg('email') || 'test@example.com';
const idLast4 = getArg('id-last4') || '1234';
const baseUrl = getArg('base-url') || process.env.BASE_URL || 'http://localhost:5173';
const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Calculate time window
const now = new Date();
const slotStart = new Date(now.getTime() - 15 * 60 * 1000); // Started 15 min ago
const slotEnd = new Date(now.getTime() + 60 * 60 * 1000); // Ends in 1 hour

// Generate student hash
const studentIdHash = crypto.createHash('sha256').update(email).digest('hex');

// Create JWT payload
const payload = {
  student_id_hash: studentIdHash,
  id_last4: idLast4,
  first_name: firstName,
  last_name: lastName,
  email: email,
  slot_start: slotStart.toISOString(),
  slot_end: slotEnd.toISOString(),
  exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
  iat: Math.floor(Date.now() / 1000),
};

// Sign the token
const token = jwt.sign(payload, jwtSecret);

// Generate the link
const magicLink = `${baseUrl}/exam?token=${token}`;

console.log('\n=== Magic Link Generator ===\n');
console.log('Student Details:');
console.log(`  Name: ${firstName} ${lastName}`);
console.log(`  Email: ${email}`);
console.log(`  ID Last 4: ${idLast4}`);
console.log(`  Student Hash: ${studentIdHash.substring(0, 16)}...`);
console.log(`\nTime Window:`);
console.log(`  Start: ${slotStart.toLocaleString('he-IL')}`);
console.log(`  End: ${slotEnd.toLocaleString('he-IL')}`);
console.log(`\n🔗 Magic Link:\n`);
console.log(magicLink);
console.log('\n⚠️  IMPORTANT:');
console.log('1. Make sure the student is in the roster Google Sheet');
console.log('2. The student_id_hash column must contain:', studentIdHash);
console.log('3. Or use the same JWT_SECRET in production as configured in Vercel\n');
