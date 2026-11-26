// Contratos da US 07 (adaptação DUA de provas via IA). O request aceita
// alunoId, textoProva e opcionalmente os nomes das tagsDificuldade selecionadas (LGPD).

export interface AdaptacaoDuaRequestDTO {
  alunoId: string;
  textoProva: string;
  tagsDificuldade?: string[];
}

/** Espelha QuestaoAdaptadaDuaDTO do back-end; não há campo de alternativas separado. */
export interface QuestaoAdaptadaDuaDTO {
  numero: number;
  enunciadoOriginal: string;
  comandoDestacado: string;
  enunciadoFragmentado: string[];
  textoAdaptado: string;
  adaptacoesVisuaisAplicadas: string[];
}

export interface AdaptacaoDuaResponseDTO {
  textoOriginal: string;
  textoAdaptado: string;
  tagsDificuldadeAplicadas: string[];
  orientacoesAplicacao: string[];
  questoesAdaptadas: QuestaoAdaptadaDuaDTO[];
  complexidadePreservada: boolean;
  promptDuaAplicado: string;
  geradoEm: string;
}

/** Decisão local do professor sobre cada questão do preview (TA7.3). */
export type StatusDecisaoDua = 'PENDENTE' | 'APROVADA' | 'EDITADA' | 'REJEITADA';

export interface QuestaoPreviewDua extends QuestaoAdaptadaDuaDTO {
  status: StatusDecisaoDua;
  textoFinal: string;
  justificativaRejeicao: string;
}

/** Dados usados para montar o documento final aprovado, sem persistência no servidor. */
export interface DocumentoDuaDTO {
  estudante: {
    nome: string;
    matricula: string;
    curso: string;
    turma: string;
  };
  textoFinal: string;
  questoes: QuestaoPreviewDua[];
  tagsAplicadas: string[];
  orientacoes: string[];
  complexidadePreservada: boolean;
  geradoEm: string;
}
