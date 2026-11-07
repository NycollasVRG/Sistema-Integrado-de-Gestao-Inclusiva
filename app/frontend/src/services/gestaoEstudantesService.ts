import { obterTokenGestao } from './authGestaoEstudantes';
import { tratarStatusGlobal } from './apiClient';
import type {
  DadosEstudanteFormulario,
  EstudanteResumo,
  FiltrosEstudantes,
  PaginaEstudantes,
  TagDificuldadeDTO,
} from '../types/gestaoEstudantes';

const API_BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:8080').replace(/\/$/, '');

export class ErroApiAlunos extends Error {
  readonly status: number;

  constructor(status: number, mensagem: string) {
    super(mensagem);
    this.name = 'ErroApiAlunos';
    this.status = status;
  }
}

function normalizarTags(valor: unknown): TagDificuldadeDTO[] {
  if (!Array.isArray(valor)) return [];
  return valor.flatMap((item): TagDificuldadeDTO[] => {
    if (typeof item === 'string') return [{ nome: item }];
    if (typeof item === 'object' && item !== null) {
      const obj = item as Record<string, unknown>;
      if (typeof obj.nome === 'string') {
        return [{ nome: obj.nome, id: typeof obj.id === 'string' ? obj.id : undefined }];
      }
    }
    return [];
  });
}

function normalizarEstudante(valor: unknown): EstudanteResumo {
  if (!valor || typeof valor !== 'object') {
    throw new Error('A API retornou um estudante em formato inválido.');
  }
  const registro = valor as Record<string, unknown>;
  if (typeof registro.id !== 'string') {
    throw new Error('A resposta da API não contém o identificador do estudante.');
  }
  const status = typeof registro.status === 'string' ? registro.status : 'ATIVO';

  // AlunoResponseDTO devolve duas listas paralelas, ordenadas da mesma forma
  // pelo AlunoMapper: tagsDificuldade (nomes) e tagsDificuldadeIds (UUIDs).
  const tags = normalizarTags(
    registro.tagsDificuldade ?? registro.tags ?? registro.tagsDificuldadeNomes,
  );
  const ids = registro.tagsDificuldadeIds;
  if (Array.isArray(ids) && ids.length === tags.length) {
    tags.forEach((tag, indice) => {
      if (typeof ids[indice] === 'string' && ids[indice].trim()) {
        tag.id = ids[indice];
      }
    });
  }

  return {
    id: registro.id,
    nomeCompleto: String(registro.nomeCompleto ?? registro.nome ?? ''),
    matricula: String(registro.matricula ?? ''),
    curso: String(registro.curso ?? ''),
    turma: String(registro.turma ?? ''),
    status,
    ativo: typeof registro.ativo === 'boolean' ? registro.ativo : status === 'ATIVO',
    tagsDificuldade: tags,
  };
}

async function requisitar<T>(
  caminho: string,
  opcoes: { method?: 'GET' | 'POST' | 'PUT' | 'DELETE'; body?: unknown; signal?: AbortSignal } = {},
): Promise<T> {
  const token = obterTokenGestao();
  if (!token) throw new ErroApiAlunos(401, 'Sua sessão expirou. Faça login novamente.');

  const resposta = await fetch(`${API_BASE}${caminho}`, {
    method: opcoes.method ?? 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      ...(opcoes.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(opcoes.body !== undefined ? { body: JSON.stringify(opcoes.body) } : {}),
    signal: opcoes.signal,
  });

  if (!resposta.ok) {
    let mensagem = `Não foi possível concluir a operação (HTTP ${resposta.status}).`;
    try {
      const problema: unknown = await resposta.json();
      if (problema && typeof problema === 'object') {
        const detalhes = problema as { detail?: unknown; title?: unknown };
        if (typeof detalhes.detail === 'string' && detalhes.detail.trim()) mensagem = detalhes.detail;
        else if (typeof detalhes.title === 'string' && detalhes.title.trim()) mensagem = detalhes.title;
      }
    } catch { /* API pode responder sem JSON. */ }
    tratarStatusGlobal(resposta.status, { detail: mensagem });
    throw new ErroApiAlunos(resposta.status, mensagem);
  }

  if (resposta.status === 204) return undefined as T;
  return (await resposta.json()) as T;
}

export const GestaoEstudantesService = {
  // Catálogo completo de indicadores, independente da página atual de estudantes.
  async listarTags(signal?: AbortSignal): Promise<TagDificuldadeDTO[]> {
    const dados = await requisitar<unknown>('/api/indicadores', { signal });
    if (!Array.isArray(dados)) {
      throw new Error('A API de indicadores retornou um formato inesperado.');
    }
    return dados.map((item): TagDificuldadeDTO => {
      if (!item || typeof item !== 'object') {
        throw new Error('A API retornou uma tag em formato inválido.');
      }
      const tag = item as Record<string, unknown>;
      if (typeof tag.id !== 'string' || typeof tag.nome !== 'string') {
        throw new Error('Uma tag retornada pela API está sem id ou nome.');
      }
      return { id: tag.id, nome: tag.nome };
    });
  },

  async listar(filtros: FiltrosEstudantes, signal?: AbortSignal): Promise<PaginaEstudantes> {
    const parametros = new URLSearchParams({
      page: String(filtros.page),
      size: String(filtros.size),
      sort: 'nomeCompleto,asc',
      ativo: String(filtros.ativo),
    });
    if (filtros.termo.trim()) parametros.set('termo', filtros.termo.trim());
    if (filtros.curso.trim()) parametros.set('curso', filtros.curso.trim());
    if (filtros.turma.trim()) parametros.set('turma', filtros.turma.trim());
    if (filtros.tag.trim()) parametros.set('tag', filtros.tag.trim());
    const dados = await requisitar<{
      content: unknown[];
      number: number;
      size: number;
      totalElements: number;
      totalPages: number;
    }>(`/api/alunos?${parametros}`, { signal });
    if (!Array.isArray(dados.content)) {
      throw new Error('Formato de paginação inesperado na resposta da API.');
    }
    return {
      content: dados.content.map(normalizarEstudante),
      number: dados.number,
      size: dados.size,
      totalElements: dados.totalElements,
      totalPages: dados.totalPages,
    };
  },

  async buscarPorId(id: string, signal?: AbortSignal): Promise<EstudanteResumo> {
    const dados = await requisitar<unknown>(`/api/alunos/${encodeURIComponent(id)}`, { signal });
    return normalizarEstudante(dados);
  },

  async criar(dados: DadosEstudanteFormulario): Promise<EstudanteResumo> {
    const resposta = await requisitar<unknown>('/api/alunos', { method: 'POST', body: dados });
    return normalizarEstudante(resposta);
  },

  async atualizar(id: string, dados: DadosEstudanteFormulario): Promise<EstudanteResumo> {
    const resposta = await requisitar<unknown>(`/api/alunos/${encodeURIComponent(id)}`, {
      method: 'PUT', body: dados,
    });
    return normalizarEstudante(resposta);
  },

  async inativar(id: string, status: 'INATIVO' | 'EVADIDO'): Promise<void> {
    const params = new URLSearchParams({ status });
    await requisitar<void>(`/api/alunos/${encodeURIComponent(id)}?${params}`, {
      method: 'DELETE',
    });
  },
};
