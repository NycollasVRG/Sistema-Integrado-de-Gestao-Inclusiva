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

function normalizarTexto(valor: string | null | undefined): string | null {
  if (!valor) return null;
  const limpo = valor.trim();
  return limpo.length > 0 ? limpo : null;
}

function normalizarPlanoAcao(plano: PlanoAcaoResponseDTO): PlanoAcaoResponseDTO {
  return {
    ...plano,
    nomeEstudante: plano.nomeEstudante ?? null,
    matriculaEstudante: plano.matriculaEstudante ?? null,
    cursoEstudante: plano.cursoEstudante ?? null,
    periodoLetivo: plano.periodoLetivo ?? null,
    periodoIngresso: plano.periodoIngresso ?? null,
    dataNascimento: plano.dataNascimento ?? null,
    telefoneEstudante: plano.telefoneEstudante ?? null,
    emailEstudante: plano.emailEstudante ?? null,
    nomeResponsavel: plano.nomeResponsavel ?? null,
    grauParentescoResponsavel: plano.grauParentescoResponsavel ?? null,
    telefoneResponsavel: plano.telefoneResponsavel ?? null,
    emailResponsavel: plano.emailResponsavel ?? null,
    identificacaoNecessidadesEspecificas: plano.identificacaoNecessidadesEspecificas ?? null,
    relatoPercursoEducacional: plano.relatoPercursoEducacional ?? null,
    demandasIdentificadas: plano.demandasIdentificadas ?? null,
    propostasIntervencao: plano.propostasIntervencao ?? null,
    assinaturaCoordenadorClai: plano.assinaturaCoordenadorClai ?? null,
    dataAssinatura: plano.dataAssinatura ?? null,
  };
}

function construirCorpo(dto: PlanoAcaoUpdateDTO): PlanoAcaoUpdateDTO {
  return {
    periodoLetivo: normalizarTexto(dto.periodoLetivo),
    periodoIngresso: normalizarTexto(dto.periodoIngresso),
    dataNascimento: normalizarTexto(dto.dataNascimento),
    telefoneEstudante: normalizarTexto(dto.telefoneEstudante),
    emailEstudante: normalizarTexto(dto.emailEstudante),
    nomeResponsavel: normalizarTexto(dto.nomeResponsavel),
    grauParentescoResponsavel: normalizarTexto(dto.grauParentescoResponsavel),
    telefoneResponsavel: normalizarTexto(dto.telefoneResponsavel),
    emailResponsavel: normalizarTexto(dto.emailResponsavel),
    possuiComorbidade: dto.possuiComorbidade ?? null,
    comorbidadeDetalhes: dto.possuiComorbidade ? normalizarTexto(dto.comorbidadeDetalhes) : null,
    usaMedicacaoContinua: dto.usaMedicacaoContinua ?? null,
    medicacaoDetalhes: dto.usaMedicacaoContinua ? normalizarTexto(dto.medicacaoDetalhes) : null,
    frequentaServicosApoio: dto.frequentaServicosApoio ?? null,
    servicosApoioDetalhes: dto.frequentaServicosApoio ? normalizarTexto(dto.servicosApoioDetalhes) : null,
    apresentouDocumentosComprobatorios: dto.apresentouDocumentosComprobatorios ?? null,
    documentosComprobatoriosDetalhes: dto.apresentouDocumentosComprobatorios
      ? normalizarTexto(dto.documentosComprobatoriosDetalhes)
      : null,
    identificacaoNecessidadesEspecificas: normalizarTexto(dto.identificacaoNecessidadesEspecificas),
    relatoPercursoEducacional: normalizarTexto(dto.relatoPercursoEducacional),
    demandasIdentificadas: normalizarTexto(dto.demandasIdentificadas),
    propostasIntervencao: normalizarTexto(dto.propostasIntervencao),
    assinaturaCoordenadorClai: normalizarTexto(dto.assinaturaCoordenadorClai),
    dataAssinatura: normalizarTexto(dto.dataAssinatura),
  };
}

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

  static async buscarPorId(id: string, signal?: AbortSignal): Promise<PlanoAcaoResponseDTO> {
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
      ...construirCorpo(dto),
    };

    const res = await apiFetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return normalizarPlanoAcao(await res.json());
  }

  static async atualizar(
    id: string,
    dto: PlanoAcaoUpdateDTO
  ): Promise<PlanoAcaoResponseDTO> {
    const res = await apiFetch(`${this.baseUrl}/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(construirCorpo(dto)),
    });
    return normalizarPlanoAcao(await res.json());
  }

  static async excluir(id: string): Promise<void> {
    await apiFetch(`${this.baseUrl}/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }
}
