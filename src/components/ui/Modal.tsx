import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
}

const SIZES = {
  sm:   'sm:max-w-md',
  md:   'sm:max-w-lg',
  lg:   'sm:max-w-2xl',
  xl:   'sm:max-w-4xl',
  full: 'sm:max-w-6xl',
} as const;

export default function Modal({
  title, onClose, children, size = 'lg', showCloseButton = true,
}: ModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog" aria-modal="true"
        className={`relative w-full ${SIZES[size]} bg-white shadow-cdl-lg
                    rounded-t-2xl sm:rounded-xl overflow-hidden
                    max-h-[95vh] sm:max-h-[90vh] flex flex-col
                    border-t-4 border-cdl-navy-700 animate-slide-up`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 shrink-0">
          <h3 className="text-base sm:text-lg font-semibold text-cdl-navy-700 truncate pr-2">
            {title}
          </h3>
          {showCloseButton && (
            <button
              onClick={onClose}
              aria-label="Fechar"
              className="rounded-lg p-1.5 text-gray-400 hover:bg-cdl-neutral-50
                         hover:text-cdl-navy-700 transition-colors shrink-0"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <div className="px-4 sm:px-6 py-4 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}