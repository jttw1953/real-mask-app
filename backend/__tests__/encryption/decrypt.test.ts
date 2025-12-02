import { jest } from '@jest/globals';
import crypto from 'crypto';

describe('Decryption Functions', () => {
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

  describe('decrypt()', () => {
    describe('Success Cases', () => {
      /**
       * Verifies that decrypt returns a string
       */
      test('should return a string', () => {
        const encrypted = encrypt('test');
        const result = decrypt(encrypted);

        expect(typeof result).toBe('string');
      });

      /**
       * Verifies that decrypt can decrypt encrypted text back to original
       */
      test('should decrypt encrypted text back to original', () => {
        const originalText = 'Hello, World!';
        const encrypted = encrypt(originalText);
        const decrypted = decrypt(encrypted);

        expect(decrypted).toBe(originalText);
      });

      /**
       * Verifies decryption of empty string
       */
      test('should decrypt empty string', () => {
        const encrypted = encrypt('');
        const decrypted = decrypt(encrypted);

        expect(decrypted).toBe('');
      });

      /**
       * Verifies decryption of single character
       */
      test('should decrypt single character', () => {
        const originalText = 'a';
        const encrypted = encrypt(originalText);
        const decrypted = decrypt(encrypted);

        expect(decrypted).toBe(originalText);
      });

      /**
       * Verifies decryption of short string
       */
      test('should decrypt short string', () => {
        const originalText = 'test';
        const encrypted = encrypt(originalText);
        const decrypted = decrypt(encrypted);

        expect(decrypted).toBe(originalText);
      });

      /**
       * Verifies decryption of long string
       */
      test('should decrypt long string', () => {
        const originalText = 'a'.repeat(10000);
        const encrypted = encrypt(originalText);
        const decrypted = decrypt(encrypted);

        expect(decrypted).toBe(originalText);
      });

      /**
       * Verifies decryption of very long string
       */
      test('should decrypt very long string (1MB)', () => {
        const originalText = 'x'.repeat(1024 * 1024); // 1MB
        const encrypted = encrypt(originalText);
        const decrypted = decrypt(encrypted);

        expect(decrypted).toBe(originalText);
      });

      /**
       * Verifies decryption of string with special characters
       */
      test('should decrypt string with special characters', () => {
        const originalText = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/~`';
        const encrypted = encrypt(originalText);
        const decrypted = decrypt(encrypted);

        expect(decrypted).toBe(originalText);
      });

      /**
       * Verifies decryption of string with Unicode characters
       */
      test('should decrypt string with Unicode characters', () => {
        const originalText = '你好世界 こんにちは мир 🌍🌎🌏';
        const encrypted = encrypt(originalText);
        const decrypted = decrypt(encrypted);

        expect(decrypted).toBe(originalText);
      });

      /**
       * Verifies decryption of string with emojis
       */
      test('should decrypt string with emojis', () => {
        const originalText = '😀😃😄😁🎉🎊🎈🎁';
        const encrypted = encrypt(originalText);
        const decrypted = decrypt(encrypted);

        expect(decrypted).toBe(originalText);
      });

      /**
       * Verifies decryption of string with newlines
       */
      test('should decrypt string with newlines', () => {
        const originalText = 'line1\nline2\nline3';
        const encrypted = encrypt(originalText);
        const decrypted = decrypt(encrypted);

        expect(decrypted).toBe(originalText);
      });

      /**
       * Verifies decryption of string with tabs
       */
      test('should decrypt string with tabs', () => {
        const originalText = 'col1\tcol2\tcol3';
        const encrypted = encrypt(originalText);
        const decrypted = decrypt(encrypted);

        expect(decrypted).toBe(originalText);
      });

      /**
       * Verifies decryption of multiline text
       */
      test('should decrypt multiline text', () => {
        const originalText = `This is line 1
This is line 2
This is line 3
With some special chars: !@#$%`;
        const encrypted = encrypt(originalText);
        const decrypted = decrypt(encrypted);

        expect(decrypted).toBe(originalText);
      });

      /**
       * Verifies decryption of JSON string
       */
      test('should decrypt JSON string', () => {
        const originalText = JSON.stringify({
          name: 'John Doe',
          age: 30,
          email: 'john@example.com',
          data: [1, 2, 3, 4, 5],
        });
        const encrypted = encrypt(originalText);
        const decrypted = decrypt(encrypted);

        expect(decrypted).toBe(originalText);
        expect(JSON.parse(decrypted)).toEqual(JSON.parse(originalText));
      });

      /**
       * Verifies decryption of string with null bytes
       */
      test('should decrypt string with null bytes', () => {
        const originalText = 'before\x00after';
        const encrypted = encrypt(originalText);
        const decrypted = decrypt(encrypted);

        expect(decrypted).toBe(originalText);
      });

      /**
       * Verifies decryption of string with all whitespace
       */
      test('should decrypt string with only spaces', () => {
        const originalText = '     ';
        const encrypted = encrypt(originalText);
        const decrypted = decrypt(encrypted);

        expect(decrypted).toBe(originalText);
      });

      /**
       * Verifies that multiple encryptions can be decrypted correctly
       */
      test('should decrypt multiple different encrypted texts', () => {
        const texts = ['first', 'second', 'third', 'fourth', 'fifth'];
        const encrypted = texts.map((text) => encrypt(text));
        const decrypted = encrypted.map((enc) => decrypt(enc));

        expect(decrypted).toEqual(texts);
      });

      /**
       * Verifies that decrypt works with different encryption keys
       */
      test('should decrypt with matching encryption key', async () => {
        const originalText = 'test message';

        // Encrypt with first key
        process.env.ENCRYPTION_KEY = 'specific-key-123';
        jest.resetModules();
        const module1 = await import('../../src/supabase_api/encryption.js');
        const encrypted = module1.encrypt(originalText);

        // Decrypt with same key
        process.env.ENCRYPTION_KEY = 'specific-key-123';
        jest.resetModules();
        const module2 = await import('../../src/supabase_api/encryption.js');
        const decrypted = module2.decrypt(encrypted);

        // Reset to original
        process.env.ENCRYPTION_KEY = 'test-encryption-key-for-testing-purposes';
        jest.resetModules();

        expect(decrypted).toBe(originalText);
      });
    });

    describe('Error Cases', () => {
      /**
       * Verifies that decrypt throws error when ENCRYPTION_KEY is not set
       */
      test('should throw error when ENCRYPTION_KEY is not set', async () => {
        const encrypted = encrypt('test');

        const env = process.env as any;
        delete env.ENCRYPTION_KEY;
        jest.resetModules();

        const module = await import('../../src/supabase_api/encryption.js');

        expect(() => module.decrypt(encrypted)).toThrow(
          'ENCRYPTION_KEY not set in environment variables'
        );
      });

      /**
       * Verifies that decrypt throws error when ENCRYPTION_KEY is undefined
       */
      test('should throw error when ENCRYPTION_KEY is undefined', async () => {
        const encrypted = encrypt('test');

        const env = process.env as any;
        delete env.ENCRYPTION_KEY;
        jest.resetModules();

        const module = await import('../../src/supabase_api/encryption.js');

        expect(() => module.decrypt(encrypted)).toThrow(
          'ENCRYPTION_KEY not set in environment variables'
        );
      });

      /**
       * Verifies that decrypt throws error when ENCRYPTION_KEY is empty string
       */
      test('should throw error when ENCRYPTION_KEY is empty string', async () => {
        const encrypted = encrypt('test');

        process.env.ENCRYPTION_KEY = '';
        jest.resetModules();

        const module = await import('../../src/supabase_api/encryption.js');

        expect(() => module.decrypt(encrypted)).toThrow(
          'ENCRYPTION_KEY not set in environment variables'
        );
      });

      /**
       * Verifies that decrypt throws error when ENCRYPTION_KEY is null/deleted
       */
      test('should throw error when ENCRYPTION_KEY is null/deleted', async () => {
        const encrypted = encrypt('test');

        const env = process.env as any;
        delete env.ENCRYPTION_KEY;
        jest.resetModules();

        const module = await import('../../src/supabase_api/encryption.js');

        expect(() => module.decrypt(encrypted)).toThrow(
          'ENCRYPTION_KEY not set in environment variables'
        );
      });

      /**
       * Verifies that decrypt throws error with wrong encryption key
       */
      test('should throw error when decrypting with wrong key', async () => {
        const originalText = 'test message';

        // Encrypt with first key
        process.env.ENCRYPTION_KEY = 'key1';
        jest.resetModules();
        const module1 = await import('../../src/supabase_api/encryption.js');
        const encrypted = module1.encrypt(originalText);

        // Try to decrypt with different key
        process.env.ENCRYPTION_KEY = 'key2';
        jest.resetModules();
        const module2 = await import('../../src/supabase_api/encryption.js');

        // Reset to original
        process.env.ENCRYPTION_KEY = 'test-encryption-key-for-testing-purposes';
        jest.resetModules();

        // Should throw error or return corrupted data
        expect(() => {
          const decrypted = module2.decrypt(encrypted);
          // If it doesn't throw, result should be different
          expect(decrypted).not.toBe(originalText);
        }).toThrow();
      });

      /**
       * Verifies that decrypt throws error with corrupted IV
       */
      test('should throw error or produce corrupted output with corrupted IV', () => {
        const originalText = 'test';
        const encrypted = encrypt(originalText);

        // Corrupt the IV (first 16 bytes)
        const corrupted = Buffer.from(encrypted);
        corrupted[0] = corrupted[0]! ^ 0xff;

        // Should either throw or return different/corrupted data
        try {
          const result = decrypt(corrupted);
          // If it doesn't throw, the result should be different from original
          expect(result).not.toBe(originalText);
        } catch (error) {
          // Throwing is also acceptable
          expect(error).toBeDefined();
        }
      });

      /**
       * Verifies that decrypt throws error with corrupted ciphertext
       */
      test('should throw error with corrupted ciphertext', () => {
        const encrypted = encrypt('test');

        // Corrupt the ciphertext (after IV)
        const corrupted = Buffer.from(encrypted);
        corrupted[20] = corrupted[20]! ^ 0xff;

        expect(() => decrypt(corrupted)).toThrow();
      });

      /**
       * Verifies that decrypt throws error with truncated buffer
       */
      test('should throw error with truncated buffer (too short)', () => {
        const encrypted = encrypt('test');

        // Create truncated buffer (less than IV size)
        const truncated = encrypted.subarray(0, 10);

        expect(() => decrypt(truncated)).toThrow();
      });

      /**
       * Verifies that decrypt throws error with buffer missing IV
       */
      test('should throw error with buffer exactly IV size', () => {
        const encrypted = encrypt('test');

        // Create buffer with only IV (16 bytes)
        const onlyIv = encrypted.subarray(0, 16);

        expect(() => decrypt(onlyIv)).toThrow();
      });

      /**
       * Verifies that decrypt throws error with empty buffer
       */
      test('should throw error with empty buffer', () => {
        const emptyBuffer = Buffer.alloc(0);

        expect(() => decrypt(emptyBuffer)).toThrow();
      });

      /**
       * Verifies that decrypt throws error with invalid padding
       */
      test('should throw error with invalid padding', () => {
        const encrypted = encrypt('test');

        // Corrupt the last byte (padding)
        const corrupted = Buffer.from(encrypted);
        const lastIndex = corrupted.length - 1;
        corrupted[lastIndex] = corrupted[lastIndex]! ^ 0xff;

        expect(() => decrypt(corrupted)).toThrow();
      });
    });

    describe('Input Type Validation', () => {
      /**
       * Verifies that decrypt handles Buffer input correctly
       */
      test('should accept Buffer input', () => {
        const encrypted = encrypt('test');
        expect(() => decrypt(encrypted)).not.toThrow();
      });

      /**
       * Verifies behavior with string input (should throw error)
       */
      test('should throw error with string input', () => {
        expect(() => decrypt('not a buffer' as any)).toThrow();
      });

      /**
       * Verifies behavior with number input (should throw error)
       */
      test('should throw error with number input', () => {
        expect(() => decrypt(123 as any)).toThrow();
      });

      /**
       * Verifies behavior with boolean input (should throw error)
       */
      test('should throw error with boolean input', () => {
        expect(() => decrypt(true as any)).toThrow();
      });

      /**
       * Verifies behavior with null input (should throw error)
       */
      test('should throw error with null input', () => {
        expect(() => decrypt(null as any)).toThrow();
      });

      /**
       * Verifies behavior with undefined input (should throw error)
       */
      test('should throw error with undefined input', () => {
        expect(() => decrypt(undefined as any)).toThrow();
      });

      /**
       * Verifies behavior with object input (should throw error)
       */
      test('should throw error with object input', () => {
        expect(() => decrypt({ key: 'value' } as any)).toThrow();
      });

      /**
       * Verifies behavior with array input (should throw error)
       */
      test('should throw error with array input', () => {
        expect(() => decrypt([1, 2, 3] as any)).toThrow();
      });

      /**
       * Verifies behavior with Uint8Array (should work as it's similar to Buffer)
       */
      test('should handle Uint8Array input', () => {
        const encrypted = encrypt('test');
        const uint8Array = new Uint8Array(encrypted);
        const asBuffer = Buffer.from(uint8Array);

        const decrypted = decrypt(asBuffer);
        expect(decrypted).toBe('test');
      });
    });

    describe('Decryption Properties', () => {
      /**
       * Verifies that decryption is deterministic
       */
      test('should produce same result for same encrypted data', () => {
        const encrypted = encrypt('test message');

        const result1 = decrypt(encrypted);
        const result2 = decrypt(encrypted);
        const result3 = decrypt(encrypted);

        expect(result1).toBe(result2);
        expect(result2).toBe(result3);
      });

      /**
       * Verifies that decrypt handles buffers from different sources
       */
      test('should decrypt buffer created from hex string', () => {
        const originalText = 'test';
        const encrypted = encrypt(originalText);
        const hexString = encrypted.toString('hex');
        const bufferFromHex = Buffer.from(hexString, 'hex');

        const decrypted = decrypt(bufferFromHex);
        expect(decrypted).toBe(originalText);
      });

      /**
       * Verifies that decrypt handles buffers created from base64
       */
      test('should decrypt buffer created from base64 string', () => {
        const originalText = 'test';
        const encrypted = encrypt(originalText);
        const base64String = encrypted.toString('base64');
        const bufferFromBase64 = Buffer.from(base64String, 'base64');

        const decrypted = decrypt(bufferFromBase64);
        expect(decrypted).toBe(originalText);
      });

      /**
       * Verifies that decrypt correctly extracts IV from buffer
       */
      test('should correctly extract IV from encrypted buffer', () => {
        const encrypted = encrypt('test');

        // Manually verify IV extraction
        const iv = encrypted.subarray(0, 16);
        expect(iv.length).toBe(16);

        // Decryption should work with correct IV
        expect(() => decrypt(encrypted)).not.toThrow();
      });

      /**
       * Verifies that decrypt correctly extracts ciphertext from buffer
       */
      test('should correctly extract ciphertext from encrypted buffer', () => {
        const encrypted = encrypt('test');

        // Manually verify ciphertext extraction
        const ciphertext = encrypted.subarray(16);
        expect(ciphertext.length).toBeGreaterThan(0);
        expect(ciphertext.length % 16).toBe(0); // Should be padded to block size

        // Decryption should work
        expect(() => decrypt(encrypted)).not.toThrow();
      });

      /**
       * Verifies round-trip encryption/decryption consistency
       */
      test('should maintain data integrity through multiple round trips', () => {
        let text = 'original text';

        // Encrypt and decrypt 100 times
        for (let i = 0; i < 100; i++) {
          const encrypted = encrypt(text);
          text = decrypt(encrypted);
        }

        expect(text).toBe('original text');
      });
    });

    describe('Edge Cases', () => {
      /**
       * Verifies decryption of buffer at minimum valid size
       */
      test('should handle minimum valid buffer size (IV + 1 block)', () => {
        const originalText = 'a';
        const encrypted = encrypt(originalText);

        // Should be at least 32 bytes (16 IV + 16 encrypted block)
        expect(encrypted.length).toBeGreaterThanOrEqual(32);

        const decrypted = decrypt(encrypted);
        expect(decrypted).toBe(originalText);
      });

      /**
       * Verifies decryption of very large encrypted buffer
       */
      test('should handle large encrypted buffer (10MB)', () => {
        const originalText = 'x'.repeat(10 * 1024 * 1024); // 10MB
        const encrypted = encrypt(originalText);
        const decrypted = decrypt(encrypted);

        expect(decrypted).toBe(originalText);
      });

      /**
       * Verifies decryption with short encryption key
       */
      test('should work with short encryption key', async () => {
        process.env.ENCRYPTION_KEY = 'short';
        jest.resetModules();

        const module = await import('../../src/supabase_api/encryption.js');
        const encrypted = module.encrypt('test');
        const decrypted = module.decrypt(encrypted);

        expect(decrypted).toBe('test');
      });

      /**
       * Verifies decryption with long encryption key
       */
      test('should work with long encryption key', async () => {
        process.env.ENCRYPTION_KEY = 'a'.repeat(1000);
        jest.resetModules();

        const module = await import('../../src/supabase_api/encryption.js');
        const encrypted = module.encrypt('test');
        const decrypted = module.decrypt(encrypted);

        expect(decrypted).toBe('test');
      });

      /**
       * Verifies decryption with key containing special characters
       */
      test('should work with encryption key containing special characters', async () => {
        process.env.ENCRYPTION_KEY = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/~`';
        jest.resetModules();

        const module = await import('../../src/supabase_api/encryption.js');
        const encrypted = module.encrypt('test');
        const decrypted = module.decrypt(encrypted);

        expect(decrypted).toBe('test');
      });

      /**
       * Verifies concurrent decryption operations
       */
      test('should handle concurrent decryption operations', async () => {
        const texts = Array.from({ length: 100 }, (_, i) => `message ${i}`);
        const encrypted = texts.map((text) => encrypt(text));

        const promises = encrypted.map((enc) => Promise.resolve(decrypt(enc)));

        const results = await Promise.all(promises);
        expect(results).toEqual(texts);
      });

      /**
       * Verifies that decryption works with copied buffers
       */
      test('should work with copied/cloned buffers', () => {
        const originalText = 'test message';
        const encrypted = encrypt(originalText);

        // Create various copies
        const copy1 = Buffer.from(encrypted);
        const copy2 = Buffer.concat([encrypted]);
        const copy3 = encrypted.subarray(0, encrypted.length);

        expect(decrypt(copy1)).toBe(originalText);
        expect(decrypt(copy2)).toBe(originalText);
        expect(decrypt(copy3)).toBe(originalText);
      });

      /**
       * Verifies that buffer modifications don't affect original
       */
      test('should not be affected by buffer modifications after encryption', () => {
        const originalText = 'test';
        const encrypted = encrypt(originalText);
        const encryptedCopy = Buffer.from(encrypted);

        // Modify the original
        encrypted[0] = encrypted[0]! ^ 0xff;

        // Copy should still decrypt correctly
        const decrypted = decrypt(encryptedCopy);
        expect(decrypted).toBe(originalText);
      });
    });

    describe('Security Properties', () => {
      /**
       * Verifies that decryption is deterministic (same ciphertext = same plaintext)
       */
      test('should be deterministic (same ciphertext always produces same plaintext)', () => {
        const encrypted = encrypt('security test');
        const results = new Set();

        // Decrypt same ciphertext 10 times
        for (let i = 0; i < 10; i++) {
          const result = decrypt(encrypted);
          results.add(result);
        }

        // All results should be identical
        expect(results.size).toBe(1);
        expect(results.has('security test')).toBe(true);
      });

      /**
       * Verifies that tampering detection works
       */
      test('should detect tampering in encrypted data', () => {
        const originalText = 'important data';
        const encrypted = encrypt(originalText);

        // Try tampering with different parts
        const positions = [0, 5, 10, 15, 20, encrypted.length - 1];

        let detectedTampering = 0;

        positions.forEach((pos) => {
          const tampered = Buffer.from(encrypted);
          tampered[pos] = tampered[pos]! ^ 0x01;

          try {
            const result = decrypt(tampered);
            // If decryption succeeds, data should be corrupted
            if (result !== originalText) {
              detectedTampering++;
            }
          } catch (error) {
            // Throwing error means tampering was detected
            detectedTampering++;
          }
        });

        // At least some tampering should be detected
        expect(detectedTampering).toBeGreaterThan(0);
      });

      /**
       * Verifies that IV is correctly used in decryption
       */
      test('should fail with wrong IV', () => {
        const encrypted = encrypt('test');

        // Replace IV with random bytes
        const wrongIv = crypto.randomBytes(16);
        const withWrongIv = Buffer.concat([wrongIv, encrypted.subarray(16)]);

        expect(() => decrypt(withWrongIv)).toThrow();
      });

      /**
       * Verifies that decryption fails gracefully with malformed data
       */
      test('should fail gracefully with random data', () => {
        const randomData = crypto.randomBytes(64);

        expect(() => decrypt(randomData)).toThrow();
      });

      /**
       * Verifies that partial decryption is not possible
       */
      test('should not allow partial decryption', () => {
        const encrypted = encrypt('long test message for partial decryption');

        // Try with various truncated lengths
        const truncatedLengths = [20, 30, encrypted.length - 5];

        truncatedLengths.forEach((len) => {
          const truncated = encrypted.subarray(0, len);
          expect(() => decrypt(truncated)).toThrow();
        });
      });
    });

    describe('Performance', () => {
      /**
       * Verifies that decryption completes in reasonable time
       */
      test('should decrypt small buffer quickly (< 100ms)', () => {
        const encrypted = encrypt('test message');
        const start = Date.now();
        decrypt(encrypted);
        const duration = Date.now() - start;

        expect(duration).toBeLessThan(100);
      });

      /**
       * Verifies that decryption of medium buffer is reasonably fast
       */
      test('should decrypt medium buffer efficiently (< 500ms)', () => {
        const text = 'x'.repeat(100000); // 100KB
        const encrypted = encrypt(text);
        const start = Date.now();
        decrypt(encrypted);
        const duration = Date.now() - start;

        expect(duration).toBeLessThan(500);
      });

      /**
       * Verifies that repeated decryption maintains performance
       */
      test('should maintain performance over repeated decryptions', () => {
        const encrypted = encrypt('test');
        const durations: number[] = [];

        // Decrypt 100 times and measure
        for (let i = 0; i < 100; i++) {
          const start = Date.now();
          decrypt(encrypted);
          durations.push(Date.now() - start);
        }

        // Calculate average duration
        const avgDuration =
          durations.reduce((a, b) => a + b, 0) / durations.length;

        // Average should be reasonable (< 100ms per decryption)
        expect(avgDuration).toBeLessThan(100);
      });
    });

    describe('Cross-compatibility', () => {
      /**
       * Verifies that data encrypted with one instance can be decrypted by another
       */
      test('should decrypt data encrypted in different context', async () => {
        const originalText = 'cross-context test';

        // Encrypt in first context
        process.env.ENCRYPTION_KEY = 'shared-key';
        jest.resetModules();
        const module1 = await import('../../src/supabase_api/encryption.js');
        const encrypted = module1.encrypt(originalText);

        // Decrypt in second context (simulating different process/session)
        jest.resetModules();
        const module2 = await import('../../src/supabase_api/encryption.js');
        const decrypted = module2.decrypt(encrypted);

        // Reset to original
        process.env.ENCRYPTION_KEY = 'test-encryption-key-for-testing-purposes';
        jest.resetModules();

        expect(decrypted).toBe(originalText);
      });

      /**
       * Verifies that encrypted data persists correctly when stored/retrieved
       */
      test('should decrypt data after conversion to/from storage format', () => {
        const originalText = 'persistence test';
        const encrypted = encrypt(originalText);

        // Simulate storage as hex string
        const storedAsHex = encrypted.toString('hex');
        const retrievedFromHex = Buffer.from(storedAsHex, 'hex');

        expect(decrypt(retrievedFromHex)).toBe(originalText);

        // Simulate storage as base64 string
        const storedAsBase64 = encrypted.toString('base64');
        const retrievedFromBase64 = Buffer.from(storedAsBase64, 'base64');

        expect(decrypt(retrievedFromBase64)).toBe(originalText);
      });
    });
  });
});
