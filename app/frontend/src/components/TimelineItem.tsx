import { Eye, Lock, Pencil } from "lucide-react";
import type { TimelineEventDTO, TimelineEventType } from "../types/timeline";
import type { NovoAtendimentoResponseDTO } from "../types/prontuarioAcoes";
import {
  MENSAGEM_BLOQUEIO,
  formatarDataAtendimento,
  formatarTempoRestante,
  limiteEdicao,
  motivoBloqueioEdicao,
  rotuloTipoAtendimento,
} from "../utils/atendimento";

interface TimelineItemProps {
  event: TimelineEventDTO;
  /** Detalhes do atendimento (somente para eventos do tipo ATENDIMENTO), quando já carregados. */
  atendimento?: NovoAtendimentoResponseDTO;
  /** Usuário logado e relógio atual, para decidir o estado de edição (TA4.4). */
  userId?: string | null;
  agora: number;
  onVisualizarAtendimento?: (atendimentoId: string) => void;
  /** Habilita o detalhe de eventos RAI/RAE (TA9.2 / TA9.3). */
  onVisualizarRelatorio?: (relatorioId: string) => void;
}

function getEventLabel(tipo: TimelineEventType): string {
  switch (tipo) {
    case "ESTUDO_DE_CASO":
      return "Estudo de Caso";
    case "PEI":
      return "PEI";
    case "PEA":
      return "PEA";
    case "ATENDIMENTO":
      return "Atendimento";
    case "RAI":
      return "RAI — Relatório de Acompanhamento Individualizado";
    case "RAE":
      return "RAE — Relatório de Atendimento Educacional";
    default:
      return "Registro";
  }
}

function formatDateTime(dateTime: string): string {
  try {
    const date = new Date(dateTime);
    return date.toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return dateTime;
  }
}

export function TimelineItem({
  event,
  atendimento,
  userId = null,
  agora,
  onVisualizarAtendimento,
  onVisualizarRelatorio,
}: TimelineItemProps) {
  const ehAtendimento = event.tipo === "ATENDIMENTO" && !!onVisualizarAtendimento;
  const ehRelatorio =
    (event.tipo === "RAI" || event.tipo === "RAE") && !!onVisualizarRelatorio;

  const motivo = atendimento ? motivoBloqueioEdicao(atendimento, userId, agora) : null;
  const limite = atendimento ? limiteEdicao(atendimento) : null;

  return (
    <div className="ml-4 flex-1 min-w-0">
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-sm font-medium text-gray-900">
            {getEventLabel(event.tipo)}
            {event.tipo === "ATENDIMENTO" && atendimento && (
              <span className="ml-2 text-xs font-normal text-gray-500">
                {rotuloTipoAtendimento(atendimento.tipoAtendimento)}
              </span>
            )}
          </h3>
          <time
            className="text-xs text-gray-500 whitespace-nowrap"
            dateTime={event.dataCriacao}
          >
            {formatDateTime(event.dataCriacao)}
          </time>
        </div>

        {ehAtendimento && atendimento && (
          <div className="mt-2 space-y-1">
            <p className="text-xs text-gray-600">
              {formatarDataAtendimento(atendimento.dataAtendimento)} &bull; {atendimento.profissionalResponsavel}
            </p>
            <p className="text-xs text-gray-700 line-clamp-2 whitespace-pre-wrap break-words">
              {atendimento.descricao}
            </p>
          </div>
        )}

        {ehRelatorio && (
          <div className="mt-3 flex items-center justify-between flex-wrap gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-ifpb-tealLight text-ifpb-teal border border-ifpb-teal/20">
              Registro bimestral
            </span>
            <button
              type="button"
              onClick={() => onVisualizarRelatorio?.(event.id)}
              className="inline-flex items-center text-xs font-semibold text-ifpb-teal hover:text-ifpb-tealHover hover:underline cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 mr-1" />
              Ver detalhes
            </button>
          </div>
        )}

        {ehAtendimento && (
          <div className="mt-3 flex items-center justify-between flex-wrap gap-2">
            {atendimento ? (
              motivo === null ? (
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200"
                  title="Você é o autor e ainda está dentro da janela de 24h"
                >
                  <Pencil className="w-3 h-3 mr-1" />
                  Editável
                  {limite !== null && ` por mais ${formatarTempoRestante(limite - agora)}`}
                </span>
              ) : (
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-gray-100 text-gray-600 border border-gray-200"
                  title={MENSAGEM_BLOQUEIO[motivo]}
                >
                  <Lock className="w-3 h-3 mr-1" />
                  {motivo === "NAO_AUTOR" ? "Edição bloqueada (outro autor)" : "Edição bloqueada (prazo de 24h encerrado)"}
                </span>
              )
            ) : (
              <span />
            )}

            <button
              type="button"
              onClick={() => onVisualizarAtendimento?.(event.id)}
              className="inline-flex items-center text-xs font-semibold text-ifpb-teal hover:text-ifpb-tealHover hover:underline cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 mr-1" />
              Ver detalhes
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
