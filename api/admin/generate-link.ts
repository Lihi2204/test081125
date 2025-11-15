import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateMagicLink } from '../lib/jwt';
import crypto from 'crypto';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      first_name,
      last_name,
      email,
      id_last4,
      slot_start,
      slot_end,
      base_url,
    } = req.body;

    // Validate required fields
    if (!first_name || !last_name || !email || !id_last4) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['first_name', 'last_name', 'email', 'id_last4'],
      });
    }

    // Generate student_id_hash from email
    const student_id_hash = crypto.createHash('sha256').update(email).digest('hex');

    // Default time window: now + 1 hour
    const now = new Date();
    const defaultSlotStart = slot_start || now.toISOString();
    const defaultSlotEnd = slot_end || new Date(now.getTime() + 60 * 60 * 1000).toISOString();

    // Generate the magic link
    const link = generateMagicLink(base_url || 'http://localhost:5173', {
      student_id_hash,
      id_last4,
      first_name,
      last_name,
      email,
      slot_start: defaultSlotStart,
      slot_end: defaultSlotEnd,
    });

    return res.status(200).json({
      success: true,
      link,
      student_id_hash,
      slot_start: defaultSlotStart,
      slot_end: defaultSlotEnd,
    });
  } catch (err) {
    console.error('Error generating link:', err);
    return res.status(500).json({
      error: 'Failed to generate link',
      details: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}
