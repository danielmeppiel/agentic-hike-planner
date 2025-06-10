/**
 * Typing indicator component that shows when the AI is generating a response.
 * Displays an animated three-dot indicator in a chat bubble with the AI avatar.
 * 
 * @example
 * ```tsx
 * function ChatInterface() {
 *   const [isTyping, setIsTyping] = useState(false);
 * 
 *   return (
 *     <div>
 *       {messages.map(message => <ChatMessage key={message.id} message={message} />)}
 *       {isTyping && <TypingIndicator />}
 *     </div>
 *   );
 * }
 * ```
 */
export function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex items-start space-x-3 max-w-[80%]">
        {/* Avatar */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-emerald-500 to-blue-500 text-white">
          <span className="text-sm font-bold">🤖</span>
        </div>
        
        {/* Typing Bubble */}
        <div className="bg-white/90 text-gray-800 rounded-2xl rounded-bl-md px-4 py-3">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full typing-indicator"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full typing-indicator" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full typing-indicator" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
