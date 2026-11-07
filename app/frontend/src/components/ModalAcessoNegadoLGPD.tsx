import React, { useCallback, useEffect, useState } from 'react';
import { Lock } from 'lucide-react';
import { ModalBase } from './ModalBase';
import { aoAcessoNegado } from '../services/authSessao';

export const MENSAGEM_LGPD = 'Acesso Negado: Documento protegido por sigilo clínico/LGPD';

/**
 * Modal global de acesso negado (TA11.2). Escuta o 403 capturado pelo apiClient
 * e bloqueios preventivos disparados via notificarAcessoNegado().
 * Deve ser montado uma única vez (em App.tsx).
 */
export const ModalAcessoNegadoLGPD: React.FC = () => {
  const [aberto, setAberto] = useState(false);
  const [detalhe, setDetalhe] = useState<string | undefined>();

  useEffect(
    () =>
      aoAcessoNegado((d) => {
        setDetalhe(d);
        setAberto(true);
      }),
    [],
  );

  const fechar = useCallback(() => setAberto(false), []);

  return (
    <ModalBase
      isOpen={aberto}
      onClose={fechar}
      titulo="Acesso Negado"
      subtitulo="Restrição de sigilo clínico / LGPD"
      icone={<Lock className="w-5 h-5" />}
      maxWidthClass="max-w-md"
      footer={
        <button
          type="button"
          onClick={fechar}
          className="px-4 py-2 rounded-md text-sm font-semibold bg-ifpb-teal hover:bg-ifpb-tealHover text-white cursor-pointer"
        >
          Entendi
        </button>
      }
    >
      <p className="text-sm font-semibold text-red-800">{MENSAGEM_LGPD}</p>
      {detalhe && <p className="text-xs text-gray-600">{detalhe}</p>}
    </ModalBase>
  );
};
