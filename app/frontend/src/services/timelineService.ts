import type { TimelineEventDTO } from '../types/timeline';
import { EstudoDeCasoService } from './estudoDeCasoService';
import { PeiService } from './peiService';
import { ProntuarioService } from './prontuarioService';
import { apiFetch, usarFallbackLocal } from './apiClient';

function ordenarPorDataCriacao(eventos: TimelineEventDTO[]): TimelineEventDTO[] {
  return [...eventos].sort((a, b) => {
    const tA = new Date(a.dataCriacao).getTime();
    const tB = new Date(b.dataCriacao).getTime();
    if (tA !== tB) return tA - tB;
    return a.id.localeCompare(b.id);
  });
}

async function montarEventosLocais(alunoId: string): Promise<TimelineEventDTO[]> {
  const eventos: TimelineEventDTO[] = [];

  const [estudos, peis, atendimentos] = await Promise.all([
    EstudoDeCasoService.listarPorAluno(alunoId),
    PeiService.listarPorAluno(alunoId),
    ProntuarioService.listarAtendimentosPorAluno(alunoId),
  ]);

  for (const est of estudos) {
    eventos.push({
      id: est.id,
      tipo: 'ESTUDO_DE_CASO',
      dataCriacao: est.criadoEm || est.atualizadoEm || new Date().toISOString(),
    });
  }

  for (const pei of peis) {
    eventos.push({
      id: pei.id,
      tipo: 'PEI',
      dataCriacao: pei.criadoEm || pei.atualizadoEm || new Date().toISOString(),
    });
  }

  for (const atend of atendimentos) {
    eventos.push({
      id: atend.id,
      tipo: 'ATENDIMENTO',
      dataCriacao: atend.criadoEm,
    });
  }

  return ordenarPorDataCriacao(eventos);
}

export async function getTimeline(alunoId: string): Promise<TimelineEventDTO[]> {
  try {
    const response = await apiFetch(`/api/alunos/${alunoId}/timeline`);

    const backendEvents = (await response.json()) as TimelineEventDTO[];
    const atendimentosLocais = await ProntuarioService.listarAtendimentosPorAluno(alunoId);

    // Atendimentos ainda são mock (sem endpoint): tipo próprio para não colidir com o PEA real do Back.
    const eventosMockAtendimento: TimelineEventDTO[] = atendimentosLocais.map((atend) => ({
      id: atend.id,
      tipo: 'ATENDIMENTO',
      dataCriacao: atend.criadoEm,
    }));

    const idsExistentes = new Set(backendEvents.map((e) => e.id));
    const mesclados = [
      ...backendEvents,
      ...eventosMockAtendimento.filter((e) => !idsExistentes.has(e.id)),
    ];

    return ordenarPorDataCriacao(mesclados);
  } catch (e: unknown) {
    if (!usarFallbackLocal(e)) throw e;
    console.warn('Backend indisponível na Timeline, utilizando agregação local de fallback.');
  }

  return montarEventosLocais(alunoId);
}
