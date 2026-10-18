import type {
  EstudoDeCasoResponseDTO,
  ProblemDetailRFC9457,
} from '../types/estudoDeCaso';
import type {
  EmissaoDocumentoRequestDTO,
  EmissaoDocumentoResponseDTO,
  NovoAtendimentoRequestDTO,
  NovoAtendimentoResponseDTO,
  NovoEstudoRapidoRequestDTO,
} from '../types/prontuarioAcoes';
import { EstudoDeCasoService } from './estudoDeCasoService';

const STORAGE_KEY_ATENDIMENTOS = 'sigi_clai_atendimentos';
const STORAGE_KEY_DOCUMENTOS = 'sigi_clai_documentos_prontuario';

function getStoredAtendimentos(): NovoAtendimentoResponseDTO[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ATENDIMENTOS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Falha ao ler cache local de atendimentos:', e);
  }
  return [];
}

function saveStoredAtendimentos(atendimentos: NovoAtendimentoResponseDTO[]) {
  try {
    localStorage.setItem(STORAGE_KEY_ATENDIMENTOS, JSON.stringify(atendimentos));
  } catch (e) {
    console.error('Falha ao gravar cache local de atendimentos:', e);
  }
}

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
    dto: NovoEstudoRapidoRequestDTO,
    usuarioId?: string
  ): Promise<EstudoDeCasoResponseDTO> {
    if (!dto.alunoId) {
      const problem: ProblemDetailRFC9457 = {
        title: 'Dados do Aluno Ausentes',
        status: 400,
        detail: 'O identificador do aluno em foco (alunoId) é obrigatório.',
      };
      throw problem;
    }

    return EstudoDeCasoService.criar(
      {
        alunoId: dto.alunoId,
        status: dto.status,
        diagnosticoInicial: dto.diagnosticoInicial,
        indicadoresIds: dto.indicadoresIds,
      },
      usuarioId
    );
  }

  /**
   * Registro de Novo Atendimento a partir do modal rápido do Prontuário.
   * Mock Service estruturado para a sprint atual (persiste em localStorage com delay simulado).
   */
  static async criarAtendimento(
    dto: NovoAtendimentoRequestDTO
  ): Promise<NovoAtendimentoResponseDTO> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    if (!dto.alunoId || !dto.matriculaAluno) {
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

    const agora = new Date().toISOString();
    const novoAtendimento: NovoAtendimentoResponseDTO = {
      id: gerarIdLocal('atend'),
      alunoId: dto.alunoId,
      matriculaAluno: dto.matriculaAluno,
      tipoAtendimento: dto.tipoAtendimento,
      dataAtendimento: dto.dataAtendimento || agora.slice(0, 10),
      profissionalResponsavel: dto.profissionalResponsavel.trim() || 'Equipe Multidisciplinar CLAI',
      descricao: dto.descricao.trim(),
      encaminhamentos: dto.encaminhamentos?.trim() || undefined,
      criadoEm: agora,
    };

    const listaAtual = getStoredAtendimentos();
    saveStoredAtendimentos([novoAtendimento, ...listaAtual]);

    return novoAtendimento;
  }

  /**
   * Lista os atendimentos registrados localmente para o aluno em foco.
   */
  static async listarAtendimentosPorAluno(
    alunoId: string
  ): Promise<NovoAtendimentoResponseDTO[]> {
    return getStoredAtendimentos().filter((item) => item.alunoId === alunoId);
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
