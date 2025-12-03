/**
 * End-to-end encryption utilities for chat messages
 * Uses TweetNaCl.js crypto_box for NaCl public key cryptography
 */

import nacl from 'tweetnacl';

export interface KeyPair {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
}

export interface EncryptedMessage {
  ciphertext: string; // base64 encoded
  nonce: string; // base64 encoded
  publicKey: string; // base64 encoded sender's public key
}

/**
 * Convert Uint8Array to base64 (browser-compatible)
 */
function uint8ArrayToBase64(arr: Uint8Array): string {
  const bytes = new Uint8Array(arr);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert base64 to Uint8Array (browser-compatible)
 */
function base64ToUint8Array(str: string): Uint8Array {
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Generate a new key pair for this user
 */
export function generateKeyPair(): KeyPair {
  return nacl.box.keyPair();
}

/**
 * Encrypt a message for a recipient using their public key
 */
export function encryptMessage(
  message: string,
  recipientPublicKey: Uint8Array,
  senderSecretKey: Uint8Array
): EncryptedMessage {
  const nonce = nacl.randomBytes(24);
  
  // Use Buffer for encoding in Node environment, TextEncoder for browser
  let messageBytes: Uint8Array;
  if (typeof Buffer !== 'undefined') {
    messageBytes = new Uint8Array(Buffer.from(message, 'utf8'));
  } else {
    messageBytes = new TextEncoder().encode(message);
  }
  
  const ciphertext = nacl.box(
    messageBytes,
    nonce,
    recipientPublicKey,
    senderSecretKey
  );
  
  if (!ciphertext) {
    throw new Error('Encryption failed');
  }

  // Get sender's public key from their secret key
  const senderKeyPair = nacl.box.keyPair.fromSecretKey(senderSecretKey);

  return {
    ciphertext: uint8ArrayToBase64(ciphertext),
    nonce: uint8ArrayToBase64(nonce),
    publicKey: uint8ArrayToBase64(senderKeyPair.publicKey),
  };
}

/**
 * Decrypt a message using your secret key and sender's public key
 */
export function decryptMessage(
  encrypted: EncryptedMessage,
  senderPublicKey: Uint8Array,
  recipientSecretKey: Uint8Array
): string {
  const ciphertext = base64ToUint8Array(encrypted.ciphertext);
  const nonce = base64ToUint8Array(encrypted.nonce);

  const messageBytes = nacl.box.open(
    ciphertext,
    nonce,
    senderPublicKey,
    recipientSecretKey
  );

  if (!messageBytes) {
    throw new Error('Failed to decrypt message');
  }

  // Use Buffer for decoding in Node environment, TextDecoder for browser
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(messageBytes).toString('utf8');
  } else {
    return new TextDecoder().decode(messageBytes);
  }
}

/**
 * Export functions for public use
 */
export { uint8ArrayToBase64, base64ToUint8Array };
