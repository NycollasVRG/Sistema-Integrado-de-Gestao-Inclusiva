import React from 'react';
import { AlertCircle, ChevronRight, FileText, Plus, ScrollText } from 'lucide-react';
import type { AtaReuniaoResponseDTO } from '../types/ata';
import { ROTULO_STATUS_ATA, ROTULO_TIPO_REUNIAO } from '../types/ata';

interface SecaoAtasReuniaoProps {
  atas: AtaReuniaoResponseDTO[];
  loading?: boolean;
  error?: string | null;
  podeGerir?: boolean;
  onNovaAta: () => void;
  onAbrirAta: (ata: AtaReuniaoResponseDTO) => void;
  onEmitirTermo?: (ata: AtaReuniaoResponseDTO) => void;
}

function formatarData(valor?: string | null): string {
  if (!valor) return '—';
  try {
    return new Date(valor).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return valor;
  }
}

/** Seção do prontuário com as Atas de Reunião do estudante (US 08). */
export const SecaoAtasReuniao: React.FC<SecaoAtasReuniaoProps> = ({
  atas,
  loading = false,
  error = null,
  podeGerir = false,
  onNovaAta,
  onAbrirAta,
  onEmitirTermo,
}) => {
  const finalizadas = atas.filter((ata) => ata.status === 'FINALIZADA').length;

  return (
    <section
      aria-label="Atas de Reunião"
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-ifpb-tealLight text-ifpb-teal">
            <ScrollText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Atas de Reunião</h2>
            <p className="text-xs text-gray-500">
              Registros, assinaturas e termos aditivos integrados ao prontuário
              {atas.length > 0 && ` • ${finalizadas} finalizada(s) de ${atas.length}`}
            </p>
          </div>
        </div>
        {podeGerir && (
          <button
            type="button"
            onClick={onNovaAta}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white bg-ifpb-teal hover:bg-ifpb-tealHover transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Nova Ata
          </button>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-6 text-xs text-gray-500">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-ifpb-teal mr-2" />
          Carregando atas de reunião...
        </div>
      )}

      {!loading && error && (
        <div role="alert" className="bg-red-50 border border-red-200 rounded-md p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <p className="text-xs text-red-800 break-words">{error}</p>
        </div>
      )}

      {!loading && !error && atas.length === 0 && (
        <div className="text-center py-6">
          <FileText className="mx-auto h-10 w-10 text-gray-400" />
          <p className="mt-2 text-sm font-medium text-gray-900">Nenhuma ata de reunião registrada.</p>
          <p className="mt-1 text-xs text-gray-500">
            {podeGerir
              ? 'Registre a primeira ata para documentar reuniões e compromissos.'
              : 'Somente equipe CLAI/Coordenação pode registrar atas.'}
          </p>
        </div>
      )}

      {!loading && !error && atas.length > 0 && (
        <ul className="divide-y divide-gray-200">
          {atas.slice(0, 8).map((ata) => {
            const finalizada = ata.status === 'FINALIZADA';
            return (
              <li key={ata.id} className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <button
                  type="button"
                  onClick={() => onAbrirAta(ata)}
                  className="text-left min-w-0 flex-1 cursor-pointer group"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-ifpb-dark group-hover:underline">
                      {ROTULO_TIPO_REUNIAO[ata.tipoReuniao]}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${
                      finalizada
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}>
                      {ROTULO_STATUS_ATA[ata.status]}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-600 line-clamp-1 break-words">{ata.pauta}</p>
                  <p className="mt-1 text-[11px] text-gray-500">
                    {formatarData(ata.dataReuniao)} &bull; {ata.assinaturas.length} assinatura(s) &bull;{' '}
                    {ata.compromissos.length} compromisso(s)
                  </p>
                </button>

                <div className="flex items-center gap-2 shrink-0">
                  {finalizada && podeGerir && onEmitirTermo && (
                    <button
                      type="button"
                      onClick={() => onEmitirTermo(ata)}
                      className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-ifpb-teal border border-ifpb-teal/30 bg-ifpb-tealLight/40 hover:bg-ifpb-tealLight transition-colors cursor-pointer"
                    >
                      Emitir Termo Aditivo
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onAbrirAta(ata)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-ifpb-teal hover:underline cursor-pointer"
                  >
                    {!finalizada && podeGerir ? 'Continuar' : 'Ver detalhes'}
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
