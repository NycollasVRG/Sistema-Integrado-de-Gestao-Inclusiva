/** Resposta de GET /api/notificacoes (NotificacaoResponseDTO do back-end). */
export interface NotificacaoResponseDTO {
  id: string;
  perfilDestinatario: string;
  titulo: string;
  mensagem: string;
  /** Caminho de API, ex.: `/api/peis/aluno/{alunoId}`. */
  linkReferencia?: string | null;
  lida: boolean;
  criadoEm: string;
}
