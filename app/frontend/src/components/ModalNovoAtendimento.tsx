import React, { useState } from 'react';
import { AlertTriangle, Calendar, CheckCircle2, Stethoscope, User } from 'lucide-react';
import { ModalBase } from './ModalBase';
import { ModalAlunoHeader } from './ModalAlunoHeader';
import { ProntuarioService } from '../services/prontuarioService';
import type {
  AlunoModalData,
  NovoAtendimentoResponseDTO,
  TipoAtendimento,
} from '../types/prontuarioAcoes';
import type { ProblemDetailRFC9457 } from '../types/estudoDeCaso';
import { dataLocalISO } from '../utils/data';

export interface ModalNovoAtendimentoProps {
  isOpen: boolean;
  onClose: () => void;
  aluno: AlunoModalData;
  onSuccess: (atendimento: NovoAtendimentoResponseDTO) => void | Promise<void>;
  onError?: (titulo: string, detalhe: string) => void;
}

const OPCOES_TIPO_ATENDIMENTO: { valor: TipoAtendimento; rotulo: string }[] = [
  { valor: 'PEDAGOGICO', rotulo: 'Acompanhamento Pedagógico' },
  { valor: 'PSICOLOGICO', rotulo: 'Atendimento Psicológico' },
  { valor: 'ASSISTENCIA_SOCIAL', rotulo: 'Assistência Social' },
  { valor: 'ACESSIBILIDADE', rotulo: 'Suporte de Acessibilidade / AEE' },
  { valor: 'MULTIDISCIPLINAR', rotulo: 'Reunião Multidisciplinar / Família' },
];

