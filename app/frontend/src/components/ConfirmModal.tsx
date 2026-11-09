import React, { useEffect } from 'react';
import { AlertTriangle, CheckCircle2, RotateCw } from 'lucide-react';

export interface ConfirmModalProps {
  titulo: string;
  mensagem: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  onConfirmar: () => void | Promise<void>;
  onCancelar: () => void;
  isLoading?: boolean;
  variante?: 'perigo' | 'primario';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  titulo,
  mensagem,
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
  onConfirmar,
  onCancelar,
  isLoading = false,
  variante = 'perigo',
}) => {
  const isPerigo = variante === 'perigo';

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isLoading) {
        onCancelar();
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isLoading, onCancelar]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-[1px] transition-opacity"
        onClick={() => {
          if (!isLoading) onCancelar();
        }}
        aria-hidden="true"
      />

      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden z-10">
        <div className="px-6 pt-6 pb-4 flex items-start space-x-3">
          <div
            className={`p-2.5 rounded-full shrink-0 ${
              isPerigo ? 'bg-red-50 text-ifpb-red' : 'bg-ifpb-tealLight text-ifpb-teal'
            }`}
          >
            {isPerigo ? (
              <AlertTriangle className="w-6 h-6" />
            ) : (
              <CheckCircle2 className="w-6 h-6" />
            )}
          </div>
          <div className="flex-1">
            <h2 id="confirm-modal-title" className="text-base font-bold text-ifpb-dark">
              {titulo}
            </h2>
            <p className="text-sm text-gray-600 mt-1">{mensagem}</p>
          </div>
        </div>

        <div className="px-6 py-4 bg-ifpb-breadcrumb/60 border-t border-gray-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <button
            type="button"
            onClick={onCancelar}
            disabled={isLoading}
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-xs font-bold border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 shadow-xs transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {textoCancelar}
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            disabled={isLoading}
            className={`inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-lg text-xs font-bold text-white shadow-sm focus:outline-none focus:ring-2 transition-all duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
              isPerigo
                ? 'bg-ifpb-red hover:brightness-110 focus:ring-red-300'
                : 'bg-ifpb-teal hover:bg-ifpb-tealHover focus:ring-ifpb-teal/40'
            }`}
          >
            {isLoading && <RotateCw className="w-3.5 h-3.5 animate-spin" />}
            {isLoading ? 'Processando...' : textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
};
