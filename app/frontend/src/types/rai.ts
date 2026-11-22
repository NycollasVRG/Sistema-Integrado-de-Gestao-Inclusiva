/** Valores aceitos pelo backend em `RaiRequestDTO.tipoRelatorio`. */
export type TipoRelatorio = 'RAI' | 'RAE';

/** Corpo do POST /api/rais (RaiRequestDTO do back-end). */
export interface RaiRequestDTO {
  alunoId: string;
  /** Opcional; quando informado precisa pertencer ao estudante. */
  peiId?: string | null;
  /** Opcional; quando informado precisa pertencer ao estudante. */
  acompanhamentoId?: string | null;
  tipoRelatorio: TipoRelatorio;
  /** Bimestre de referência, de 1 a 4. */
  bimestre: number;
  /** Quando true, o back-end notifica o COORDENADOR para revisar o PEI (TA3.3). */
  indicativoRegressao?: boolean;
  descricao?: string | null;
}

/** Resposta do back-end (RaiResponseDTO), inclusive em GET /api/rais/{id}. */
export interface RaiResponseDTO {
  id: string;
  alunoId: string;
  peiId?: string | null;
  acompanhamentoId?: string | null;
  tipoRelatorio: TipoRelatorio;
  bimestre: number;
  indicativoRegressao?: boolean | null;
  descricao?: string | null;
  criadoEm: string;
}
