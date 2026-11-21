import type { ProblemDetailRFC9457 } from '../types/estudoDeCaso';
import type { RaiRequestDTO, RaiResponseDTO } from '../types/rai';
import { apiFetch } from './apiClient';

/**
 * Emissão de RAI/RAE (TA3.3 / TA9.2 / TA9.3).
 * Toda a persistência e a geração da notificação de regressão acontecem no back-end.
 */
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
      body: JSON.stringify({
        alunoId: dto.alunoId,
        peiId: dto.peiId || undefined,
        acompanhamentoId: dto.acompanhamentoId || undefined,
        tipoRelatorio: dto.tipoRelatorio,
        bimestre: dto.bimestre,
        indicativoRegressao: Boolean(dto.indicativoRegressao),
        descricao: dto.descricao?.trim() || undefined,
      }),
    });
    return (await res.json()) as RaiResponseDTO;
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
