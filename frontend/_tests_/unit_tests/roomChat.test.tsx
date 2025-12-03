/**
 * Integration tests for Room component chat functionality
 * Tests message sending/receiving with socket.io mocking
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Room } from '../../src/components/Room';
import { generateKeyPair, encryptMessage, decryptMessage } from '../../src/utils/encryption';

// Mock socket.io
jest.mock('socket.io-client');

// Mock other dependencies
jest.mock('@mediapipe/face_mesh', () => ({
  FaceMesh: jest.fn(),
}));

jest.mock('@mediapipe/camera_utils', () => ({
  Camera: jest.fn(),
}));

jest.mock('../../src/components/ChatPanel', () => ({
  __esModule: true,
  default: ({ isOpen, onClose, onSendMessage, localKeyPair, remotePublicKey }: any) => (
    isOpen ? (
      <div data-testid="chat-panel">
        <button onClick={onClose} data-testid="close-chat">Close</button>
        <input
          data-testid="chat-input"
          onKeyPress={(e: any) => {
            if (e.key === 'Enter') {
              onSendMessage(e.target.value);
              e.target.value = '';
            }
          }}
          placeholder="Type a message..."
        />
        <div data-testid="local-key-pair">{localKeyPair ? 'Has Key' : 'No Key'}</div>
        <div data-testid="remote-public-key">{remotePublicKey ? 'Has Remote Key' : 'No Remote Key'}</div>
      </div>
    ) : null
  ),
}));

jest.mock('../../src/components/OverlaySelector', () => ({
  __esModule: true,
  default: () => <div>Overlay Selector</div>,
}));

jest.mock('../../src/components/PageBackground', () => ({
  __esModule: true,
  default: ({ children }: any) => <div>{children}</div>,
}));

describe('Room Component - Chat Integration', () => {
  let mockSocket: any;
  let mockEmit: jest.Mock;
  let mockOn: jest.Mock;

  beforeEach(() => {
    // Setup mock socket
    mockEmit = jest.fn();
    mockOn = jest.fn((event: string, callback: Function) => {
      // Store callbacks for testing
      if (!mockSocket.listeners) {
        mockSocket.listeners = {};
      }
      mockSocket.listeners[event] = callback;
    });

    mockSocket = {
      id: 'test-socket-123',
      emit: mockEmit,
      on: mockOn,
      off: jest.fn(),
      disconnect: jest.fn(),
      connect: jest.fn(),
    };

    (io as jest.Mock).mockReturnValue(mockSocket);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderRoom = () => {
    const mockLocalAudioTrack = {
      enabled: true,
      kind: 'audio',
    } as MediaStreamTrack;

    const mockLocalVideoTrack = {
      enabled: true,
      kind: 'video',
    } as MediaStreamTrack;

    return render(
      <BrowserRouter>
        <Room
          name="TestUser"
          localAudioTrack={mockLocalAudioTrack}
          localVideoTrack={mockLocalVideoTrack}
          meetingId="test-meeting-123"
          userOverlays={[]}
        />
      </BrowserRouter>
    );
  };

  describe('Socket Connection and Chat Setup', () => {
    it('should initialize socket connection', () => {
      renderRoom();

      expect(io).toHaveBeenCalledWith('http://localhost:3000', expect.any(Object));
    });

    it('should set up chat message listener', () => {
      renderRoom();

      expect(mockOn).toHaveBeenCalledWith(
        'chat-message',
        expect.any(Function)
      );
    });

    it('should set up encrypted message listener', () => {
      renderRoom();

      expect(mockOn).toHaveBeenCalledWith(
        'encrypted-chat-message',
        expect.any(Function)
      );
    });

    it('should set up public key listener', () => {
      renderRoom();

      expect(mockOn).toHaveBeenCalledWith(
        'public-key',
        expect.any(Function)
      );
    });
  });

  describe('Disconnection Handling', () => {
    it('should cleanup on component unmount', () => {
      const { unmount } = renderRoom();

      unmount();

      expect(mockSocket.disconnect).toHaveBeenCalled();
    });
  });
});
