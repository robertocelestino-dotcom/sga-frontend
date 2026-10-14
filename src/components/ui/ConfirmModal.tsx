import { useEffect, useRef, ReactNode } from 'react';
import { AlertTriangle, CheckCircle, Info, XCircle, X } from 'lucide-react';

type Variant = 'danger' | 'warning' | 'success' | 'info';

interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message: ReactNode;
  confirmText?: string;
  cancelText?: string;
  type?: Variant;              // usado no Usuarios.tsx
  variant?: Variant;           // alias
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  onClose?: () => void;        // alias (compatível com Usuarios.tsx)
}

/* ============================================================
   MAPA DE VARIANTES → classes Tailwind CDL
   Todas listadas no `safelist` do tailwind.config.js
   ============================================================ */
const CFG: Record<Variant, {
  Icon: any;
  iconCls: string;     // cor do ícone
  iconBgCls: string;   // fundo do círculo do ícone
  ringCls: string;     // "anel" externo (usando shadow-[...] com hex)
  borderCls: string;   // borda superior
  btnCls: string;      // botão confirmar
}> = {
  danger: {
    Icon: XCircle,
    iconCls:     'text-cdl-danger-500',
    iconBgCls:   'bg-cdl-danger-50',
    ringCls:     'shadow-[0_0_0_6px_rgba(192,57,43,.18)]',
    borderCls:   'border-t-4 border-cdl-danger-500',
    btnCls:      'bg-cdl-danger-500 hover:bg-cdl-danger-600 text-white',
  },
  warning: {
    Icon: AlertTriangle,
    iconCls:     'text-cdl-yellow-600',
    iconBgCls:   'bg-cdl-yellow-50',
    ringCls:     'shadow-[0_0_0_6px_rgba(245,197,24,.28)]',
    borderCls:   'border-t-4 border-cdl-yellow-500',
    // Amarelo CDL é claro → texto navy garante contraste WCAG AA
    btnCls:      'bg-cdl-yellow-gradient text-cdl-navy-700 hover:brightness-105',
  },
  success: {
    Icon: CheckCircle,
    iconCls:     'text-cdl-green-500',
    iconBgCls:   'bg-cdl-green-50',
    ringCls:     'shadow-[0_0_0_6px_rgba(45,139,78,.18)]',
    borderCls:   'border-t-4 border-cdl-green-500',
    btnCls:      'bg-cdl-green-500 hover:bg-cdl-green-600 text-white',
  },
  info: {
    Icon: Info,
    iconCls:     'text-cdl-navy-700',
    iconBgCls:   'bg-cdl-navy-50',
    ringCls:     'shadow-[0_0_0_6px_rgba(31,58,138,.18)]',
    borderCls:   'border-t-4 border-cdl-navy-700',
    btnCls:      'bg-cdl-navy-700 hover:bg-cdl-navy-800 text-white',
  },
};

export default function ConfirmModal({
  isOpen,
  title = 'Confirmar ação',
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type,
  variant,
  loading = false,
  onConfirm,
  onCancel,
  onClose,
}: ConfirmModalProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);
  const v = variant ?? type ?? 'warning';
  const cfg = CFG[v];
  const { Icon } = cfg;
  const handleClose = onCancel ?? onClose ?? (() => {});

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) handleClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const t = setTimeout(() => confirmRef.current?.focus(), 80);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
      clearTimeout(t);
    };
  }, [isOpen, loading, handleClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cm-title"
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center
                 p-0 sm:p-4 animate-fade-in"
    >
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={() => !loading && handleClose()}
        aria-hidden="true"
      />

      {/* card */}
      <div
        className={`relative w-full sm:max-w-md bg-white
                    rounded-t-2xl sm:rounded-2xl
                    shadow-[0_20px_60px_-15px_rgba(0,0,0,.35)]
                    overflow-hidden max-h-[92vh] flex flex-col
                    animate-slide-up ${cfg.borderCls}`}
      >
        {/* botão fechar */}
        <button
          type="button"
          onClick={handleClose}
          disabled={loading}
          aria-label="Fechar"
          className="absolute top-3 right-3 z-10 p-1.5 rounded-full
                     text-gray-400 hover:text-cdl-navy-700 hover:bg-cdl-neutral-50
                     disabled:opacity-40 transition-colors"
        >
          <X size={18} />
        </button>

        {/* cabeçalho */}
        <div className="flex flex-col items-center pt-7 px-6">
          <div
            className={`flex items-center justify-center w-14 h-14 rounded-full mb-4
                        ${cfg.iconBgCls} ${cfg.ringCls}`}
          >
            <Icon size={28} className={cfg.iconCls} strokeWidth={2.2} />
          </div>
          <h2
            id="cm-title"
            className="text-lg sm:text-xl font-semibold text-center
                       text-cdl-navy-700 whitespace-pre-line"
          >
            {title}
          </h2>
        </div>

        {/* corpo */}
        <div className="px-6 py-4 overflow-y-auto">
          <div className="text-sm sm:text-[15px] text-center leading-relaxed
                          text-cdl-neutral-500 whitespace-pre-line">
            {message}
          </div>
        </div>

        {/* ações */}
        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 px-6 pb-6 pt-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-lg font-medium text-sm
                       border border-[#D6DCE5] text-cdl-navy-700 bg-white
                       hover:bg-cdl-neutral-50 transition-all
                       disabled:opacity-50 active:scale-[.98]"
          >
            {cancelText}
          </button>

          <button
            ref={confirmRef}
            type="button"
            onClick={() => !loading && onConfirm()}
            disabled={loading}
            className={`flex-1 px-4 py-2.5 rounded-lg font-semibold text-sm
                        transition-all disabled:opacity-60 active:scale-[.98]
                        flex items-center justify-center gap-2
                        ${cfg.btnCls}`}
          >
            {loading && (
              <span
                className="inline-block w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: 'currentColor transparent currentColor currentColor' }}
                aria-hidden="true"
              />
            )}
            {loading ? 'Processando…' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}