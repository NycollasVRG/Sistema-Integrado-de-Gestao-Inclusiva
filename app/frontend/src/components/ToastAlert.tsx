import React from 'react';
import { CheckCircle2, AlertCircle, X, AlertTriangle } from 'lucide-react';

export interface ToastMessage {
  id: string;
  tipo: 'sucesso' | 'erro' | 'alerta';
  titulo: string;
  mensagem: string;
}

interface ToastAlertProps {
  toasts: ToastMessage[];
  onFechar: (id: string) => void;
}

export const ToastAlert: React.FC<ToastAlertProps> = ({ toasts, onFechar }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-3 max-w-md w-full px-4 sm:px-0">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`p-4 rounded-xl shadow-lg border flex items-start space-x-3 transition-all duration-300 transform translate-y-0 ${
            toast.tipo === 'sucesso'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : toast.tipo === 'erro'
              ? 'bg-red-50 border-red-200 text-red-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}
        >
          {toast.tipo === 'sucesso' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />}
          {toast.tipo === 'erro' && <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />}
          {toast.tipo === 'alerta' && <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />}

          <div className="flex-1 text-xs">
            <h5 className="font-bold text-sm leading-tight mb-0.5">{toast.titulo}</h5>
            <p className="opacity-90">{toast.mensagem}</p>
          </div>

          <button
            type="button"
            onClick={() => onFechar(toast.id)}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
