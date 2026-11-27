import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileSignature,
  RotateCw,
  ScrollText,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { ModalBase } from './ModalBase';
import { ModalTermoAditivo } from './ModalTermoAditivo';
import { AtaService } from '../services/ataService';
import { isProblem } from '../services/apiClient';
import type {
  AtaReuniaoResponseDTO,
  TermoAditivoResponseDTO,
} from '../types/ata';
import { ROTULO_STATUS_ATA, ROTULO_TIPO_REUNIAO } from '../types/ata';

interface ModalDetalheAtaProps {
  ataId: string;
  ataInicial?: AtaReuniaoResponseDTO | null;
  modoInicial?: 'DETALHE' | 'TERMO';
  podeGerir?: boolean;
  onClose: () => void;
  onAtualizada?: (ata: AtaReuniaoResponseDTO) => void;
  onTermoAdicionado?: (termo: TermoAditivoResponseDTO) => void;
  onEditarRascunho?: (ata: AtaReuniaoResponseDTO) => void;
}

function formatarData(valor?: string | null): string {
  if (!valor) return '—';
  try {
    return new Date(valor).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return valor;
  }
}

function formatarTamanho(bytes?: number | null): string {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Detalhe de ata a partir do prontuário ou da Linha do Tempo (US 08).
 * Ata FINALIZADA é exibida somente leitura; a única ação de alteração é o Termo Aditivo (TA8.4).
 */
export const ModalDetalheAta: React.FC<ModalDetalheAtaProps> = ({
  ataId,
  ataInicial = null,
  modoInicial = 'DETALHE',
  podeGerir = false,
  onClose,
  onAtualizada,
  onTermoAdicionado,
  onEditarRascunho,
}) => {
  const [ata, setAta] = useState<AtaReuniaoResponseDTO | null>(ataInicial);
  const [carregando, setCarregando] = useState(!ataInicial);
  const [erro, setErro] = useState<string | null>(null);
  const [modo, setModo] = useState<'DETALHE' | 'TERMO'>(modoInicial);
  const [concluindoId, setConcluindoId] = useState<string | null>(null);
  const [erroAcao, setErroAcao] = useState<string | null>(null);

  useEffect(() => {
    const controlador = new AbortController();
    AtaService.buscarPorId(ataId, controlador.signal)
      .then((dados) => {
        if (!controlador.signal.aborted) setAta(dados);
      })
      .catch((e: unknown) => {
        if (controlador.signal.aborted) return;
        const prob = isProblem(e) ? e : null;
        setErro(prob?.detail || prob?.title || 'Não foi possível carregar os detalhes da ata.');
      })
      .finally(() => {
        if (!controlador.signal.aborted) setCarregando(false);
      });
    return () => controlador.abort();
  }, [ataId]);

  const concluirCompromisso = async (compromissoId: string) => {
    if (!ata) return;
    setErroAcao(null);
    setConcluindoId(compromissoId);
    try {
      const atualizado = await AtaService.concluirCompromisso(ata.id, compromissoId);
      const proxima: AtaReuniaoResponseDTO = {
        ...ata,
        compromissos: ata.compromissos.map((c) => (c.id === compromissoId ? atualizado : c)),
      };
      setAta(proxima);
      onAtualizada?.(proxima);
    } catch (e: unknown) {
      const prob = isProblem(e) ? e : null;
      setErroAcao(prob?.detail || prob?.title || 'Não foi possível concluir o compromisso.');
    } finally {
      setConcluindoId(null);
    }
  };

  const afterTermo = async (termo: TermoAditivoResponseDTO) => {
    const atualizada = await AtaService.buscarPorId(ataId);
    setAta(atualizada);
    onAtualizada?.(atualizada);
    onTermoAdicionado?.(termo);
    setModo('DETALHE');
  };

  const finalizada = ata?.status === 'FINALIZADA';
  const podeEmitirTermo = finalizada && podeGerir;

  return (
    <ModalBase
      isOpen
      onClose={onClose}
      isLoading={carregando}
      maxWidthClass="max-w-4xl"
      titulo={modo === 'TERMO' ? 'Emitir Termo Aditivo' : 'Detalhes da Ata de Reunião'}
      subtitulo={
        ata
          ? `${ROTULO_TIPO_REUNIAO[ata.tipoReuniao]} • ${ROTULO_STATUS_ATA[ata.status]}`
          : 'Registro de reunião do prontuário'
      }
      icone={<ScrollText className="w-5 h-5" />}
      footer={
        modo === 'TERMO' ? undefined : (
          <>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
            >
              Fechar
            </button>
            {podeEmitirTermo && (
              <button
                type="button"
                onClick={() => setModo('TERMO')}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-bold text-white bg-ifpb-teal hover:bg-ifpb-tealHover transition-colors cursor-pointer"
              >
                <FileSignature className="w-4 h-4" />
                Emitir Termo Aditivo
              </button>
            )}
            {!finalizada && podeGerir && onEditarRascunho && ata && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEditarRascunho(ata);
                }}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-bold text-white bg-ifpb-teal hover:bg-ifpb-tealHover transition-colors cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                Editar Rascunho
              </button>
            )}
          </>
        )
      }
    >
      {carregando && (
        <div className="flex items-center justify-center py-8 text-xs text-gray-500">
          <RotateCw className="w-4 h-4 animate-spin mr-2 text-ifpb-teal" />
          Carregando ata...
        </div>
      )}

      {erro && !carregando && (
        <div role="alert" className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <p className="text-xs text-red-800 break-words">{erro}</p>
        </div>
      )}

      {modo === 'TERMO' ? (
        <ModalTermoAditivo
          ataId={ataId}
          onCancelar={() => setModo('DETALHE')}
          onSucesso={afterTermo}
        />
      ) : (
        ata && !carregando && !erro && (
          <div className="space-y-5">
            {erroAcao && (
              <div role="alert" className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-800">
                {erroAcao}
              </div>
            )}

            {finalizada && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-800 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Ata finalizada em {formatarData(ata.finalizadaEm)}. Campos originais em modo
                  somente leitura; alterações devem ser registradas por Termo Aditivo.
                </span>
              </div>
            )}

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-lg border border-gray-200 bg-ifpb-breadcrumb/40 p-3">
                <dt className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Data da reunião</dt>
                <dd className="mt-1 text-sm font-semibold text-ifpb-dark">{formatarData(ata.dataReuniao)}</dd>
              </div>
              <div className="rounded-lg border border-gray-200 bg-ifpb-breadcrumb/40 p-3">
                <dt className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Local</dt>
                <dd className="mt-1 text-sm font-semibold text-ifpb-dark">{ata.localReuniao || '—'}</dd>
              </div>
              <div className="rounded-lg border border-gray-200 bg-ifpb-breadcrumb/40 p-3">
                <dt className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Registrada em</dt>
                <dd className="mt-1 text-sm font-semibold text-ifpb-dark">{formatarData(ata.criadoEm)}</dd>
              </div>
              <div className="rounded-lg border border-gray-200 bg-ifpb-breadcrumb/40 p-3">
                <dt className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Estudante</dt>
                <dd className="mt-1 text-sm font-semibold text-ifpb-dark">{ata.alunoNome || '—'}</dd>
              </div>
            </dl>

            <div>
              <p className="text-xs font-bold text-ifpb-dark mb-1">Pauta</p>
              <div className="rounded-lg border border-gray-200 bg-white p-3 text-xs text-gray-700 whitespace-pre-wrap break-words">
                {ata.pauta}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-ifpb-dark mb-1">Deliberações</p>
              <div className="rounded-lg border border-gray-200 bg-white p-3 text-xs text-gray-700 whitespace-pre-wrap break-words">
                {ata.deliberacoes?.trim() || 'Nenhuma deliberação registrada.'}
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 p-3">
              <p className="text-xs font-bold text-ifpb-dark mb-2">Documento assinado</p>
              {ata.documentoAssinadoAnexado ? (
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <p className="text-xs text-gray-600">
                    {ata.documentoNomeOriginal || 'documento'} • {formatarTamanho(ata.documentoTamanhoBytes)}
                  </p>
                  <button
                    type="button"
                    onClick={() => void AtaService.baixarDocumentoAssinado(ata)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-ifpb-teal hover:underline cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> Baixar documento
                  </button>
                </div>
              ) : (
                <p className="text-xs text-gray-500">Nenhum documento assinado foi anexado a esta ata.</p>
              )}
            </div>

            <div className="rounded-lg border border-gray-200 p-3">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-ifpb-teal" />
                <p className="text-xs font-bold text-ifpb-dark">Participantes e assinaturas digitais</p>
              </div>
              {ata.assinaturas.length === 0 ? (
                <p className="text-xs text-gray-500">Nenhuma assinatura digital coletada.</p>
              ) : (
                <ul className="space-y-2">
                  {ata.assinaturas.map((a) => (
                    <li key={a.id} className="rounded-md bg-gray-50 border border-gray-200 p-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <p className="text-xs font-semibold text-ifpb-dark">
                          {a.nomeParticipante} <span className="font-normal text-gray-500">({a.papelParticipante})</span>
                        </p>
                        <span className="text-[11px] text-gray-500">{formatarData(a.assinadoEm)}</span>
                      </div>
                      <p className="mt-1 text-[10px] text-gray-500 break-all">
                        Hash: {a.hashConteudo || '—'}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-lg border border-gray-200 p-3">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-ifpb-teal" />
                <p className="text-xs font-bold text-ifpb-dark">Compromissos e prazos</p>
              </div>
              {ata.compromissos.length === 0 ? (
                <p className="text-xs text-gray-500">Nenhum compromisso registrado.</p>
              ) : (
                <ul className="space-y-2">
                  {ata.compromissos.map((c) => (
                    <li key={c.id} className="rounded-md bg-gray-50 border border-gray-200 p-2 flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-ifpb-dark break-words">{c.descricao}</p>
                        <p className="mt-1 text-[11px] text-gray-500">
                          {c.responsavelNome || 'Responsável não informado'} • Prazo: {formatarData(c.prazo)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${
                          c.status === 'CONCLUIDO'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          {c.status === 'CONCLUIDO' ? 'Concluído' : 'Pendente'}
                        </span>
                        {c.status === 'PENDENTE' && podeGerir && (
                          <button
                            type="button"
                            onClick={() => void concluirCompromisso(c.id)}
                            disabled={concluindoId !== null}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-ifpb-teal hover:underline cursor-pointer disabled:opacity-50"
                          >
                            {concluindoId === c.id ? <RotateCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                            Concluir
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-lg border border-gray-200 p-3">
              <div className="flex items-center gap-2 mb-2">
                <FileSignature className="w-4 h-4 text-ifpb-teal" />
                <p className="text-xs font-bold text-ifpb-dark">Termos aditivos</p>
              </div>
              {ata.termosAditivos.length === 0 ? (
                <p className="text-xs text-gray-500">Nenhum termo aditivo emitido.</p>
              ) : (
                <ul className="space-y-2">
                  {ata.termosAditivos.map((t) => (
                    <li key={t.id} className="rounded-md bg-gray-50 border border-gray-200 p-2">
                      <p className="text-xs text-gray-700 whitespace-pre-wrap break-words">{t.texto}</p>
                      <p className="mt-1 text-[10px] text-gray-500">{formatarData(t.criadoEm)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {podeEmitirTermo && (
              <button
                type="button"
                onClick={() => setModo('TERMO')}
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold text-ifpb-teal border border-ifpb-teal/30 bg-ifpb-tealLight/40 hover:bg-ifpb-tealLight transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                Emitir Termo Aditivo
              </button>
            )}
          </div>
        )
      )}
    </ModalBase>
  );
};
