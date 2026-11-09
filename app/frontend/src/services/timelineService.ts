import type { TimelineEventDTO } from '../types/timeline';
import { apiFetch } from './apiClient';

function ordenarPorDataCriacao(eventos: TimelineEventDTO[]): TimelineEventDTO[] {
  return [...eventos].sort((a, b) => {
    const tA = new Date(a.dataCriacao).getTime();
    const tB = new Date(b.dataCriacao).getTime();
    if (tA !== tB) return tA - tB;
    return a.id.localeCompare(b.id);
  });
}

export async function getTimeline(alunoId: string): Promise<TimelineEventDTO[]> {
  const response = await apiFetch(`/api/alunos/${encodeURIComponent(alunoId)}/timeline`);
  const backendEvents = (await response.json()) as TimelineEventDTO[];
  return ordenarPorDataCriacao(backendEvents);
}
