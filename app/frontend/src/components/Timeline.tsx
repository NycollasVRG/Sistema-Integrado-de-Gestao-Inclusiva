import { Calendar, FileText, Stethoscope } from "lucide-react";
import type { TimelineEventDTO, TimelineEventType } from "../types/timeline";
import { TimelineItem } from "./TimelineItem";

interface TimelineProps {
  events: TimelineEventDTO[];
  loading?: boolean;
  error?: string | null;
}

function getEventIcon(tipo: TimelineEventType) {
  const baseClasses = "w-5 h-5 text-blue-600";

  switch (tipo) {
    case "ESTUDO_DE_CASO":
      return <FileText className={baseClasses} aria-hidden="true" />;
    case "PEI":
      return <Calendar className={baseClasses} aria-hidden="true" />;
    case "PEA":
      return <Stethoscope className={baseClasses} aria-hidden="true" />;
    default:
      return <Calendar className={baseClasses} aria-hidden="true" />;
  }
}

export function Timeline({ events, loading = false, error = null }: TimelineProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Linha do Tempo
        </h2>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-sm text-gray-600">
            Carregando linha do tempo...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Linha do Tempo
        </h2>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-700">
            Erro ao carregar linha do tempo.
            {error && (
              <span className="block mt-1 text-red-600">{error}</span>
            )}
          </p>
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Linha do Tempo
        </h2>
        <div className="text-center py-8">
          <Calendar className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Nenhum registro encontrado.
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Não há registros de acompanhamento para este aluno.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Linha do Tempo
      </h2>
      <div className="relative">
        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200"></div>
        <ul className="space-y-6">
          {events.map((event) => (
            <li key={event.id} className="relative flex items-start">
              <div className="relative flex items-center justify-center w-10 h-10 bg-blue-50 rounded-full border-2 border-blue-200 z-10">
                {getEventIcon(event.tipo)}
              </div>
              <TimelineItem event={event} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
