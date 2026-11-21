import type { NovoAtendimentoResponseDTO, TipoAtendimento } from '../types/prontuarioAcoes';

export const OPCOES_TIPO_ATENDIMENTO: { valor: TipoAtendimento; rotulo: string }[] = [
  { valor: 'PEDAGOGICO', rotulo: 'Acompanhamento Pedagógico' },
  { valor: 'PSICOLOGICO', rotulo: 'Atendimento Psicológico' },
  { valor: 'ASSISTENCIA_SOCIAL', rotulo: 'Assistência Social' },
  { valor: 'ACESSIBILIDADE', rotulo: 'Suporte de Acessibilidade / AEE' },
  { valor: 'MULTIDISCIPLINAR', rotulo: 'Reunião Multidisciplinar / Família' },
];

export function rotuloTipoAtendimento(tipo: TipoAtendimento): string {
  return OPCOES_TIPO_ATENDIMENTO.find((o) => o.valor === tipo)?.rotulo ?? tipo;
}

/** Janela em que o autor ainda pode editar (espelha AtendimentoService.JANELA_EDICAO do back-end). */
export const JANELA_EDICAO_MS = 24 * 60 * 60 * 1000;

/**
 * O back-end serializa LocalDateTime sem fuso, no fuso da JVM (America/Fortaleza, UTC-03:00 fixo,
 * sem horário de verão — ver Dockerfile/docker-compose). Interpretar a string no fuso do navegador
 * deslocaria a janela de 24h para quem acessa de outro fuso; por isso fixamos o offset do servidor.
 */
const OFFSET_SERVIDOR = '-03:00';
const TEM_FUSO = /(Z|[+-]\d{2}:?\d{2})$/i;

/** Converte a data-hora do servidor em epoch ms; {@code null} se ausente/ inválida. */
export function paraTimestampServidor(valor: string | null | undefined): number | null {
  if (!valor) return null;
  const normalizado = TEM_FUSO.test(valor) ? valor : `${valor}${OFFSET_SERVIDOR}`;
  const ts = new Date(normalizado).getTime();
  return Number.isNaN(ts) ? null : ts;
}

/** Instante-limite da edição (criadoEm + 24h), ou {@code null} se não há marco temporal. */
export function limiteEdicao(atendimento: Pick<NovoAtendimentoResponseDTO, 'criadoEm'>): number | null {
  const criado = paraTimestampServidor(atendimento.criadoEm);
  return criado === null ? null : criado + JANELA_EDICAO_MS;
}

/** Autor do registro? Sem {@code criadoPor} ou sem usuário logado, nega (fail closed). */
export function ehAutor(
  atendimento: Pick<NovoAtendimentoResponseDTO, 'criadoPor'>,
  userId: string | null | undefined,
): boolean {
  return !!userId && !!atendimento.criadoPor && atendimento.criadoPor === userId;
}

export type MotivoBloqueioEdicao = 'NAO_AUTOR' | 'PRAZO_EXPIRADO';

/**
 * Regra de UI (TA4.4): edição liberada somente ao autor e enquanto
 * {@code agora - criadoEm <= 24h}. O back-end continua sendo a autoridade (PUT → 403).
 * Retorna {@code null} quando a edição está liberada.
 */
export function motivoBloqueioEdicao(
  atendimento: Pick<NovoAtendimentoResponseDTO, 'criadoPor' | 'criadoEm'>,
  userId: string | null | undefined,
  agora: number = Date.now(),
): MotivoBloqueioEdicao | null {
  if (!ehAutor(atendimento, userId)) return 'NAO_AUTOR';
  const criado = paraTimestampServidor(atendimento.criadoEm);
  if (criado === null || agora - criado > JANELA_EDICAO_MS) return 'PRAZO_EXPIRADO';
  return null;
}

export function podeEditarAtendimento(
  atendimento: Pick<NovoAtendimentoResponseDTO, 'criadoPor' | 'criadoEm'>,
  userId: string | null | undefined,
  agora: number = Date.now(),
): boolean {
  return motivoBloqueioEdicao(atendimento, userId, agora) === null;
}

export const MENSAGEM_BLOQUEIO: Record<MotivoBloqueioEdicao, string> = {
  NAO_AUTOR: 'Somente o profissional que registrou o atendimento pode editá-lo.',
  PRAZO_EXPIRADO: 'O prazo de 24 horas para edição deste atendimento foi encerrado.',
};

/** "Editável por mais 3h 12min" / "menos de 1 min". */
export function formatarTempoRestante(ms: number): string {
  if (ms <= 0) return 'encerrado';
  const totalMin = Math.floor(ms / 60000);
  if (totalMin < 1) return 'menos de 1 min';
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h}h` : `${h}h ${m}min`;
}

/** YYYY-MM-DD -> dd/MM/aaaa sem passar por Date (evita deslocamento de fuso). */
export function formatarDataAtendimento(iso: string | null | undefined): string {
  if (!iso) return '—';
  const [a, m, d] = iso.slice(0, 10).split('-');
  return a && m && d ? `${d}/${m}/${a}` : iso;
}

export function formatarDataHoraServidor(valor: string | null | undefined): string {
  const ts = paraTimestampServidor(valor);
  return ts === null ? '—' : new Date(ts).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}
