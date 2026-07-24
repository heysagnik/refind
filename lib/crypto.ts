import crypto from 'crypto';

const ALGO = 'aes-256-gcm';

function getKey(): Buffer {
  const secret = process.env.ANSWER_ENCRYPTION_KEY || process.env.BETTER_AUTH_SECRET;
  if (!secret) throw new Error('Missing ANSWER_ENCRYPTION_KEY (or BETTER_AUTH_SECRET) env var');
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Verification answers must stay human-readable to the finder (they're compared
 * by eye, not machine-matched), so they're encrypted at rest rather than hashed.
 */
export function encryptAnswer(plaintext: string): string {
  if (!plaintext) return '';
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString('base64')}:${tag.toString('base64')}:${enc.toString('base64')}`;
}

export function decryptAnswer(stored: string): string {
  if (!stored) return '';
  const parts = stored.split(':');
  if (parts.length !== 4 || parts[0] !== 'v1') return stored;

  try {
    const [, ivB64, tagB64, dataB64] = parts;
    const decipher = crypto.createDecipheriv(ALGO, getKey(), Buffer.from(ivB64, 'base64'));
    decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
    const dec = Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()]);
    return dec.toString('utf8');
  } catch {
    return stored;
  }
}
