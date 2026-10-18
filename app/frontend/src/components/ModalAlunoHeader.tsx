import React from 'react';
import { Lock, UserCheck } from 'lucide-react';
import type { AlunoModalData } from '../types/prontuarioAcoes';

export interface ModalAlunoHeaderProps {
  aluno: AlunoModalData;
}

/**
 * Ref. TA9.3: Bloco reutilizável de identificação do aluno pré-carregado no modal.
 * Exibe Nome, Matrícula e Curso em modo readOnly / resumo visual, dispensando
 * que o usuário redigite a matrícula ou selecione o aluno novamente.
 */
export const ModalAlunoHeader: React.FC<ModalAlunoHeaderProps> = ({ aluno }) => {
  return (
    <div
      className="bg-ifpb-tealLight/70 border border-ifpb-teal/25 rounded-lg p-4 space-y-3"
      aria-label="Dados do estudante pré-carregados"
    >
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center space-x-2 text-ifpb-teal">
          <UserCheck className="w-4 h-4 shrink-0" />
          <span className="text-xs font-bold uppercase tracking-wider">
            Estudante em Foco (Pré-carregado)
          </span>
        </div>

        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-white text-gray-600 border border-gray-200">
          <Lock className="w-3 h-3 mr-1 text-ifpb-teal" />
          Somente Leitura &bull; TA9.3
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Nome do Aluno */}
        <div className="sm:col-span-1">
          <label
            htmlFor="modal-readonly-nome"
            className="block text-[11px] font-semibold text-gray-600 uppercase"
          >
            Nome do Aluno
          </label>
          <input
            id="modal-readonly-nome"
            type="text"
            readOnly
            value={aluno.nome}
            className="mt-1 w-full px-3 py-1.5 rounded-md text-xs font-semibold text-ifpb-dark bg-white/90 border border-gray-300 cursor-default focus:outline-none"
          />
        </div>

        {/* Matrícula (Pré-carregada sem redigitação - TA9.3) */}
        <div>
          <label
            htmlFor="modal-readonly-matricula"
            className="block text-[11px] font-semibold text-gray-600 uppercase"
          >
            Matrícula
          </label>
          <input
            id="modal-readonly-matricula"
            type="text"
            readOnly
            value={aluno.matricula}
            className="mt-1 w-full px-3 py-1.5 rounded-md text-xs font-mono font-bold text-ifpb-teal bg-white/90 border border-gray-300 cursor-default focus:outline-none"
          />
        </div>

        {/* Curso */}
        <div>
          <label
            htmlFor="modal-readonly-curso"
            className="block text-[11px] font-semibold text-gray-600 uppercase"
          >
            Curso
          </label>
          <input
            id="modal-readonly-curso"
            type="text"
            readOnly
            value={aluno.curso || 'Não informado'}
            className="mt-1 w-full px-3 py-1.5 rounded-md text-xs font-medium text-gray-700 bg-white/90 border border-gray-300 cursor-default focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
};
