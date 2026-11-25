import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  History,
  LayoutDashboard,
  RotateCw,
  ShieldAlert,
  Users,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { CardAcessoRestrito } from '../components/CardAcessoRestrito';
import { CardIndicadorDashboard } from '../components/CardIndicadorDashboard';
import { ConfirmModal } from '../components/ConfirmModal';
import { ItemAlertaDashboard } from '../components/ItemAlertaDashboard';
import { DashboardAlertaService } from '../services/dashboardAlertaService';
import { isAbortError, toProblem } from '../services/apiClient';
import type { AlertaPedagogicoDTO } from '../types/alertaDashboard';
import {
  FILTROS_VAZIOS,
  alterarFiltro,
  aplicarTratamento,
  calcularIndicadores,
  filtrarAlertas,
  opcoesCurso,
  opcoesTurma,
  opcoesUnidade,
  ordenarHistorico,
  temFiltroAtivo,
  type FiltrosDashboard,
  type OpcaoFiltro,
} from '../utils/dashboardAlertas';

export interface DashboardAlertasProps {
  onNotificar?: (tipo: 'sucesso' | 'erro' | 'alerta', titulo: string, mensagem: string) => void;
}

type Aba = 'ATIVOS' | 'HISTORICO';

interface SeletorFiltroProps {
  id: string;
  rotulo: string;
  valor: string;
  opcoes: OpcaoFiltro[];
  textoTodos: string;
  onChange: (valor: string) => void;
}

function SeletorFiltro({ id, rotulo, valor, opcoes, textoTodos, onChange }: SeletorFiltroProps) {
  return (
    <div className="flex-1 min-w-[10rem]">
      <label htmlFor={id} className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
        {rotulo}
      </label>
      <select
        id={id}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-ifpb-teal/40 cursor-pointer"
      >
        <option value="">{textoTodos}</option>
        {opcoes.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.rotulo}
          </option>
        ))}
      </select>
    </div>
  );
}

