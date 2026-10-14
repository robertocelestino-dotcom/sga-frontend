// src/providers/MessageProvider.tsx
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

// ============================================================
// TIPOS
// ============================================================
interface Message {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  text: string;
  duration?: number;
}

export type ConfirmType = 'danger' | 'warning' | 'success' | 'info';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: ConfirmType;
}

interface ConfirmState extends ConfirmOptions {
  isOpen: boolean;
  resolve: ((value: boolean) => void) | null;
}

interface MessageContextData {
  // Toasts (mantidos)
  messages: Message[];
  showToast: (text: string, type: 'success' | 'error' | 'warning' | 'info', duration?: number) => void;
  showSuccess: (text: string, duration?: number) => void;
  showError: (text: string, duration?: number) => void;
  showWarning: (text: string, duration?: number) => void;
  showInfo: (text: string, duration?: number) => void;
  removeMessage: (id: string) => void;
  // 🆕 Confirm (adicionado)
  showConfirm: (options: ConfirmOptions) => Promise<boolean>;
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

// ============================================================
// ESTILOS DO CONFIRM (CDL)
// ============================================================
const CONFIRM_STYLES: Record<ConfirmType, {
  borderTop: string;
  icon: string;
  bg: string;
  btnBg: string;
  btnText: string;
}> = {
  danger: {
    borderTop: 'border-cdl-danger-500',
    icon: 'text-cdl-danger-500',
    bg: 'bg-cdl-danger-50',
    btnBg: 'bg-cdl-danger-500 hover:bg-cdl-danger-600',
    btnText: 'text-white',
  },
  warning: {
    borderTop: 'border-cdl-yellow-500',
    icon: 'text-cdl-yellow-600',
    bg: 'bg-cdl-yellow-50',
    btnBg: 'bg-cdl-yellow-gradient hover:brightness-105',
    btnText: 'text-cdl-navy-700',
  },
  success: {
    borderTop: 'border-cdl-green-500',
    icon: 'text-cdl-green-700',
    bg: 'bg-cdl-green-50',
    btnBg: 'bg-cdl-green-500 hover:bg-cdl-green-600',
    btnText: 'text-white',
  },
  info: {
    borderTop: 'border-cdl-navy-700',
    icon: 'text-cdl-navy-700',
    bg: 'bg-cdl-navy-50',
    btnBg: 'bg-cdl-navy-700 hover:bg-cdl-navy-800',
    btnText: 'text-white',
  },
};

// ============================================================
// PROVIDER
// ============================================================
export const MessageProvider: React.FC<MessageProviderProps> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [confirm, setConfirm] = useState<ConfirmState>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
    type: 'warning',
    resolve: null,
  });

  const generateUniqueId = useCallback(() => {
    return `${Date.now()}-${++messageCounter}-${Math.random().toString(36).substr(2, 6)}`;
  }, []);

  /* ============ TOASTS ============ */
  const addMessage = useCallback((message: Omit<Message, 'id'>) => {
    const id = generateUniqueId();

    console.log('📢 Adicionando mensagem:', message.text, message.type);

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
    console.log('🔔 showToast chamado:', { text, type });
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

  /* ============ 🆕 CONFIRM ============ */
  const showConfirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      setConfirm({
        isOpen: true,
        title: options.title,
        message: options.message,
        confirmText: options.confirmText || 'Confirmar',
        cancelText: options.cancelText || 'Cancelar',
        type: options.type || 'warning',
        resolve,
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    confirm.resolve?.(true);
    setConfirm((prev) => ({ ...prev, isOpen: false, resolve: null }));
  }, [confirm]);

  const handleCancelConfirm = useCallback(() => {
    confirm.resolve?.(false);
    setConfirm((prev) => ({ ...prev, isOpen: false, resolve: null }));
  }, [confirm]);

  /* ============ ESTILOS DE TOAST (mantidos) ============ */
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
      removeMessage,
      showConfirm, // 🆕
    }}>
      {children}

      {/* ============ TOAST CONTAINER (mantido) ============ */}
      <div className="fixed bottom-4 right-4 z-[9999] space-y-2">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`p-4 rounded-lg shadow-lg border min-w-[300px] max-w-md ${getMessageStyles(message.type)}`}
            style={{
              animation: 'slideInRight 0.3s ease-out',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
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

      {/* ============ 🆕 CONFIRM MODAL ============ */}
      {confirm.isOpen && (() => {
        const cfg = CONFIRM_STYLES[confirm.type || 'warning'];
        const Icon = confirm.type === 'danger'  ? XCircle
                   : confirm.type === 'success' ? CheckCircle
                   : confirm.type === 'info'    ? Info
                   : AlertTriangle;

        return (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center
                       p-0 sm:p-4 bg-black/50 backdrop-blur-[2px]"
            style={{ animation: 'fadeIn 0.15s ease-out' }}
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0"
              onClick={handleCancelConfirm}
              aria-hidden="true"
            />

            {/* Card */}
            <div
              className={`relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl
                          shadow-[0_20px_60px_-15px_rgba(0,0,0,.35)] overflow-hidden
                          max-h-[92vh] flex flex-col border-t-4 ${cfg.borderTop}`}
              style={{ animation: 'slideUp 0.2s ease-out' }}
            >
              {/* Botão fechar */}
              <button
                type="button"
                onClick={handleCancelConfirm}
                aria-label="Fechar"
                className="absolute top-3 right-3 z-10 p-1.5 rounded-full
                           text-gray-400 hover:text-cdl-navy-700 hover:bg-cdl-neutral-50
                           transition-colors"
              >
                <X size={18} />
              </button>

              {/* Ícone + Título */}
              <div className="flex flex-col items-center pt-7 px-6">
                <div className={`flex items-center justify-center w-14 h-14 rounded-full mb-4 ${cfg.bg}`}>
                  <Icon size={28} className={cfg.icon} strokeWidth={2.2} />
                </div>
                <h2
                  id="confirm-title"
                  className="text-lg sm:text-xl font-semibold text-center
                             text-cdl-navy-700 whitespace-pre-line"
                >
                  {confirm.title}
                </h2>
              </div>

              {/* Mensagem */}
              <div className="px-6 py-4 overflow-y-auto">
                <div className="text-sm sm:text-[15px] text-center leading-relaxed
                                text-cdl-neutral-500 whitespace-pre-line">
                  {confirm.message}
                </div>
              </div>

              {/* Ações */}
              <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 px-6 pb-6 pt-2">
                <button
                  type="button"
                  onClick={handleCancelConfirm}
                  className="flex-1 px-4 py-2.5 rounded-lg font-medium text-sm
                             border border-[#D6DCE5] text-cdl-navy-700 bg-white
                             hover:bg-cdl-neutral-50 transition-all active:scale-[.98]"
                >
                  {confirm.cancelText}
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className={`flex-1 px-4 py-2.5 rounded-lg font-semibold text-sm
                              transition-all active:scale-[.98] flex items-center
                              justify-center gap-2 ${cfg.btnBg} ${cfg.btnText}`}
                >
                  {confirm.confirmText}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ============ ANIMAÇÕES (mantidas + adicionadas) ============ */}
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
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px) scale(.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </MessageContext.Provider>
  );
};

export default MessageProvider;