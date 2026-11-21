import React, { useEffect, useState } from 'react';
import { AlertCircle, FileBarChart, RotateCw } from 'lucide-react';
import { toProblem } from '../services/apiClient';
import { RaiService } from '../services/raiService';
import type { RaiResponseDTO } from '../types/rai';
import { ModalBase } from './ModalBase';

interface ModalDetalheRaiProps {
  relatorioId: string;
  onClose: () => void;
}

function formatarData(dateTime?: string | null): string {
  if (!dateTime) return '—';
  try {
    return new Date(dateTime).toLocaleString('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  } catch {
    return dateTime;
  }
}

/** Detalhe de RAI/RAE a partir da Linha do Tempo (TA9.2 / TA9.3). */
export const ModalDetalheRai: React.FC<ModalDetalheRaiProps> = ({
  relatorioId,
  onClose,
}) => {
  const [relatorio, setRelatorio] = useState<RaiResponseDTO | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const controlador = new AbortController();
    setCarregando(true);
    setErro(null);

    RaiService.buscarPorId(relatorioId, controlador.signal)
      .then((dados) => {
        if (!controlador.signal.aborted) setRelatorio(dados);
      })
      .catch((e: unknown) => {
        if (controlador.signal.aborted) return;
        const prob = toProblem(e);
        setErro(prob.detail || prob.title || 'Não foi possível carregar o relatório.');
      })
      .finally(() => {
        if (!controlador.signal.aborted) setCarregando(false);
      });

    return () => controlador.abort();
  }, [relatorioId]);

  return (
    <ModalBase
      isOpen
      onClose={onClose}
      isLoading={carregando}
      titulo={
        relatorio?.tipoRelatorio === 'RAE'
          ? 'Detalhes do RAE'
          : 'Detalhes do RAI'
      }
      subtitulo="Registro emitido e disponível na Linha do Tempo do estudante"
      icone={<FileBarChart className="w-5 h-5" />}
      footer={
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2.5 rounded-lg text-xs font-bold text-white bg-ifpb-teal hover:bg-ifpb-tealHover shadow-sm transition-colors cursor-pointer"
        >
          Fechar
        </button>
      }
    >
      {carregando && (
        <div className="flex items-center justify-center py-8 text-xs text-gray-500">
          <RotateCw className="w-4 h-4 animate-spin mr-2 text-ifpb-teal" />
          Carregando relatório...
        </div>
      )}

      {erro && !carregando && (
        <div
          role="alert"
          className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2"
        >
          <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
          <p className="text-xs text-red-800 break-words">{erro}</p>
        </div>
      )}

      {relatorio && !carregando && !erro && (
        <div className="space-y-4">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-ifpb-breadcrumb/60 border border-gray-200">
              <dt className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                Tipo de relatório
              </dt>
              <dd className="mt-1 text-sm font-semibold text-ifpb-dark">
                {relatorio.tipoRelatorio}
              </dd>
            </div>
            <div className="p-3 rounded-lg bg-ifpb-breadcrumb/60 border border-gray-200">
              <dt className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                Bimestre de referência
              </dt>
              <dd className="mt-1 text-sm font-semibold text-ifpb-dark">
                {relatorio.bimestre}º bimestre
              </dd>
            </div>
            <div className="p-3 rounded-lg bg-ifpb-breadcrumb/60 border border-gray-200">
              <dt className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                Emitido em
              </dt>
              <dd className="mt-1 text-sm font-semibold text-ifpb-dark">
                {formatarData(relatorio.criadoEm)}
              </dd>
            </div>
            <div className="p-3 rounded-lg bg-ifpb-breadcrumb/60 border border-gray-200">
              <dt className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                Indicativo de regressão
              </dt>
              <dd className="mt-1">
                {relatorio.indicativoRegressao ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                    Sim — PEI encaminhado ao Coordenador
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Não — progressão registrada
                  </span>
                )}
              </dd>
            </div>
          </dl>

          <div>
            <p className="text-xs font-bold text-ifpb-dark mb-1">Descrição / Evidências</p>
            <div className="p-3 rounded-lg border border-gray-200 bg-white text-xs text-gray-700 whitespace-pre-wrap break-words leading-relaxed">
              {relatorio.descricao?.trim() || 'Nenhuma descrição informada.'}
            </div>
          </div>
        </div>
      )}
    </ModalBase>
  );
};
