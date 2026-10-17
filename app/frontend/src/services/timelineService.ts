import type { TimelineEventDTO } from "../types/timeline";

export async function getTimeline(alunoId: string): Promise<TimelineEventDTO[]> {
  const response = await fetch(`/api/alunos/${alunoId}/timeline`);

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(
      errorText || `Erro ao carregar linha do tempo: ${response.status}`
    );
  }

  const data = (await response.json()) as TimelineEventDTO[];
  return data;
}
