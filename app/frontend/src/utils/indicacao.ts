import type { NivelRestricao, Role } from '../types/auth';
import type { StatusIndicacao } from '../types/indicacao';

/** Limite do back-end por nome de disciplina (IndicacaoRequestDTO). */
export const LIMITE_CARACTERES_DISCIPLINA = 150;

export const ROTULO_STATUS_INDICACAO: Record<StatusIndicacao, string> = {
  PENDENTE: 'Pendente',
  APROVADA: 'Aprovada',
  REJEITADA: 'Rejeitada',
};

/** Perfis autorizados a registrar indicações (espelha o @PreAuthorize do POST /api/indicacoes). */
const ROLES_QUE_INDICAM: ReadonlySet<Role> = new Set<Role>([
  'PROFESSOR',
  'COORDENADOR',
  'CLAI_PSICOPEDAGOGO',
  'ADMIN',
]);

/** Perfis da equipe CLAI com acesso direto ao painel (espelha RbacGuard.temRestricaoModeradaOuSuperior). */
const ROLES_DA_TRIAGEM: ReadonlySet<Role> = new Set<Role>([
  'CLAI_PSICOPEDAGOGO',
  'COORDENADOR',
  'ADMIN',
]);

export function podeIndicarEstudante(role: Role | null | undefined): boolean {
  return !!role && ROLES_QUE_INDICAM.has(role);
}

export function podeGerirTriagem(
  role: Role | null | undefined,
  nivel: NivelRestricao | null | undefined,
): boolean {
  if (role && ROLES_DA_TRIAGEM.has(role)) return true;
  return nivel === 'RESTRICAO_MODERADA' || nivel === 'SUPER_RESTRICAO';
}

/** Estudante encerrado (inativo/evadido) não pode ser indicado (regra do back-end). */
export function estudanteAceitaIndicacao(estudante: { status?: string; ativo?: boolean }): boolean {
  if (estudante.ativo === false) return false;
  return estudante.status !== 'INATIVO' && estudante.status !== 'EVADIDO';
}

export function ehEmTriagem(status: string | null | undefined): boolean {
  return status === 'EM_TRIAGEM';
}

/** Remove espaços nas pontas e colapsa espaços internos repetidos. */
export function normalizarDisciplina(valor: string): string {
  return valor.replace(/\s+/g, ' ').trim();
}

export type ResultadoAdicaoDisciplina =
  | { ok: true; lista: string[] }
  | { ok: false; lista: string[]; erro: string };

/**
 * Adiciona uma disciplina à lista, ignorando duplicatas (sem diferenciar maiúsculas/acentos)
 * e respeitando o limite do back-end. Aceita vários nomes separados por vírgula ou ponto e vírgula.
 */
export function adicionarDisciplinas(lista: string[], entrada: string): ResultadoAdicaoDisciplina {
  const chave = (v: string) =>
    v.normalize('NFD').replace(/\p{M}+/gu, '').toLocaleLowerCase('pt-BR');
  const nomes = entrada.split(/[,;]/).map(normalizarDisciplina).filter(Boolean);
  if (nomes.length === 0) return { ok: true, lista };

  const resultado = [...lista];
  const existentes = new Set(resultado.map(chave));
  for (const nome of nomes) {
    if (nome.length > LIMITE_CARACTERES_DISCIPLINA) {
      return {
        ok: false,
        lista,
        erro: `O nome da disciplina deve ter no máximo ${LIMITE_CARACTERES_DISCIPLINA} caracteres.`,
      };
    }
    if (existentes.has(chave(nome))) continue;
    existentes.add(chave(nome));
    resultado.push(nome);
  }
  return { ok: true, lista: resultado };
}

export interface ErrosIndicacao {
  justificativa?: string;
  disciplinas?: string;
}

export const MSG_JUSTIFICATIVA_OBRIGATORIA =
  'Informe a justificativa pedagógica da indicação.';
export const MSG_DISCIPLINA_OBRIGATORIA =
  'Informe ao menos uma disciplina onde a dificuldade foi observada.';
export const MSG_JUSTIFICATIVA_REJEICAO_OBRIGATORIA =
  'A justificativa é obrigatória para rejeitar uma indicação.';

/** TA10.1: sem justificativa pedagógica e sem ao menos uma disciplina o envio é bloqueado. */
export function validarIndicacao(justificativa: string, disciplinas: string[]): ErrosIndicacao {
  const erros: ErrosIndicacao = {};
  if (!justificativa.trim()) erros.justificativa = MSG_JUSTIFICATIVA_OBRIGATORIA;
  if (disciplinas.length === 0) erros.disciplinas = MSG_DISCIPLINA_OBRIGATORIA;
  return erros;
}

export function formatarDataHora(iso: string | null | undefined): string {
  if (!iso) return '—';
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return iso;
  return data.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
