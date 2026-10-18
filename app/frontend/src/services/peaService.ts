
import type {
  PeaRequestDTO,
  PeaResponseDTO,
  PeaUpdateDTO,
  PerfilUsuario
} from '../types/pea';

interface ApiError {
  status: number;
  title: string;
  detail: string;
}

// Converte respostas de erro do Backend em mensagens tratáveis.
async function verificarResposta(response: Response): Promise<void> {
  if (response.ok) return;

  let detalhes: Partial<ApiError> = {};

  try {
    detalhes = await response.json();
  } catch {
    // A resposta pode não conter JSON.
  }

  if (response.status === 403) {
    throw {
      status: 403,
      title: 'Acesso negado',
      detail: 'Você não possui permissão para acessar esses documentos.'
    } satisfies ApiError;
  }

  throw {
    status: response.status,
    title: detalhes.title || 'Erro na requisição',
    detail: detalhes.detail || 'Não foi possível concluir a operação.'
  } satisfies ApiError;
}

export class PeaService {
  private static baseUrl = '/api/peas';

  private static defaultUserId =
    '99999999-9999-9999-9999-999999999999';

  static async listarPorAluno(
    alunoId: string
  ): Promise<PeaResponseDTO[]> {
    const response = await fetch(
      `${this.baseUrl}/aluno/${alunoId}`
    );

    await verificarResposta(response);

    return response.json();
  }

  static async criar(
    dto: PeaRequestDTO,
    usuarioId = this.defaultUserId
  ): Promise<PeaResponseDTO> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': usuarioId
      },
      body: JSON.stringify(dto)
    });

    await verificarResposta(response);

    return response.json();
  }

  static async atualizar(
    id: string,
    dto: PeaUpdateDTO,
    usuarioId = this.defaultUserId
  ): Promise<PeaResponseDTO> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': usuarioId
      },
      body: JSON.stringify(dto)
    });

    await verificarResposta(response);

    return response.json();
  }

  // TA3.2: Consulta protegida aos anexos do PEI.
  // Recebe o ID de um PEI, nunca o ID de um PEA.
  static async listarAnexosSensiveis(
    peiId: string,
    perfil: PerfilUsuario
  ): Promise<PeaResponseDTO[]> {

    if (perfil === 'Professor') {
      throw {
        status: 403,
        title: 'Acesso negado',
        detail: 'Professores não podem acessar anexos sensíveis.'
      } satisfies ApiError;
    }

    const response = await fetch(
      `/api/peis/${peiId}/anexos-sensiveis`,
      {
        headers: {
          'X-User-Perfil': perfil
        }
      }
    );

    await verificarResposta(response);

    return response.json();
  }
}
