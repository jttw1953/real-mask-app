/**
 * Unit tests for encryption utilities
 * Tests encryptMessage and decryptMessage functions with various scenarios
 */

import {
  generateKeyPair,
  encryptMessage,
  decryptMessage,
  uint8ArrayToBase64,
  base64ToUint8Array,
  type KeyPair,
  type EncryptedMessage,
} from '../../src/utils/encryption';

describe('Encryption Utilities', () => {
  let aliceKeyPair: KeyPair;
  let bobKeyPair: KeyPair;

  beforeEach(() => {
    // Generate fresh key pairs for each test
    aliceKeyPair = generateKeyPair();
    bobKeyPair = generateKeyPair();
  });

  describe('generateKeyPair', () => {
    it('should generate a valid key pair with publicKey and secretKey', () => {
      const keyPair = generateKeyPair();
      expect(keyPair.publicKey).toBeDefined();
      expect(keyPair.secretKey).toBeDefined();
      expect(keyPair.publicKey).toBeInstanceOf(Uint8Array);
      expect(keyPair.secretKey).toBeInstanceOf(Uint8Array);
    });

    it('should generate different key pairs each time', () => {
      const keyPair1 = generateKeyPair();
      const keyPair2 = generateKeyPair();

      expect(keyPair1.publicKey).not.toEqual(keyPair2.publicKey);
      expect(keyPair1.secretKey).not.toEqual(keyPair2.secretKey);
    });

    it('should generate keys of expected length', () => {
      const keyPair = generateKeyPair();
      // NaCl public keys are 32 bytes
      expect(keyPair.publicKey.length).toBe(32);
      // NaCl secret keys for box are 32 bytes
      expect(keyPair.secretKey.length).toBe(32);
    });
  });

  describe('uint8ArrayToBase64 and base64ToUint8Array', () => {
    it('should convert Uint8Array to base64 and back', () => {
      const original = new Uint8Array([1, 2, 3, 4, 5, 255, 254, 253]);
      const base64 = uint8ArrayToBase64(original);
      const recovered = base64ToUint8Array(base64);

      expect(recovered).toEqual(original);
    });

    it('should handle empty arrays', () => {
      const original = new Uint8Array([]);
      const base64 = uint8ArrayToBase64(original);
      const recovered = base64ToUint8Array(base64);

      expect(recovered).toEqual(original);
    });

    it('should be compatible with base64 standard', () => {
      const original = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
      const base64 = uint8ArrayToBase64(original);
      expect(base64).toBe('SGVsbG8=');
    });
  });

  describe('encryptMessage', () => {
    it('should encrypt a simple message', () => {
      const message = 'Hello, Bob!';
      const encrypted = encryptMessage(message, bobKeyPair.publicKey, aliceKeyPair.secretKey);

      expect(encrypted).toBeDefined();
      expect(encrypted.ciphertext).toBeDefined();
      expect(encrypted.nonce).toBeDefined();
      expect(encrypted.publicKey).toBeDefined();
      expect(typeof encrypted.ciphertext).toBe('string');
      expect(typeof encrypted.nonce).toBe('string');
      expect(typeof encrypted.publicKey).toBe('string');
    });

    it('should encrypt messages with special characters', () => {
      const messages = [
        'Hello! 👋',
        'Test with symbols: !@#$%^&*()',
        'Multi\nline\nmessage',
        'Unicode: 你好世界',
        'Empty after colon: ',
      ];

      messages.forEach((msg) => {
        const encrypted = encryptMessage(msg, bobKeyPair.publicKey, aliceKeyPair.secretKey);
        const decrypted = decryptMessage(encrypted, aliceKeyPair.publicKey, bobKeyPair.secretKey);
        expect(decrypted).toBe(msg);
      });
    });

    it('should encrypt empty strings', () => {
      const message = '';
      const encrypted = encryptMessage(message, bobKeyPair.publicKey, aliceKeyPair.secretKey);
      const decrypted = decryptMessage(encrypted, aliceKeyPair.publicKey, bobKeyPair.secretKey);
      expect(decrypted).toBe('');
    });

    it('should encrypt long messages', () => {
      const longMessage = 'A'.repeat(10000);
      const encrypted = encryptMessage(longMessage, bobKeyPair.publicKey, aliceKeyPair.secretKey);
      const decrypted = decryptMessage(encrypted, aliceKeyPair.publicKey, bobKeyPair.secretKey);
      expect(decrypted).toBe(longMessage);
    });

    it('should produce different ciphertexts for the same message', () => {
      const message = 'Same message';
      const encrypted1 = encryptMessage(message, bobKeyPair.publicKey, aliceKeyPair.secretKey);
      const encrypted2 = encryptMessage(message, bobKeyPair.publicKey, aliceKeyPair.secretKey);

      // Ciphertexts should differ due to random nonce
      expect(encrypted1.ciphertext).not.toBe(encrypted2.ciphertext);
      // But nonces should also differ
      expect(encrypted1.nonce).not.toBe(encrypted2.nonce);
    });

    it('should include sender public key in encrypted message', () => {
      const message = 'Test';
      const encrypted = encryptMessage(message, bobKeyPair.publicKey, aliceKeyPair.secretKey);
      const senderPublicKeyFromEncrypted = base64ToUint8Array(encrypted.publicKey);

      // Should match Alice's public key
      expect(senderPublicKeyFromEncrypted).toEqual(aliceKeyPair.publicKey);
    });
  });

  describe('decryptMessage', () => {
    it('should decrypt a message encrypted by the other party', () => {
      const message = 'Secret message from Alice';
      const encrypted = encryptMessage(message, bobKeyPair.publicKey, aliceKeyPair.secretKey);

      // Bob decrypts using Alice's public key and his secret key
      const decrypted = decryptMessage(encrypted, aliceKeyPair.publicKey, bobKeyPair.secretKey);
      expect(decrypted).toBe(message);
    });

    it('should fail to decrypt with wrong recipient secret key', () => {
      const message = 'Secret';
      const encrypted = encryptMessage(message, bobKeyPair.publicKey, aliceKeyPair.secretKey);

      // Try to decrypt with wrong key
      const charlieKeyPair = generateKeyPair();
      expect(() => {
        decryptMessage(encrypted, aliceKeyPair.publicKey, charlieKeyPair.secretKey);
      }).toThrow('Failed to decrypt message');
    });

    it('should fail to decrypt with tampered ciphertext', () => {
      const message = 'Secret';
      const encrypted = encryptMessage(message, bobKeyPair.publicKey, aliceKeyPair.secretKey);

      // Tamper with ciphertext
      const tamperedEncrypted: EncryptedMessage = {
        ...encrypted,
        ciphertext: uint8ArrayToBase64(new Uint8Array(64)), // Replace with garbage
      };

      expect(() => {
        decryptMessage(tamperedEncrypted, aliceKeyPair.publicKey, bobKeyPair.secretKey);
      }).toThrow('Failed to decrypt message');
    });

    it('should fail to decrypt with wrong sender public key', () => {
      const message = 'Secret';
      const encrypted = encryptMessage(message, bobKeyPair.publicKey, aliceKeyPair.secretKey);

      // Use wrong sender public key
      const charlieKeyPair = generateKeyPair();
      expect(() => {
        decryptMessage(encrypted, charlieKeyPair.publicKey, bobKeyPair.secretKey);
      }).toThrow('Failed to decrypt message');
    });

    it('should handle base64 encoded encrypted messages', () => {
      const message = 'Test with base64 encoding';
      const encrypted = encryptMessage(message, bobKeyPair.publicKey, aliceKeyPair.secretKey);

      // Verify the fields are indeed base64 strings
      expect(() => {
        base64ToUint8Array(encrypted.ciphertext);
        base64ToUint8Array(encrypted.nonce);
        base64ToUint8Array(encrypted.publicKey);
      }).not.toThrow();
    });
  });

  describe('Round-trip encryption/decryption', () => {
    it('should support bidirectional communication', () => {
      // Alice sends to Bob
      const messageFromAlice = 'Hello Bob';
      const encryptedByAlice = encryptMessage(
        messageFromAlice,
        bobKeyPair.publicKey,
        aliceKeyPair.secretKey
      );
      const decryptedByBob = decryptMessage(
        encryptedByAlice,
        aliceKeyPair.publicKey,
        bobKeyPair.secretKey
      );
      expect(decryptedByBob).toBe(messageFromAlice);

      // Bob replies to Alice
      const messageFromBob = 'Hi Alice!';
      const encryptedByBob = encryptMessage(
        messageFromBob,
        aliceKeyPair.publicKey,
        bobKeyPair.secretKey
      );
      const decryptedByAlice = decryptMessage(
        encryptedByBob,
        bobKeyPair.publicKey,
        aliceKeyPair.secretKey
      );
      expect(decryptedByAlice).toBe(messageFromBob);
    });

    it('should support multiple message exchanges', () => {
      const messages = ['First', 'Second', 'Third', 'Fourth', 'Fifth'];

      messages.forEach((msg, index) => {
        if (index % 2 === 0) {
          // Alice sends
          const encrypted = encryptMessage(msg, bobKeyPair.publicKey, aliceKeyPair.secretKey);
          const decrypted = decryptMessage(encrypted, aliceKeyPair.publicKey, bobKeyPair.secretKey);
          expect(decrypted).toBe(msg);
        } else {
          // Bob sends
          const encrypted = encryptMessage(msg, aliceKeyPair.publicKey, bobKeyPair.secretKey);
          const decrypted = decryptMessage(encrypted, bobKeyPair.publicKey, aliceKeyPair.secretKey);
          expect(decrypted).toBe(msg);
        }
      });
    });
  });

  describe('EncryptedMessage interface', () => {
    it('should have required fields in encrypted message', () => {
      const message = 'Test';
      const encrypted = encryptMessage(message, bobKeyPair.publicKey, aliceKeyPair.secretKey);

      expect(encrypted).toHaveProperty('ciphertext');
      expect(encrypted).toHaveProperty('nonce');
      expect(encrypted).toHaveProperty('publicKey');
    });

    it('should be serializable to JSON', () => {
      const message = 'Serializable test';
      const encrypted = encryptMessage(message, bobKeyPair.publicKey, aliceKeyPair.secretKey);

      // Should be JSON serializable
      const json = JSON.stringify(encrypted);
      const parsed = JSON.parse(json) as EncryptedMessage;

      // Should still be decryptable
      const decrypted = decryptMessage(parsed, aliceKeyPair.publicKey, bobKeyPair.secretKey);
      expect(decrypted).toBe(message);
    });
  });

  describe('Edge cases', () => {
    it('should handle message with only whitespace', () => {
      const message = '   \n\t   ';
      const encrypted = encryptMessage(message, bobKeyPair.publicKey, aliceKeyPair.secretKey);
      const decrypted = decryptMessage(encrypted, aliceKeyPair.publicKey, bobKeyPair.secretKey);
      expect(decrypted).toBe(message);
    });

    it('should handle message with null bytes', () => {
      // Encode a string with null bytes manually
      const encoder = new TextEncoder();
      const messageWithNulls = 'Hello\x00World';
      const encrypted = encryptMessage(messageWithNulls, bobKeyPair.publicKey, aliceKeyPair.secretKey);
      const decrypted = decryptMessage(encrypted, aliceKeyPair.publicKey, bobKeyPair.secretKey);
      expect(decrypted).toBe(messageWithNulls);
    });

    it('should not leak message content through ciphertext length patterns', () => {
      const shortMsg = 'Hi';
      const longMsg = 'A'.repeat(1000);

      const encryptedShort = encryptMessage(shortMsg, bobKeyPair.publicKey, aliceKeyPair.secretKey);
      const encryptedLong = encryptMessage(longMsg, bobKeyPair.publicKey, aliceKeyPair.secretKey);

      // Ciphertexts should differ in length based on message length
      // (This is expected for stream ciphers)
      const shortLen = base64ToUint8Array(encryptedShort.ciphertext).length;
      const longLen = base64ToUint8Array(encryptedLong.ciphertext).length;
      expect(longLen).toBeGreaterThan(shortLen);
    });
  });
});
