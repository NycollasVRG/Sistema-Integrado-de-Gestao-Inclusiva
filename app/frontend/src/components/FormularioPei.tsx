import React, { useState, useEffect } from 'react';
import type { Aluno, IndicadorReutilizavel } from '../types/estudoDeCaso';
import type { PeiResponseDTO } from '../types/pei';
import { ArrowLeft, Save, Lock, Info, AlertTriangle, ClipboardList, Tag } from 'lucide-react';

interface FormularioPeiProps {
  aluno: Aluno;
  peiExistente: PeiResponseDTO | null;
  dificuldades: IndicadorReutilizavel[];
  onSalvar: (habilidadesInteresses: string, propostasAdaptacoes: string) => Promise<void>;
  onVoltar: () => void;
  isLoading?: boolean;
}

interface CampoBloqueadoProps {
  id: string;
  rotulo: string;
  valor: string;
  mono?: boolean;
}

// TA3.1: dados institucionais exibidos somente leitura
const CampoBloqueado: React.FC<CampoBloqueadoProps> = ({ id, rotulo, valor, mono }) => (
  <div className="space-y-1">
    <label htmlFor={id} className="text-xs font-bold text-gray-500 uppercase flex items-center">
      <Lock className="w-3 h-3 mr-1 text-gray-400" />
      {rotulo}
    </label>
    <input
      id={id}
      type="text"
      value={valor || 'Não informado'}
      readOnly
      disabled
      aria-readonly="true"
      className={`w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 bg-gray-100 cursor-not-allowed ${
        mono ? 'font-mono' : ''
      }`}
    />
  </div>
);

