import { UserIcon } from '@heroicons/react/24/outline';
import type { Message } from '../types';
// Import from the index file to ensure proper module resolution
import { formatTimeString } from '../utils';

interface ChatMessageProps {
  /** The message object to display */
  message: Message;
}

/**
 * Individual chat message component that displays messages from users or AI.
 * Handles different message types (text, action) and provides appropriate styling
 * and avatars for each sender type.
 * 
 * @param props - Component props
 * @param props.message - Message object containing content, sender, timestamp, and type
 * 
 * @example
 * ```tsx
 * const message = {
 *   id: '1',
 *   content: 'Hello, can you help me find trails?',
 *   sender: 'user',
 *   timestamp: new Date(),
 *   type: 'text'
 * };
 * 
 * <ChatMessage message={message} />
 * ```
 */
export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.sender === 'user';
  const isAction = message.type === 'action';
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} message-enter`}>
      <div className={`flex items-start space-x-3 max-w-[80%] ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser 
            ? 'bg-blue-500 text-white' 
            : 'bg-gradient-to-br from-emerald-500 to-blue-500 text-white'
        }`}>
          {isUser ? (
            <UserIcon className="w-4 h-4" />
          ) : (
            <span className="text-sm font-bold">🤖</span>
          )}
        </div>
        
        {/* Message Bubble */}
        <div className={`rounded-2xl px-4 py-3 ${
          isUser
            ? isAction
              ? 'bg-blue-400/90 text-white'
              : 'bg-blue-500/90 text-white'
            : 'bg-white/90 text-gray-800'
        } ${isUser ? 'rounded-br-md' : 'rounded-bl-md'}`}>
          {isAction && (
            <div className="text-xs opacity-75 mb-1">Quick Action</div>
          )}
          <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {message.content}
          </div>
          <div className={`text-xs mt-2 ${
            isUser ? 'text-blue-100' : 'text-gray-500'
          }`}>
            {formatTimeString(message.timestamp)}
          </div>
        </div>
      </div>
    </div>
  );
}
