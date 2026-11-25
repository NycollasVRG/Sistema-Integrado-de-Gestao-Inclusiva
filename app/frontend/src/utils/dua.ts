import type { Role } from '../types/auth';

/** Perfis autorizados a adaptar provas (espelha o @PreAuthorize do POST /api/dua/adaptar). */
const ROLES_QUE_ADAPTAM_DUA: ReadonlySet<Role> = new Set<Role>([
  'PROFESSOR',
  'COORDENADOR',
  'CLAI_PSICOPEDAGOGO',
  'ADMIN',
]);

export function podeAdaptarDua(role: Role | null | undefined): boolean {
  return !!role && ROLES_QUE_ADAPTAM_DUA.has(role);
}

/** Importação de arquivo é apenas conveniência para preencher o textarea. */
export const LIMITE_ARQUIVO_DUA_BYTES = 2 * 1024 * 1024;
export const EXTENSOES_ARQUIVO_DUA = ['txt', 'md'] as const;

export const MSG_ESTUDANTE_OBRIGATORIO_DUA =
  'Selecione o estudante antes de gerar a adaptação.';
export const MSG_PROVA_OBRIGATORIA_DUA =
  'Digite, cole ou importe o texto da prova antes de gerar a adaptação.';
export const MSG_ARQUIVO_INVALIDO_DUA =
  'Formato não aceito. Importe um arquivo .txt ou .md, ou cole o texto da prova.';
export const MSG_ARQUIVO_VAZIO_DUA = 'O arquivo selecionado está vazio.';
export const MSG_ARQUIVO_GRANDE_DUA =
  'O arquivo é maior que 2 MB. Importe um arquivo menor ou cole o texto da prova.';

/** Usado quando o back-end devolve 504 sem corpo RFC 9457 (ex.: proxy). */
export const MSG_TIMEOUT_DUA =
  'O serviço de inteligência artificial demorou mais que o esperado para adaptar a avaliação. ' +
  'Tente novamente em instantes ou faça a adaptação manualmente.';
