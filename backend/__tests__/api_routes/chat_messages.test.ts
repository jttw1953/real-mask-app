/**
 * Unit tests for chat message handlers in userManager
 * Tests plaintext and encrypted message handling with profanity filtering
 */

import { jest } from '@jest/globals';
import { userManager } from '../../src/managers/userManager.js';
import { Socket } from 'socket.io';

// Mock the roomManager module
jest.mock('../../src/managers/roomManager.js', () => ({
  roomManager: jest.fn().mockImplementation(() => ({
    onOffer: jest.fn(),
    onAnswer: jest.fn(),
    onIceCandidate: jest.fn(),
    createRoom: jest.fn(),
  })),
}));

describe('UserManager Chat Handlers', () => {
  let userMgr: userManager;
  let mockSocket1: jest.Mocked<Socket>;
  let mockSocket2: jest.Mocked<Socket>;

  beforeEach(() => {
    // Use fake timers to avoid async issues
    jest.useFakeTimers();
    
    userMgr = new userManager();

    // Create mock sockets
    mockSocket1 = {
      id: 'socket-1',
      on: jest.fn(),
      emit: jest.fn(),
    } as unknown as jest.Mocked<Socket>;

    mockSocket2 = {
      id: 'socket-2',
      on: jest.fn(),
      emit: jest.fn(),
    } as unknown as jest.Mocked<Socket>;
  });

  afterEach(() => {
    // Clear all timers and restore real timers
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('handleChatMessage', () => {
    it('should relay plaintext messages to other participant', () => {
      // Setup meeting with two participants
      const meetingId = 'meeting-123';
      userMgr.addUser('Alice', mockSocket1);
      userMgr.addUser('Bob', mockSocket2);

      // Simulate join meeting for both users
      const socket1OnCalls = (mockSocket1.on as jest.Mock).mock.calls;
      const joinMeetingHandler1 = socket1OnCalls.find(
        (call: any[]) => call[0] === 'join-meeting'
      )?.[1];
      joinMeetingHandler1?.({ meetingId, name: 'Alice' });

      const socket2OnCalls = (mockSocket2.on as jest.Mock).mock.calls;
      const joinMeetingHandler2 = socket2OnCalls.find(
        (call: any[]) => call[0] === 'join-meeting'
      )?.[1];
      joinMeetingHandler2?.({ meetingId, name: 'Bob' });

      // Reset emit to only track new calls
      (mockSocket1.emit as jest.Mock).mockClear();
      (mockSocket2.emit as jest.Mock).mockClear();

      // Find and call handleChatMessage
      const sendMessageHandler = socket1OnCalls.find(
        (call: any[]) => call[0] === 'send-message'
      )?.[1];
      sendMessageHandler?.({
        meetingId,
        text: 'Hello Bob!',
        senderName: 'Alice',
      });

      // Verify Bob received the message
      expect((mockSocket2.emit as jest.Mock).mock.calls).toContainEqual([
        'chat-message',
        { text: 'Hello Bob!', senderName: 'Alice' },
      ]);
    });

    it('should not relay if only one participant in meeting', () => {
      const meetingId = 'meeting-123';
      userMgr.addUser('Alice', mockSocket1);

      const socket1OnCalls = (mockSocket1.on as jest.Mock).mock.calls;
      const joinMeetingHandler = socket1OnCalls.find(
        (call: any[]) => call[0] === 'join-meeting'
      )?.[1];
      joinMeetingHandler?.({ meetingId, name: 'Alice' });

      (mockSocket1.emit as jest.Mock).mockClear();

      // Try to send message
      const sendMessageHandler = socket1OnCalls.find(
        (call: any[]) => call[0] === 'send-message'
      )?.[1];
      sendMessageHandler?.({
        meetingId,
        text: 'Hello!',
        senderName: 'Alice',
      });

      // Should not emit to socket2 (it wasn't added)
      expect((mockSocket1.emit as jest.Mock)).not.toHaveBeenCalled();
    });

    it('should filter profanity from messages', () => {
      const meetingId = 'meeting-123';
      userMgr.addUser('User1', mockSocket1);
      userMgr.addUser('User2', mockSocket2);

      const socket1OnCalls = (mockSocket1.on as jest.Mock).mock.calls;
      const joinMeetingHandler1 = socket1OnCalls.find(
        (call: any[]) => call[0] === 'join-meeting'
      )?.[1];
      joinMeetingHandler1?.({ meetingId, name: 'User1' });

      const socket2OnCalls = (mockSocket2.on as jest.Mock).mock.calls;
      const joinMeetingHandler2 = socket2OnCalls.find(
        (call: any[]) => call[0] === 'join-meeting'
      )?.[1];
      joinMeetingHandler2?.({ meetingId, name: 'User2' });

      (mockSocket1.emit as jest.Mock).mockClear();
      (mockSocket2.emit as jest.Mock).mockClear();

      const sendMessageHandler = socket1OnCalls.find(
        (call: any[]) => call[0] === 'send-message'
      )?.[1];
      sendMessageHandler?.({
        meetingId,
        text: 'This is a damn test',
        senderName: 'User1',
      });

      // Verify message was filtered
      const emitCalls = (mockSocket2.emit as jest.Mock).mock.calls;
      const chatMessageCall = emitCalls.find((call: any[]) => call[0] === 'chat-message');
      expect(chatMessageCall).toBeDefined();
      // The filtered text should have the profanity replaced with asterisks
      expect(chatMessageCall?.[1].text).not.toContain('damn');
      expect(chatMessageCall?.[1].text).toContain('****');
    });

    it('should handle multiple messages in sequence', () => {
      const meetingId = 'meeting-123';
      userMgr.addUser('Alice', mockSocket1);
      userMgr.addUser('Bob', mockSocket2);

      const socket1OnCalls = (mockSocket1.on as jest.Mock).mock.calls;
      const joinMeetingHandler1 = socket1OnCalls.find(
        (call: any[]) => call[0] === 'join-meeting'
      )?.[1];
      joinMeetingHandler1?.({ meetingId, name: 'Alice' });

      const socket2OnCalls = (mockSocket2.on as jest.Mock).mock.calls;
      const joinMeetingHandler2 = socket2OnCalls.find(
        (call: any[]) => call[0] === 'join-meeting'
      )?.[1];
      joinMeetingHandler2?.({ meetingId, name: 'Bob' });

      (mockSocket1.emit as jest.Mock).mockClear();
      (mockSocket2.emit as jest.Mock).mockClear();

      const sendMessageHandler = socket1OnCalls.find(
        (call: any[]) => call[0] === 'send-message'
      )?.[1];

      // Send multiple messages
      const messages = ['First message', 'Second message', 'Third message'];
      messages.forEach((msg) => {
        (mockSocket2.emit as jest.Mock).mockClear();
        sendMessageHandler?.({
          meetingId,
          text: msg,
          senderName: 'Alice',
        });

        const emitCalls = (mockSocket2.emit as jest.Mock).mock.calls;
        const chatCall = emitCalls.find((call: any[]) => call[0] === 'chat-message');
        expect(chatCall?.[1].text).toBe(msg);
      });
    });

    it('should preserve sender name in relayed message', () => {
      const meetingId = 'meeting-123';
      userMgr.addUser('AliceName', mockSocket1);
      userMgr.addUser('BobName', mockSocket2);

      const socket1OnCalls = (mockSocket1.on as jest.Mock).mock.calls;
      const joinMeetingHandler1 = socket1OnCalls.find(
        (call: any[]) => call[0] === 'join-meeting'
      )?.[1];
      joinMeetingHandler1?.({ meetingId, name: 'AliceName' });

      const socket2OnCalls = (mockSocket2.on as jest.Mock).mock.calls;
      const joinMeetingHandler2 = socket2OnCalls.find(
        (call: any[]) => call[0] === 'join-meeting'
      )?.[1];
      joinMeetingHandler2?.({ meetingId, name: 'BobName' });

      (mockSocket2.emit as jest.Mock).mockClear();

      const sendMessageHandler = socket1OnCalls.find(
        (call: any[]) => call[0] === 'send-message'
      )?.[1];
      sendMessageHandler?.({
        meetingId,
        text: 'Hello',
        senderName: 'AliceName',
      });

      const emitCalls = (mockSocket2.emit as jest.Mock).mock.calls;
      const chatCall = emitCalls.find((call: any[]) => call[0] === 'chat-message');
      expect(chatCall?.[1].senderName).toBe('AliceName');
    });

    it('should handle messages with special characters', () => {
      const meetingId = 'meeting-123';
      userMgr.addUser('User1', mockSocket1);
      userMgr.addUser('User2', mockSocket2);

      const socket1OnCalls = (mockSocket1.on as jest.Mock).mock.calls;
      const joinMeetingHandler1 = socket1OnCalls.find(
        (call: any[]) => call[0] === 'join-meeting'
      )?.[1];
      joinMeetingHandler1?.({ meetingId, name: 'User1' });

      const socket2OnCalls = (mockSocket2.on as jest.Mock).mock.calls;
      const joinMeetingHandler2 = socket2OnCalls.find(
        (call: any[]) => call[0] === 'join-meeting'
      )?.[1];
      joinMeetingHandler2?.({ meetingId, name: 'User2' });

      (mockSocket2.emit as jest.Mock).mockClear();

      const sendMessageHandler = socket1OnCalls.find(
        (call: any[]) => call[0] === 'send-message'
      )?.[1];

      const specialMessage = 'Test with emoji 👋 and symbols !@#$%';
      sendMessageHandler?.({
        meetingId,
        text: specialMessage,
        senderName: 'User1',
      });

      const emitCalls = (mockSocket2.emit as jest.Mock).mock.calls;
      const chatCall = emitCalls.find((call: any[]) => call[0] === 'chat-message');
      expect(chatCall?.[1].text).toContain('emoji 👋');
    });
  });

  describe('handleEncryptedChatMessage', () => {
    it('should relay encrypted messages to other participant', () => {
      const meetingId = 'meeting-123';
      userMgr.addUser('Alice', mockSocket1);
      userMgr.addUser('Bob', mockSocket2);

      const socket1OnCalls = (mockSocket1.on as jest.Mock).mock.calls;
      const joinMeetingHandler1 = socket1OnCalls.find(
        (call: any[]) => call[0] === 'join-meeting'
      )?.[1];
      joinMeetingHandler1?.({ meetingId, name: 'Alice' });

      const socket2OnCalls = (mockSocket2.on as jest.Mock).mock.calls;
      const joinMeetingHandler2 = socket2OnCalls.find(
        (call: any[]) => call[0] === 'join-meeting'
      )?.[1];
      joinMeetingHandler2?.({ meetingId, name: 'Bob' });

      (mockSocket2.emit as jest.Mock).mockClear();

      const encryptedMessageHandler = socket1OnCalls.find(
        (call: any[]) => call[0] === 'encrypted-chat-message'
      )?.[1];

      const encryptedMessage = {
        ciphertext: 'abc123',
        nonce: 'def456',
        publicKey: 'ghi789',
      };

      encryptedMessageHandler?.({
        meetingId,
        encrypted: encryptedMessage,
      });

      // Verify Bob received the encrypted message
      const emitCalls = (mockSocket2.emit as jest.Mock).mock.calls;
      const encryptedCall = emitCalls.find(
        (call: any[]) => call[0] === 'encrypted-chat-message'
      );
      expect(encryptedCall).toBeDefined();
      expect(encryptedCall?.[1]).toEqual(encryptedMessage);
    });

    it('should not relay encrypted message if only one participant', () => {
      const meetingId = 'meeting-123';
      userMgr.addUser('Alice', mockSocket1);

      const socket1OnCalls = (mockSocket1.on as jest.Mock).mock.calls;
      const joinMeetingHandler = socket1OnCalls.find(
        (call: any[]) => call[0] === 'join-meeting'
      )?.[1];
      joinMeetingHandler?.({ meetingId, name: 'Alice' });

      (mockSocket1.emit as jest.Mock).mockClear();

      const encryptedMessageHandler = socket1OnCalls.find(
        (call: any[]) => call[0] === 'encrypted-chat-message'
      )?.[1];

      const encryptedMessage = {
        ciphertext: 'abc123',
        nonce: 'def456',
        publicKey: 'ghi789',
      };

      encryptedMessageHandler?.({
        meetingId,
        encrypted: encryptedMessage,
      });

      // Should not emit
      expect((mockSocket1.emit as jest.Mock)).not.toHaveBeenCalled();
    });

    it('should preserve entire encrypted message structure', () => {
      const meetingId = 'meeting-123';
      userMgr.addUser('Alice', mockSocket1);
      userMgr.addUser('Bob', mockSocket2);

      const socket1OnCalls = (mockSocket1.on as jest.Mock).mock.calls;
      const joinMeetingHandler1 = socket1OnCalls.find(
        (call: any[]) => call[0] === 'join-meeting'
      )?.[1];
      joinMeetingHandler1?.({ meetingId, name: 'Alice' });

      const socket2OnCalls = (mockSocket2.on as jest.Mock).mock.calls;
      const joinMeetingHandler2 = socket2OnCalls.find(
        (call: any[]) => call[0] === 'join-meeting'
      )?.[1];
      joinMeetingHandler2?.({ meetingId, name: 'Bob' });

      (mockSocket2.emit as jest.Mock).mockClear();

      const encryptedMessageHandler = socket1OnCalls.find(
        (call: any[]) => call[0] === 'encrypted-chat-message'
      )?.[1];

      const encryptedMessage = {
        ciphertext: 'verylongciphertextstring123456789',
        nonce: 'noncestringvalue',
        publicKey: 'publickeyvalue',
      };

      encryptedMessageHandler?.({
        meetingId,
        encrypted: encryptedMessage,
      });

      const emitCalls = (mockSocket2.emit as jest.Mock).mock.calls;
      const encryptedCall = emitCalls.find(
        (call: any[]) => call[0] === 'encrypted-chat-message'
      );

      // Verify all fields are preserved exactly
      expect(encryptedCall?.[1].ciphertext).toBe(encryptedMessage.ciphertext);
      expect(encryptedCall?.[1].nonce).toBe(encryptedMessage.nonce);
      expect(encryptedCall?.[1].publicKey).toBe(encryptedMessage.publicKey);
    });

    it('should not decrypt messages on server', () => {
      // This test verifies that the server does NOT attempt to decrypt
      // The encrypted message is passed through as-is
      const meetingId = 'meeting-123';
      userMgr.addUser('Alice', mockSocket1);
      userMgr.addUser('Bob', mockSocket2);

      const socket1OnCalls = (mockSocket1.on as jest.Mock).mock.calls;
      const joinMeetingHandler1 = socket1OnCalls.find(
        (call: any[]) => call[0] === 'join-meeting'
      )?.[1];
      joinMeetingHandler1?.({ meetingId, name: 'Alice' });

      const socket2OnCalls = (mockSocket2.on as jest.Mock).mock.calls;
      const joinMeetingHandler2 = socket2OnCalls.find(
        (call: any[]) => call[0] === 'join-meeting'
      )?.[1];
      joinMeetingHandler2?.({ meetingId, name: 'Bob' });

      (mockSocket2.emit as jest.Mock).mockClear();

      const encryptedMessageHandler = socket1OnCalls.find(
        (call: any[]) => call[0] === 'encrypted-chat-message'
      )?.[1];

      // Simulate an encrypted message (would fail if server tried to decrypt)
      const encryptedMessage = {
        ciphertext: 'garbagethatwouldfailifwetriedtodecrypt',
        nonce: 'alsogarbageforthistest',
        publicKey: 'moregarbagedata',
      };

      // This should succeed because server does not attempt decryption
      encryptedMessageHandler?.({
        meetingId,
        encrypted: encryptedMessage,
      });

      // Message should be relayed as-is
      const emitCalls = (mockSocket2.emit as jest.Mock).mock.calls;
      const encryptedCall = emitCalls.find(
        (call: any[]) => call[0] === 'encrypted-chat-message'
      );
      expect(encryptedCall).toBeDefined();
    });

    it('should handle multiple encrypted messages', () => {
      const meetingId = 'meeting-123';
      userMgr.addUser('Alice', mockSocket1);
      userMgr.addUser('Bob', mockSocket2);

      const socket1OnCalls = (mockSocket1.on as jest.Mock).mock.calls;
      const joinMeetingHandler1 = socket1OnCalls.find(
        (call: any[]) => call[0] === 'join-meeting'
      )?.[1];
      joinMeetingHandler1?.({ meetingId, name: 'Alice' });

      const socket2OnCalls = (mockSocket2.on as jest.Mock).mock.calls;
      const joinMeetingHandler2 = socket2OnCalls.find(
        (call: any[]) => call[0] === 'join-meeting'
      )?.[1];
      joinMeetingHandler2?.({ meetingId, name: 'Bob' });

      const encryptedMessageHandler = socket1OnCalls.find(
        (call: any[]) => call[0] === 'encrypted-chat-message'
      )?.[1];

      const messages = [
        {
          ciphertext: 'cipher1',
          nonce: 'nonce1',
          publicKey: 'key1',
        },
        {
          ciphertext: 'cipher2',
          nonce: 'nonce2',
          publicKey: 'key2',
        },
        {
          ciphertext: 'cipher3',
          nonce: 'nonce3',
          publicKey: 'key3',
        },
      ];

      messages.forEach((msg) => {
        (mockSocket2.emit as jest.Mock).mockClear();
        encryptedMessageHandler?.({
          meetingId,
          encrypted: msg,
        });

        const emitCalls = (mockSocket2.emit as jest.Mock).mock.calls;
        const encryptedCall = emitCalls.find(
          (call: any[]) => call[0] === 'encrypted-chat-message'
        );
        expect(encryptedCall?.[1]).toEqual(msg);
      });
    });
  });

  describe('Public Key Exchange', () => {
    it('should relay public keys between participants', () => {
      const meetingId = 'meeting-123';
      userMgr.addUser('Alice', mockSocket1);
      userMgr.addUser('Bob', mockSocket2);

      const socket1OnCalls = (mockSocket1.on as jest.Mock).mock.calls;
      const joinMeetingHandler1 = socket1OnCalls.find(
        (call: any[]) => call[0] === 'join-meeting'
      )?.[1];
      joinMeetingHandler1?.({ meetingId, name: 'Alice' });

      const socket2OnCalls = (mockSocket2.on as jest.Mock).mock.calls;
      const joinMeetingHandler2 = socket2OnCalls.find(
        (call: any[]) => call[0] === 'join-meeting'
      )?.[1];
      joinMeetingHandler2?.({ meetingId, name: 'Bob' });

      (mockSocket2.emit as jest.Mock).mockClear();

      const publicKeyHandler = socket1OnCalls.find(
        (call: any[]) => call[0] === 'public-key'
      )?.[1];

      const alicePublicKey = 'alice-public-key-base64';
      publicKeyHandler?.({ publicKey: alicePublicKey });

      // Verify Bob received the public key
      const emitCalls = (mockSocket2.emit as jest.Mock).mock.calls;
      const keyCall = emitCalls.find((call: any[]) => call[0] === 'public-key');
      expect(keyCall?.[1].publicKey).toBe(alicePublicKey);
    });
  });
});
