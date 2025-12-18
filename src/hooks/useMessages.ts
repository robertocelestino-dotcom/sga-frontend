// src/hooks/useMessages.ts
import { useState } from 'react';

interface MessageState {
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  showConfirm: (options: ConfirmOptions) => Promise<boolean>;
  toastMessages: Array<{ id: number; message: string; type: string }>;
  confirmModal: ConfirmOptions | null;
}

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

const useMessages = (): MessageState => {
  const [toastMessages, setToastMessages] = useState<Array<{ id: number; message: string; type: string }>>([]);
  const [confirmModal, setConfirmModal] = useState<ConfirmOptions | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    const id = Date.now();
    setToastMessages(prev => [...prev, { id, message, type }]);
    
    setTimeout(() => {
      setToastMessages(prev => prev.filter(msg => msg.id !== id));
    }, 5000);
  };

  const showConfirm = (options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmModal({
        ...options,
        onConfirm: () => {
          setConfirmModal(null);
          resolve(true);
        },
        onCancel: () => {
          setConfirmModal(null);
          resolve(false);
        },
      } as any);
    });
  };

  return {
    showToast,
    showConfirm,
    toastMessages,
    confirmModal,
  };
};

export default useMessages;