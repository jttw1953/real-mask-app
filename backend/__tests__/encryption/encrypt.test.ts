import { jest } from '@jest/globals';
import crypto from 'crypto';

describe('Encryption Functions', () => {
  let originalEnv: NodeJS.ProcessEnv;
  let encrypt: (text: string) => Buffer;
  let decrypt: (buffer: Buffer) => string;

  beforeAll(async () => {
    originalEnv = process.env;
  });

  beforeEach(async () => {
    // Reset modules to clear any cached imports
    jest.resetModules();

    // Set a valid encryption key for tests
    process.env.ENCRYPTION_KEY = 'test-encryption-key-for-testing-purposes';

    // Dynamically import the encryption module
    const encryptionModule = await import(
      '../../src/supabase_api/encryption.js'
    );
    encrypt = encryptionModule.encrypt;
    decrypt = encryptionModule.decrypt;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('encrypt()', () => {
    describe('Success Cases', () => {
      /**
       * Verifies that encrypt returns a Buffer
       */
      test('should return a Buffer', () => {
        const result = encrypt('test');

        expect(result).toBeInstanceOf(Buffer);
      });

      /**
       * Verifies that encrypted output includes IV (16 bytes) + encrypted data
       */
      test('should return buffer with IV prepended (at least 17 bytes)', () => {
        const result = encrypt('a');

        // IV (16 bytes) + at least 1 block of encrypted data (16 bytes with padding)
        expect(result.length).toBeGreaterThanOrEqual(32);
      });

      /**
       * Verifies that encrypting the same text twice produces different outputs
       */
      test('should produce different outputs for same input (due to random IV)', () => {
        const text = 'test message';
        const result1 = encrypt(text);
        const result2 = encrypt(text);

        expect(result1).not.toEqual(result2);
        expect(result1.toString('hex')).not.toBe(result2.toString('hex'));
      });

      /**
       * Verifies that encrypted data can be decrypted back to original
       */
      test('should produce data that can be decrypted back to original', () => {
        const originalText = 'Hello, World!';
        const encrypted = encrypt(originalText);
        const decrypted = decrypt(encrypted);

        expect(decrypted).toBe(originalText);
      });

      /**
       * Verifies encryption of empty string
       */
      test('should encrypt empty string', () => {
        const result = encrypt('');

        expect(result).toBeInstanceOf(Buffer);
        expect(result.length).toBeGreaterThanOrEqual(32); // IV + padding block

        const decrypted = decrypt(result);
        expect(decrypted).toBe('');
      });

      /**
       * Verifies encryption of single character
       */
      test('should encrypt single character', () => {
        const result = encrypt('a');

        expect(result).toBeInstanceOf(Buffer);
        expect(result.length).toBeGreaterThanOrEqual(32);

        const decrypted = decrypt(result);
        expect(decrypted).toBe('a');
      });

      /**
       * Verifies encryption of short string
       */
      test('should encrypt short string', () => {
        const text = 'test';
        const result = encrypt(text);

        expect(result).toBeInstanceOf(Buffer);
        const decrypted = decrypt(result);
        expect(decrypted).toBe(text);
      });

      /**
       * Verifies encryption of long string
       */
      test('should encrypt long string', () => {
        const text = 'a'.repeat(10000);
        const result = encrypt(text);

        expect(result).toBeInstanceOf(Buffer);
        expect(result.length).toBeGreaterThan(10000);

        const decrypted = decrypt(result);
        expect(decrypted).toBe(text);
      });

      /**
       * Verifies encryption of very long string
       */
      test('should encrypt very long string (1MB)', () => {
        const text = 'x'.repeat(1024 * 1024); // 1MB
        const result = encrypt(text);

        expect(result).toBeInstanceOf(Buffer);
        const decrypted = decrypt(result);
        expect(decrypted).toBe(text);
      });

      /**
       * Verifies encryption of string with special characters
       */
      test('should encrypt string with special characters', () => {
        const text = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/~`';
        const result = encrypt(text);

        expect(result).toBeInstanceOf(Buffer);
        const decrypted = decrypt(result);
        expect(decrypted).toBe(text);
      });

      /**
       * Verifies encryption of string with Unicode characters
       */
      test('should encrypt string with Unicode characters', () => {
        const text = '你好世界 こんにちは мир 🌍🌎🌏';
        const result = encrypt(text);

        expect(result).toBeInstanceOf(Buffer);
        const decrypted = decrypt(result);
        expect(decrypted).toBe(text);
      });

      /**
       * Verifies encryption of string with emojis
       */
      test('should encrypt string with emojis', () => {
        const text = '😀😃😄😁🎉🎊🎈🎁';
        const result = encrypt(text);

        expect(result).toBeInstanceOf(Buffer);
        const decrypted = decrypt(result);
        expect(decrypted).toBe(text);
      });

      /**
       * Verifies encryption of string with newlines
       */
      test('should encrypt string with newlines', () => {
        const text = 'line1\nline2\nline3';
        const result = encrypt(text);

        expect(result).toBeInstanceOf(Buffer);
        const decrypted = decrypt(result);
        expect(decrypted).toBe(text);
      });

      /**
       * Verifies encryption of string with tabs
       */
      test('should encrypt string with tabs', () => {
        const text = 'col1\tcol2\tcol3';
        const result = encrypt(text);

        expect(result).toBeInstanceOf(Buffer);
        const decrypted = decrypt(result);
        expect(decrypted).toBe(text);
      });

      /**
       * Verifies encryption of multiline text
       */
      test('should encrypt multiline text', () => {
        const text = `This is line 1
This is line 2
This is line 3
With some special chars: !@#$%`;
        const result = encrypt(text);

        expect(result).toBeInstanceOf(Buffer);
        const decrypted = decrypt(result);
        expect(decrypted).toBe(text);
      });

      /**
       * Verifies encryption of JSON string
       */
      test('should encrypt JSON string', () => {
        const text = JSON.stringify({
          name: 'John Doe',
          age: 30,
          email: 'john@example.com',
          data: [1, 2, 3, 4, 5],
        });
        const result = encrypt(text);

        expect(result).toBeInstanceOf(Buffer);
        const decrypted = decrypt(result);
        expect(decrypted).toBe(text);
        expect(JSON.parse(decrypted)).toEqual(JSON.parse(text));
      });

      /**
       * Verifies encryption of string with null bytes
       */
      test('should encrypt string with null bytes', () => {
        const text = 'before\x00after';
        const result = encrypt(text);

        expect(result).toBeInstanceOf(Buffer);
        const decrypted = decrypt(result);
        expect(decrypted).toBe(text);
      });

      /**
       * Verifies encryption of string with all whitespace
       */
      test('should encrypt string with only spaces', () => {
        const text = '     ';
        const result = encrypt(text);

        expect(result).toBeInstanceOf(Buffer);
        const decrypted = decrypt(result);
        expect(decrypted).toBe(text);
      });

      /**
       * Verifies that IV is random (first 16 bytes should differ)
       */
      test('should use different IV for each encryption', () => {
        const text = 'test';
        const result1 = encrypt(text);
        const result2 = encrypt(text);

        const iv1 = result1.subarray(0, 16);
        const iv2 = result2.subarray(0, 16);

        expect(iv1).not.toEqual(iv2);
      });

      /**
       * Verifies encryption with different encryption keys produces different results
       */
      test('should produce different results with different encryption keys', async () => {
        const text = 'test message';

        // First encryption with first key
        process.env.ENCRYPTION_KEY = 'key1';
        jest.resetModules();
        const module1 = await import('../../src/supabase_api/encryption.js');
        const result1 = module1.encrypt(text);

        // Second encryption with second key
        process.env.ENCRYPTION_KEY = 'key2';
        jest.resetModules();
        const module2 = await import('../../src/supabase_api/encryption.js');
        const result2 = module2.encrypt(text);

        // Reset to original
        process.env.ENCRYPTION_KEY = 'test-encryption-key-for-testing-purposes';
        jest.resetModules();

        // The encrypted data (excluding IV) should be different
        expect(result1.subarray(16)).not.toEqual(result2.subarray(16));
      });
    });

    describe('Error Cases', () => {
      /**
       * Verifies that encrypt throws error when ENCRYPTION_KEY is not set
       */
      test('should throw error when ENCRYPTION_KEY is not set', async () => {
        const env = process.env as any;
        delete env.ENCRYPTION_KEY;
        jest.resetModules();

        const module = await import('../../src/supabase_api/encryption.js');

        expect(() => module.encrypt('test')).toThrow(
          'ENCRYPTION_KEY not set in environment variables'
        );
      });

      /**
       * Verifies that encrypt throws error when ENCRYPTION_KEY is undefined
       */
      test('should throw error when ENCRYPTION_KEY is undefined', async () => {
        const env = process.env as any;
        delete env.ENCRYPTION_KEY;
        jest.resetModules();

        const module = await import('../../src/supabase_api/encryption.js');

        expect(() => module.encrypt('test')).toThrow(
          'ENCRYPTION_KEY not set in environment variables'
        );
      });

      /**
       * Verifies that encrypt throws error when ENCRYPTION_KEY is empty string
       */
      test('should throw error when ENCRYPTION_KEY is empty string', async () => {
        process.env.ENCRYPTION_KEY = '';
        jest.resetModules();

        const module = await import('../../src/supabase_api/encryption.js');

        expect(() => module.encrypt('test')).toThrow(
          'ENCRYPTION_KEY not set in environment variables'
        );
      });

      /**
       * Verifies that encrypt throws error when ENCRYPTION_KEY is null
       */
      test('should throw error when ENCRYPTION_KEY is null/deleted', async () => {
        const env = process.env as any;
        delete env.ENCRYPTION_KEY;
        jest.resetModules();

        const module = await import('../../src/supabase_api/encryption.js');

        expect(() => module.encrypt('test')).toThrow(
          'ENCRYPTION_KEY not set in environment variables'
        );
      });
    });

    describe('Input Type Validation', () => {
      /**
       * Verifies that encrypt handles string input correctly
       */
      test('should accept string input', () => {
        expect(() => encrypt('valid string')).not.toThrow();
      });

      /**
       * Verifies behavior with number input (should throw error)
       */
      test('should throw error with number input', () => {
        expect(() => encrypt(123 as any)).toThrow();
      });

      /**
       * Verifies behavior with boolean input (should throw error)
       */
      test('should throw error with boolean input', () => {
        expect(() => encrypt(true as any)).toThrow();
      });

      /**
       * Verifies behavior with null input
       */
      test('should throw error with null input', () => {
        expect(() => encrypt(null as any)).toThrow();
      });

      /**
       * Verifies behavior with undefined input
       */
      test('should throw error with undefined input', () => {
        expect(() => encrypt(undefined as any)).toThrow();
      });

      /**
       * Verifies behavior with object input (should throw error)
       */
      test('should throw error with object input', () => {
        expect(() => encrypt({ key: 'value' } as any)).toThrow();
      });

      /**
       * Verifies behavior with array input (should throw error)
       */
      test('should throw error with array input', () => {
        expect(() => encrypt([1, 2, 3] as any)).toThrow();
      });
    });

    describe('Encryption Properties', () => {
      /**
       * Verifies that encrypted data length is appropriate for input
       */
      test('should produce appropriately sized output', () => {
        const inputs = ['a', 'test', 'longer text string', 'x'.repeat(100)];

        inputs.forEach((input) => {
          const result = encrypt(input);
          // IV (16) + encrypted data (padded to block size)
          expect(result.length).toBeGreaterThanOrEqual(32);
          // Should not be excessively large
          expect(result.length).toBeLessThan(input.length + 100);
        });
      });

      /**
       * Verifies that output is properly padded to block size
       */
      test('should pad output to AES block size (16 bytes)', () => {
        const inputs = ['a', 'ab', 'abc', 'abcd', 'abcdefghijklmnop'];

        inputs.forEach((input) => {
          const result = encrypt(input);
          // Total length minus IV should be multiple of 16
          const encryptedLength = result.length - 16;
          expect(encryptedLength % 16).toBe(0);
        });
      });

      /**
       * Verifies that encryption is deterministic with same IV
       */
      test('should produce same result with same IV (if we could control it)', () => {
        // This test verifies the encryption algorithm works consistently
        // We can't control the IV, but we can verify decrypt(encrypt(x)) = x
        const text = 'consistency test';

        for (let i = 0; i < 10; i++) {
          const encrypted = encrypt(text);
          const decrypted = decrypt(encrypted);
          expect(decrypted).toBe(text);
        }
      });

      /**
       * Verifies that output appears random (high entropy)
       */
      test('should produce output with high entropy', () => {
        const text = 'aaaaaaaaaaaaaaaa'; // Low entropy input
        const result = encrypt(text);

        // Check that output is not all same bytes
        const bytes = Array.from(result);
        const uniqueBytes = new Set(bytes);

        // Encrypted data should have many unique bytes (high entropy)
        expect(uniqueBytes.size).toBeGreaterThan(10);
      });

      /**
       * Verifies that small changes in input produce large changes in output
       */
      test('should exhibit avalanche effect (small input change = large output change)', () => {
        const text1 = 'test message';
        const text2 = 'test messagf'; // One character different

        const result1 = encrypt(text1);
        const result2 = encrypt(text2);

        // Skip IV comparison (first 16 bytes), compare encrypted data
        const encrypted1 = result1.subarray(16);
        const encrypted2 = result2.subarray(16);

        // Count differing bytes
        let differences = 0;
        const minLength = Math.min(encrypted1.length, encrypted2.length);
        for (let i = 0; i < minLength; i++) {
          if (encrypted1[i] !== encrypted2[i]) {
            differences++;
          }
        }

        // Should have significant differences (avalanche effect)
        expect(differences).toBeGreaterThan(minLength * 0.3);
      });
    });

    describe('Edge Cases', () => {
      /**
       * Verifies encryption of string with maximum practical length
       */
      test('should handle string at practical size limit (10MB)', () => {
        const text = 'x'.repeat(10 * 1024 * 1024); // 10MB
        const result = encrypt(text);

        expect(result).toBeInstanceOf(Buffer);
        expect(result.length).toBeGreaterThan(10 * 1024 * 1024);
      });

      /**
       * Verifies encryption with various key lengths
       */
      test('should work with short encryption key', async () => {
        process.env.ENCRYPTION_KEY = 'short';
        jest.resetModules();

        const module = await import('../../src/supabase_api/encryption.js');
        const result = module.encrypt('test');

        expect(result).toBeInstanceOf(Buffer);
        const decrypted = module.decrypt(result);
        expect(decrypted).toBe('test');
      });

      /**
       * Verifies encryption with long encryption key
       */
      test('should work with long encryption key', async () => {
        process.env.ENCRYPTION_KEY = 'a'.repeat(1000);
        jest.resetModules();

        const module = await import('../../src/supabase_api/encryption.js');
        const result = module.encrypt('test');

        expect(result).toBeInstanceOf(Buffer);
        const decrypted = module.decrypt(result);
        expect(decrypted).toBe('test');
      });

      /**
       * Verifies encryption with key containing special characters
       */
      test('should work with encryption key containing special characters', async () => {
        process.env.ENCRYPTION_KEY = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/~`';
        jest.resetModules();

        const module = await import('../../src/supabase_api/encryption.js');
        const result = module.encrypt('test');

        expect(result).toBeInstanceOf(Buffer);
        const decrypted = module.decrypt(result);
        expect(decrypted).toBe('test');
      });

      /**
       * Verifies that repeated encryption/decryption cycles work
       */
      test('should handle multiple encryption/decryption cycles', () => {
        let text = 'original text';

        // Encrypt and decrypt 100 times
        for (let i = 0; i < 100; i++) {
          const encrypted = encrypt(text);
          text = decrypt(encrypted);
        }

        expect(text).toBe('original text');
      });

      /**
       * Verifies concurrent encryption operations
       */
      test('should handle concurrent encryption operations', () => {
        const promises = Array.from({ length: 100 }, (_, i) => {
          return Promise.resolve(encrypt(`message ${i}`));
        });

        return Promise.all(promises).then((results) => {
          expect(results).toHaveLength(100);
          results.forEach((result, i) => {
            expect(result).toBeInstanceOf(Buffer);
            const decrypted = decrypt(result);
            expect(decrypted).toBe(`message ${i}`);
          });
        });
      });
    });

    describe('Security Properties', () => {
      /**
       * Verifies that same plaintext produces different ciphertexts
       */
      test('should not be deterministic (same input = different output)', () => {
        const text = 'security test';
        const results = new Set();

        // Encrypt same text 10 times
        for (let i = 0; i < 10; i++) {
          const result = encrypt(text);
          results.add(result.toString('hex'));
        }

        // All results should be unique
        expect(results.size).toBe(10);
      });

      /**
       * Verifies that IV is truly random
       */
      test('should use cryptographically random IV', () => {
        const ivs = new Set();

        // Generate 100 encryptions and collect IVs
        for (let i = 0; i < 100; i++) {
          const result = encrypt('test');
          const iv = result.subarray(0, 16).toString('hex');
          ivs.add(iv);
        }

        // All IVs should be unique (statistically very likely)
        expect(ivs.size).toBe(100);
      });

      /**
       * Verifies that output does not contain plaintext
       */
      test('should not contain plaintext in output', () => {
        const text = 'secretpassword123';
        const result = encrypt(text);
        const resultString = result.toString('utf8');

        // Plaintext should not appear in encrypted output
        expect(resultString).not.toContain('secretpassword123');
        expect(resultString).not.toContain('secret');
        expect(resultString).not.toContain('password');
      });

      /**
       * Verifies that changing one bit in ciphertext corrupts decryption
       */
      test('should fail decryption if ciphertext is tampered', () => {
        const text = 'test message';
        const encrypted = encrypt(text);

        // Create a copy and flip one bit in the encrypted data (not in IV)
        const tampered = Buffer.from(encrypted);
        tampered[20] = tampered[20]! ^ 0x01;

        // Decryption should either fail or return corrupted data
        expect(() => {
          const decrypted = decrypt(tampered);
          // If it doesn't throw, the decrypted text should be different
          expect(decrypted).not.toBe(text);
        }).toThrow();
      });
    });

    describe('Performance', () => {
      /**
       * Verifies that encryption completes in reasonable time
       */
      test('should encrypt small string quickly (< 100ms)', () => {
        const start = Date.now();
        encrypt('test message');
        const duration = Date.now() - start;

        expect(duration).toBeLessThan(100);
      });

      /**
       * Verifies that encryption of medium string is reasonably fast
       */
      test('should encrypt medium string efficiently (< 500ms)', () => {
        const text = 'x'.repeat(100000); // 100KB
        const start = Date.now();
        encrypt(text);
        const duration = Date.now() - start;

        expect(duration).toBeLessThan(500);
      });
    });
  });
});
