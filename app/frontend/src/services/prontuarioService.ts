import type {
  EstudoDeCasoResponseDTO,
  ProblemDetailRFC9457,
} from '../types/estudoDeCaso';
import type {
  AtualizarAtendimentoRequestDTO,
  NovoAtendimentoRequestDTO,
  NovoAtendimentoResponseDTO,
  NovoEstudoRapidoRequestDTO,
} from '../types/prontuarioAcoes';
import { EstudoDeCasoService } from './estudoDeCasoService';
import { apiFetch } from './apiClient';

export class ProntuarioService {
  /**
   * Criação rápida de Estudo de Caso a partir do modal do Prontuário.
   * Utiliza a API real (/api/estudos-de-caso) com fallback local já configurado em EstudoDeCasoService.
   */
  static async criarEstudoRapido(
    dto: NovoEstudoRapidoRequestDTO
  ): Promise<EstudoDeCasoResponseDTO> {
    if (!dto.alunoId) {
      const problem: ProblemDetailRFC9457 = {
        title: 'Dados do Aluno Ausentes',
        status: 400,
        detail: 'O identificador do aluno em foco (alunoId) é obrigatório.',
      };
      throw problem;
    }

    return EstudoDeCasoService.criar({
      alunoId: dto.alunoId,
      status: dto.status,
      diagnosticoInicial: dto.diagnosticoInicial,
      historico: dto.historico,
      indicadoresIds: dto.indicadoresIds,
    });
  }

  /**
   * Registro de Novo Atendimento (TA4.1/TA4.2): POST /api/atendimentos.
   * O autor (criadoPor) e o carimbo de criação vêm do servidor a partir do JWT; nada é persistido localmente.
   */
  static async criarAtendimento(
    dto: NovoAtendimentoRequestDTO
  ): Promise<NovoAtendimentoResponseDTO> {
    if (!dto.alunoId) {
      const problem: ProblemDetailRFC9457 = {
        title: 'Dados do Aluno Ausentes',
        status: 400,
        detail: 'O aluno deve estar pré-carregado para registrar um atendimento.',
      };
      throw problem;
    }

    if (!dto.descricao || !dto.descricao.trim()) {
      const problem: ProblemDetailRFC9457 = {
        title: 'Erro de Validação',
        status: 400,
        detail: 'A descrição/relato do atendimento é obrigatória.',
      };
      throw problem;
    }

    const res = await apiFetch('/api/atendimentos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        alunoId: dto.alunoId,
        tipoAtendimento: dto.tipoAtendimento,
        dataAtendimento: dto.dataAtendimento,
        profissionalResponsavel: dto.profissionalResponsavel.trim(),
        descricao: dto.descricao.trim(),
        encaminhamentos: dto.encaminhamentos?.trim() || null,
      }),
    });
    return (await res.json()) as NovoAtendimentoResponseDTO;
  }

  /** Detalhe de um atendimento: GET /api/atendimentos/{id}. */
  static async buscarAtendimento(
    id: string,
    signal?: AbortSignal
  ): Promise<NovoAtendimentoResponseDTO> {
    const res = await apiFetch(`/api/atendimentos/${encodeURIComponent(id)}`, { signal });
    return (await res.json()) as NovoAtendimentoResponseDTO;
  }

  /** Atendimentos do aluno (mais recentes primeiro): GET /api/atendimentos/aluno/{alunoId}. */
  static async listarAtendimentosPorAluno(
    alunoId: string,
    signal?: AbortSignal
  ): Promise<NovoAtendimentoResponseDTO[]> {
    const res = await apiFetch(`/api/atendimentos/aluno/${encodeURIComponent(alunoId)}`, { signal });
    return (await res.json()) as NovoAtendimentoResponseDTO[];
  }

  /**
   * Edição (TA4.4): PUT /api/atendimentos/{id}. O servidor só aceita o autor dentro das 24h
   * e responde 403 caso contrário; esse 403 é regra de negócio, então não aciona o modal global de LGPD.
   */
  static async atualizarAtendimento(
    id: string,
    dto: AtualizarAtendimentoRequestDTO
  ): Promise<NovoAtendimentoResponseDTO> {
    const res = await apiFetch(`/api/atendimentos/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      ignorarAcessoNegadoGlobal: true,
      body: JSON.stringify({
        tipoAtendimento: dto.tipoAtendimento,
        dataAtendimento: dto.dataAtendimento,
        profissionalResponsavel: dto.profissionalResponsavel.trim(),
        descricao: dto.descricao.trim(),
        encaminhamentos: dto.encaminhamentos?.trim() || null,
      }),
    });
    return (await res.json()) as NovoAtendimentoResponseDTO;
  }
}
