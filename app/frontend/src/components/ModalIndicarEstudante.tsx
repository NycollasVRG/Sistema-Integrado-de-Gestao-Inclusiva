import React, { useState } from 'react';
import { ClipboardPlus } from 'lucide-react';
import { ModalBase } from './ModalBase';
import { FormularioIndicacao } from './FormularioIndicacao';
import type { EstudanteIndicavel, IndicacaoResponseDTO } from '../types/indicacao';

interface ModalIndicarEstudanteProps {
  /** Estudante pré-selecionado (ex.: linha da listagem). O modal fica fechado quando nulo. */
  estudante: EstudanteIndicavel | null;
  onClose: () => void;
  onSucesso: (indicacao: IndicacaoResponseDTO) => void;
}

export const ModalIndicarEstudante: React.FC<ModalIndicarEstudanteProps> = ({
  estudante,
  onClose,
  onSucesso,
}) => {
  const [enviando, setEnviando] = useState(false);

  return (
    <ModalBase
      isOpen={estudante !== null}
      onClose={onClose}
      isLoading={enviando}
      titulo="Indicar estudante para triagem"
      subtitulo="A equipe CLAI será notificada para analisar a demanda"
      icone={<ClipboardPlus className="w-5 h-5" />}
      maxWidthClass="max-w-xl"
    >
      {estudante && (
        <FormularioIndicacao
          // Reinicia o formulário ao trocar de estudante.
          key={estudante.id}
          estudante={estudante}
          onSucesso={onSucesso}
          onCancelar={onClose}
          onEnviandoChange={setEnviando}
        />
      )}
    </ModalBase>
  );
};
