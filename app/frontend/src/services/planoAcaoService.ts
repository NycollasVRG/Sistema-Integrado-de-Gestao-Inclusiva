import type {
  PlanoAcaoRequestDTO,
  PlanoAcaoResponseDTO,
  PlanoAcaoUpdateDTO,
} from '../types/planoAcao';
import { apiFetch } from './apiClient';
import { getAcompanhamento, type AcompanhamentoDTO } from './alunoService';

export type {
  DadosFormularioPlanoAcao,
  PlanoAcaoRequestDTO,
  PlanoAcaoResponseDTO,
  PlanoAcaoUpdateDTO,
} from '../types/planoAcao';

function normalizarCampoCriacao(valor: string | null | undefined): string | null {
  if (!valor) return null;
  const limpo = valor.trim();
  return limpo.length > 0 ? limpo : null;
}

function normalizarCampoAtualizacao(valor: string | null | undefined): string | null | undefined {
  if (valor === undefined) return undefined;
  return normalizarCampoCriacao(valor);
}

function normalizarPlanoAcao(plano: PlanoAcaoResponseDTO): PlanoAcaoResponseDTO {
  return {
    ...plano,
    nomeEstudante: plano.nomeEstudante ?? null,
    matriculaEstudante: plano.matriculaEstudante ?? null,
    cursoEstudante: plano.cursoEstudante ?? null,
    demandasIdentificadas: plano.demandasIdentificadas ?? null,
    propostasIntervencao: plano.propostasIntervencao ?? null,
    componenteCurricular: plano.componenteCurricular ?? null,
    semestreAno: plano.semestreAno ?? null,
    docente: plano.docente ?? null,
    objetivoGeral: plano.objetivoGeral ?? null,
    objetivosEspecificos: plano.objetivosEspecificos ?? null,
    conteudosProgramaticos: plano.conteudosProgramaticos ?? null,
    metodologia: plano.metodologia ?? null,
    avaliacao: plano.avaliacao ?? null,
    bibliografiaBasica: plano.bibliografiaBasica ?? null,
    bibliografiaComplementar: plano.bibliografiaComplementar ?? null,
  };
}

/**
 * Serviço de integração com os endpoints REST de Plano de Ação (/api/planos-acao).
 * Utiliza apiFetch para herdar injeção de JWT, tratamento global 401/403 e erros RFC 9457.
 */
export class PlanoAcaoService {
  private static readonly baseUrl = '/api/planos-acao';

  static async buscarAcompanhamentoPorAluno(
    alunoId: string,
    signal?: AbortSignal
  ): Promise<AcompanhamentoDTO> {
    return getAcompanhamento(alunoId, signal);
  }

  static async listarTodos(signal?: AbortSignal): Promise<PlanoAcaoResponseDTO[]> {
    const res = await apiFetch(this.baseUrl, { signal });
    const lista: PlanoAcaoResponseDTO[] = await res.json();
    return lista.map(normalizarPlanoAcao);
  }

  static async buscarPorId(
    id: string,
    signal?: AbortSignal
  ): Promise<PlanoAcaoResponseDTO> {
    const res = await apiFetch(`${this.baseUrl}/${encodeURIComponent(id)}`, { signal });
    return normalizarPlanoAcao(await res.json());
  }

  static async listarPorAcompanhamento(
    acompanhamentoId: string,
    signal?: AbortSignal
  ): Promise<PlanoAcaoResponseDTO[]> {
    const res = await apiFetch(
      `${this.baseUrl}/acompanhamento/${encodeURIComponent(acompanhamentoId)}`,
      { signal }
    );
    const lista: PlanoAcaoResponseDTO[] = await res.json();
    return lista.map(normalizarPlanoAcao);
  }

  static async listarPorAluno(
    alunoId: string,
    signal?: AbortSignal
  ): Promise<PlanoAcaoResponseDTO[]> {
    const res = await apiFetch(
      `${this.baseUrl}/aluno/${encodeURIComponent(alunoId)}`,
      { signal }
    );
    const lista: PlanoAcaoResponseDTO[] = await res.json();
    return lista.map(normalizarPlanoAcao);
  }

  static async criar(dto: PlanoAcaoRequestDTO): Promise<PlanoAcaoResponseDTO> {
    const payload: PlanoAcaoRequestDTO = {
      acompanhamentoId: dto.acompanhamentoId,
      demandasIdentificadas: normalizarCampoCriacao(dto.demandasIdentificadas),
      propostasIntervencao: normalizarCampoCriacao(dto.propostasIntervencao),
      componenteCurricular: normalizarCampoCriacao(dto.componenteCurricular),
      semestreAno: normalizarCampoCriacao(dto.semestreAno),
      docente: normalizarCampoCriacao(dto.docente),
      objetivoGeral: normalizarCampoCriacao(dto.objetivoGeral),
      objetivosEspecificos: normalizarCampoCriacao(dto.objetivosEspecificos),
      conteudosProgramaticos: normalizarCampoCriacao(dto.conteudosProgramaticos),
      metodologia: normalizarCampoCriacao(dto.metodologia),
      avaliacao: normalizarCampoCriacao(dto.avaliacao),
      bibliografiaBasica: normalizarCampoCriacao(dto.bibliografiaBasica),
      bibliografiaComplementar: normalizarCampoCriacao(dto.bibliografiaComplementar),
    };

    const res = await apiFetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return normalizarPlanoAcao(await res.json());
  }

  static async atualizar(
    id: string,
    dto: PlanoAcaoUpdateDTO
  ): Promise<PlanoAcaoResponseDTO> {
    const payload: PlanoAcaoUpdateDTO = {
      demandasIdentificadas: normalizarCampoAtualizacao(dto.demandasIdentificadas),
      propostasIntervencao: normalizarCampoAtualizacao(dto.propostasIntervencao),
      componenteCurricular: normalizarCampoAtualizacao(dto.componenteCurricular),
      semestreAno: normalizarCampoAtualizacao(dto.semestreAno),
      docente: normalizarCampoAtualizacao(dto.docente),
      objetivoGeral: normalizarCampoAtualizacao(dto.objetivoGeral),
      objetivosEspecificos: normalizarCampoAtualizacao(dto.objetivosEspecificos),
      conteudosProgramaticos: normalizarCampoAtualizacao(dto.conteudosProgramaticos),
      metodologia: normalizarCampoAtualizacao(dto.metodologia),
      avaliacao: normalizarCampoAtualizacao(dto.avaliacao),
      bibliografiaBasica: normalizarCampoAtualizacao(dto.bibliografiaBasica),
      bibliografiaComplementar: normalizarCampoAtualizacao(dto.bibliografiaComplementar),
    };

    const res = await apiFetch(`${this.baseUrl}/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return normalizarPlanoAcao(await res.json());
  }

  static async excluir(id: string): Promise<void> {
    await apiFetch(`${this.baseUrl}/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }
}
