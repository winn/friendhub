import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, ArrowLeft, Star, Loader } from 'lucide-react';
import { api } from '../lib/api';
import { RatingModal } from './RatingModal';
import { useLanguage } from '../contexts/LanguageContext';
import type { Message } from '../types';

interface ChatWindowProps {
  userId: string;
  onPointsUpdate: () => void;
  onBack: () => void;
}

export function ChatWindow({ userId, onPointsUpdate, onBack }: ChatWindowProps) {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get agent details from localStorage
  const storedAgent = localStorage.getItem('selectedAgent');
  const agent = storedAgent ? JSON.parse(storedAgent) : null;
  
  // Use consistent field names from the database schema
  const storedAgentId = agent?.agent_id || localStorage.getItem('selectedAgentId');
  const agentOwnerId = agent?.user_id || localStorage.getItem('selectedAgentOwnerId');
  const agentName = agent?.name || localStorage.getItem('selectedAgentName');
  const agentImage = agent?.agent_profile_image || localStorage.getItem('selectedAgentImage');
  const agentRating = agent?.average_rating || localStorage.getItem('selectedAgentRating');

  useEffect(() => {
    if (!storedAgentId) {
      console.error('No agent ID found in localStorage');
      onBack();
    }
  }, [storedAgentId, onBack]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !storedAgentId || isLoading) {
      return;
    }

    const messageText = newMessage.trim();
    setNewMessage('');
    setIsLoading(true);
    setError(null);

    // Add user message immediately
    const userMessage: Message = {
      id: crypto.randomUUID(),
      conversation_id: conversationId || '',
      user_id: userId,
      content: messageText,
      role: 'user',
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);

    // Add typing indicator
    const typingIndicatorId = crypto.randomUUID();
    setMessages(prev => [...prev, {
      id: typingIndicatorId,
      conversation_id: conversationId || '',
      user_id: userId,
      content: '...',
      role: 'assistant',
      created_at: new Date().toISOString(),
      isTyping: true
    }]);

    try {
      // First deduct points from user
      const deductResult = await api.points.update({
        userId: userId,
        points: -10,
        reason: `Message sent to agent ${storedAgentId}`
      });

      if (deductResult.error) {
        throw new Error(deductResult.error);
      }

      // Send message to message-bedrock
      const messageResponse = await api.message.send({
        userId,
        agentId: storedAgentId,
        message: messageText,
        conversationId: conversationId || undefined
      });
      
      if (messageResponse.error) {
        // Refund points if message fails
        await api.points.update({
          userId: userId,
          points: 10,
          reason: `Refund for failed message to agent ${storedAgentId}`
        });
        throw new Error(messageResponse.error);
      }

      // Credit points to agent owner
      if (agentOwnerId) {
        try {
          await api.agent.creditPoints(storedAgentId, agentOwnerId, 5, userId);
          onPointsUpdate();
        } catch (creditError) {
          console.warn('Failed to credit points to agent owner:', creditError);
          // Don't fail the whole operation if crediting fails
        }
      }

      // Set conversation ID if this is a new conversation
      if (!conversationId && messageResponse.conversationId) {
        setConversationId(messageResponse.conversationId);
      }

      // Remove typing indicator and add assistant's response
      setMessages(prev => {
        const filtered = prev.filter(msg => msg.id !== typingIndicatorId);
        if (messageResponse.message) {
          return [...filtered, {
            id: crypto.randomUUID(),
            conversation_id: conversationId || messageResponse.conversationId || '',
            user_id: userId,
            content: messageResponse.message,
            role: 'assistant',
            created_at: new Date().toISOString(),
          }];
        }
        return filtered;
      });
    } catch (error) {
      console.error('Error in message flow:', error);
      setError(error instanceof Error ? error.message : t('error_message'));
      
      // Remove typing indicator and add error message
      setMessages(prev => {
        const filtered = prev.filter(msg => msg.id !== typingIndicatorId);
        return [...filtered, {
          id: crypto.randomUUID(),
          conversation_id: conversationId || '',
          user_id: userId,
          content: t('error_message'),
          role: 'assistant',
          created_at: new Date().toISOString(),
          isError: true
        }];
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] sm:h-[600px] gradient-card rounded-2xl shadow-fun">
      <div className="p-3 sm:p-4 border-b border-primary-100 backdrop-blur-sm rounded-t-2xl flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="p-2 hover:bg-primary-100 rounded-full transition-all duration-300"
            aria-label={t('back')}
          >
            <ArrowLeft className="h-5 w-5 text-primary-600" />
          </button>
          <div className="ml-2 sm:ml-4 flex items-center">
            {agentImage ? (
              <img
                src={agentImage}
                alt={agentName || t('agent')}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover ring-2 ring-primary-300 ring-offset-2"
              />
            ) : (
              <Bot className="h-8 w-8 sm:h-10 sm:w-10 text-primary-600 float-animation" />
            )}
            <div className="ml-2 sm:ml-3">
              <span className="font-bold text-base sm:text-lg bg-gradient-to-r from-primary-600 to-fun-purple bg-clip-text text-transparent truncate">
                {agentName || t('agent')}
              </span>
              {agentRating && (
                <div className="flex items-center text-sm text-gray-600">
                  <Star className="h-4 w-4 text-fun-yellow fill-fun-yellow mr-1" />
                  <span>{agentRating}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowRatingModal(true)}
          className="p-2 hover:bg-primary-100 rounded-full transition-all duration-300 flex items-center space-x-2"
        >
          <Star className="h-5 w-5 text-fun-yellow" />
          <span className="hidden sm:inline text-sm text-gray-600">{t('rate_friend')}</span>
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`message-bubble max-w-[85%] sm:max-w-[80%] p-3 sm:p-4 rounded-2xl shadow-md ${
                message.role === 'user'
                  ? 'bg-gradient-to-r from-primary-500 to-fun-purple text-white'
                  : message.isError
                  ? 'bg-red-50 text-red-600'
                  : 'bg-white text-gray-900'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="flex items-center mb-2">
                  {agentImage ? (
                    <img
                      src={agentImage}
                      alt={agentName || t('agent')}
                      className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover ring-2 ring-primary-300"
                    />
                  ) : (
                    <Bot className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600" />
                  )}
                  <span className="ml-2 font-bold text-primary-600 text-sm sm:text-base">
                    {agentName || t('agent')}
                  </span>
                </div>
              )}
              {message.isTyping ? (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
                </div>
              ) : (
                <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap">{message.content}</p>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-4 mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="p-3 sm:p-4 border-t border-primary-100">
        <div className="flex space-x-2 sm:space-x-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={t('type_message')}
            className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-white rounded-full border-2 border-primary-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all duration-300 text-sm sm:text-base"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || isLoading}
            className="btn-fun inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 rounded-full text-white font-medium disabled:opacity-50"
          >
            {isLoading ? (
              <Loader className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
            ) : (
              <Send className="h-4 w-4 sm:h-5 sm:w-5" />
            )}
          </button>
        </div>
      </form>

      {showRatingModal && (
        <RatingModal
          agentId={storedAgentId}
          agentName={agentName || t('agent')}
          userId={userId}
          onClose={() => setShowRatingModal(false)}
          onSuccess={() => {
            setShowRatingModal(false);
          }}
        />
      )}
    </div>
  );
}