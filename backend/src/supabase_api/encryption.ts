import crypto from 'crypto';

const encryptionKey = process.env.ENCRYPTION_KEY;

export function encrypt(text: string): Buffer {
  if (!encryptionKey) {
    throw new Error('ENCRYPTION_KEY not set in environment variables');
  }

  const key = crypto.scryptSync(encryptionKey, 'salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  return Buffer.concat([iv, encrypted]);
}

export function decrypt(buffer: Buffer): string {
  if (!encryptionKey) {
    throw new Error('ENCRYPTION_KEY not set in environment variables');
  }

  const key = crypto.scryptSync(encryptionKey, 'salt', 32);
  const iv = buffer.subarray(0, 16);
  const encrypted = buffer.subarray(16);
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString('utf8');
}
