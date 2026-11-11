import type { TimelineEventDTO } from '../types/timeline';
import { apiFetch } from './apiClient';

function extrairTimestamp(dataCriacao: string | null | undefined): number | null {
  if (!dataCriacao) return null;
  const ts = new Date(dataCriacao).getTime();
  return Number.isNaN(ts) ? null : ts;
}

function ordenarPorDataCriacao(eventos: TimelineEventDTO[]): TimelineEventDTO[] {
  return [...eventos].sort((a, b) => {
    const tA = extrairTimestamp(a.dataCriacao);
    const tB = extrairTimestamp(b.dataCriacao);

    if (tA === null && tB !== null) return 1;
    if (tA !== null && tB === null) return -1;
    if (tA !== null && tB !== null && tA !== tB) return tA - tB;

    return (a.id ?? '').localeCompare(b.id ?? '');
  });
}

export async function getTimeline(alunoId: string, signal?: AbortSignal): Promise<TimelineEventDTO[]> {
  const response = await apiFetch(`/api/alunos/${encodeURIComponent(alunoId)}/timeline`, { signal });
  const backendEvents = (await response.json()) as TimelineEventDTO[];
  return ordenarPorDataCriacao(backendEvents);
}
