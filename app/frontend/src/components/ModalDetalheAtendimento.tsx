import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Lock, Pencil, Stethoscope, Timer, X } from 'lucide-react';
import { ModalBase } from './ModalBase';
import { useAuth } from '../contexts/AuthContext';
import { useAgora } from '../hooks/useAgora';
import { ProntuarioService } from '../services/prontuarioService';
import { isAbortError, toProblem } from '../services/apiClient';
import type { NovoAtendimentoResponseDTO, TipoAtendimento } from '../types/prontuarioAcoes';
import {
  MENSAGEM_BLOQUEIO,
  OPCOES_TIPO_ATENDIMENTO,
  formatarDataAtendimento,
  formatarDataHoraServidor,
  formatarTempoRestante,
  limiteEdicao,
  motivoBloqueioEdicao,
  paraTimestampServidor,
  rotuloTipoAtendimento,
} from '../utils/atendimento';

export interface ModalDetalheAtendimentoProps {
  atendimentoId: string;
  /** Versão já carregada com a Linha do Tempo, exibida enquanto o detalhe é buscado. */
  atendimentoInicial?: NovoAtendimentoResponseDTO;
  onClose: () => void;
  onAtualizado: (atendimento: NovoAtendimentoResponseDTO) => void;
}

interface FormEdicao {
  tipoAtendimento: TipoAtendimento;
  dataAtendimento: string;
  profissionalResponsavel: string;
  descricao: string;
  encaminhamentos: string;
}

function paraForm(a: NovoAtendimentoResponseDTO): FormEdicao {
  return {
    tipoAtendimento: a.tipoAtendimento,
    dataAtendimento: a.dataAtendimento?.slice(0, 10) ?? '',
    profissionalResponsavel: a.profissionalResponsavel,
    descricao: a.descricao,
    encaminhamentos: a.encaminhamentos ?? '',
  };
}

const CLASSE_CAMPO =
  'w-full px-3 py-2 rounded-lg text-xs border border-gray-300 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-ifpb-teal/30 focus:border-ifpb-teal';

const Campo: React.FC<{ rotulo: string; children: React.ReactNode }> = ({ rotulo, children }) => (
  <div>
    <dt className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{rotulo}</dt>
    <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap break-words">{children}</dd>
  </div>
);

/**
 * Detalhe do atendimento aberto a partir da Linha do Tempo (US 04 / TA4.4).
 * Somente leitura por padrão; "Editar" só fica habilitado ao autor e enquanto
 * {@code Date.now() - criadoEm <= 24h}. O 403 do servidor continua sendo a palavra final.
 */
