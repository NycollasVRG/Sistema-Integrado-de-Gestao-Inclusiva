import type {
  EstudoDeCasoResponseDTO,
  ProblemDetailRFC9457,
} from '../types/estudoDeCaso';
import type {
  AtualizarAtendimentoRequestDTO,
  EmissaoDocumentoRequestDTO,
  EmissaoDocumentoResponseDTO,
  NovoAtendimentoRequestDTO,
  NovoAtendimentoResponseDTO,
  NovoEstudoRapidoRequestDTO,
} from '../types/prontuarioAcoes';
import { EstudoDeCasoService } from './estudoDeCasoService';
import { apiFetch } from './apiClient';

const STORAGE_KEY_DOCUMENTOS = 'sigi_clai_documentos_prontuario';

function getStoredDocumentos(): EmissaoDocumentoResponseDTO[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DOCUMENTOS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Falha ao ler cache local de documentos:', e);
  }
  return [];
}

function saveStoredDocumentos(documentos: EmissaoDocumentoResponseDTO[]) {
  try {
    localStorage.setItem(STORAGE_KEY_DOCUMENTOS, JSON.stringify(documentos));
  } catch (e) {
    console.error('Falha ao gravar cache local de documentos:', e);
  }
}

function gerarIdLocal(prefixo: string): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${prefixo}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

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

  /**
   * Emissão de documentos complementares (Emitir RAE / Gerar Dossiê).
   * Mock Service estruturado para homologação do fluxo de atalhos rápidos do Prontuário.
   */
  static async emitirDocumento(
    dto: EmissaoDocumentoRequestDTO
  ): Promise<EmissaoDocumentoResponseDTO> {
    await new Promise((resolve) => setTimeout(resolve, 400));

    if (!dto.alunoId) {
      const problem: ProblemDetailRFC9457 = {
        title: 'Dados do Aluno Ausentes',
        status: 400,
        detail: 'O identificador do aluno é obrigatório para emissão do documento.',
      };
      throw problem;
    }

    const agora = new Date().toISOString();
    const ano = new Date().getFullYear();
    const codigo = Math.floor(100000 + Math.random() * 900000);
    const protocolo = `${dto.tipoDocumento}-${ano}-${codigo}`;

    const nomeDoc =
      dto.tipoDocumento === 'RAE'
        ? 'Relatório de Atendimento Educacional (RAE)'
        : 'Dossiê Consolidado do Estudante';

    const docGerado: EmissaoDocumentoResponseDTO = {
      id: gerarIdLocal('doc'),
      alunoId: dto.alunoId,
      tipoDocumento: dto.tipoDocumento,
      protocolo,
      geradoEm: agora,
      resumo: `${nomeDoc} emitido para a matrícula ${dto.matriculaAluno} sob protocolo ${protocolo}.`,
    };

    const docs = getStoredDocumentos();
    saveStoredDocumentos([docGerado, ...docs]);

    return docGerado;
  }
}
