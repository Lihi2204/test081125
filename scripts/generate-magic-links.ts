#!/usr/bin/env npx ts-node
/**
 * Magic Link Generator for Oral Exam Bot
 *
 * This script generates JWT-based magic links for students.
 * Run with: npx ts-node scripts/generate-magic-links.ts
 *
 * Before running:
 * 1. Set JWT_SECRET in your .env file
 * 2. Prepare a CSV file with student data
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import fs from 'fs';

// Load environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://exam-bot.vercel.app';

interface StudentInput {
  id_number: string; // Full ID number (will be hashed)
  first_name: string;
  last_name: string;
  email: string;
  slot_start: string; // ISO datetime
  slot_end: string; // ISO datetime
}

function hashStudentId(idNumber: string): string {
  return crypto.createHash('sha256').update(idNumber).digest('hex');
}

function generateMagicLink(student: StudentInput): string {
  const studentIdHash = hashStudentId(student.id_number);
  const idLast4 = student.id_number.slice(-4);

  const payload = {
    student_id_hash: studentIdHash,
    id_last4: idLast4,
    first_name: student.first_name,
    last_name: student.last_name,
    email: student.email,
    slot_start: student.slot_start,
    slot_end: student.slot_end,
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
    iat: Math.floor(Date.now() / 1000),
  };

  const token = jwt.sign(payload, JWT_SECRET);
  return `${BASE_URL}/exam?token=${token}`;
}

// Example usage - generate links for sample students
const sampleStudents: StudentInput[] = [
  {
    id_number: '123456789',
    first_name: 'דנה',
    last_name: 'כהן',
    email: 'dana.cohen@student.ono.ac.il',
    slot_start: '2025-11-20T14:00:00Z',
    slot_end: '2025-11-20T14:15:00Z',
  },
  {
    id_number: '987654321',
    first_name: 'יוסי',
    last_name: 'לוי',
    email: 'yossi.levi@student.ono.ac.il',
    slot_start: '2025-11-20T14:15:00Z',
    slot_end: '2025-11-20T14:30:00Z',
  },
];

console.log('Generating Magic Links for Oral Exam Bot\n');
console.log('==========================================\n');

sampleStudents.forEach((student, index) => {
  const link = generateMagicLink(student);
  const studentIdHash = hashStudentId(student.id_number);
  const idLast4 = student.id_number.slice(-4);

  console.log(`Student ${index + 1}: ${student.first_name} ${student.last_name}`);
  console.log(`  Email: ${student.email}`);
  console.log(`  ID Hash: ${studentIdHash}`);
  console.log(`  ID Last 4: ${idLast4}`);
  console.log(`  Slot: ${student.slot_start} - ${student.slot_end}`);
  console.log(`  Magic Link: ${link}`);
  console.log('\n---\n');
});

console.log('==========================================');
console.log('\nIMPORTANT: Copy these links and send to students via email.');
console.log('Store the ID hashes in your roster Google Sheet.');
console.log('\nTo generate for real students, modify the sampleStudents array');
console.log('or read from a CSV file.');
