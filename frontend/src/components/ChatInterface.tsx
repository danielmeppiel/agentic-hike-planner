import { useState, useRef, useEffect } from 'react';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { ChatHeader } from './ChatHeader';
import { ChatMessage } from './ChatMessage';
import { QuickActions } from './QuickActions';
import ConversationStarters from './ConversationStarters';
import { TypingIndicator } from './TypingIndicator';
import { useChatStore } from '../stores/chatStore';
import type { Message } from '../types';

/**
 * Main chat interface component for the AI hiking assistant.
 * Provides a full-screen chat experience with message history, typing indicators,
 * quick actions, and conversation starters.
 * 
 * @example
 * ```tsx
 * import { ChatInterface } from './components/ChatInterface';
 * 
 * function App() {
 *   return <ChatInterface />;
 * }
 * ```
 */
export function ChatInterface() {
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  const { messages, addMessage, isAuthenticated } = useChatStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage.trim(),
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    };

    addMessage(userMessage);
    setInputMessage('');
    setIsTyping(true);

    // Simulate AI response (replace with actual AI service call)
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: generateAIResponse(userMessage.content),
        sender: 'ai',
        timestamp: new Date(),
        type: 'text'
      };
      addMessage(aiResponse);
      setIsTyping(false);
    }, 1500);
  };

  const handleSendConversationStarter = (starter: string) => {
    setInputMessage(starter);
    // Auto-send the conversation starter
    setTimeout(() => {
      const userMessage: Message = {
        id: Date.now().toString(),
        content: starter,
        sender: 'user',
        timestamp: new Date(),
        type: 'text'
      };

      addMessage(userMessage);
      setIsTyping(true);

      // Generate a more detailed AI response for conversation starters
      setTimeout(() => {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          content: generateDetailedAIResponse(starter),
          sender: 'ai',
          timestamp: new Date(),
          type: 'text'
        };
        addMessage(aiResponse);
        setIsTyping(false);
      }, 2000);
    }, 100);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const generateAIResponse = (userInput: string): string => {
    // Simple response logic - replace with actual AI service
    const input = userInput.toLowerCase();
    
    if (input.includes('hike') || input.includes('trail')) {
      return "🏔️ I'd love to help you find the perfect hiking trail! What's your experience level and what type of scenery are you looking for? Mountains, forests, desert, or coastal views?";
    }
    
    if (input.includes('trip') || input.includes('plan')) {
      return "🗺️ Let's plan an amazing hiking adventure! How many days are you thinking, and do you prefer day hikes or multi-day backpacking? Also, what region interests you most?";
    }
    
    if (input.includes('gear') || input.includes('equipment')) {
      return "🎒 Great question about gear! The essentials depend on your hike type. For day hikes: good boots, water, snacks, first aid, and weather protection. What specific gear questions do you have?";
    }
    
    return "🌟 Hi there! I'm your AI hiking companion. I can help you discover amazing trails, plan trips, suggest gear, check weather conditions, and provide safety tips. What outdoor adventure can I help you with today?";
  };

  const generateDetailedAIResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    // More detailed responses for conversation starters
    if (input.includes('beginner-friendly') && input.includes('waterfalls')) {
      return "🌊 Perfect choice! For beginner-friendly waterfall hikes near San Francisco, I recommend:\n\n🥾 **Muir Woods & Cataract Falls** (Easy, 2.5 miles)\n- Well-maintained trails with beautiful redwoods\n- Multiple small waterfalls along the creek\n- Best visited after winter rains\n\n🥾 **Alamere Falls** (Moderate, 8.5 miles)\n- Stunning beach waterfall (rare!)\n- Point Reyes National Seashore\n- Requires some scrambling but worth it\n\n🥾 **Berry Creek Falls** (Moderate, 10.7 miles)\n- Big Basin Redwoods State Park\n- Three-tier waterfall system\n- Cool forest environment\n\nWould you like detailed directions to any of these, or shall I help you prepare for the hike?";
    }
    
    if (input.includes('challenging') && input.includes('2-day') && input.includes('pacific northwest')) {
      return "⛰️ Excellent! The Pacific Northwest has incredible 2-day backpacking options. Here are my top recommendations:\n\n🏔️ **Olympic Peninsula - Enchanted Valley** (22 miles)\n- \"Valley of 10,000 Waterfalls\"\n- Chalet camping opportunity\n- Best: July-September\n\n🏔️ **Mount Rainier - Tolmie Peak** (12 miles)\n- Stunning alpine lakes\n- Wildflower meadows\n- Mountain goat sightings\n\n🏔️ **North Cascades - Blue Lake** (8.5 miles)\n- Crystal clear alpine lake\n- Dramatic granite peaks\n- Moderate difficulty with big rewards\n\nI'll need to know:\n- Your backpacking experience level\n- Preferred difficulty (these range from moderate to strenuous)\n- Specific dates you're considering\n\nShall we dive deeper into one of these options?";
    }
    
    if (input.includes('family-friendly') && input.includes('minimal elevation')) {
      return "👨‍👩‍👧‍👦 Great choice for family adventures! Here are some fantastic low-elevation hikes perfect for families:\n\n🌲 **Easy Nature Trails (Under 2 miles)**\n- Redwood groves with wide, flat paths\n- Boardwalk trails through wetlands\n- Lake loops with picnic areas\n\n🦋 **Kid-Friendly Features to Look For:**\n- Interactive nature centers\n- Scavenger hunt opportunities\n- Stream crossings (kids love bridges!)\n- Wildlife viewing areas\n\n📍 **What I'll need to give specific recommendations:**\n- Your location or region of interest\n- Ages of the children\n- How far you're willing to travel\n- Any specific interests (animals, water features, etc.)\n\nI can also suggest fun hiking games and activities to keep the kids engaged! What area are you thinking of exploring?";
    }
    
    // Default detailed response
    return generateAIResponse(userInput) + "\n\nI'm equipped with detailed knowledge about trails across North America, current weather conditions, gear recommendations, and safety protocols. Feel free to ask me anything specific!";
  };

  const handleQuickAction = (action: string) => {
    const quickActionMessage: Message = {
      id: Date.now().toString(),
      content: action,
      sender: 'user',
      timestamp: new Date(),
      type: 'action'
    };
    
    addMessage(quickActionMessage);
    setIsTyping(true);

    // Handle quick action responses
    setTimeout(() => {
      let response = '';
      switch (action) {
        case 'Find trails near me':
          response = "📍 I'll help you find trails nearby! To give you the best recommendations, could you share your current location or a city you'd like to explore? Also, what difficulty level are you comfortable with?";
          break;
        case 'Plan a weekend trip':
          response = "🏕️ A weekend trip sounds perfect! Are you thinking of a 2-day adventure? Would you prefer car camping with day hikes, or a backpacking trip? And what's your target distance from home?";
          break;
        case 'Check my saved trips':
          response = isAuthenticated 
            ? "📋 Here are your saved trips:\n\n🏔️ Mt. Whitney Day Hike - Planned for next month\n🌲 Olympic Peninsula 3-Day - Draft\n🏜️ Joshua Tree Weekend - Completed\n\nWhich one would you like to review or modify?"
            : "🔐 To access your saved trips, please sign in to your account first. Would you like me to help you with that?";
          break;
        case 'Get weather updates':
          response = "🌤️ I can provide weather forecasts for your planned hikes! Which trail or location would you like weather information for? I can give you current conditions, forecasts, and safety recommendations.";
          break;
        default:
          response = "I'm here to help with your hiking adventures! What would you like to explore?";
      }
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        sender: 'ai',
        timestamp: new Date(),
        type: 'text'
      };
      addMessage(aiResponse);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen mountain-background flex flex-col">
      {/* Header */}
      <ChatHeader />
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full p-4">
        {/* Messages Container */}
        <div className="flex-1 glass rounded-2xl p-6 mb-4 flex flex-col">
          {/* Welcome Message */}
          {messages.length === 0 && (
            <div className="flex-1 flex items-center justify-center text-center">
              <div className="max-w-4xl w-full space-y-8">
                <div>
                  <div className="w-16 h-16 text-white/80 mx-auto mb-4 text-4xl">🏔️</div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Welcome to Your AI Hiking Companion! 🥾
                  </h2>
                  <p className="text-white/80 mb-6">
                    I'm here to help you discover amazing trails, plan epic adventures, 
                    and make your hiking dreams come true. What adventure shall we plan today?
                  </p>
                </div>
                
                <QuickActions onActionClick={handleQuickAction} />
                
                <ConversationStarters onStarterClick={handleSendConversationStarter} />
              </div>
            </div>
          )}
          
          {/* Messages */}
          {messages.length > 0 && (
            <div className="flex-1 overflow-y-auto chat-scroll space-y-4 mb-4">
              {messages.map((message: Message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {isTyping && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          )}
          
          {/* Quick Actions (when messages exist) */}
          {messages.length > 0 && (
            <div className="border-t border-white/20 pt-4">
              <QuickActions onActionClick={handleQuickAction} compact />
            </div>
          )}
        </div>
        
        {/* Input Area */}
        <div className="glass rounded-2xl p-4">
          <div className="flex items-center space-x-3">
            <div className="flex-1">
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me about trails, plan a trip, or get hiking advice..."
                className="w-full bg-white/90 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-500 border-0 resize-none focus:ring-2 focus:ring-blue-400 focus:outline-none"
                rows={1}
                style={{
                  minHeight: '48px',
                  maxHeight: '120px',
                  resize: 'none'
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = Math.min(target.scrollHeight, 120) + 'px';
                }}
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isTyping}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white p-3 rounded-xl transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 flex-shrink-0 self-stretch flex items-center justify-center"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
