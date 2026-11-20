import type { TipoAtendimento } from '../types/prontuarioAcoes';

/**
 * Rascunho do formulário "Novo Atendimento" (TA4.3).
 *
 * Fica no localStorage, chaveado por USUÁRIO + ALUNO: dois profissionais no mesmo computador não
 * enxergam o rascunho um do outro e rascunhos de alunos diferentes nunca se misturam.
 * Isto NÃO é o registro do atendimento (que só existe no PostgreSQL via /api/atendimentos): é apenas
 * uma cópia de segurança do texto digitado, apagada ao registrar com sucesso, ao descartar,
 * ao expirar (TTL) ou no logout explícito.
 */
const PREFIXO = 'sigi_clai_rascunho_atendimento';

/** Rascunhos abandonados são descartados (o conteúdo é dado clínico sensível). */
export const TTL_RASCUNHO_MS = 7 * 24 * 60 * 60 * 1000;

export interface RascunhoAtendimento {
  tipoAtendimento: TipoAtendimento;
  dataAtendimento: string;
  profissionalResponsavel: string;
  descricao: string;
  encaminhamentos: string;
}

interface RascunhoPersistido extends RascunhoAtendimento {
  salvoEm: number;
}

export interface RascunhoRestaurado {
  dados: RascunhoAtendimento;
  salvoEm: number;
}

function chave(userId: string, alunoId: string): string {
  return `${PREFIXO}:${userId}:${alunoId}`;
}

/** Só há o que salvar se o usuário digitou texto livre; valores padrão dos campos não contam. */
export function rascunhoTemConteudo(d: RascunhoAtendimento): boolean {
  return d.descricao.trim() !== '' || d.encaminhamentos.trim() !== '';
}

export function lerRascunho(userId: string, alunoId: string, agora = Date.now()): RascunhoRestaurado | null {
  if (!userId || !alunoId) return null;
  try {
    const bruto = localStorage.getItem(chave(userId, alunoId));
    if (!bruto) return null;
    const p = JSON.parse(bruto) as Partial<RascunhoPersistido>;
    if (
      typeof p.salvoEm !== 'number' ||
      typeof p.descricao !== 'string' ||
      typeof p.encaminhamentos !== 'string' ||
      typeof p.tipoAtendimento !== 'string' ||
      typeof p.dataAtendimento !== 'string' ||
      typeof p.profissionalResponsavel !== 'string'
    ) {
      removerRascunho(userId, alunoId);
      return null;
    }
    if (agora - p.salvoEm > TTL_RASCUNHO_MS) {
      removerRascunho(userId, alunoId);
      return null;
    }
    return {
      salvoEm: p.salvoEm,
      dados: {
        tipoAtendimento: p.tipoAtendimento as TipoAtendimento,
        dataAtendimento: p.dataAtendimento,
        profissionalResponsavel: p.profissionalResponsavel,
        descricao: p.descricao,
        encaminhamentos: p.encaminhamentos,
      },
    };
  } catch {
    // JSON corrompido ou storage indisponível: trata como "sem rascunho".
    return null;
  }
}

/**
 * Grava o rascunho; sem conteúdo digitado, remove o existente.
 * @returns instante do salvamento, ou {@code null} se nada foi gravado.
 */
export function salvarRascunho(userId: string, alunoId: string, dados: RascunhoAtendimento): number | null {
  if (!userId || !alunoId) return null;
  if (!rascunhoTemConteudo(dados)) {
    removerRascunho(userId, alunoId);
    return null;
  }
  try {
    const salvoEm = Date.now();
    const payload: RascunhoPersistido = { ...dados, salvoEm };
    localStorage.setItem(chave(userId, alunoId), JSON.stringify(payload));
    return salvoEm;
  } catch (e) {
    // Cota excedida / modo privado: o formulário continua funcionando, só sem a cópia de segurança.
    console.warn('Não foi possível salvar o rascunho do atendimento:', e);
    return null;
  }
}

export function removerRascunho(userId: string, alunoId: string): void {
  if (!userId || !alunoId) return;
  try {
    localStorage.removeItem(chave(userId, alunoId));
  } catch {
    // Storage indisponível: nada a limpar.
  }
}

/** Logout explícito: apaga todos os rascunhos do usuário neste navegador. */
export function removerRascunhosDoUsuario(userId: string): void {
  if (!userId) return;
  try {
    const prefixo = `${PREFIXO}:${userId}:`;
    const alvo: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefixo)) alvo.push(k);
    }
    alvo.forEach((k) => localStorage.removeItem(k));
  } catch {
    // Storage indisponível: nada a limpar.
  }
}
