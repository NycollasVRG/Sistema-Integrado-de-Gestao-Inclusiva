import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Bell,
  Check,
  CheckCheck,
  ChevronRight,
  RotateCw,
} from 'lucide-react';
import { isAbortError, toProblem } from '../services/apiClient';
import {
  NotificacaoService,
  registrarAlteracaoNotificacoes,
  rotaPeiDaNotificacao,
} from '../services/notificacaoService';
import type { NotificacaoResponseDTO } from '../types/notificacao';

interface DropdownNotificacoesProps {
  perfil?: string;
}

function formatarData(dateTime: string): string {
  try {
    return new Date(dateTime).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateTime;
  }
}

/** Central de notificações do cabeçalho, inicialmente voltada ao COORDENADOR (TA3.3). */
export const DropdownNotificacoes: React.FC<DropdownNotificacoesProps> = ({
  perfil = 'COORDENADOR',
}) => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [aberto, setAberto] = useState(false);
  const [notificacoes, setNotificacoes] = useState<NotificacaoResponseDTO[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [processandoId, setProcessandoId] = useState<string | null>(null);

  const carregar = useCallback(
    async (signal?: AbortSignal) => {
      setCarregando(true);
      setErro(null);
      try {
        const dados = await NotificacaoService.listar(perfil, false, signal);
        if (!signal?.aborted) setNotificacoes(dados);
      } catch (e: unknown) {
        if (isAbortError(e) || signal?.aborted) return;
        const prob = toProblem(e);
        setErro(prob.detail || prob.title || 'Não foi possível carregar as notificações.');
      } finally {
        if (!signal?.aborted) setCarregando(false);
      }
    },
    [perfil]
  );

  useEffect(() => {
    const controlador = new AbortController();
    void carregar(controlador.signal);
    return () => controlador.abort();
  }, [carregar]);

  // Recarrega quando um RAI/RAE com indicativo de regressão é emitido no prontuário.
  useEffect(() => registrarAlteracaoNotificacoes(() => void carregar()), [carregar]);

  useEffect(() => {
    if (!aberto) return;

    function tratarCliqueFora(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setAberto(false);
      }
    }

    function tratarTeclaEsc(event: KeyboardEvent) {
      if (event.key === 'Escape') setAberto(false);
    }

    document.addEventListener('mousedown', tratarCliqueFora);
    document.addEventListener('keydown', tratarTeclaEsc);
    return () => {
      document.removeEventListener('mousedown', tratarCliqueFora);
      document.removeEventListener('keydown', tratarTeclaEsc);
    };
  }, [aberto]);

  const pendentes = notificacoes.filter((notificacao) => !notificacao.lida);

  const marcarComoLida = async (
    notificacao: NotificacaoResponseDTO,
    navegar: boolean
  ) => {
    if (processandoId) return;
    setErro(null);
    setProcessandoId(notificacao.id);

    try {
      if (!notificacao.lida) {
        await NotificacaoService.marcarComoLida(notificacao.id);
        setNotificacoes((anteriores) =>
          anteriores.map((item) =>
            item.id === notificacao.id ? { ...item, lida: true } : item
          )
        );
      }

      if (navegar) {
        const rota = rotaPeiDaNotificacao(notificacao.linkReferencia);
        setAberto(false);
        if (rota) navigate(rota);
      }
    } catch (e: unknown) {
      const prob = toProblem(e);
      setErro(prob.detail || prob.title || 'Não foi possível marcar a notificação como lida.');
    } finally {
      setProcessandoId(null);
    }
  };

  const marcarTodasComoLidas = async () => {
    if (processandoId || pendentes.length === 0) return;
    setProcessandoId('todas');
    setErro(null);

    try {
      await Promise.all(
        pendentes.map((notificacao) =>
          NotificacaoService.marcarComoLida(notificacao.id)
        )
      );
      setNotificacoes((anteriores) =>
        anteriores.map((item) => ({ ...item, lida: true }))
      );
    } catch (e: unknown) {
      const prob = toProblem(e);
      setErro(prob.detail || prob.title || 'Não foi possível marcar todas como lidas.');
    } finally {
      setProcessandoId(null);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setAberto((prev) => !prev)}
        className={`relative p-2 rounded-lg transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-ifpb-teal/40 ${
          aberto
            ? 'bg-ifpb-tealLight text-ifpb-teal'
            : 'text-ifpb-teal hover:text-ifpb-tealHover hover:bg-gray-100'
        }`}
        title="Central de notificações"
        aria-label={`Notificações${pendentes.length > 0 ? ` (${pendentes.length} não lidas)` : ''}`}
        aria-expanded={aberto}
        aria-haspopup="true"
      >
        <Bell className="w-5 h-5" strokeWidth={2.2} />
        {pendentes.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-ifpb-red text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
            {pendentes.length > 9 ? '9+' : pendentes.length}
          </span>
        )}
      </button>

      {aberto && (
        <div
          className="absolute right-0 top-full mt-2 w-[22rem] max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden"
          role="menu"
          aria-orientation="vertical"
        >
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-2 bg-ifpb-breadcrumb/50">
            <div>
              <p className="text-sm font-bold text-ifpb-dark">Notificações</p>
              <p className="text-[11px] text-gray-500">
                {pendentes.length > 0
                  ? `${pendentes.length} pendente${pendentes.length > 1 ? 's' : ''} de leitura`
                  : 'Tudo em dia'}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => void carregar()}
                disabled={carregando}
                title="Recarregar notificações"
                aria-label="Recarregar notificações"
                className="p-1.5 rounded-md text-gray-500 hover:text-ifpb-teal hover:bg-white cursor-pointer disabled:opacity-50"
              >
                <RotateCw className={`w-3.5 h-3.5 ${carregando ? 'animate-spin' : ''}`} />
              </button>
              {pendentes.length > 0 && (
                <button
                  type="button"
                  onClick={() => void marcarTodasComoLidas()}
                  disabled={processandoId !== null}
                  title="Marcar todas como lidas"
                  aria-label="Marcar todas como lidas"
                  className="p-1.5 rounded-md text-gray-500 hover:text-ifpb-teal hover:bg-white cursor-pointer disabled:opacity-50"
                >
                  <CheckCheck className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {erro && (
            <div
              role="alert"
              className="m-3 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
              <p className="text-xs text-red-800 break-words">{erro}</p>
            </div>
          )}

          {carregando && notificacoes.length === 0 && !erro && (
            <div className="px-4 py-8 text-center text-xs text-gray-500">
              Carregando notificações...
            </div>
          )}

          {!carregando && notificacoes.length === 0 && !erro && (
            <div className="px-4 py-8 text-center">
              <Bell className="mx-auto h-8 w-8 text-gray-300" />
              <p className="mt-2 text-xs font-medium text-gray-600">
                Nenhuma notificação no momento
              </p>
            </div>
          )}

          {notificacoes.length > 0 && (
            <ul className="max-h-96 overflow-y-auto divide-y divide-gray-100" role="list">
              {notificacoes.map((notificacao) => {
                const rota = rotaPeiDaNotificacao(notificacao.linkReferencia);
                return (
                  <li key={notificacao.id} className="p-3 hover:bg-gray-50">
                    <div className="flex items-start gap-2">
                      <button
                        type="button"
                        role="menuitem"
                        disabled={processandoId !== null}
                        onClick={() => void marcarComoLida(notificacao, true)}
                        className="flex-1 min-w-0 text-left cursor-pointer disabled:opacity-60"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={`text-xs leading-snug break-words ${
                              notificacao.lida
                                ? 'font-medium text-gray-600'
                                : 'font-bold text-ifpb-dark'
                            }`}
                          >
                            {notificacao.titulo}
                          </p>
                          {!notificacao.lida && (
                            <span
                              className="mt-1 w-2 h-2 rounded-full bg-ifpb-teal shrink-0"
                              aria-label="Não lida"
                            />
                          )}
                        </div>
                        <p className="mt-1 text-[11px] text-gray-600 leading-relaxed whitespace-pre-wrap break-words">
                          {notificacao.mensagem}
                        </p>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <time
                            className="text-[10px] text-gray-400 whitespace-nowrap"
                            dateTime={notificacao.criadoEm}
                          >
                            {formatarData(notificacao.criadoEm)}
                          </time>
                          {rota && (
                            <span className="inline-flex items-center text-[11px] font-bold text-ifpb-teal">
                              Revisar PEI
                              <ChevronRight className="w-3 h-3 ml-0.5" />
                            </span>
                          )}
                        </div>
                      </button>

                      {!notificacao.lida && (
                        <button
                          type="button"
                          onClick={() => void marcarComoLida(notificacao, false)}
                          disabled={processandoId !== null}
                          title="Marcar como lida"
                          aria-label="Marcar como lida"
                          className="p-1.5 rounded-md text-gray-400 hover:text-ifpb-teal hover:bg-ifpb-tealLight cursor-pointer disabled:opacity-50 shrink-0"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
