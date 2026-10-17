import type {
  Aluno,
  EstudoDeCasoRequestDTO,
  EstudoDeCasoResponseDTO,
  EstudoDeCasoUpdateDTO,
  IndicadorReutilizavel,
  ProblemDetailRFC9457,
} from '../types/estudoDeCaso';

// Alunos iniciais alinhados com o seed do banco de dados (seed_test_data.sql)
export const ALUNOS_PADRAO: Aluno[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    nome: 'Aluno Teste Fluxo Completo',
    matricula: 'MAT-TEST-001',
    turma: '2026.1',
    curso: 'Técnico em Informática',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    nome: 'Aluno Teste Conflito Ativo',
    matricula: 'MAT-TEST-002',
    turma: '2025.1',
    curso: 'Análise e Desenvolvimento de Sistemas',
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    nome: 'Mariana Medeiros da Silva',
    matricula: '20261SOUSA0095',
    turma: '2025.2',
    curso: 'Técnico em Edificações',
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    nome: 'Carlos Eduardo Santos',
    matricula: '20261SOUSA0102',
    turma: '2026.1',
    curso: 'Técnico em Informática',
  },
];

// Indicadores reutilizáveis (Tags de dificuldades) alinhados com o banco
export const INDICADORES_PADRAO: IndicadorReutilizavel[] = [
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    nome: 'Dificuldade de Leitura',
    descricao: 'Apresenta barreiras na decodificação e fluência leitora.',
  },
  {
    id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    nome: 'TDAH',
    descricao: 'Déficit de Atenção e Hiperatividade.',
  },
  {
    id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    nome: 'Discalculia',
    descricao: 'Dificuldade específica no aprendizado de matemática.',
  },
  {
    id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    nome: 'Transtorno do Espectro Autista (TEA)',
    descricao: 'Necessidade de suporte na comunicação social e adaptações sensoriais.',
  },
  {
    id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    nome: 'Baixa Visão',
    descricao: 'Requer materiais com fonte ampliada e contrastes adequados.',
  },
];

// Armazenamento em memória com persistência local como fallback caso o backend Java não esteja iniciado
const STORAGE_KEY = 'sigi_clai_estudos_de_caso';

function getStoredEstudos(): EstudoDeCasoResponseDTO[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Falha ao ler cache local de estudos:', e);
  }
  return [
    {
      id: 'e1111111-0000-0000-0000-000000000001',
      alunoId: '22222222-2222-2222-2222-222222222222',
      status: 'ATIVO',
      diagnosticoInicial: 'Aluno acompanhado com adaptação curricular em andamento.',
      indicadoresIds: ['aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'],
      criadoEm: new Date(Date.now() - 86400000).toISOString(),
      atualizadoEm: new Date().toISOString(),
    },
  ];
}

function saveStoredEstudos(estudos: EstudoDeCasoResponseDTO[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(estudos));
  } catch (e) {
    console.error('Falha ao gravar cache local:', e);
  }
}

export class EstudoDeCasoService {
  private static baseUrl = '/api/estudos-de-caso';
  private static defaultUserId = '99999999-9999-9999-9999-999999999999';

  static async buscarPorId(id: string): Promise<EstudoDeCasoResponseDTO> {
    try {
      const res = await fetch(`${this.baseUrl}/${id}`);
      if (res.ok) {
        return await res.json();
      }
      if (res.status === 404) {
        const errorData: ProblemDetailRFC9457 = await res.json().catch(() => ({
          title: 'Não Encontrado',
          status: 404,
          detail: 'Estudo de caso não encontrado.',
        }));
        throw errorData;
      }
    } catch (e: any) {
      if (e?.status) throw e;
      // Fallback local
      console.warn('Backend indisponível, usando repositório local.');
    }

    const estudos = getStoredEstudos();
    const found = estudos.find((e) => e.id === id);
    if (!found) {
      const notFound: ProblemDetailRFC9457 = {
        title: 'Recurso Não Encontrado',
        status: 404,
        detail: 'Estudo de caso não encontrado.',
      };
      throw notFound;
    }
    return found;
  }

  static async listarPorAluno(alunoId: string): Promise<EstudoDeCasoResponseDTO[]> {
    try {
      const res = await fetch(`${this.baseUrl}/aluno/${alunoId}`);
      if (res.ok) {
        return await res.json();
      }
      if (res.status === 404) {
        return [];
      }
    } catch (e) {
      console.warn('Backend indisponível no endpoint de listagem, usando repositório local.');
    }

    const estudos = getStoredEstudos();
    return estudos.filter((e) => e.alunoId === alunoId);
  }

