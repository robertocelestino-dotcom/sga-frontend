// src/providers/MessageProvider.tsx

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface Message {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  text: string;
  duration?: number;
}

interface MessageContextData {
  messages: Message[];
  showToast: (text: string, type: 'success' | 'error' | 'warning' | 'info', duration?: number) => void;
  showSuccess: (text: string, duration?: number) => void;
  showError: (text: string, duration?: number) => void;
  showWarning: (text: string, duration?: number) => void;
  showInfo: (text: string, duration?: number) => void;
  removeMessage: (id: string) => void;
}

const MessageContext = createContext<MessageContextData | undefined>(undefined);

export const useMessage = () => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error('useMessage must be used within a MessageProvider');
  }
  return context;
};

interface MessageProviderProps {
  children: ReactNode;
}

let messageCounter = 0;

export const MessageProvider: React.FC<MessageProviderProps> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([]);

  const generateUniqueId = useCallback(() => {
    return `${Date.now()}-${++messageCounter}-${Math.random().toString(36).substr(2, 6)}`;
  }, []);

  const addMessage = useCallback((message: Omit<Message, 'id'>) => {
    const id = generateUniqueId();
    
    console.log('📢 Adicionando mensagem:', message.text, message.type); // 🔥 LOG
    
    setMessages(prev => [...prev, { ...message, id }]);

    if (message.duration !== 0) {
      setTimeout(() => {
        setMessages(prev => prev.filter(msg => msg.id !== id));
      }, message.duration || 5000);
    }
  }, [generateUniqueId]);

  const showToast = useCallback((
    text: string, 
    type: 'success' | 'error' | 'warning' | 'info', 
    duration: number = 5000
  ) => {
    console.log('🔔 showToast chamado:', { text, type }); // 🔥 LOG
    addMessage({ type, text, duration });
  }, [addMessage]);

  const showSuccess = useCallback((text: string, duration?: number) => {
    showToast(text, 'success', duration);
  }, [showToast]);

  const showError = useCallback((text: string, duration?: number) => {
    showToast(text, 'error', duration);
  }, [showToast]);

  const showWarning = useCallback((text: string, duration?: number) => {
    showToast(text, 'warning', duration);
  }, [showToast]);

  const showInfo = useCallback((text: string, duration?: number) => {
    showToast(text, 'info', duration);
  }, [showToast]);

  const removeMessage = useCallback((id: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
  }, []);

  const getMessageStyles = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-300 text-green-800';
      case 'error': return 'bg-red-50 border-red-300 text-red-800';
      case 'warning': return 'bg-yellow-50 border-yellow-300 text-yellow-800';
      default: return 'bg-blue-50 border-blue-300 text-blue-800';
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      default: return 'ℹ️';
    }
  };

  return (
    <MessageContext.Provider value={{
      messages,
      showToast,
      showSuccess,
      showError,
      showWarning,
      showInfo,
      removeMessage
    }}>
      {children}
      
      {/* Toast Container - COM Z-INDEX ALTO */}
      <div className="fixed bottom-4 right-4 z-[9999] space-y-2">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`p-4 rounded-lg shadow-lg border min-w-[300px] max-w-md ${getMessageStyles(message.type)}`}
            style={{ 
              animation: 'slideInRight 0.3s ease-out',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
            }}
            role="alert"
          >
            <div className="flex items-start gap-3">
              <div className="text-xl">{getIcon(message.type)}</div>
              <div className="flex-1">
                {message.title && (
                  <h4 className="font-semibold text-sm mb-1">{message.title}</h4>
                )}
                <p className="text-sm">{message.text}</p>
              </div>
              <button
                onClick={() => removeMessage(message.id)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {/* Adicionar keyframes globalmente */}
      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </MessageContext.Provider>
  );
};

export default MessageProvider;