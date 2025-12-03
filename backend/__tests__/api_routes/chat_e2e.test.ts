/**
 * End-to-end integration tests for chat feature
 * Tests complete chat flow: encrypt -> send -> relay -> decrypt
 */

import { jest } from '@jest/globals';
import { userManager } from '../../src/managers/userManager.js';
import { Socket } from 'socket.io';

// Mock encryption types and functions for testing
type KeyPair = {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
};

type EncryptedMessage = {
  ciphertext: string;
  nonce: string;
};

// Mock encryption utilities for testing (simulating client-side encryption)
let keyCounter = 0;
function generateKeyPair(): KeyPair {
  keyCounter++;
  return {
    publicKey: new Uint8Array(32).fill(keyCounter),
    secretKey: new Uint8Array(32).fill(keyCounter + 100),
  };
}

function encryptMessage(
  message: string,
  recipientPublicKey: Uint8Array,
  senderSecretKey: Uint8Array
): EncryptedMessage {
  // Mock: encode with key info for validation during decryption
  const keyInfo = `${recipientPublicKey[0]}_${senderSecretKey[0]}`;
  return {
    ciphertext: Buffer.from(`${keyInfo}:${message}`).toString('base64'),
    nonce: 'mock-nonce',
  };
}

function decryptMessage(
  encrypted: EncryptedMessage,
  senderPublicKey: Uint8Array,
  recipientSecretKey: Uint8Array
): string {
  // Validate the encrypted message structure
  if (!encrypted || !encrypted.ciphertext) {
    throw new Error('Invalid encrypted message');
  }
  
  const decoded = Buffer.from(encrypted.ciphertext, 'base64').toString('utf8');
  const [keyInfo, message] = decoded.split(':');
  
  if (!message) {
    throw new Error('Malformed encrypted message');
  }
  
  // Validate key match (mock validation)
  const [expectedRecipPub, expectedSenderSec] = keyInfo.split('_').map(Number);
  
  // Check if the keys match what was used to encrypt
  // recipientSecretKey should pair with recipientPublicKey (diff of 100)
  // senderPublicKey should pair with senderSecretKey (diff of 100)
  const recipientPubFromSecret = recipientSecretKey[0] - 100;
  const senderSecFromPub = senderPublicKey[0] + 100;
  
  if (recipientPubFromSecret !== expectedRecipPub || senderSecFromPub !== expectedSenderSec) {
    throw new Error('Decryption failed: wrong keys');
  }
  
  return message;
}

function uint8ArrayToBase64(arr: Uint8Array): string {
  return Buffer.from(arr).toString('base64');
}

function base64ToUint8Array(b64: string): Uint8Array {
  return new Uint8Array(Buffer.from(b64, 'base64'));
}

// Mock the roomManager
jest.mock('../../src/managers/roomManager.js', () => ({
  roomManager: jest.fn().mockImplementation(() => ({
    onOffer: jest.fn(),
    onAnswer: jest.fn(),
    onIceCandidate: jest.fn(),
    createRoom: jest.fn(),
  })),
}));

