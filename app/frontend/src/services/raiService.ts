import type { ProblemDetailRFC9457 } from '../types/estudoDeCaso';
import type { RaiRequestDTO, RaiResponseDTO } from '../types/rai';
import { apiFetch } from './apiClient';

function normalizarCorpoRai(dto: RaiRequestDTO) {
  return {
    alunoId: dto.alunoId,
    peiId: dto.peiId || undefined,
    acompanhamentoId: dto.acompanhamentoId || undefined,
    tipoRelatorio: dto.tipoRelatorio,
    bimestre: dto.bimestre,
    indicativoRegressao: Boolean(dto.indicativoRegressao),
    descricao: dto.descricao?.trim() || undefined,
    periodoLetivo: dto.periodoLetivo?.trim() || undefined,
    componenteCurricular: dto.componenteCurricular?.trim() || undefined,
    docente: dto.docente?.trim() || undefined,
    relacionamentoOpcoes: dto.relacionamentoOpcoes ?? [],
    relacionamentoOutros: dto.relacionamentoOutros?.trim() || undefined,
    relacionamentoComentario: dto.relacionamentoComentario?.trim() || undefined,
    habilidadesCognitivasOpcoes: dto.habilidadesCognitivasOpcoes ?? [],
    habilidadesCognitivasOutros: dto.habilidadesCognitivasOutros?.trim() || undefined,
    habilidadesCognitivasComentario: dto.habilidadesCognitivasComentario?.trim() || undefined,
    habilidadesSocioemocionaisOpcoes: dto.habilidadesSocioemocionaisOpcoes ?? [],
    habilidadesSocioemocionaisOutros: dto.habilidadesSocioemocionaisOutros?.trim() || undefined,
    habilidadesSocioemocionaisComentario: dto.habilidadesSocioemocionaisComentario?.trim() || undefined,
    avancosGerais: dto.avancosGerais?.trim() || undefined,
    dificuldadesAprendizagem: dto.dificuldadesAprendizagem?.trim() || undefined,
    fatoresExternos: dto.fatoresExternos?.trim() || undefined,
    habilidadesDesenvolvidas: (dto.habilidadesDesenvolvidas ?? [])
      .filter((h) => h.habilidadeDesenvolvida.trim().length > 0)
      .map((h, idx) => ({
        id: h.id ?? undefined,
        ordem: h.ordem ?? idx,
        habilidadeDesenvolvida: h.habilidadeDesenvolvida.trim(),
        nivelAprendizado: h.nivelAprendizado,
        observacoes: h.observacoes?.trim() || undefined,
      })),
    parecer: dto.parecer?.trim() || undefined,
    dataRelatorio: dto.dataRelatorio?.trim() || undefined,
    assinaturaDocente: dto.assinaturaDocente?.trim() || undefined,
  };
}

export class RaiService {
  private static baseUrl = '/api/rais';

  static async emitir(dto: RaiRequestDTO): Promise<RaiResponseDTO> {
    if (!dto.alunoId) {
      const problem: ProblemDetailRFC9457 = {
        title: 'Dados do Aluno Ausentes',
        status: 400,
        detail: 'O identificador do aluno é obrigatório para emitir o relatório.',
      };
      throw problem;
    }

    if (!Number.isInteger(dto.bimestre) || dto.bimestre < 1 || dto.bimestre > 4) {
      const problem: ProblemDetailRFC9457 = {
        title: 'Erro de Validação',
        status: 400,
        detail: 'Selecione um bimestre de referência entre 1 e 4.',
      };
      throw problem;
    }

    const res = await apiFetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(normalizarCorpoRai(dto)),
    });
    return (await res.json()) as RaiResponseDTO;
  }

  static async atualizar(id: string, dto: RaiRequestDTO): Promise<RaiResponseDTO> {
    const res = await apiFetch(`${this.baseUrl}/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(normalizarCorpoRai(dto)),
    });
    return (await res.json()) as RaiResponseDTO;
  }

  static async excluir(id: string): Promise<void> {
    await apiFetch(`${this.baseUrl}/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  /** Relatórios do estudante, em ordem cronológica (GET /api/rais/aluno/{alunoId}). */
  static async listarPorAluno(
    alunoId: string,
    signal?: AbortSignal
  ): Promise<RaiResponseDTO[]> {
    const res = await apiFetch(
      `${this.baseUrl}/aluno/${encodeURIComponent(alunoId)}`,
      { signal }
    );
    return (await res.json()) as RaiResponseDTO[];
  }

  /** Detalhe de um relatório exibido na Linha do Tempo (GET /api/rais/{id}). */
  static async buscarPorId(
    id: string,
    signal?: AbortSignal
  ): Promise<RaiResponseDTO> {
    const res = await apiFetch(`${this.baseUrl}/${encodeURIComponent(id)}`, { signal });
    return (await res.json()) as RaiResponseDTO;
  }
}
