import type {
  PeiRequestDTO,
  PeiResponseDTO,
  PeiUpdateDTO,
} from '../types/pei';
import type { ProblemDetailRFC9457 } from '../types/estudoDeCaso';
import { apiFetch, usarFallbackLocal } from './apiClient';
import { USE_LOCAL_FALLBACK } from '../config/featureFlags';

// esta tabela fixa um acompanhamento por aluno para uso até a integração.
// Os UUIDs abaixo são os do seed da US03 (backend/collection/US03/seed_test_data.sql),
// que só cria acompanhamento para os alunos 1111... e 2222...
export const ACOMPANHAMENTO_POR_ALUNO: Record<string, string> = {
  '11111111-1111-1111-1111-111111111111': '33333333-3333-3333-3333-333333333333',
  '22222222-2222-2222-2222-222222222222': '44444444-4444-4444-4444-444444444444',
};

const STORAGE_KEY = 'sigi_clai_peis';

function getStoredPeis(): PeiResponseDTO[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Falha ao ler cache local de PEIs:', e);
  }
  return [];
}

function saveStoredPeis(peis: PeiResponseDTO[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(peis));
  } catch (e) {
    console.error('Falha ao gravar cache local de PEIs:', e);
  }
}

export class PeiService {
  private static baseUrl = '/api/peis';
  private static defaultUserId = '99999999-9999-9999-9999-999999999999';

  static async listarPorAluno(alunoId: string): Promise<PeiResponseDTO[]> {
    try {
      const res = await apiFetch(`${this.baseUrl}/aluno/${alunoId}`);
      return await res.json();
    } catch (e: unknown) {
      if (!usarFallbackLocal(e)) throw e;
      console.warn('Backend indisponível na listagem de PEI, usando repositório local.');
    }
    return getStoredPeis().filter((p) => p.alunoId === alunoId);
  }

  static async criar(dto: PeiRequestDTO, alunoId: string, usuarioId?: string): Promise<PeiResponseDTO> {
    const userId = usuarioId || this.defaultUserId;
    const payload: PeiRequestDTO = {
      acompanhamentoId: dto.acompanhamentoId,
      habilidadesInteresses: dto.habilidadesInteresses.trim(),
      propostasAdaptacoes: dto.propostasAdaptacoes.trim(),
    };
    try {
      const res = await apiFetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
        body: JSON.stringify(payload),
      });
      const criado: PeiResponseDTO = await res.json();
      if (USE_LOCAL_FALLBACK) {
        saveStoredPeis([criado, ...getStoredPeis()]);
      }
      return criado;
    } catch (e: unknown) {
      if (!usarFallbackLocal(e)) throw e;
    }
    console.warn('Backend indisponível, persistindo PEI localmente.');
    const agora = new Date().toISOString();
    const novo: PeiResponseDTO = {
      id: crypto.randomUUID ? crypto.randomUUID() : `mock-${Date.now()}`,
      acompanhamentoId: payload.acompanhamentoId,
      alunoId,
      habilidadesInteresses: payload.habilidadesInteresses,
      propostasAdaptacoes: payload.propostasAdaptacoes,
      criadoEm: agora,
      atualizadoEm: agora,
    };
    saveStoredPeis([novo, ...getStoredPeis()]);
    return novo;
  }

  static async atualizar(id: string, dto: PeiUpdateDTO, usuarioId?: string): Promise<PeiResponseDTO> {
    const userId = usuarioId || this.defaultUserId;
    const payload: PeiUpdateDTO = {
      habilidadesInteresses: dto.habilidadesInteresses !== undefined ? dto.habilidadesInteresses.trim() : undefined,
      propostasAdaptacoes: dto.propostasAdaptacoes !== undefined ? dto.propostasAdaptacoes.trim() : undefined,
    };
    try {
      const res = await apiFetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
        body: JSON.stringify(payload),
      });
      const atualizado: PeiResponseDTO = await res.json();
      if (USE_LOCAL_FALLBACK) {
        saveStoredPeis(getStoredPeis().map((p) => (p.id === id ? atualizado : p)));
      }
      return atualizado;
    } catch (e: unknown) {
      if (!usarFallbackLocal(e)) throw e;
    }
    console.warn('Backend indisponível, atualizando PEI localmente.');
    const peis = getStoredPeis();
    const idx = peis.findIndex((p) => p.id === id);
    if (idx === -1) {
      const notFound: ProblemDetailRFC9457 = {
        title: 'Recurso Não Encontrado',
        status: 404,
        detail: 'PEI não encontrado com o ID fornecido.',
      };
      throw notFound;
    }
    peis[idx] = {
      ...peis[idx],
      habilidadesInteresses: payload.habilidadesInteresses || peis[idx].habilidadesInteresses,
      propostasAdaptacoes: payload.propostasAdaptacoes || peis[idx].propostasAdaptacoes,
      atualizadoEm: new Date().toISOString(),
    };
    saveStoredPeis(peis);
    return peis[idx];
  }
}
