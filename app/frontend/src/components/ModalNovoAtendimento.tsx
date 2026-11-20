import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  RotateCcw,
  Save,
  Stethoscope,
  Trash2,
  User,
  WifiOff,
} from 'lucide-react';
import { ModalBase } from './ModalBase';
import { ModalAlunoHeader } from './ModalAlunoHeader';
import { ProntuarioService } from '../services/prontuarioService';
import {
  lerRascunho,
  removerRascunho,
  salvarRascunho,
  type RascunhoAtendimento,
} from '../services/rascunhoAtendimentoService';
import { useAuth } from '../contexts/AuthContext';
import type {
  AlunoModalData,
  NovoAtendimentoResponseDTO,
  TipoAtendimento,
} from '../types/prontuarioAcoes';
import type { ProblemDetailRFC9457 } from '../types/estudoDeCaso';
import { dataLocalISO } from '../utils/data';
import { OPCOES_TIPO_ATENDIMENTO } from '../utils/atendimento';

export interface ModalNovoAtendimentoProps {
  isOpen: boolean;
  onClose: () => void;
  aluno: AlunoModalData;
  onSuccess: (atendimento: NovoAtendimentoResponseDTO) => void | Promise<void>;
  onError?: (titulo: string, detalhe: string) => void;
}

/** TA4.3: tempo sem digitar antes de gravar o rascunho. */
export const DEBOUNCE_RASCUNHO_MS = 2000;

const PROFISSIONAL_PADRAO = 'Equipe Multidisciplinar CLAI';

function rascunhoPadrao(): RascunhoAtendimento {
  return {
    tipoAtendimento: 'PEDAGOGICO',
    dataAtendimento: dataLocalISO(),
    profissionalResponsavel: PROFISSIONAL_PADRAO,
    descricao: '',
    encaminhamentos: '',
  };
}

