import type {
  AlertaPedagogicoDTO,
  SeveridadeAlerta,
  TipoAlertaPedagogico,
} from '../types/alertaDashboard';

export const ROTULO_TIPO_ALERTA: Record<TipoAlertaPedagogico, string> = {
  RETENCAO: 'Retenção',
  RISCO_JUBILAMENTO: 'Risco de jubilamento',
  INCOERENCIA_PEDAGOGICA: 'Incoerência pedagógica',
};

export const ROTULO_SEVERIDADE: Record<SeveridadeAlerta, string> = {
  VERMELHO: 'Alerta vermelho',
  PEDAGOGICO: 'Alerta pedagógico',
};

/** Valores dos filtros guardam a chave normalizada ('' = todos). */
export interface FiltrosDashboard {
  unidade: string;
  curso: string;
  turma: string;
}

export const FILTROS_VAZIOS: FiltrosDashboard = { unidade: '', curso: '', turma: '' };

export interface OpcaoFiltro {
  valor: string;
  rotulo: string;
}

/** Chave de comparação: sem acentos, sem maiúsculas e sem espaços repetidos. */
export function chaveFiltro(valor: string | null | undefined): string {
  return (valor ?? '')
    .normalize('NFD')
    .replace(/\p{M}+/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase('pt-BR');
}

export function temFiltroAtivo(filtros: FiltrosDashboard): boolean {
  return filtros.unidade !== '' || filtros.curso !== '' || filtros.turma !== '';
}

function coletarOpcoes(
  alertas: AlertaPedagogicoDTO[],
  campo: keyof FiltrosDashboard,
): OpcaoFiltro[] {
  const mapa = new Map<string, string>();
  for (const alerta of alertas) {
    const bruto = alerta[campo]?.replace(/\s+/g, ' ').trim();
    const chave = chaveFiltro(bruto);
    if (chave && !mapa.has(chave)) mapa.set(chave, bruto as string);
  }
  return [...mapa.entries()]
    .map(([valor, rotulo]) => ({ valor, rotulo }))
    .sort((a, b) => a.rotulo.localeCompare(b.rotulo, 'pt-BR', { numeric: true }));
}

/** Unidades disponíveis (sobre todos os alertas, ativos e tratados). */
export function opcoesUnidade(alertas: AlertaPedagogicoDTO[]): OpcaoFiltro[] {
  return coletarOpcoes(alertas, 'unidade');
}

/** Cursos disponíveis, restritos à Unidade selecionada. */
export function opcoesCurso(alertas: AlertaPedagogicoDTO[], filtros: FiltrosDashboard): OpcaoFiltro[] {
  return coletarOpcoes(
    alertas.filter((a) => !filtros.unidade || chaveFiltro(a.unidade) === filtros.unidade),
    'curso',
  );
}

/** Turmas disponíveis, restritas à Unidade e ao Curso selecionados. */
export function opcoesTurma(alertas: AlertaPedagogicoDTO[], filtros: FiltrosDashboard): OpcaoFiltro[] {
  return coletarOpcoes(
    alertas.filter(
      (a) =>
        (!filtros.unidade || chaveFiltro(a.unidade) === filtros.unidade) &&
        (!filtros.curso || chaveFiltro(a.curso) === filtros.curso),
    ),
    'turma',
  );
}

/** Alterar um filtro "pai" limpa os filhos (Unidade > Curso > Turma), que passam a ser outro recorte. */
export function alterarFiltro(
  atuais: FiltrosDashboard,
  campo: keyof FiltrosDashboard,
  valor: string,
): FiltrosDashboard {
  if (campo === 'unidade') return { unidade: valor, curso: '', turma: '' };
  if (campo === 'curso') return { ...atuais, curso: valor, turma: '' };
  return { ...atuais, turma: valor };
}

/** TA5.3: filtros combinados (AND) por Unidade, Curso e Turma. */
export function filtrarAlertas(
  alertas: AlertaPedagogicoDTO[],
  filtros: FiltrosDashboard,
): AlertaPedagogicoDTO[] {
  return alertas.filter(
    (a) =>
      (!filtros.unidade || chaveFiltro(a.unidade) === filtros.unidade) &&
      (!filtros.curso || chaveFiltro(a.curso) === filtros.curso) &&
      (!filtros.turma || chaveFiltro(a.turma) === filtros.turma),
  );
}

export interface IndicadoresDashboard {
  ativos: number;
  vermelhos: number;
  pedagogicos: number;
  jubilamento: number;
  retencao: number;
  incoerencias: number;
  estudantesEmAlerta: number;
  tratados: number;
}

/** Indicadores dos cards, calculados sobre o recorte já filtrado. */
export function calcularIndicadores(filtrados: AlertaPedagogicoDTO[]): IndicadoresDashboard {
  const ativos = filtrados.filter((a) => !a.tratado);
  return {
    ativos: ativos.length,
    vermelhos: ativos.filter((a) => a.severidade === 'VERMELHO').length,
    pedagogicos: ativos.filter((a) => a.severidade === 'PEDAGOGICO').length,
    jubilamento: ativos.filter((a) => a.tipoAlerta === 'RISCO_JUBILAMENTO').length,
    retencao: ativos.filter((a) => a.tipoAlerta === 'RETENCAO').length,
    incoerencias: ativos.filter((a) => a.tipoAlerta === 'INCOERENCIA_PEDAGOGICA').length,
    estudantesEmAlerta: new Set(ativos.map((a) => a.alunoId)).size,
    tratados: filtrados.length - ativos.length,
  };
}

/** Histórico: do tratamento mais recente para o mais antigo. */
export function ordenarHistorico(tratados: AlertaPedagogicoDTO[]): AlertaPedagogicoDTO[] {
  const instante = (a: AlertaPedagogicoDTO) => Date.parse(a.tratadoEm ?? a.criadoEm) || 0;
  return [...tratados].sort((a, b) => instante(b) - instante(a));
}

/** Aplica o retorno do PATCH /tratar na lista local (o alerta sai de "ativos" e entra no histórico). */
export function aplicarTratamento(
  alertas: AlertaPedagogicoDTO[],
  atualizado: AlertaPedagogicoDTO,
  agoraIso: string,
): AlertaPedagogicoDTO[] {
  return alertas.map((a) =>
    a.id === atualizado.id
      ? { ...a, ...atualizado, tratado: true, tratadoEm: atualizado.tratadoEm ?? agoraIso }
      : a,
  );
}