/** Dashboard de Métricas, Alertas Inteligentes e Histórico de Tratativas da CLAI (US 05 / TA5.1–TA5.4). */
export function DashboardAlertas({ onNotificar }: DashboardAlertasProps) {
  const navigate = useNavigate();
  const { podeVerDashboard, sessao } = useAuth();
  const [alertas, setAlertas] = useState<AlertaPedagogicoDTO[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [aba, setAba] = useState<Aba>('ATIVOS');
  const [filtros, setFiltros] = useState<FiltrosDashboard>(FILTROS_VAZIOS);
  const [revisao, setRevisao] = useState(0);
  const [aTratar, setATratar] = useState<AlertaPedagogicoDTO | null>(null);
  const [tratando, setTratando] = useState(false);

  useEffect(() => {
    if (!podeVerDashboard) return;
    const controlador = new AbortController();
    Promise.all([
      DashboardAlertaService.listar(false, controlador.signal),
      DashboardAlertaService.listar(true, controlador.signal),
    ])
      .then(([ativos, tratados]) => {
        if (!controlador.signal.aborted) setAlertas([...ativos, ...tratados]);
      })
      .catch((falha: unknown) => {
        if (isAbortError(falha) || controlador.signal.aborted) return;
        const problema = toProblem(falha, 'Erro ao carregar alertas', 'Não foi possível carregar os alertas.');
        setErro(problema.detail || problema.title);
      })
      .finally(() => {
        if (!controlador.signal.aborted) setCarregando(false);
      });
    return () => controlador.abort();
  }, [podeVerDashboard, revisao]);

  const recarregar = useCallback(() => {
    setCarregando(true);
    setErro('');
    setRevisao((v) => v + 1);
  }, []);

  // TA5.3: tudo abaixo é derivado dos filtros; mudar um filtro atualiza cards, painel e histórico na hora.
  const unidades = useMemo(() => opcoesUnidade(alertas), [alertas]);
  const cursos = useMemo(() => opcoesCurso(alertas, filtros), [alertas, filtros]);
  const turmas = useMemo(() => opcoesTurma(alertas, filtros), [alertas, filtros]);
  const filtrados = useMemo(() => filtrarAlertas(alertas, filtros), [alertas, filtros]);
  const indicadores = useMemo(() => calcularIndicadores(filtrados), [filtrados]);
  const ativos = useMemo(() => filtrados.filter((a) => !a.tratado), [filtrados]);
  const vermelhos = useMemo(() => ativos.filter((a) => a.severidade === 'VERMELHO'), [ativos]);
  const pedagogicos = useMemo(() => ativos.filter((a) => a.severidade === 'PEDAGOGICO'), [ativos]);
  const historico = useMemo(() => ordenarHistorico(filtrados.filter((a) => a.tratado)), [filtrados]);

  if (!podeVerDashboard) {
    return (
      <CardAcessoRestrito mensagem="O Dashboard de Alertas é restrito à equipe CLAI, à Coordenação e à Administração." />
    );
  }

  const abrirProntuario = (alunoId: string) => navigate(`/estudantes/${alunoId}/prontuario`);

  // TA5.4: o alerta sai do painel principal e passa a constar no histórico.
  async function confirmarTratamento() {
    if (!aTratar) return;
    setTratando(true);
    try {
      const atualizado = await DashboardAlertaService.tratar(aTratar.id);
      setAlertas((anteriores) => aplicarTratamento(anteriores, atualizado, new Date().toISOString()));
      onNotificar?.(
        'sucesso',
        'Alerta tratado',
        `O alerta de ${aTratar.alunoNome} foi movido para o Histórico de Alertas Tratados.`,
      );
      setATratar(null);
    } catch (falha: unknown) {
      const problema = toProblem(falha, 'Erro ao tratar alerta', 'Não foi possível marcar o alerta como tratado.');
      onNotificar?.('erro', problema.title, problema.detail || 'Não foi possível marcar o alerta como tratado.');
    } finally {
      setTratando(false);
    }
  }

  const ABAS: { id: Aba; rotulo: string; total: number; icone: ReactNode }[] = [
    { id: 'ATIVOS', rotulo: 'Alertas Ativos', total: ativos.length, icone: <AlertTriangle className="w-4 h-4" /> },
    {
      id: 'HISTORICO',
      rotulo: 'Histórico de Alertas Tratados',
      total: historico.length,
      icone: <History className="w-4 h-4" />,
    },
  ];

  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ifpb-teal inline-flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6" aria-hidden="true" />
            Dashboard de Alertas
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Monitore evasão, retenção e incoerências avaliativas. Os indicadores acompanham os filtros aplicados.
          </p>
        </div>
        <button
          type="button"
          onClick={recarregar}
          disabled={carregando}
          className="inline-flex items-center gap-2 self-start rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 cursor-pointer transition-colors"
        >
          <RotateCw className={`w-4 h-4 ${carregando ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {erro && (
        <p role="alert" className="rounded-lg bg-red-50 border border-red-200 text-red-700 p-3 text-sm">
          {erro}
        </p>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3" aria-label="Indicadores">
        <CardIndicadorDashboard
          titulo="Alertas ativos"
          valor={indicadores.ativos}
          descricao={`${indicadores.estudantesEmAlerta} estudante(s) em alerta`}
          icone={<Users className="w-4 h-4" />}
        />
        <CardIndicadorDashboard
          titulo="Risco de jubilamento"
          valor={indicadores.jubilamento}
          descricao="Alerta vermelho"
          tom="vermelho"
          icone={<ShieldAlert className="w-4 h-4" />}
        />
        <CardIndicadorDashboard
          titulo="Retenção"
          valor={indicadores.retencao}
          descricao="Alerta vermelho"
          tom="vermelho"
          icone={<ShieldAlert className="w-4 h-4" />}
        />
        <CardIndicadorDashboard
          titulo="Incoerências avaliativas"
          valor={indicadores.incoerencias}
          descricao="Alerta pedagógico"
          tom="pedagogico"
          icone={<AlertTriangle className="w-4 h-4" />}
        />
        <CardIndicadorDashboard
          titulo="Tratados"
          valor={indicadores.tratados}
          descricao="No histórico de tratativas"
          tom="sucesso"
          icone={<CheckCircle2 className="w-4 h-4" />}
        />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-xs p-4">
        <div className="flex flex-wrap items-end gap-3">
          <SeletorFiltro
            id="filtro-unidade"
            rotulo="Unidade"
            valor={filtros.unidade}
            opcoes={unidades}
            textoTodos="Todas as unidades"
            onChange={(v) => setFiltros((f) => alterarFiltro(f, 'unidade', v))}
          />
          <SeletorFiltro
            id="filtro-curso"
            rotulo="Curso"
            valor={filtros.curso}
            opcoes={cursos}
            textoTodos="Todos os cursos"
            onChange={(v) => setFiltros((f) => alterarFiltro(f, 'curso', v))}
          />
          <SeletorFiltro
            id="filtro-turma"
            rotulo="Turma"
            valor={filtros.turma}
            opcoes={turmas}
            textoTodos="Todas as turmas"
            onChange={(v) => setFiltros((f) => alterarFiltro(f, 'turma', v))}
          />
          <button
            type="button"
            onClick={() => setFiltros(FILTROS_VAZIOS)}
            disabled={!temFiltroAtivo(filtros)}
            className="rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            Limpar filtros
          </button>
        </div>
        <p className="mt-3 text-xs text-gray-500" aria-live="polite">
          {ativos.length} alerta(s) ativo(s) e {historico.length} tratado(s) no recorte atual.
        </p>
      </div>

      <div role="tablist" aria-label="Alertas do dashboard" className="flex flex-wrap gap-2">
        {ABAS.map(({ id, rotulo, total, icone }) => {
          const ativa = aba === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={ativa}
              onClick={() => setAba(id)}
              className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold border transition-colors cursor-pointer ${
                ativa
                  ? 'bg-ifpb-teal text-white border-ifpb-teal shadow-xs'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {icone}
              {rotulo}
              <span
                className={`min-w-[1.5rem] rounded-full px-1.5 py-0.5 text-[11px] text-center ${
                  ativa ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {total}
              </span>
            </button>
          );
        })}
      </div>

      {carregando && alertas.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-ifpb-teal mb-3" />
          <p className="text-sm font-medium text-gray-600">Carregando alertas...</p>
        </div>
      ) : aba === 'ATIVOS' ? (
        <div className="space-y-6">
          <section aria-labelledby="titulo-alertas-vermelhos" className="space-y-3">
            <h2 id="titulo-alertas-vermelhos" className="text-sm font-bold uppercase tracking-wider text-ifpb-red">
              Alertas vermelhos — retenção e jubilamento ({vermelhos.length})
            </h2>
            {vermelhos.length === 0 ? (
              <p className="rounded-xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-600">
                Nenhum alerta vermelho ativo{temFiltroAtivo(filtros) ? ' para os filtros selecionados' : ''}.
              </p>
            ) : (
              <ul className="space-y-3" aria-label="Alertas vermelhos ativos">
                {vermelhos.map((a) => (
                  <ItemAlertaDashboard
                    key={a.id}
                    alerta={a}
                    onTratar={setATratar}
                    onAbrirProntuario={abrirProntuario}
                  />
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="titulo-alertas-pedagogicos" className="space-y-3">
            <h2 id="titulo-alertas-pedagogicos" className="text-sm font-bold uppercase tracking-wider text-amber-700">
              Alertas pedagógicos — incoerência avaliativa ({pedagogicos.length})
            </h2>
            {pedagogicos.length === 0 ? (
              <p className="rounded-xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-600">
                Nenhum alerta pedagógico ativo{temFiltroAtivo(filtros) ? ' para os filtros selecionados' : ''}.
              </p>
            ) : (
              <ul className="space-y-3" aria-label="Alertas pedagógicos ativos">
                {pedagogicos.map((a) => (
                  <ItemAlertaDashboard
                    key={a.id}
                    alerta={a}
                    onTratar={setATratar}
                    onAbrirProntuario={abrirProntuario}
                  />
                ))}
              </ul>
            )}
          </section>
        </div>
      ) : historico.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <History className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-600">
            Nenhum alerta tratado{temFiltroAtivo(filtros) ? ' para os filtros selecionados' : ' até o momento'}.
          </p>
        </div>
      ) : (
        <ul className="space-y-3" aria-label="Histórico de alertas tratados">
          {historico.map((a) => (
            <ItemAlertaDashboard
              key={a.id}
              alerta={a}
              onAbrirProntuario={abrirProntuario}
              usuarioId={sessao?.userId}
            />
          ))}
        </ul>
      )}

      {aTratar && (
        <ConfirmModal
          titulo="Marcar como Ciente / Tratado"
          mensagem={`O alerta de ${aTratar.alunoNome} sairá do painel principal e ficará registrado no Histórico de Alertas Tratados, com seu usuário e a data/hora.`}
          textoConfirmar="Confirmar"
          variante="primario"
          isLoading={tratando}
          onConfirmar={confirmarTratamento}
          onCancelar={() => setATratar(null)}
        />
      )}
    </section>
  );
}
