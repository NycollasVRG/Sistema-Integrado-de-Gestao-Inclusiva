import type {
  PeiRequestDTO,
  PeiResponseDTO,
  PeiUpdateDTO,
} from '../types/pei';
import type { ProblemDetailRFC9457 } from '../types/estudoDeCaso';

// esta tabela fixa um acompanhamento por aluno para uso até a integração.
export const ACOMPANHAMENTO_POR_ALUNO: Record<string, string> = {
  '11111111-1111-1111-1111-111111111111': 'a1111111-0000-0000-0000-000000000001',
  '22222222-2222-2222-2222-222222222222': 'a2222222-0000-0000-0000-000000000002',
  '33333333-3333-3333-3333-333333333333': 'a3333333-0000-0000-0000-000000000003',
  '44444444-4444-4444-4444-444444444444': 'a4444444-0000-0000-0000-000000000004',
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
      const res = await fetch(`${this.baseUrl}/aluno/${alunoId}`);
      if (res.ok) return await res.json();
      if (res.status === 404) return [];
    } catch {
      console.warn('Backend indisponível na listagem de PEI, usando repositório local.');
    }
    return getStoredPeis().filter((p) => p.alunoId === alunoId);
  }

  static async criar(dto: PeiRequestDTO, alunoId: string, usuarioId?: string): Promise<PeiResponseDTO> {
    const userId = usuarioId || this.defaultUserId;
    try {
      const res = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
        body: JSON.stringify(dto),
      });
      if (res.ok) {
        const criado: PeiResponseDTO = await res.json();
        saveStoredPeis([criado, ...getStoredPeis()]);
        return criado;
      }
      if (res.status !== 503) {
        const problem: ProblemDetailRFC9457 = await res.json();
        throw problem;
      }
    } catch (e: any) {
      if (e?.detail || e?.status) throw e;
    }
    console.warn('Backend indisponível, persistindo PEI localmente.');
    const agora = new Date().toISOString();
    const novo: PeiResponseDTO = {
      id: crypto.randomUUID ? crypto.randomUUID() : `mock-${Date.now()}`,
      acompanhamentoId: dto.acompanhamentoId,
      alunoId,
      habilidadesInteresses: dto.habilidadesInteresses,
      propostasAdaptacoes: dto.propostasAdaptacoes,
      criadoEm: agora,
      atualizadoEm: agora,
    };
    saveStoredPeis([novo, ...getStoredPeis()]);
    return novo;
  }

  static async atualizar(id: string, dto: PeiUpdateDTO, usuarioId?: string): Promise<PeiResponseDTO> {
    const userId = usuarioId || this.defaultUserId;
    try {
      const res = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
        body: JSON.stringify(dto),
      });
      if (res.ok) {
        const atualizado: PeiResponseDTO = await res.json();
        saveStoredPeis(getStoredPeis().map((p) => (p.id === id ? atualizado : p)));
        return atualizado;
      }
      if (res.status !== 503) {
        const problem: ProblemDetailRFC9457 = await res.json();
        throw problem;
      }
    } catch (e: any) {
      if (e?.detail || e?.status) throw e;
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
      habilidadesInteresses: dto.habilidadesInteresses,
      propostasAdaptacoes: dto.propostasAdaptacoes,
      atualizadoEm: new Date().toISOString(),
    };
    saveStoredPeis(peis);
    return peis[idx];
  }
}