export const ModalNovoAtendimento: React.FC<ModalNovoAtendimentoProps> = ({
  isOpen,
  onClose,
  aluno,
  onSuccess,
  onError,
}) => {
  const [tipoAtendimento, setTipoAtendimento] = useState<TipoAtendimento>('PEDAGOGICO');
  const [dataAtendimento, setDataAtendimento] = useState<string>(() => dataLocalISO());
  const [profissionalResponsavel, setProfissionalResponsavel] = useState<string>(
    'Equipe Multidisciplinar CLAI'
  );
  const [descricao, setDescricao] = useState<string>('');
  const [encaminhamentos, setEncaminhamentos] = useState<string>('');

  const [erroDescricao, setErroDescricao] = useState<string | null>(null);
  const [erroProfissional, setErroProfissional] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const limparFormulario = () => {
    setTipoAtendimento('PEDAGOGICO');
    setDataAtendimento(dataLocalISO());
    setProfissionalResponsavel('Equipe Multidisciplinar CLAI');
    setDescricao('');
    setEncaminhamentos('');
    setErroDescricao(null);
    setErroProfissional(null);
  };

  const handleFechar = () => {
    if (isSubmitting) return;
    limparFormulario();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let possuiErro = false;

    if (!profissionalResponsavel.trim()) {
      setErroProfissional('Informe o profissional ou setor responsável pelo atendimento.');
      possuiErro = true;
    } else {
      setErroProfissional(null);
    }

    if (!descricao.trim()) {
      setErroDescricao('O relato/descrição do atendimento é obrigatório.');
      possuiErro = true;
    } else {
      setErroDescricao(null);
    }

    if (possuiErro) return;

    setIsSubmitting(true);
    try {
      const criado = await ProntuarioService.criarAtendimento({
        alunoId: aluno.id,
        matriculaAluno: aluno.matricula,
        tipoAtendimento,
        dataAtendimento,
        profissionalResponsavel: profissionalResponsavel.trim(),
        descricao: descricao.trim(),
        encaminhamentos: encaminhamentos.trim() || undefined,
      });

      limparFormulario();
      await onSuccess(criado);
      onClose();
    } catch (err: unknown) {
      const prob = err as Partial<ProblemDetailRFC9457>;
      if (onError) {
        onError(
          prob.title || 'Falha ao Registrar Atendimento',
          prob.detail || 'Não foi possível concluir o registro do atendimento.'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={handleFechar}
      titulo="Novo Atendimento"
      subtitulo="Registro rápido de atendimento vinculado ao estudante em foco"
      icone={<Stethoscope className="w-5 h-5" />}
      isLoading={isSubmitting}
      footer={
        <>
          <button
            type="button"
            onClick={handleFechar}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-xs font-bold border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="form-novo-atendimento"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-lg text-xs font-bold text-white bg-ifpb-teal hover:bg-ifpb-tealHover shadow-sm transition-all duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isSubmitting ? 'Registrando...' : 'Registrar Atendimento'}</span>
          </button>
        </>
      }
    >
      {/* Ref. TA9.3: Cabeçalho do Aluno Pré-carregado sem exigir digitação de matrícula */}
      <ModalAlunoHeader aluno={aluno} />

      <form id="form-novo-atendimento" onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Tipo de Atendimento */}
          <div>
            <label
              htmlFor="atendimento-tipo"
              className="block text-xs font-bold text-ifpb-dark mb-1"
            >
              Natureza do Atendimento <span className="text-ifpb-red">*</span>
            </label>
            <select
              id="atendimento-tipo"
              value={tipoAtendimento}
              onChange={(e) => setTipoAtendimento(e.target.value as TipoAtendimento)}
              disabled={isSubmitting}
              className="w-full px-3 py-2 rounded-lg text-xs border border-gray-300 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-ifpb-teal/30 focus:border-ifpb-teal"
            >
              {OPCOES_TIPO_ATENDIMENTO.map((op) => (
                <option key={op.valor} value={op.valor}>
                  {op.rotulo}
                </option>
              ))}
            </select>
          </div>

          {/* Data do Atendimento */}
          <div>
            <label
              htmlFor="atendimento-data"
              className="block text-xs font-bold text-ifpb-dark mb-1"
            >
              Data do Atendimento <span className="text-ifpb-red">*</span>
            </label>
            <div className="relative">
              <input
                id="atendimento-data"
                type="date"
                value={dataAtendimento}
                onChange={(e) => setDataAtendimento(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-3 py-2 rounded-lg text-xs border border-gray-300 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-ifpb-teal/30 focus:border-ifpb-teal"
              />
              <Calendar className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-2.5 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Profissional Responsável */}
        <div>
          <label
            htmlFor="atendimento-profissional"
            className="block text-xs font-bold text-ifpb-dark mb-1"
          >
            Profissional / Setor Responsável <span className="text-ifpb-red">*</span>
          </label>
          <div className="relative">
            <input
              id="atendimento-profissional"
              type="text"
              value={profissionalResponsavel}
              onChange={(e) => {
                setProfissionalResponsavel(e.target.value);
                if (e.target.value.trim()) setErroProfissional(null);
              }}
              placeholder="Ex.: Psicopedagogia CLAI / Nome do Profissional"
              disabled={isSubmitting}
              className={`w-full px-3 py-2 rounded-lg text-xs border bg-white text-gray-800 focus:outline-none focus:ring-2 ${
                erroProfissional
                  ? 'border-ifpb-red focus:ring-red-200'
                  : 'border-gray-300 focus:ring-ifpb-teal/30 focus:border-ifpb-teal'
              }`}
            />
            <User className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-2.5 pointer-events-none" />
          </div>
          {erroProfissional && (
            <p className="mt-1 text-xs text-ifpb-red flex items-center">
              <AlertTriangle className="w-3.5 h-3.5 mr-1 shrink-0" />
              {erroProfissional}
            </p>
          )}
        </div>

        {/* Descrição / Relato */}
        <div>
          <label
            htmlFor="atendimento-descricao"
            className="block text-xs font-bold text-ifpb-dark mb-1"
          >
            Relato / Síntese do Atendimento <span className="text-ifpb-red">*</span>
          </label>
          <textarea
            id="atendimento-descricao"
            rows={4}
            value={descricao}
            onChange={(e) => {
              setDescricao(e.target.value);
              if (e.target.value.trim()) setErroDescricao(null);
            }}
            placeholder="Descreva as demandas abordadas, orientações realizadas e percepções durante o atendimento..."
            disabled={isSubmitting}
            className={`w-full p-3 rounded-lg text-xs border bg-white text-gray-800 focus:outline-none focus:ring-2 resize-y ${
              erroDescricao
                ? 'border-ifpb-red focus:ring-red-200'
                : 'border-gray-300 focus:ring-ifpb-teal/30 focus:border-ifpb-teal'
            }`}
          />
          {erroDescricao && (
            <p className="mt-1 text-xs text-ifpb-red flex items-center">
              <AlertTriangle className="w-3.5 h-3.5 mr-1 shrink-0" />
              {erroDescricao}
            </p>
          )}
        </div>

        {/* Encaminhamentos */}
        <div>
          <label
            htmlFor="atendimento-encaminhamentos"
            className="block text-xs font-bold text-ifpb-dark mb-1"
          >
            Encaminhamentos / Próximos Passos <span className="text-gray-400 font-normal">(Opcional)</span>
          </label>
          <textarea
            id="atendimento-encaminhamentos"
            rows={2}
            value={encaminhamentos}
            onChange={(e) => setEncaminhamentos(e.target.value)}
            placeholder="Ex.: Agendar retorno em 15 dias; comunicar coordenação de curso..."
            disabled={isSubmitting}
            className="w-full p-3 rounded-lg text-xs border border-gray-300 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-ifpb-teal/30 focus:border-ifpb-teal resize-y"
          />
        </div>
      </form>
    </ModalBase>
  );
};
