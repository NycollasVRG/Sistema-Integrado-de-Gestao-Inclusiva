import type { TimelineEventDTO, TimelineEventType } from "../types/timeline";

interface TimelineItemProps {
  event: TimelineEventDTO;
}

function getEventLabel(tipo: TimelineEventType): string {
  switch (tipo) {
    case "ESTUDO_DE_CASO":
      return "Estudo de Caso";
    case "PEI":
      return "PEI";
    case "PEA":
      return "PEA";
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

export function TimelineItem({ event }: TimelineItemProps) {
  return (
    <div className="ml-4 flex-1 min-w-0">
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-sm font-medium text-gray-900">
            {getEventLabel(event.tipo)}
          </h3>
          <time
            className="text-xs text-gray-500 whitespace-nowrap"
            dateTime={event.dataCriacao}
          >
            {formatDateTime(event.dataCriacao)}
          </time>
        </div>
      </div>
    </div>
  );
}