  static async criar(dto: EstudoDeCasoRequestDTO, usuarioId?: string): Promise<EstudoDeCasoResponseDTO> {
    const userId = usuarioId || this.defaultUserId;
    try {
      const res = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId,
        },
        body: JSON.stringify(dto),
      });

      if (res.ok) {
        const created: EstudoDeCasoResponseDTO = await res.json();
        // Sincroniza cache local
        const estudos = getStoredEstudos();
        saveStoredEstudos([created, ...estudos]);
        return created;
      }

      const problem: ProblemDetailRFC9457 = await res.json();
      throw problem;
    } catch (e: any) {
      if (e?.detail || e?.status) throw e;
      console.warn('Backend indisponível, persistindo estudo localmente.');
    }

    // Validação local espelhando backend
    const estudos = getStoredEstudos();
    if (dto.status === 'ATIVO' && estudos.some((e) => e.alunoId === dto.alunoId && e.status === 'ATIVO')) {
      const conflict: ProblemDetailRFC9457 = {
        title: 'Regra de Negócio Violada',
        status: 400,
        detail: 'Já existe um Estudo de Caso ATIVO para este aluno.',
      };
      throw conflict;
    }

    const novoEstudo: EstudoDeCasoResponseDTO = {
      id: crypto.randomUUID ? crypto.randomUUID() : `mock-${Date.now()}`,
      alunoId: dto.alunoId,
      status: dto.status,
      diagnosticoInicial: dto.diagnosticoInicial || null,
      indicadoresIds: dto.indicadoresIds || [],
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    };

    saveStoredEstudos([novoEstudo, ...estudos]);
    return novoEstudo;
  }

  static async atualizar(
    id: string,
    dto: EstudoDeCasoUpdateDTO,
    usuarioId?: string
  ): Promise<EstudoDeCasoResponseDTO> {
    const userId = usuarioId || this.defaultUserId;
    try {
      const res = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId,
        },
        body: JSON.stringify(dto),
      });

      if (res.ok) {
        const updated: EstudoDeCasoResponseDTO = await res.json();
        const estudos = getStoredEstudos();
        saveStoredEstudos(estudos.map((e) => (e.id === id ? updated : e)));
        return updated;
      }

      const problem: ProblemDetailRFC9457 = await res.json();
      throw problem;
    } catch (e: any) {
      if (e?.detail || e?.status) throw e;
      console.warn('Backend indisponível, atualizando localmente.');
    }

    const estudos = getStoredEstudos();
    const index = estudos.findIndex((e) => e.id === id);
    if (index === -1) {
      const notFound: ProblemDetailRFC9457 = {
        title: 'Recurso Não Encontrado',
        status: 404,
        detail: 'Estudo de caso não encontrado com o ID fornecido.',
      };
      throw notFound;
    }

    const atualizado: EstudoDeCasoResponseDTO = {
      ...estudos[index],
      status: dto.status,
      diagnosticoInicial: dto.diagnosticoInicial || null,
      indicadoresIds: dto.indicadoresIds || [],
      atualizadoEm: new Date().toISOString(),
    };

    estudos[index] = atualizado;
    saveStoredEstudos(estudos);
    return atualizado;
  }

  static async excluir(id: string, usuarioId?: string): Promise<void> {
    const userId = usuarioId || this.defaultUserId;
    try {
      const res = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
        headers: {
          'X-User-Id': userId,
        },
      });

      if (res.ok || res.status === 204) {
        const estudos = getStoredEstudos();
        saveStoredEstudos(estudos.filter((e) => e.id !== id));
        return;
      }

      const problem: ProblemDetailRFC9457 = await res.json();
      throw problem;
    } catch (e: any) {
      if (e?.detail || e?.status) throw e;
      console.warn('Backend indisponível, excluindo localmente.');
    }

    const estudos = getStoredEstudos();
    const target = estudos.find((e) => e.id === id);
    if (target && target.status === 'ENCERRADO') {
      const problem: ProblemDetailRFC9457 = {
        title: 'Operação Não Permitida',
        status: 400,
        detail: 'Não é permitido excluir um Estudo de Caso já concluído.',
      };
      throw problem;
    }

    saveStoredEstudos(estudos.filter((e) => e.id !== id));
  }
}
