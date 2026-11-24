/** Contratos da US 05 alinhados com AlertaPedagogicoResponseDTO / enums do back-end. */

/** TA5.1 (VERMELHO: retenção/jubilamento) e TA5.2 (PEDAGOGICO: incoerência avaliativa). */
export type SeveridadeAlerta = 'VERMELHO' | 'PEDAGOGICO';

export type TipoAlertaPedagogico = 'RETENCAO' | 'RISCO_JUBILAMENTO' | 'INCOERENCIA_PEDAGOGICA';

export interface AlertaPedagogicoDTO {
  id: string;
  alunoId: string;
  alunoNome: string;
  alunoMatricula: string;
  tipoAlerta: TipoAlertaPedagogico;
  severidade: SeveridadeAlerta;
  unidade: string | null;
  curso: string | null;
  turma: string | null;
  descricao: string;
  tratado: boolean;
  tratadoPor: string | null;
  tratadoEm: string | null;
  criadoEm: string;
}
