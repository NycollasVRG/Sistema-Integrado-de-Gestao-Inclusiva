import React from 'react';
import {
  FileDown,
  FilePlus2,
  FileSpreadsheet,
  Stethoscope,
  Zap,
} from 'lucide-react';

export interface ProntuarioQuickActionsProps {
  alunoNome?: string;
  onNovoAtendimento: () => void;
  onNovoEstudo: () => void;
  onEmitirRae: () => void;
  onGerarDossie: () => void;
  disabled?: boolean;
}

export const ProntuarioQuickActions: React.FC<ProntuarioQuickActionsProps> = ({
  alunoNome,
  onNovoAtendimento,
  onNovoEstudo,
  onEmitirRae,
  onGerarDossie,
  disabled = false,
}) => {
  return (
    <section
      aria-label="Atalhos Rápidos do Prontuário"
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-ifpb-tealLight text-ifpb-teal">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-ifpb-dark">
              Atalhos Rápidos do Prontuário
            </h2>
            <p className="text-xs text-gray-500">
              {alunoNome
                ? `Ações diretas com dados pré-carregados para ${alunoNome}`
                : 'Ações diretas para o estudante em foco sem sair desta tela'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Botão 1: Novo Atendimento (TA9.3) */}
        <button
          type="button"
          onClick={onNovoAtendimento}
          disabled={disabled}
          className="flex items-center justify-center sm:justify-start space-x-3 px-4 py-3 rounded-lg text-xs font-bold bg-ifpb-teal hover:bg-ifpb-tealHover text-white shadow-sm transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Stethoscope className="w-4 h-4 shrink-0" />
          <div className="text-left">
            <span className="block">Novo Atendimento</span>
            <span className="block text-[10px] font-normal text-green-100">
              Registrar intervenção rápida
            </span>
          </div>
        </button>

        {/* Botão 2: Novo Estudo (TA9.3) */}
        <button
          type="button"
          onClick={onNovoEstudo}
          disabled={disabled}
          className="flex items-center justify-center sm:justify-start space-x-3 px-4 py-3 rounded-lg text-xs font-bold bg-ifpb-tealLight hover:bg-ifpb-teal/15 text-ifpb-teal border border-ifpb-teal/30 transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FilePlus2 className="w-4 h-4 shrink-0" />
          <div className="text-left">
            <span className="block">Novo Estudo</span>
            <span className="block text-[10px] font-normal text-ifpb-teal/80">
              Iniciar ou atualizar estudo
            </span>
          </div>
        </button>

        {/* Botão 3: Emitir RAE */}
        <button
          type="button"
          onClick={onEmitirRae}
          disabled={disabled}
          className="flex items-center justify-center sm:justify-start space-x-3 px-4 py-3 rounded-lg text-xs font-bold bg-white hover:bg-emerald-50 text-ifpb-dark border border-gray-200 hover:border-ifpb-green/40 transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FileSpreadsheet className="w-4 h-4 text-ifpb-green shrink-0" />
          <div className="text-left">
            <span className="block">Emitir RAE</span>
            <span className="block text-[10px] font-normal text-gray-500">
              Relatório de Atendimento
            </span>
          </div>
        </button>

        {/* Botão 4: Gerar Dossiê */}
        <button
          type="button"
          onClick={onGerarDossie}
          disabled={disabled}
          className="flex items-center justify-center sm:justify-start space-x-3 px-4 py-3 rounded-lg text-xs font-bold bg-white hover:bg-gray-50 text-ifpb-dark border border-gray-200 hover:border-gray-300 transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FileDown className="w-4 h-4 text-ifpb-teal shrink-0" />
          <div className="text-left">
            <span className="block">Gerar Dossiê</span>
            <span className="block text-[10px] font-normal text-gray-500">
              Consolidado do prontuário
            </span>
          </div>
        </button>
      </div>
    </section>
  );
};
