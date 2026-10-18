import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface ModalBaseProps {
  isOpen: boolean;
  onClose: () => void;
  titulo: string;
  subtitulo?: string;
  icone?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidthClass?: string;
  isLoading?: boolean;
}

export const ModalBase: React.FC<ModalBaseProps> = ({
  isOpen,
  onClose,
  titulo,
  subtitulo,
  icone,
  children,
  footer,
  maxWidthClass = 'max-w-2xl',
  isLoading = false,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isLoading) {
        onClose();
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="prontuario-modal-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-[1px] transition-opacity"
        onClick={() => {
          if (!isLoading) onClose();
        }}
        aria-hidden="true"
      />

      {/* Container do Modal */}
      <div
        className={`relative bg-white rounded-xl shadow-2xl border border-gray-200 w-full ${maxWidthClass} overflow-hidden flex flex-col max-h-[90vh] z-10`}
      >
        {/* Cabeçalho do Modal */}
        <div className="bg-gradient-to-r from-ifpb-teal to-[#164e4b] px-6 py-4 text-white flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3 min-w-0">
            {icone && (
              <div className="p-2 rounded-lg bg-white/15 text-white shrink-0">
                {icone}
              </div>
            )}
            <div className="min-w-0">
              <h2
                id="prontuario-modal-title"
                className="text-base sm:text-lg font-bold tracking-tight truncate"
              >
                {titulo}
              </h2>
              {subtitulo && (
                <p className="text-xs text-green-100 truncate mt-0.5">
                  {subtitulo}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            aria-label="Fechar modal"
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/40 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo com rolagem interna */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">{children}</div>

        {/* Rodapé de Ações */}
        {footer && (
          <div className="px-6 py-4 bg-ifpb-breadcrumb/60 border-t border-gray-200 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