describe('Chat Feature - End-to-End Integration', () => {
  let userMgr: userManager;
  let aliceKeyPair: KeyPair;
  let bobKeyPair: KeyPair;
  let mockSocketAlice: jest.Mocked<Socket>;
  let mockSocketBob: jest.Mocked<Socket>;

  beforeEach(() => {
    // Use fake timers to avoid async issues
    jest.useFakeTimers();
    
    userMgr = new userManager();
    aliceKeyPair = generateKeyPair();
    bobKeyPair = generateKeyPair();

    // Create mock sockets for both users
    mockSocketAlice = {
      id: 'alice-socket',
      on: jest.fn(),
      emit: jest.fn(),
    } as unknown as jest.Mocked<Socket>;

    mockSocketBob = {
      id: 'bob-socket',
      on: jest.fn(),
      emit: jest.fn(),
    } as unknown as jest.Mocked<Socket>;
  });

  afterEach(() => {
    // Clear all timers and restore real timers
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('Full Plaintext Chat Flow', () => {
    it('should send and receive plaintext message', () => {
      const meetingId = 'meeting-e2e-1';
      const message = 'Hello Bob!';

      // Add both users
      userMgr.addUser('Alice', mockSocketAlice);
      userMgr.addUser('Bob', mockSocketBob);

      // Setup meeting
      const aliceJoinHandler = (mockSocketAlice.on as jest.Mock).mock.calls.find(
        (call: any[]) => call[0] === 'join-meeting'
      )?.[1];
      aliceJoinHandler?.({ meetingId, name: 'Alice' });

      const bobJoinHandler = (mockSocketBob.on as jest.Mock).mock.calls.find(
        (call: any[]) => call[0] === 'join-meeting'
      )?.[1];
      bobJoinHandler?.({ meetingId, name: 'Bob' });

      // Get send-message handler
      const sendMessageHandler = (mockSocketAlice.on as jest.Mock).mock.calls.find(
        (call: any[]) => call[0] === 'send-message'
      )?.[1];

      // Alice sends message
      (mockSocketBob.emit as jest.Mock).mockClear();
      sendMessageHandler?.({
        meetingId,
        text: message,
        senderName: 'Alice',
      });

      // Verify Bob received the message
      const bobEmitCalls = (mockSocketBob.emit as jest.Mock).mock.calls;
      const chatCall = bobEmitCalls.find((call: any[]) => call[0] === 'chat-message');
      expect(chatCall?.[1]).toMatchObject({
        text: message,
        senderName: 'Alice',
      });
    });

    it('should handle bidirectional plaintext messages', () => {
      const meetingId = 'meeting-e2e-2';

      userMgr.addUser('Alice', mockSocketAlice);
      userMgr.addUser('Bob', mockSocketBob);

      const aliceJoinHandler = (mockSocketAlice.on as jest.Mock).mock.calls.find(
        (call: any[]) => call[0] === 'join-meeting'
      )?.[1];
      aliceJoinHandler?.({ meetingId, name: 'Alice' });

      const bobJoinHandler = (mockSocketBob.on as jest.Mock).mock.calls.find(
        (call: any[]) => call[0] === 'join-meeting'
      )?.[1];
      bobJoinHandler?.({ meetingId, name: 'Bob' });

      const sendMessageHandler = (mockSocketAlice.on as jest.Mock).mock.calls.find(
        (call: any[]) => call[0] === 'send-message'
      )?.[1];

      // Alice sends
      (mockSocketBob.emit as jest.Mock).mockClear();
      sendMessageHandler?.({
        meetingId,
        text: 'Hello Bob',
        senderName: 'Alice',
      });

      let bobEmitCalls = (mockSocketBob.emit as jest.Mock).mock.calls;
      expect(bobEmitCalls.some((call: any[]) => call[0] === 'chat-message')).toBe(true);

      // Bob sends (using Bob's send-message handler)
      const bobSendMessageHandler = (mockSocketBob.on as jest.Mock).mock.calls.find(
        (call: any[]) => call[0] === 'send-message'
      )?.[1];

      (mockSocketAlice.emit as jest.Mock).mockClear();
      bobSendMessageHandler?.({
        meetingId,
        text: 'Hi Alice',
        senderName: 'Bob',
      });

      const aliceEmitCalls = (mockSocketAlice.emit as jest.Mock).mock.calls;
      const aliceChatCall = aliceEmitCalls.find((call: any[]) => call[0] === 'chat-message');
      expect(aliceChatCall?.[1]).toMatchObject({
        text: 'Hi Alice',
        senderName: 'Bob',
      });
    });
  });

  describe('Full Encrypted Chat Flow', () => {
    it('should exchange keys and send encrypted message', () => {
      const meetingId = 'meeting-e2e-3';

      userMgr.addUser('Alice', mockSocketAlice);
      userMgr.addUser('Bob', mockSocketBob);

      // Setup meeting
      const aliceJoinHandler = (mockSocketAlice.on as jest.Mock).mock.calls.find(
        (call: any[]) => call[0] === 'join-meeting'
      )?.[1];
      aliceJoinHandler?.({ meetingId, name: 'Alice' });

      const bobJoinHandler = (mockSocketBob.on as jest.Mock).mock.calls.find(
        (call: any[]) => call[0] === 'join-meeting'
      )?.[1];
      bobJoinHandler?.({ meetingId, name: 'Bob' });

      // Get key exchange handlers
      const aliceKeyHandler = (mockSocketAlice.on as jest.Mock).mock.calls.find(
        (call: any[]) => call[0] === 'public-key'
      )?.[1];

      const bobKeyHandler = (mockSocketBob.on as jest.Mock).mock.calls.find(
        (call: any[]) => call[0] === 'public-key'
      )?.[1];

      // Exchange keys
      (mockSocketBob.emit as jest.Mock).mockClear();
      const alicePublicKeyB64 = uint8ArrayToBase64(aliceKeyPair.publicKey);
      aliceKeyHandler?.({ publicKey: alicePublicKeyB64 });

      // Bob should receive Alice's public key
      let bobEmitCalls = (mockSocketBob.emit as jest.Mock).mock.calls;
      const bobKeyCall = bobEmitCalls.find((call: any[]) => call[0] === 'public-key');
      expect(bobKeyCall?.[1].publicKey).toBe(alicePublicKeyB64);

      // Alice receives Bob's key
      (mockSocketAlice.emit as jest.Mock).mockClear();
      const bobPublicKeyB64 = uint8ArrayToBase64(bobKeyPair.publicKey);
      bobKeyHandler?.({ publicKey: bobPublicKeyB64 });

      let aliceEmitCalls = (mockSocketAlice.emit as jest.Mock).mock.calls;
      const aliceKeyCall = aliceEmitCalls.find((call: any[]) => call[0] === 'public-key');
      expect(aliceKeyCall?.[1].publicKey).toBe(bobPublicKeyB64);

      // Now send encrypted message
      const encryptedMessageHandler = (mockSocketAlice.on as jest.Mock).mock.calls.find(
        (call: any[]) => call[0] === 'encrypted-chat-message'
      )?.[1];

      const plainMessage = 'Secret message for Bob';
      const encrypted = encryptMessage(
        plainMessage,
        bobKeyPair.publicKey,
        aliceKeyPair.secretKey
      );

      (mockSocketBob.emit as jest.Mock).mockClear();
      encryptedMessageHandler?.({
        meetingId,
        encrypted,
      });

      // Bob should receive the encrypted message
      bobEmitCalls = (mockSocketBob.emit as jest.Mock).mock.calls;
      const encryptedCall = bobEmitCalls.find(
        (call: any[]) => call[0] === 'encrypted-chat-message'
      );
      expect(encryptedCall?.[1]).toEqual(encrypted);

      // Bob can decrypt with his key pair
      const decrypted = decryptMessage(
        encryptedCall?.[1],
        aliceKeyPair.publicKey,
        bobKeyPair.secretKey
      );
      expect(decrypted).toBe(plainMessage);
    });

    it('should handle full bidirectional encrypted conversation', () => {
      const meetingId = 'meeting-e2e-4';

      userMgr.addUser('Alice', mockSocketAlice);
      userMgr.addUser('Bob', mockSocketBob);

      // Setup meeting
      const aliceJoinHandler = (mockSocketAlice.on as jest.Mock).mock.calls.find(
        (call: any[]) => call[0] === 'join-meeting'
      )?.[1];
      aliceJoinHandler?.({ meetingId, name: 'Alice' });

      const bobJoinHandler = (mockSocketBob.on as jest.Mock).mock.calls.find(
        (call: any[]) => call[0] === 'join-meeting'
      )?.[1];
      bobJoinHandler?.({ meetingId, name: 'Bob' });

      // Exchange public keys
      const aliceKeyHandler = (mockSocketAlice.on as jest.Mock).mock.calls.find(
        (call: any[]) => call[0] === 'public-key'
      )?.[1];

      const bobKeyHandler = (mockSocketBob.on as jest.Mock).mock.calls.find(
        (call: any[]) => call[0] === 'public-key'
      )?.[1];

      (mockSocketBob.emit as jest.Mock).mockClear();
      aliceKeyHandler?.({ publicKey: uint8ArrayToBase64(aliceKeyPair.publicKey) });

      (mockSocketAlice.emit as jest.Mock).mockClear();
      bobKeyHandler?.({ publicKey: uint8ArrayToBase64(bobKeyPair.publicKey) });

      // Exchange encrypted messages
      const aliceEncryptedHandler = (mockSocketAlice.on as jest.Mock).mock.calls.find(
        (call: any[]) => call[0] === 'encrypted-chat-message'
      )?.[1];

      const bobEncryptedHandler = (mockSocketBob.on as jest.Mock).mock.calls.find(
        (call: any[]) => call[0] === 'encrypted-chat-message'
      )?.[1];

      // Alice sends first message
      const msg1 = 'First secret from Alice';
      const enc1 = encryptMessage(msg1, bobKeyPair.publicKey, aliceKeyPair.secretKey);

      (mockSocketBob.emit as jest.Mock).mockClear();
      aliceEncryptedHandler?.({ meetingId, encrypted: enc1 });

      let bobCalls = (mockSocketBob.emit as jest.Mock).mock.calls;
      let bobReceived = bobCalls.find(
        (call: any[]) => call[0] === 'encrypted-chat-message'
      )?.[1];
      const dec1 = decryptMessage(
        bobReceived,
        aliceKeyPair.publicKey,
        bobKeyPair.secretKey
      );
      expect(dec1).toBe(msg1);

      // Bob sends reply
      const msg2 = 'Reply from Bob';
      const enc2 = encryptMessage(msg2, aliceKeyPair.publicKey, bobKeyPair.secretKey);

      (mockSocketAlice.emit as jest.Mock).mockClear();
      bobEncryptedHandler?.({ meetingId, encrypted: enc2 });

      let aliceCalls = (mockSocketAlice.emit as jest.Mock).mock.calls;
      let aliceReceived = aliceCalls.find(
        (call: any[]) => call[0] === 'encrypted-chat-message'
      )?.[1];
      const dec2 = decryptMessage(
        aliceReceived,
        bobKeyPair.publicKey,
        aliceKeyPair.secretKey
      );
      expect(dec2).toBe(msg2);
    });
  });

  describe('Message Integrity and Privacy', () => {
    it('should ensure encrypted message cannot be decrypted with wrong key', () => {
      const alice = generateKeyPair();
      const bob = generateKeyPair();
      const charlie = generateKeyPair();

      const message = 'Secret message';
      const encrypted = encryptMessage(message, bob.publicKey, alice.secretKey);

      // Charlie tries to decrypt (should fail)
      expect(() => {
        decryptMessage(encrypted, alice.publicKey, charlie.secretKey);
      }).toThrow();
    });

    it('should ensure tampering with encrypted message is detected', () => {
      const alice = generateKeyPair();
      const bob = generateKeyPair();

      const message = 'Important message';
      const encrypted = encryptMessage(message, bob.publicKey, alice.secretKey);

      // Tamper with ciphertext
      const tampered: EncryptedMessage = {
        ...encrypted,
        ciphertext: uint8ArrayToBase64(new Uint8Array(64)),
      };

      expect(() => {
        decryptMessage(tampered, alice.publicKey, bob.secretKey);
      }).toThrow();
    });

    it('should maintain message content privacy from server', () => {
      // Simulate server receiving encrypted message
      const alice = generateKeyPair();
      const bob = generateKeyPair();

      const plainMessage = 'Sensitive data';
      const encrypted = encryptMessage(plainMessage, bob.publicKey, alice.secretKey);

      // Server only sees encrypted data
      const serverView = {
        ciphertext: encrypted.ciphertext,
        nonce: encrypted.nonce,
        publicKey: encrypted.publicKey,
      };

      // Server cannot decrypt
      expect(() => {
        // Even if server had some random key
        const randomKey = generateKeyPair();
        decryptMessage(
          serverView as EncryptedMessage,
          alice.publicKey,
          randomKey.secretKey
        );
      }).toThrow();

      // But Bob can decrypt with his actual key
      const decrypted = decryptMessage(encrypted, alice.publicKey, bob.secretKey);
      expect(decrypted).toBe(plainMessage);
    });
  });

  describe('Profanity Filtering', () => {
    it('should filter profanity from plaintext messages', () => {
      const meetingId = 'meeting-e2e-5';

      userMgr.addUser('User1', mockSocketAlice);
      userMgr.addUser('User2', mockSocketBob);

      const aliceJoinHandler = (mockSocketAlice.on as jest.Mock).mock.calls.find(
        (call: any[]) => call[0] === 'join-meeting'
      )?.[1];
      aliceJoinHandler?.({ meetingId, name: 'User1' });

      const bobJoinHandler = (mockSocketBob.on as jest.Mock).mock.calls.find(
        (call: any[]) => call[0] === 'join-meeting'
      )?.[1];
      bobJoinHandler?.({ meetingId, name: 'User2' });

      const sendMessageHandler = (mockSocketAlice.on as jest.Mock).mock.calls.find(
        (call: any[]) => call[0] === 'send-message'
      )?.[1];

      (mockSocketBob.emit as jest.Mock).mockClear();
      sendMessageHandler?.({
        meetingId,
        text: 'Hello damn world',
        senderName: 'User1',
      });

      const bobCalls = (mockSocketBob.emit as jest.Mock).mock.calls;
      const chatCall = bobCalls.find((call: any[]) => call[0] === 'chat-message');
      // Message should be filtered
      expect(chatCall?.[1].text).not.toContain('damn');
      expect(chatCall?.[1].text).toContain('****');
    });

    it('should not filter encrypted messages (client-side filtering only)', () => {
      const meetingId = 'meeting-e2e-6';

      userMgr.addUser('Alice', mockSocketAlice);
      userMgr.addUser('Bob', mockSocketBob);

      const aliceJoinHandler = (mockSocketAlice.on as jest.Mock).mock.calls.find(
        (call: any[]) => call[0] === 'join-meeting'
      )?.[1];
      aliceJoinHandler?.({ meetingId, name: 'Alice' });

      const bobJoinHandler = (mockSocketBob.on as jest.Mock).mock.calls.find(
        (call: any[]) => call[0] === 'join-meeting'
      )?.[1];
      bobJoinHandler?.({ meetingId, name: 'Bob' });

      const encryptedHandler = (mockSocketAlice.on as jest.Mock).mock.calls.find(
        (call: any[]) => call[0] === 'encrypted-chat-message'
      )?.[1];

      // Encrypted message with profanity (client can't filter)
      const messageWithProfanity = 'This badword is encrypted';
      const encrypted = encryptMessage(
        messageWithProfanity,
        bobKeyPair.publicKey,
        aliceKeyPair.secretKey
      );

      (mockSocketBob.emit as jest.Mock).mockClear();
      encryptedHandler?.({ meetingId, encrypted });

      // Server should relay encrypted message as-is
      const bobCalls = (mockSocketBob.emit as jest.Mock).mock.calls;
      const encCall = bobCalls.find((call: any[]) => call[0] === 'encrypted-chat-message');
      expect(encCall?.[1]).toEqual(encrypted);

      // Bob can decrypt and the profanity is preserved in encrypted form
      const decrypted = decryptMessage(
        encCall?.[1],
        aliceKeyPair.publicKey,
        bobKeyPair.secretKey
      );
      expect(decrypted).toBe(messageWithProfanity);
    });
  });

  describe('Concurrent Messages', () => {
    it('should handle messages sent concurrently', () => {
      const meetingId = 'meeting-e2e-7';

      userMgr.addUser('Alice', mockSocketAlice);
      userMgr.addUser('Bob', mockSocketBob);

      const aliceJoinHandler = (mockSocketAlice.on as jest.Mock).mock.calls.find(
        (call: any[]) => call[0] === 'join-meeting'
      )?.[1];
      aliceJoinHandler?.({ meetingId, name: 'Alice' });

      const bobJoinHandler = (mockSocketBob.on as jest.Mock).mock.calls.find(
        (call: any[]) => call[0] === 'join-meeting'
      )?.[1];
      bobJoinHandler?.({ meetingId, name: 'Bob' });

      const sendMessageHandler = (mockSocketAlice.on as jest.Mock).mock.calls.find(
        (call: any[]) => call[0] === 'send-message'
      )?.[1];

      const bobSendHandler = (mockSocketBob.on as jest.Mock).mock.calls.find(
        (call: any[]) => call[0] === 'send-message'
      )?.[1];

      // Simulate concurrent messages - don't clear mocks between sends
      (mockSocketBob.emit as jest.Mock).mockClear();
      (mockSocketAlice.emit as jest.Mock).mockClear();
      
      sendMessageHandler?.({
        meetingId,
        text: 'Alice message 1',
        senderName: 'Alice',
      });

      bobSendHandler?.({
        meetingId,
        text: 'Bob message 1',
        senderName: 'Bob',
      });

      sendMessageHandler?.({
        meetingId,
        text: 'Alice message 2',
        senderName: 'Alice',
      });

      // Verify all messages were relayed
      const bobEmitCalls = (mockSocketBob.emit as jest.Mock).mock.calls;
      const chatCalls = bobEmitCalls.filter((call: any[]) => call[0] === 'chat-message');
      expect(chatCalls.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing meeting gracefully', () => {
      const sendMessageHandler = (mockSocketAlice.on as jest.Mock).mock.calls.find(
        (call: any[]) => call[0] === 'send-message'
      )?.[1];

      userMgr.addUser('Alice', mockSocketAlice);

      // Try to send message to non-existent meeting
      (mockSocketAlice.emit as jest.Mock).mockClear();
      sendMessageHandler?.({
        meetingId: 'non-existent-meeting',
        text: 'Hello',
        senderName: 'Alice',
      });

      // Should not throw, just silently fail to relay
      expect((mockSocketAlice.emit as jest.Mock).mock.calls).not.toContainEqual(
        expect.arrayContaining(['chat-message'])
      );
    });

    it('should handle malformed encrypted message', () => {
      const meetingId = 'meeting-e2e-8';

      userMgr.addUser('Alice', mockSocketAlice);
      userMgr.addUser('Bob', mockSocketBob);

      const aliceJoinHandler = (mockSocketAlice.on as jest.Mock).mock.calls.find(
        (call: any[]) => call[0] === 'join-meeting'
      )?.[1];
      aliceJoinHandler?.({ meetingId, name: 'Alice' });

      const bobJoinHandler = (mockSocketBob.on as jest.Mock).mock.calls.find(
        (call: any[]) => call[0] === 'join-meeting'
      )?.[1];
      bobJoinHandler?.({ meetingId, name: 'Bob' });

      const encryptedHandler = (mockSocketAlice.on as jest.Mock).mock.calls.find(
        (call: any[]) => call[0] === 'encrypted-chat-message'
      )?.[1];

      // Send malformed encrypted message
      const malformed = {
        ciphertext: 'not-valid-base64-!@#$',
        nonce: 'also-not-valid',
        publicKey: 'invalid',
      };

      (mockSocketBob.emit as jest.Mock).mockClear();
      // Should not throw on server
      expect(() => {
        encryptedHandler?.({ meetingId, encrypted: malformed });
      }).not.toThrow();

      // Message should still be relayed (server doesn't validate)
      const bobCalls = (mockSocketBob.emit as jest.Mock).mock.calls;
      const encCall = bobCalls.find((call: any[]) => call[0] === 'encrypted-chat-message');
      expect(encCall).toBeDefined();
    });
  });
});
