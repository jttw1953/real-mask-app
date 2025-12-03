/**
 * Unit tests for ChatPanel component
 * Tests message display, input handling, and send functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatPanel from '../../src/components/ChatPanel';
import { generateKeyPair, encryptMessage, type KeyPair, type EncryptedMessage } from '../../src/utils/encryption';

describe('ChatPanel Component', () => {
  let mockOnSendMessage: jest.Mock;
  let localKeyPair: KeyPair;
  let remoteKeyPair: KeyPair;

  beforeEach(() => {
    mockOnSendMessage = jest.fn();
    localKeyPair = generateKeyPair();
    remoteKeyPair = generateKeyPair();
  });

  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      const { container } = render(
        <ChatPanel
          isOpen={false}
          onClose={jest.fn()}
          onSendMessage={mockOnSendMessage}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render when isOpen is true', () => {
      render(
        <ChatPanel
          isOpen={true}
          onClose={jest.fn()}
          onSendMessage={mockOnSendMessage}
        />
      );

      expect(screen.getByText('Chat')).toBeInTheDocument();
    });

    it('should display initial empty state message', () => {
      render(
        <ChatPanel
          isOpen={true}
          onClose={jest.fn()}
          onSendMessage={mockOnSendMessage}
        />
      );

      expect(screen.getByText('Start a conversation...')).toBeInTheDocument();
    });

    it('should have input field and send button', () => {
      render(
        <ChatPanel
          isOpen={true}
          onClose={jest.fn()}
          onSendMessage={mockOnSendMessage}
        />
      );

      expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Send message' })).toBeInTheDocument();
    });
  });

  describe('User Input', () => {
    it('should update input value when user types', async () => {
      const user = userEvent.setup();
      render(
        <ChatPanel
          isOpen={true}
          onClose={jest.fn()}
          onSendMessage={mockOnSendMessage}
        />
      );

      const input = screen.getByPlaceholderText('Type a message...') as HTMLInputElement;
      await user.type(input, 'Hello World');

      expect(input.value).toBe('Hello World');
    });

    it('should clear input after sending message', async () => {
      const user = userEvent.setup();
      render(
        <ChatPanel
          isOpen={true}
          onClose={jest.fn()}
          onSendMessage={mockOnSendMessage}
        />
      );

      const input = screen.getByPlaceholderText('Type a message...') as HTMLInputElement;
      await user.type(input, 'Test message');

      const sendButton = screen.getByRole('button', { name: 'Send message' });
      await user.click(sendButton);

      await waitFor(() => {
        expect(input.value).toBe('');
      });
    });

    it('should disable send button when input is empty', async () => {
      render(
        <ChatPanel
          isOpen={true}
          onClose={jest.fn()}
          onSendMessage={mockOnSendMessage}
        />
      );

      const sendButton = screen.getByRole('button', { name: 'Send message' });
      expect(sendButton).toBeDisabled();
    });

    it('should enable send button when input has text', async () => {
      const user = userEvent.setup();
      render(
        <ChatPanel
          isOpen={true}
          onClose={jest.fn()}
          onSendMessage={mockOnSendMessage}
        />
      );

      const input = screen.getByPlaceholderText('Type a message...');
      await user.type(input, 'Test');

      const sendButton = screen.getByRole('button', { name: 'Send message' });
      expect(sendButton).not.toBeDisabled();
    });

    it('should disable send button when input only contains whitespace', async () => {
      const user = userEvent.setup();
      render(
        <ChatPanel
          isOpen={true}
          onClose={jest.fn()}
          onSendMessage={mockOnSendMessage}
        />
      );

      const input = screen.getByPlaceholderText('Type a message...');
      await user.type(input, '   \n\t   ');

      const sendButton = screen.getByRole('button', { name: 'Send message' });
      expect(sendButton).toBeDisabled();
    });
  });

  describe('Message Sending', () => {
    it('should call onSendMessage when send button clicked', async () => {
      const user = userEvent.setup();
      render(
        <ChatPanel
          isOpen={true}
          onClose={jest.fn()}
          onSendMessage={mockOnSendMessage}
        />
      );

      const input = screen.getByPlaceholderText('Type a message...');
      await user.type(input, 'Test message');

      const sendButton = screen.getByRole('button', { name: 'Send message' });
      await user.click(sendButton);

      expect(mockOnSendMessage).toHaveBeenCalledWith('Test message');
    });

    it('should send message when Enter key pressed', async () => {
      const user = userEvent.setup();
      render(
        <ChatPanel
          isOpen={true}
          onClose={jest.fn()}
          onSendMessage={mockOnSendMessage}
        />
      );

      const input = screen.getByPlaceholderText('Type a message...');
      await user.type(input, 'Message via Enter{Enter}');

      expect(mockOnSendMessage).toHaveBeenCalledWith('Message via Enter');
    });

    it('should not send message if input is empty when Enter pressed', async () => {
      const user = userEvent.setup();
      render(
        <ChatPanel
          isOpen={true}
          onClose={jest.fn()}
          onSendMessage={mockOnSendMessage}
        />
      );

      const input = screen.getByPlaceholderText('Type a message...');
      await user.type(input, '{Enter}');

      expect(mockOnSendMessage).not.toHaveBeenCalled();
    });

    it('should not send message with only whitespace', async () => {
      const user = userEvent.setup();
      render(
        <ChatPanel
          isOpen={true}
          onClose={jest.fn()}
          onSendMessage={mockOnSendMessage}
        />
      );

      const input = screen.getByPlaceholderText('Type a message...');
      await user.type(input, '   {Enter}');

      expect(mockOnSendMessage).not.toHaveBeenCalled();
    });

    it('should display sent message in chat', async () => {
      const user = userEvent.setup();
      render(
        <ChatPanel
          isOpen={true}
          onClose={jest.fn()}
          onSendMessage={mockOnSendMessage}
        />
      );

      const input = screen.getByPlaceholderText('Type a message...');
      await user.type(input, 'My message');

      const sendButton = screen.getByRole('button', { name: 'Send message' });
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText('My message')).toBeInTheDocument();
      });
    });

    it('should mark sent messages as local', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <ChatPanel
          isOpen={true}
          onClose={jest.fn()}
          onSendMessage={mockOnSendMessage}
        />
      );

      const input = screen.getByPlaceholderText('Type a message...');
      await user.type(input, 'Test');

      const sendButton = screen.getByRole('button', { name: 'Send message' });
      await user.click(sendButton);

      await waitFor(() => {
        const messageDiv = container.querySelector('.justify-end');
        expect(messageDiv).toBeInTheDocument();
      });
    });
  });

  describe('Message Display', () => {
    it('should display timestamp for sent messages', async () => {
      const user = userEvent.setup();
      render(
        <ChatPanel
          isOpen={true}
          onClose={jest.fn()}
          onSendMessage={mockOnSendMessage}
        />
      );

      const input = screen.getByPlaceholderText('Type a message...');
      await user.type(input, 'Test');

      const sendButton = screen.getByRole('button', { name: 'Send message' });
      await user.click(sendButton);

      await waitFor(() => {
        const timestamps = screen.getAllByText((content, element) => {
          const classList = element?.classList;
          return classList && Array.from(classList).some(c => c.includes('opacity-70'));
        });
        expect(timestamps.length).toBeGreaterThan(0);
      });
    });

    it('should display multiple messages in order', async () => {
      const user = userEvent.setup();
      render(
        <ChatPanel
          isOpen={true}
          onClose={jest.fn()}
          onSendMessage={mockOnSendMessage}
        />
      );

      const input = screen.getByPlaceholderText('Type a message...');
      const sendButton = screen.getByRole('button', { name: 'Send message' });

      // Send first message
      await user.type(input, 'First');
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText('First')).toBeInTheDocument();
      });

      // Send second message
      await user.type(input, 'Second');
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText('Second')).toBeInTheDocument();
        const messages = screen.getAllByText(/First|Second/);
        expect(messages.length).toBe(2);
      });
    });
  });

  describe('Close Button', () => {
    it('should call onClose when close button clicked', async () => {
      const user = userEvent.setup();
      const mockOnClose = jest.fn();

      render(
        <ChatPanel
          isOpen={true}
          onClose={mockOnClose}
          onSendMessage={mockOnSendMessage}
        />
      );

      const closeButton = screen.getByRole('button', { name: 'Close chat' });
      await user.click(closeButton);
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Encryption Support', () => {
    it('should send encrypted message when keys are available', async () => {
      const user = userEvent.setup();
      render(
        <ChatPanel
          isOpen={true}
          onClose={jest.fn()}
          onSendMessage={mockOnSendMessage}
          localKeyPair={localKeyPair}
          remotePublicKey={remoteKeyPair.publicKey}
        />
      );

      const input = screen.getByPlaceholderText('Type a message...');
      await user.type(input, 'Secret message');

      const sendButton = screen.getByRole('button', { name: 'Send message' });
      await user.click(sendButton);

      await waitFor(() => {
        expect(mockOnSendMessage).toHaveBeenCalled();
        const callArg = mockOnSendMessage.mock.calls[0][0];
        // Should be encrypted object with ciphertext, nonce, publicKey
        expect(typeof callArg).toBe('object');
        expect(callArg).toHaveProperty('ciphertext');
        expect(callArg).toHaveProperty('nonce');
        expect(callArg).toHaveProperty('publicKey');
      });
    });

    it('should send plaintext if no remote key available', async () => {
      const user = userEvent.setup();
      render(
        <ChatPanel
          isOpen={true}
          onClose={jest.fn()}
          onSendMessage={mockOnSendMessage}
          localKeyPair={localKeyPair}
          remotePublicKey={null}
        />
      );

      const input = screen.getByPlaceholderText('Type a message...');
      await user.type(input, 'Plaintext message');

      const sendButton = screen.getByRole('button', { name: 'Send message' });
      await user.click(sendButton);

      await waitFor(() => {
        expect(mockOnSendMessage).toHaveBeenCalledWith('Plaintext message');
      });
    });

    it('should send plaintext if no local key available', async () => {
      const user = userEvent.setup();
      render(
        <ChatPanel
          isOpen={true}
          onClose={jest.fn()}
          onSendMessage={mockOnSendMessage}
          localKeyPair={null}
          remotePublicKey={remoteKeyPair.publicKey}
        />
      );

      const input = screen.getByPlaceholderText('Type a message...');
      await user.type(input, 'Plaintext fallback');

      const sendButton = screen.getByRole('button', { name: 'Send message' });
      await user.click(sendButton);

      await waitFor(() => {
        expect(mockOnSendMessage).toHaveBeenCalledWith('Plaintext fallback');
      });
    });

    it('should handle encryption errors gracefully', async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Pass invalid key that will cause encryption to fail
      render(
        <ChatPanel
          isOpen={true}
          onClose={jest.fn()}
          onSendMessage={mockOnSendMessage}
          localKeyPair={localKeyPair}
          remotePublicKey={new Uint8Array(31)} // Invalid key length
        />
      );

      const input = screen.getByPlaceholderText('Type a message...');
      await user.type(input, 'Test');

      const sendButton = screen.getByRole('button', { name: 'Send message' });
      await user.click(sendButton);

      await waitFor(() => {
        // Should fall back to plaintext
        expect(mockOnSendMessage).toHaveBeenCalledWith('Test');
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Special Characters and Edge Cases', () => {
    it('should handle emoji in messages', async () => {
      const user = userEvent.setup();
      render(
        <ChatPanel
          isOpen={true}
          onClose={jest.fn()}
          onSendMessage={mockOnSendMessage}
        />
      );

      const input = screen.getByPlaceholderText('Type a message...');
      await user.type(input, 'Hello 👋 World 🌍');

      const sendButton = screen.getByRole('button', { name: 'Send message' });
      await user.click(sendButton);

      await waitFor(() => {
        expect(mockOnSendMessage).toHaveBeenCalledWith('Hello 👋 World 🌍');
        expect(screen.getByText('Hello 👋 World 🌍')).toBeInTheDocument();
      });
    });

    it('should handle very long messages', async () => {
      const user = userEvent.setup();
      const longMessage = 'A'.repeat(1000);

      render(
        <ChatPanel
          isOpen={true}
          onClose={jest.fn()}
          onSendMessage={mockOnSendMessage}
        />
      );

      const input = screen.getByPlaceholderText('Type a message...') as HTMLInputElement;
      // Use fireEvent for long strings to avoid timeout
      fireEvent.change(input, { target: { value: longMessage } });

      const sendButton = screen.getByRole('button', { name: 'Send message' });
      await user.click(sendButton);

      await waitFor(() => {
        expect(mockOnSendMessage).toHaveBeenCalledWith(longMessage);
      });
    });

    it('should handle newlines in messages', async () => {
      const user = userEvent.setup();
      render(
        <ChatPanel
          isOpen={true}
          onClose={jest.fn()}
          onSendMessage={mockOnSendMessage}
        />
      );

      const input = screen.getByPlaceholderText('Type a message...') as HTMLInputElement;
      const multiLineText = 'Line 1\nLine 2';
      await user.type(input, multiLineText);

      // Input element doesn't actually support newlines, but test it handles the text
      expect(input.value).toContain('Line');
    });
  });

  describe('Window Reference Cleanup', () => {
    it('should attach addChatMessage to window on mount', () => {
      render(
        <ChatPanel
          isOpen={true}
          onClose={jest.fn()}
          onSendMessage={mockOnSendMessage}
        />
      );

      expect((window as any).addChatMessage).toBeDefined();
      expect(typeof (window as any).addChatMessage).toBe('function');
    });

    it('should remove addChatMessage from window on unmount', () => {
      const { unmount } = render(
        <ChatPanel
          isOpen={true}
          onClose={jest.fn()}
          onSendMessage={mockOnSendMessage}
        />
      );

      expect((window as any).addChatMessage).toBeDefined();
      unmount();
      expect((window as any).addChatMessage).toBeUndefined();
    });
  });
});
