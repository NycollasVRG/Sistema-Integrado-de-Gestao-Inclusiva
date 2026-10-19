import type { AlunoHeaderData } from "../types/alunoHeader";


export async function getAlunoHeader(alunoId: string): Promise<AlunoHeaderData> {
  // Simula pequeno delay para aproximar comportamento real da API
  await new Promise((resolve) => setTimeout(resolve, 300));

  // Dados mockados realistas - cenário com fotoUrl: null para validar placeholder
  const mockHeader: AlunoHeaderData = {
    id: alunoId,
    nome: "Maria Silva Santos",
    fotoUrl: null,
    matricula: "2026.1.000123",
    curso: "Pedagogia",
    tagsDificuldade: ["TDAH", "Dislexia", "Baixa Visão"],
  };

  return mockHeader;

  // TODO: Descomentar na próxima Sprint quando o endpoint de Aluno estiver disponível
  // return api.get<AlunoHeaderData>(`/api/alunos/${alunoId}`);
}
