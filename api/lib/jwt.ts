import jwt from 'jsonwebtoken';
import type { TokenPayload } from '../../src/types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export function generateToken(payload: Omit<TokenPayload, 'exp' | 'iat'>): string {
  const tokenPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
    iat: Math.floor(Date.now() / 1000),
  };

  return jwt.sign(tokenPayload, JWT_SECRET);
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
}

export function decodeToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.decode(token) as TokenPayload;
    return decoded;
  } catch (error) {
    console.error('JWT decode error:', error);
    return null;
  }
}

export function generateMagicLink(
  baseUrl: string,
  studentData: {
    student_id_hash: string;
    id_last4: string;
    first_name: string;
    last_name: string;
    email: string;
    slot_start: string;
    slot_end: string;
  }
): string {
  const token = generateToken(studentData);
  return `${baseUrl}/exam?token=${token}`;
}