export const FormularioPei: React.FC<FormularioPeiProps> = ({
  aluno,
  peiExistente,
  dificuldades,
  onSalvar,
  onVoltar,
  isLoading = false,
}) => {
  const [habilidades, setHabilidades] = useState<string>('');
  const [propostas, setPropostas] = useState<string>('');
  const [erroHabilidades, setErroHabilidades] = useState<string | null>(null);
  const [erroPropostas, setErroPropostas] = useState<string | null>(null);
  const [tentouSalvar, setTentouSalvar] = useState<boolean>(false);

  useEffect(() => {
    setHabilidades(peiExistente?.habilidadesInteresses || '');
    setPropostas(peiExistente?.propostasAdaptacoes || '');
    setErroHabilidades(null);
    setErroPropostas(null);
    setTentouSalvar(false);
  }, [peiExistente, aluno]);

  const msgHabilidades = 'Os conhecimentos, habilidades e interesses são obrigatórios.';
  const msgPropostas = 'As propostas de adaptações curriculares são obrigatórias.';

  const handleHabilidades = (valor: string) => {
    setHabilidades(valor);
    if (tentouSalvar) setErroHabilidades(valor.trim() ? null : msgHabilidades);
  };

  const handlePropostas = (valor: string) => {
    setPropostas(valor);
    if (tentouSalvar) setErroPropostas(valor.trim() ? null : msgPropostas);
  };

  const handleSalvar = async () => {
    setTentouSalvar(true);
    const eH = habilidades.trim() ? null : msgHabilidades;
    const eP = propostas.trim() ? null : msgPropostas;
    setErroHabilidades(eH);
    setErroPropostas(eP);
    if (eH || eP) return;
    await onSalvar(habilidades.trim(), propostas.trim());
  };

  const classeTextarea = (erro: string | null) =>
    `w-full p-3.5 border rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
      erro
        ? 'border-ifpb-red focus:ring-red-200 bg-red-50/30'
        : 'border-gray-300 focus:border-ifpb-teal focus:ring-ifpb-tealLight'
    }`;

  const isDirty =
    habilidades !== (peiExistente?.habilidadesInteresses || '') ||
    propostas !== (peiExistente?.propostasAdaptacoes || '');

  const handleVoltar = () => {
    if (isDirty) {
      const confirmar = window.confirm(
        'Existem alterações não salvas no PEI. Deseja realmente sair e descartar as alterações?'
      );
      if (!confirmar) return;
    }
    onVoltar();
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-[#0F6460] to-[#12534f] text-white px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={handleVoltar}
            disabled={isLoading}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            title="Voltar para a ficha do aluno"
            aria-label="Voltar para a ficha do aluno"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <ClipboardList className="w-5 h-5 text-green-300" />
              <h2 className="text-xl font-bold tracking-tight">
                {peiExistente ? 'Edição do PEI' : 'Novo Plano Educacional Individualizado (PEI)'}
              </h2>
            </div>
            <p className="text-xs text-green-100 mt-0.5">
              Aluno: <span className="font-semibold text-white">{aluno.nome}</span>
            </p>
          </div>
        </div>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white self-start sm:self-auto">
          {peiExistente ? 'PEI Registrado' : 'Novo Documento'}
        </span>
      </div>

      <div className="bg-[#EEF1EC] border-b border-[#DDE5DB] px-6 py-3 text-xs text-ifpb-dark flex items-start space-x-2">
        <Info className="w-4 h-4 text-ifpb-teal shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-ifpb-teal">Instruções para a Coordenação:</span>{' '}
          Os dados institucionais do estudante são carregados automaticamente e não podem ser editados.
          Preencha os campos abaixo para estruturar a matriz de suporte com base no Plano de Ação.
        </div>
      </div>

      <form onSubmit={(e) => e.preventDefault()} className="p-6 sm:p-8 space-y-8">
        {tentouSalvar && (erroHabilidades || erroPropostas) && (
          <div className="bg-red-50 border-l-4 border-ifpb-red p-4 rounded-r-lg space-y-1" role="alert">
            <div className="flex items-center text-sm font-bold text-red-800">
              <AlertTriangle className="w-5 h-5 text-ifpb-red mr-2" />
              Campos obrigatórios não preenchidos
            </div>
            <ul className="list-disc list-inside text-xs text-red-700 space-y-0.5 pt-1">
              {erroHabilidades && <li>{erroHabilidades}</li>}
              {erroPropostas && <li>{erroPropostas}</li>}
            </ul>
          </div>
        )}

        {/* Dados institucionais (TA3.1) */}
        <section className="space-y-3" aria-labelledby="pei-dados-institucionais">
          <div className="flex items-center justify-between">
            <h3 id="pei-dados-institucionais" className="text-sm font-bold text-ifpb-dark">
              Dados Institucionais do Estudante
            </h3>
            <span className="inline-flex items-center text-[11px] text-gray-500">
              <Lock className="w-3 h-3 mr-1" />
              Bloqueados para edição
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <CampoBloqueado id="pei-matricula" rotulo="Matrícula" valor={aluno.matricula} mono />
            <CampoBloqueado id="pei-turma" rotulo="Turma" valor={aluno.turma ?? ''} />
            <CampoBloqueado id="pei-curso" rotulo="Curso" valor={aluno.curso ?? ''} />
          </div>
        </section>

        {dificuldades.length > 0 && (
          <section className="space-y-2">
            <h3 className="text-sm font-bold text-ifpb-dark flex items-center">
              <Tag className="w-4 h-4 mr-1.5 text-ifpb-teal" />
              Dificuldades Apresentadas (do Estudo de Caso)
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {dificuldades.map((d) => (
                <span
                  key={d.id}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-ifpb-tealLight text-ifpb-teal border border-ifpb-teal/20"
                >
                  {d.nome}
                </span>
              ))}
            </div>
          </section>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="pei-habilidades" className="text-sm font-bold text-ifpb-dark flex items-center">
              <span>1. Conhecimentos, Habilidades, Capacidades e Interesses</span>
              <span className="text-ifpb-red ml-1" title="Obrigatório">*</span>
            </label>
            <span className="text-xs text-gray-400">{habilidades.length} caracteres</span>
          </div>
          <p className="text-xs text-gray-500">O que o estudante sabe? Do que gosta e quais são suas afinidades?</p>
          <textarea
            id="pei-habilidades"
            rows={5}
            value={habilidades}
            onChange={(e) => handleHabilidades(e.target.value)}
            aria-invalid={!!erroHabilidades}
            className={classeTextarea(erroHabilidades)}
          />
          {erroHabilidades && (
            <p className="text-xs text-ifpb-red font-semibold flex items-center mt-1">
              <AlertTriangle className="w-3.5 h-3.5 mr-1" />
              {erroHabilidades}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="pei-propostas" className="text-sm font-bold text-ifpb-dark flex items-center">
              <span>2. Propostas de Adaptações Curriculares</span>
              <span className="text-ifpb-red ml-1" title="Obrigatório">*</span>
            </label>
            <span className="text-xs text-gray-400">{propostas.length} caracteres</span>
          </div>
          <p className="text-xs text-gray-500">
            Adaptações de pequeno e grande porte, alterações na matriz curricular, dilatação de tempo para integralização, etc.
          </p>
          <textarea
            id="pei-propostas"
            rows={6}
            value={propostas}
            onChange={(e) => handlePropostas(e.target.value)}
            aria-invalid={!!erroPropostas}
            className={classeTextarea(erroPropostas)}
          />
          {erroPropostas && (
            <p className="text-xs text-ifpb-red font-semibold flex items-center mt-1">
              <AlertTriangle className="w-3.5 h-3.5 mr-1" />
              {erroPropostas}
            </p>
          )}
        </div>

        <div className="pt-6 border-t border-gray-200 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-4">
          <button
            type="button"
            onClick={handleVoltar}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
          >
            Voltar
          </button>
          <button
            type="button"
            onClick={handleSalvar}
            disabled={isLoading}
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg text-xs font-bold text-white bg-ifpb-teal hover:bg-ifpb-tealHover focus:outline-none focus:ring-2 focus:ring-ifpb-teal/40 shadow-sm transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4 mr-1.5 text-green-300" />
            {peiExistente ? 'Atualizar PEI' : 'Salvar PEI'}
          </button>
        </div>
      </form>
    </div>
  );
};
