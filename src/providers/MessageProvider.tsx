// src/providers/MessageProvider.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';
import Toast from '../components/ui/Toast';
import ConfirmModal from '../components/ui/ConfirmModal';

interface MessageContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  showConfirm: (options: ConfirmOptions) => Promise<boolean>;
}

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

const MessageContext = createContext<MessageContextType | undefined>(undefined);

export const useMessage = () => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error('useMessage must be used within MessageProvider');
  }
  return context;
};

interface MessageProviderProps {
  children: ReactNode;
}

export const MessageProvider: React.FC<MessageProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<Array<{ id: number; message: string; type: string }>>([]);
  const [confirmModal, setConfirmModal] = useState<(ConfirmOptions & { resolve: (value: boolean) => void }) | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 5000);
  };

  const showConfirm = (options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmModal({
        ...options,
        resolve,
      });
    });
  };

  const handleConfirm = () => {
    if (confirmModal) {
      confirmModal.resolve(true);
      setConfirmModal(null);
    }
  };

  const handleCancel = () => {
    if (confirmModal) {
      confirmModal.resolve(false);
      setConfirmModal(null);
    }
  };

  return (
    <MessageContext.Provider value={{ showToast, showConfirm }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type as any}
            onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
          />
        ))}
      </div>

      {/* Confirm Modal */}
      {confirmModal && (
        <ConfirmModal
          isOpen={true}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmText={confirmModal.confirmText}
          cancelText={confirmModal.cancelText}
          type={confirmModal.type}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </MessageContext.Provider>
  );
};