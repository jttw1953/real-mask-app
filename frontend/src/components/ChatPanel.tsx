import { useState, useRef, useEffect } from 'react';
import { Send, X } from 'lucide-react';
import type { KeyPair, EncryptedMessage } from '../utils/encryption';

type ChatMessage = {
  id: string;
  sender: 'local' | 'remote';
  text: string;
  timestamp: Date;
};

type ChatPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  onSendMessage: (message: string | EncryptedMessage) => void;
  localKeyPair?: KeyPair | null;
  remotePublicKey?: Uint8Array | null;
};

export const ChatPanel = ({ isOpen, onClose, onSendMessage, localKeyPair, remotePublicKey }: ChatPanelProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (inputValue.trim()) {
      const message: ChatMessage = {
        id: `local-${Date.now()}`,
        sender: 'local',
        text: inputValue,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, message]);
      
      // If both key pairs available, encrypt. Otherwise send plaintext.
      if (localKeyPair && remotePublicKey) {
        try {
          const { encryptMessage } = await import('../utils/encryption');
          const encrypted = encryptMessage(inputValue, remotePublicKey, localKeyPair.secretKey);
          onSendMessage(encrypted);
        } catch (error) {
          console.error('Encryption failed, sending plaintext:', error);
          onSendMessage(inputValue);
        }
      } else {
        onSendMessage(inputValue);
      }
      
      setInputValue('');
    }
  };

  const addRemoteMessage = (text: string) => {
    const message: ChatMessage = {
      id: `remote-${Date.now()}`,
      sender: 'remote',
      text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, message]);
  };

  // Expose the addRemoteMessage function to parent via useRef or callback
  // We'll attach it to window for the Room component to access
  useEffect(() => {
    (window as any).addChatMessage = addRemoteMessage;
    return () => {
      delete (window as any).addChatMessage;
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 right-4 z-50 w-80 h-96 bg-slate-800 border-2 border-slate-700 rounded-lg shadow-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 flex items-center justify-between">
        <h3 className="text-white font-semibold">Chat</h3>
        <button
          onClick={onClose}
          aria-label="Close chat"
          className="text-white hover:bg-white/20 p-1 rounded transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-slate-400 text-sm mt-8">
            Start a conversation...
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'local' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                msg.sender === 'local'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-100'
              }`}
            >
              <p className="break-words">{msg.text}</p>
              <span className="text-xs opacity-70 mt-1 block">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-slate-700 px-4 py-3 border-t border-slate-600 flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && inputValue.trim()) {
              handleSend();
            }
          }}
          placeholder="Type a message..."
          className="flex-1 px-3 py-2 bg-slate-600 text-white placeholder-slate-400 rounded border border-slate-500 focus:outline-none focus:border-blue-500 text-sm"
        />
        <button
          onClick={handleSend}
          disabled={!inputValue.trim()}
          aria-label="Send message"
          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded transition-colors"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
};

export default ChatPanel;