export const ModalDetalheAtendimento: React.FC<ModalDetalheAtendimentoProps> = ({
  atendimentoId,
  atendimentoInicial,
  onClose,
  onAtualizado,
}) => {
  const { sessao } = useAuth();
  const userId = sessao?.userId ?? null;
  const agora = useAgora(30_000);

  const [atendimento, setAtendimento] = useState<NovoAtendimentoResponseDTO | null>(
    atendimentoInicial ?? null
  );
  const [carregando, setCarregando] = useState<boolean>(true);
  const [erroCarga, setErroCarga] = useState<string | null>(null);

  const [editando, setEditando] = useState<boolean>(false);
  const [form, setForm] = useState<FormEdicao | null>(null);
  const [erroForm, setErroForm] = useState<string | null>(null);
  const [erroServidor, setErroServidor] = useState<string | null>(null);
  const [negadoPeloServidor, setNegadoPeloServidor] = useState<boolean>(false);
  const [salvando, setSalvando] = useState<boolean>(false);
  const [salvoComSucesso, setSalvoComSucesso] = useState<boolean>(false);

  useEffect(() => {
    const controlador = new AbortController();
    ProntuarioService.buscarAtendimento(atendimentoId, controlador.signal)
      .then((dados) => {
        setAtendimento(dados);
        setErroCarga(null);
      })
      .catch((e: unknown) => {
        if (isAbortError(e) || controlador.signal.aborted) return;
        // Com a versão da Linha do Tempo em mãos, uma falha na atualização não impede a leitura.
        setErroCarga(toProblem(e).detail || 'Não foi possível carregar os detalhes do atendimento.');
      })
      .finally(() => {
        if (!controlador.signal.aborted) setCarregando(false);
      });
    return () => controlador.abort();
  }, [atendimentoId]);

  const motivo = atendimento ? motivoBloqueioEdicao(atendimento, userId, agora) : 'NAO_AUTOR';
  const edicaoLiberada = atendimento !== null && motivo === null && !negadoPeloServidor;
  // A janela pode fechar com o formulário aberto: nesse caso volta ao modo leitura.
  const emEdicao = editando && edicaoLiberada && form !== null;

  const limite = atendimento ? limiteEdicao(atendimento) : null;
  const restante = limite !== null ? limite - agora : null;

  const iniciarEdicao = () => {
    if (!atendimento || !edicaoLiberada) return;
    setForm(paraForm(atendimento));
    setErroForm(null);
    setErroServidor(null);
    setSalvoComSucesso(false);
    setEditando(true);
  };

  const cancelarEdicao = () => {
    if (salvando) return;
    setEditando(false);
    setForm(null);
    setErroForm(null);
    setErroServidor(null);
  };

  const fechar = () => {
    if (salvando) return;
    onClose();
  };

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!atendimento || !form || !edicaoLiberada) return;

    if (!form.profissionalResponsavel.trim()) {
      setErroForm('Informe o profissional ou setor responsável pelo atendimento.');
      return;
    }
    if (!form.descricao.trim()) {
      setErroForm('O relato/descrição do atendimento é obrigatório.');
      return;
    }
    if (!form.dataAtendimento) {
      setErroForm('Informe a data do atendimento.');
      return;
    }

    setErroForm(null);
    setErroServidor(null);
    setSalvando(true);
    try {
      const atualizado = await ProntuarioService.atualizarAtendimento(atendimento.id, {
        tipoAtendimento: form.tipoAtendimento,
        dataAtendimento: form.dataAtendimento,
        profissionalResponsavel: form.profissionalResponsavel,
        descricao: form.descricao,
        encaminhamentos: form.encaminhamentos,
      });
      setAtendimento(atualizado);
      setEditando(false);
      setForm(null);
      setSalvoComSucesso(true);
      onAtualizado(atualizado);
    } catch (err: unknown) {
      const prob = toProblem(err, 'Falha ao atualizar', 'Não foi possível salvar as alterações.');
      if (prob.status === 403) {
        // O servidor aplicou a trava (autoria/24h) — o relógio do navegador estava defasado.
        setNegadoPeloServidor(true);
        setEditando(false);
        setForm(null);
      }
      setErroServidor(prob.detail || prob.title);
    } finally {
      setSalvando(false);
    }
  };

  const mudar = <K extends keyof FormEdicao>(campo: K, valor: FormEdicao[K]) =>
    setForm((f) => (f ? { ...f, [campo]: valor } : f));

  const criadoTs = atendimento ? paraTimestampServidor(atendimento.criadoEm) : null;
  const atualizadoTs = atendimento ? paraTimestampServidor(atendimento.atualizadoEm) : null;
  const foiEditado = criadoTs !== null && atualizadoTs !== null && atualizadoTs - criadoTs > 2000;

  return (
    <ModalBase
      isOpen
      onClose={fechar}
      titulo="Detalhes do Atendimento"
      subtitulo={atendimento?.nomeEstudante ?? undefined}
      icone={<Stethoscope className="w-5 h-5" />}
      isLoading={salvando}
      footer={
        emEdicao ? (
          <>
            <button
              type="button"
              onClick={cancelarEdicao}
              disabled={salvando}
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-xs font-bold border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <X className="w-4 h-4 mr-1.5" />
              Cancelar edição
            </button>
            <button
              type="submit"
              form="form-editar-atendimento"
              disabled={salvando}
              className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-lg text-xs font-bold text-white bg-ifpb-teal hover:bg-ifpb-tealHover shadow-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{salvando ? 'Salvando...' : 'Salvar alterações'}</span>
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={fechar}
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-xs font-bold border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
            >
              Fechar
            </button>
            <button
              type="button"
              onClick={iniciarEdicao}
              disabled={!edicaoLiberada}
              title={
                edicaoLiberada
                  ? 'Editar este atendimento'
                  : negadoPeloServidor
                    ? 'Edição bloqueada pelo servidor'
                    : motivo
                      ? MENSAGEM_BLOQUEIO[motivo]
                      : undefined
              }
              className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-lg text-xs font-bold text-white bg-ifpb-teal hover:bg-ifpb-tealHover shadow-sm cursor-pointer disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none disabled:cursor-not-allowed"
            >
              {edicaoLiberada ? <Pencil className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              <span>Editar</span>
            </button>
          </>
        )
      }
    >
      {!atendimento && carregando && (
        <p className="text-sm text-gray-600 py-6 text-center">Carregando atendimento...</p>
      )}

      {!atendimento && !carregando && (
        <div className="flex items-start space-x-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <p>{erroCarga ?? 'Atendimento não encontrado.'}</p>
        </div>
      )}

      {atendimento && (
        <div className="space-y-4">
          {erroCarga && (
            <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
              Não foi possível atualizar os dados agora; exibindo a última versão carregada.
            </p>
          )}

          {/* Situação da edição (TA4.4) */}
          {edicaoLiberada && restante !== null && (
            <div className="flex items-start space-x-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-900">
              <Timer className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" />
              <p>
                Você é o autor deste registro e pode editá-lo por mais{' '}
                <strong>{formatarTempoRestante(restante)}</strong> (até{' '}
                {new Date(limite as number).toLocaleString('pt-BR', {
                  dateStyle: 'short',
                  timeStyle: 'short',
                })}
                ).
              </p>
            </div>
          )}
          {!edicaoLiberada && (
            <div className="flex items-start space-x-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs text-gray-700">
              <Lock className="w-4 h-4 mt-0.5 shrink-0 text-gray-500" />
              <p>
                <strong>Somente leitura.</strong>{' '}
                {negadoPeloServidor
                  ? 'O servidor não autorizou a edição deste atendimento.'
                  : MENSAGEM_BLOQUEIO[motivo ?? 'NAO_AUTOR']}
              </p>
            </div>
          )}

          {erroServidor && (
            <div
              role="alert"
              className="flex items-start space-x-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-800"
            >
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-red-600" />
              <p>{erroServidor}</p>
            </div>
          )}
          {salvoComSucesso && !emEdicao && (
            <div
              role="status"
              className="flex items-start space-x-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-900"
            >
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" />
              <p>Alterações salvas.</p>
            </div>
          )}

          {emEdicao && form ? (
            <form id="form-editar-atendimento" onSubmit={salvar} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="editar-tipo" className="block text-xs font-bold text-ifpb-dark mb-1">
                    Natureza do Atendimento
                  </label>
                  <select
                    id="editar-tipo"
                    value={form.tipoAtendimento}
                    onChange={(e) => mudar('tipoAtendimento', e.target.value as TipoAtendimento)}
                    disabled={salvando}
                    className={CLASSE_CAMPO}
                  >
                    {OPCOES_TIPO_ATENDIMENTO.map((op) => (
                      <option key={op.valor} value={op.valor}>
                        {op.rotulo}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="editar-data" className="block text-xs font-bold text-ifpb-dark mb-1">
                    Data do Atendimento
                  </label>
                  <input
                    id="editar-data"
                    type="date"
                    value={form.dataAtendimento}
                    onChange={(e) => mudar('dataAtendimento', e.target.value)}
                    disabled={salvando}
                    className={CLASSE_CAMPO}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="editar-profissional" className="block text-xs font-bold text-ifpb-dark mb-1">
                  Profissional / Setor Responsável
                </label>
                <input
                  id="editar-profissional"
                  type="text"
                  value={form.profissionalResponsavel}
                  onChange={(e) => mudar('profissionalResponsavel', e.target.value)}
                  disabled={salvando}
                  className={CLASSE_CAMPO}
                />
              </div>

              <div>
                <label htmlFor="editar-descricao" className="block text-xs font-bold text-ifpb-dark mb-1">
                  Relato / Síntese do Atendimento
                </label>
                <textarea
                  id="editar-descricao"
                  rows={5}
                  value={form.descricao}
                  onChange={(e) => mudar('descricao', e.target.value)}
                  disabled={salvando}
                  className={`${CLASSE_CAMPO} resize-y`}
                />
              </div>

              <div>
                <label htmlFor="editar-encaminhamentos" className="block text-xs font-bold text-ifpb-dark mb-1">
                  Encaminhamentos / Próximos Passos <span className="text-gray-400 font-normal">(Opcional)</span>
                </label>
                <textarea
                  id="editar-encaminhamentos"
                  rows={3}
                  value={form.encaminhamentos}
                  onChange={(e) => mudar('encaminhamentos', e.target.value)}
                  disabled={salvando}
                  className={`${CLASSE_CAMPO} resize-y`}
                />
              </div>

              {erroForm && (
                <p className="text-xs text-ifpb-red flex items-center">
                  <AlertTriangle className="w-3.5 h-3.5 mr-1 shrink-0" />
                  {erroForm}
                </p>
              )}
            </form>
          ) : (
            <dl className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Campo rotulo="Natureza do Atendimento">{rotuloTipoAtendimento(atendimento.tipoAtendimento)}</Campo>
                <Campo rotulo="Data do Atendimento">{formatarDataAtendimento(atendimento.dataAtendimento)}</Campo>
              </div>
              <Campo rotulo="Profissional / Setor Responsável">{atendimento.profissionalResponsavel}</Campo>
              <Campo rotulo="Relato / Síntese do Atendimento">{atendimento.descricao}</Campo>
              <Campo rotulo="Encaminhamentos / Próximos Passos">
                {atendimento.encaminhamentos?.trim() ? (
                  atendimento.encaminhamentos
                ) : (
                  <span className="text-gray-400">Nenhum encaminhamento registrado.</span>
                )}
              </Campo>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-gray-100">
                <Campo rotulo="Registrado em">{formatarDataHoraServidor(atendimento.criadoEm)}</Campo>
                {foiEditado && (
                  <Campo rotulo="Última edição">{formatarDataHoraServidor(atendimento.atualizadoEm)}</Campo>
                )}
              </div>
            </dl>
          )}
        </div>
      )}
    </ModalBase>
  );
};