function formatarHoraRascunho(ts: number): string {
  const d = new Date(ts);
  const hoje = new Date();
  const mesmoDia = d.toDateString() === hoje.toDateString();
  return mesmoDia
    ? d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

/**
 * Casca: o formulário só existe enquanto o modal está aberto. Cada abertura monta o conteúdo do zero
 * e o estado inicial vem do rascunho salvo (por usuário + aluno), o que cobre tanto a reabertura
 * acidental quanto o recarregamento da aba após queda de conexão.
 */
export const ModalNovoAtendimento: React.FC<ModalNovoAtendimentoProps> = (props) => {
  if (!props.isOpen) return null;
  return <ConteudoModalNovoAtendimento key={props.aluno.id} {...props} />;
};

const ConteudoModalNovoAtendimento: React.FC<ModalNovoAtendimentoProps> = ({
  onClose,
  aluno,
  onSuccess,
  onError,
}) => {
  const { sessao } = useAuth();
  const userId = sessao?.userId ?? '';
  const alunoId = aluno.id;

  // Lido uma única vez, na montagem (inicializador preguiçoso).
  const [restaurado] = useState(() => lerRascunho(userId, alunoId));
  const inicial = restaurado?.dados ?? rascunhoPadrao();

  const [tipoAtendimento, setTipoAtendimento] = useState<TipoAtendimento>(inicial.tipoAtendimento);
  const [dataAtendimento, setDataAtendimento] = useState<string>(inicial.dataAtendimento);
  const [profissionalResponsavel, setProfissionalResponsavel] = useState<string>(
    inicial.profissionalResponsavel
  );
  const [descricao, setDescricao] = useState<string>(inicial.descricao);
  const [encaminhamentos, setEncaminhamentos] = useState<string>(inicial.encaminhamentos);

  const [erroDescricao, setErroDescricao] = useState<string | null>(null);
  const [erroProfissional, setErroProfissional] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [rascunhoSalvoEm, setRascunhoSalvoEm] = useState<number | null>(restaurado?.salvoEm ?? null);
  const [avisoRestaurado, setAvisoRestaurado] = useState<boolean>(restaurado !== null);
  const [online, setOnline] = useState<boolean>(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine
  );

  // --- Auto-salvamento (TA4.3) -------------------------------------------------------------
  const snapshot = useMemo<RascunhoAtendimento>(
    () => ({ tipoAtendimento, dataAtendimento, profissionalResponsavel, descricao, encaminhamentos }),
    [tipoAtendimento, dataAtendimento, profissionalResponsavel, descricao, encaminhamentos]
  );
  const snapshotRef = useRef<RascunhoAtendimento>(snapshot);
  const ultimoSalvoRef = useRef<string>(JSON.stringify(inicial));
  // Após o registro bem-sucedido o rascunho já foi apagado: nada mais pode recriá-lo.
  const encerradoRef = useRef<boolean>(false);

  useEffect(() => {
    snapshotRef.current = snapshot;
  }, [snapshot]);

  /** Grava imediatamente o que está na tela (ignora se nada mudou desde a última gravação). */
  const salvarAgora = useCallback(() => {
    if (encerradoRef.current) return;
    const atual = snapshotRef.current;
    const serializado = JSON.stringify(atual);
    if (serializado === ultimoSalvoRef.current) return;
    ultimoSalvoRef.current = serializado;
    setRascunhoSalvoEm(salvarRascunho(userId, alunoId, atual));
  }, [userId, alunoId]);

  // Debounce: grava 2s após a última alteração.
  useEffect(() => {
    const id = setTimeout(salvarAgora, DEBOUNCE_RASCUNHO_MS);
    return () => clearTimeout(id);
  }, [snapshot, salvarAgora]);

  // Não perde o que foi digitado nos últimos 2s se a aba for fechada/recarregada/ocultada,
  // nem se o modal for desmontado (fechar, trocar de aluno).
  useEffect(() => {
    const aoOcultar = () => {
      if (document.visibilityState === 'hidden') salvarAgora();
    };
    window.addEventListener('pagehide', salvarAgora);
    document.addEventListener('visibilitychange', aoOcultar);
    return () => {
      window.removeEventListener('pagehide', salvarAgora);
      document.removeEventListener('visibilitychange', aoOcultar);
      salvarAgora();
    };
  }, [salvarAgora]);

  useEffect(() => {
    const aoMudar = () => setOnline(navigator.onLine);
    window.addEventListener('online', aoMudar);
    window.addEventListener('offline', aoMudar);
    return () => {
      window.removeEventListener('online', aoMudar);
      window.removeEventListener('offline', aoMudar);
    };
  }, []);

  const descartarRascunho = () => {
    if (isSubmitting) return;
    if (!window.confirm('Descartar o rascunho e limpar o texto digitado?')) return;
    const padrao = rascunhoPadrao();
    removerRascunho(userId, alunoId);
    ultimoSalvoRef.current = JSON.stringify(padrao);
    setTipoAtendimento(padrao.tipoAtendimento);
    setDataAtendimento(padrao.dataAtendimento);
    setProfissionalResponsavel(padrao.profissionalResponsavel);
    setDescricao(padrao.descricao);
    setEncaminhamentos(padrao.encaminhamentos);
    setErroDescricao(null);
    setErroProfissional(null);
    setRascunhoSalvoEm(null);
    setAvisoRestaurado(false);
  };

  // Fechar/Cancelar NÃO descarta: o rascunho fica guardado para a próxima abertura.
  const handleFechar = () => {
    if (isSubmitting) return;
    salvarAgora();
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

    // Garante a cópia de segurança antes da requisição: se a conexão cair durante o envio, nada se perde.
    salvarAgora();

    setIsSubmitting(true);
    try {
      const criado = await ProntuarioService.criarAtendimento({
        alunoId: aluno.id,
        tipoAtendimento,
        dataAtendimento,
        profissionalResponsavel: profissionalResponsavel.trim(),
        descricao: descricao.trim(),
        encaminhamentos: encaminhamentos.trim() || undefined,
      });

      // Persistido no servidor: o rascunho cumpriu o papel e deve sumir.
      encerradoRef.current = true;
      removerRascunho(userId, alunoId);

      await onSuccess(criado);
      onClose();
    } catch (err: unknown) {
      // Falha (ex.: sem conexão): o formulário e o rascunho permanecem intactos para nova tentativa.
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
      isOpen
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
        {avisoRestaurado && restaurado && (
          <div
            role="status"
            className="flex items-start justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5"
          >
            <div className="flex items-start space-x-2 text-xs text-amber-900">
              <RotateCcw className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
              <p>
                <strong>Rascunho restaurado.</strong> Recuperamos o texto que você havia digitado
                (salvo em {formatarHoraRascunho(restaurado.salvoEm)}). Revise e registre o atendimento.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAvisoRestaurado(false)}
              className="text-[11px] font-semibold text-amber-800 hover:underline cursor-pointer shrink-0"
            >
              Ok
            </button>
          </div>
        )}

        {!online && (
          <div
            role="alert"
            className="flex items-start space-x-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-800"
          >
            <WifiOff className="w-4 h-4 mt-0.5 shrink-0 text-red-600" />
            <p>
              Sem conexão com a internet. O que você digita continua sendo guardado como rascunho neste
              navegador; registre o atendimento quando a conexão voltar.
            </p>
          </div>
        )}

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
                className="w-full pl-3 pr-8 py-2 rounded-lg text-xs border border-gray-300 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-ifpb-teal/30 focus:border-ifpb-teal [&::-webkit-calendar-picker-indicator]:opacity-0 cursor-pointer"
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
              className={`w-full pl-3 pr-9 py-2 rounded-lg text-xs border bg-white text-gray-800 focus:outline-none focus:ring-2 ${
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

        {/* Estado do auto-salvamento (TA4.3) */}
        <div
          className="flex items-center justify-between gap-3 pt-1 text-[11px] text-gray-500"
          aria-live="polite"
        >
          <span className="inline-flex items-center">
            <Save className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
            {rascunhoSalvoEm
              ? `Rascunho salvo automaticamente às ${formatarHoraRascunho(rascunhoSalvoEm)}`
              : 'O texto digitado é salvo automaticamente como rascunho'}
          </span>
          {rascunhoSalvoEm && (
            <button
              type="button"
              onClick={descartarRascunho}
              disabled={isSubmitting}
              className="inline-flex items-center font-semibold text-gray-500 hover:text-ifpb-red cursor-pointer disabled:opacity-60"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              Descartar rascunho
            </button>
          )}
        </div>
      </form>
    </ModalBase>
  );
};
