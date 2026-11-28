import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Briefcase,
  ClipboardList,
  LayoutDashboard,
  ShieldAlert,
  UserRoundPlus,
  Users,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import type { AlertaPedagogicoDTO } from '../../types/alertaDashboard';
import type { IndicacaoResponseDTO } from '../../types/indicacao';
import type { NotificacaoResponseDTO } from '../../types/notificacao';
import { DashboardAlertaService } from '../../services/dashboardAlertaService';
import { IndicacaoService } from '../../services/indicacaoService';
import { NotificacaoService, rotaPeiDaNotificacao } from '../../services/notificacaoService';
import { GestaoEstudantesService } from '../../services/gestaoEstudantesService';
import { formatarDataHora } from '../../utils/indicacao';
import { BannerBoasVindasCargo } from '../../components/inicio/BannerBoasVindasCargo';
import { CardResumoKpi } from '../../components/inicio/CardResumoKpi';

interface EstadoCoordenador {
  alertasAtivos: AlertaPedagogicoDTO[];
  indicacoesPendentes: IndicacaoResponseDTO[];
  notificacoesNaoLidas: NotificacaoResponseDTO[];
  totalEstudantes: number | null;
}

const ESTADO_INICIAL: EstadoCoordenador = {
  alertasAtivos: [],
  indicacoesPendentes: [],
  notificacoesNaoLidas: [],
  totalEstudantes: null,
};

export const InicioCoordenador: React.FC = () => {
  const { sessao } = useAuth();
  const [dados, setDados] = useState<EstadoCoordenador>(ESTADO_INICIAL);
  const [carregando, setCarregando] = useState(true);
  const [revisao, setRevisao] = useState(0);

  const recarregar = useCallback(() => {
    setCarregando(true);
    setRevisao((v) => v + 1);
  }, []);

  useEffect(() => {
    const controlador = new AbortController();
    const { signal } = controlador;

    Promise.allSettled([
      DashboardAlertaService.listar(false, signal),
      IndicacaoService.listar('PENDENTE', signal),
      NotificacaoService.listar('COORDENADOR', true, signal),
      GestaoEstudantesService.listar(
        { termo: '', curso: '', turma: '', tag: '', ativo: true, page: 0, size: 5 },
        signal,
      ),
    ])
      .then(([resAlertas, resIndicacoes, resNotificacoes, resEstudantes]) => {
        if (signal.aborted) return;
        setDados({
          alertasAtivos: resAlertas.status === 'fulfilled' ? resAlertas.value : [],
          indicacoesPendentes: resIndicacoes.status === 'fulfilled' ? resIndicacoes.value : [],
          notificacoesNaoLidas:
            resNotificacoes.status === 'fulfilled' ? resNotificacoes.value : [],
          totalEstudantes:
            resEstudantes.status === 'fulfilled' ? resEstudantes.value.totalElements : null,
        });
      })
      .finally(() => {
        if (!signal.aborted) setCarregando(false);
      });

    return () => controlador.abort();
  }, [revisao]);

  const alertasCriticos = useMemo(
    () => dados.alertasAtivos.filter((a) => a.severidade === 'VERMELHO'),
    [dados.alertasAtivos],
  );

  const alertasPrioritarios = useMemo(() => {
    return [...dados.alertasAtivos]
      .sort((a, b) => {
        if (a.severidade === b.severidade) return b.criadoEm.localeCompare(a.criadoEm);
        return a.severidade === 'VERMELHO' ? -1 : 1;
      })
      .slice(0, 5);
  }, [dados.alertasAtivos]);

  if (!sessao) return null;

  return (
    <div className="space-y-5">
      <BannerBoasVindasCargo
        sessao={sessao}
        icone={LayoutDashboard}
        carregando={carregando}
        onAtualizar={recarregar}
        acaoExtra={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/cargos"
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 px-3.5 py-2 text-xs font-semibold text-gray-700 transition-colors"
            >
              <Briefcase className="w-3.5 h-3.5 text-ifpb-teal" />
              Gerir cargos
            </Link>
            <Link
              to="/estudantes/novo"
              className="inline-flex items-center gap-1.5 rounded-lg bg-ifpb-teal hover:bg-ifpb-tealHover px-3.5 py-2 text-xs font-semibold text-white transition-colors"
            >
              <UserRoundPlus className="w-3.5 h-3.5" />
              Cadastrar estudante
            </Link>
          </div>
        }
      />

      <section
        aria-label="Indicadores da coordenação"
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
      >
        <CardResumoKpi
          titulo="Alertas Críticos"
          valor={alertasCriticos.length}
          descricao={`${dados.alertasAtivos.length} ativo(s) no total`}
          icone={ShieldAlert}
          carregando={carregando}
          to="/dashboard"
        />
        <CardResumoKpi
          titulo="Triagem Pendente"
          valor={dados.indicacoesPendentes.length}
          icone={ClipboardList}
          carregando={carregando}
          to="/triagem"
        />
        <CardResumoKpi
          titulo="Notificações"
          valor={dados.notificacoesNaoLidas.length}
          icone={Bell}
          carregando={carregando}
        />
        <CardResumoKpi
          titulo="Estudantes Ativos"
          valor={dados.totalEstudantes ?? '—'}
          icone={Users}
          carregando={carregando}
          to="/estudantes"
        />
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <section className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-ifpb-teal" aria-hidden="true" />
              Alertas Prioritários
            </h2>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1 text-xs font-semibold text-ifpb-teal hover:text-ifpb-tealHover shrink-0"
            >
              Ver dashboard
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-gray-100">
            {carregando ? (
              <div className="p-5 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : alertasPrioritarios.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">
                Nenhum alerta pendente no momento.
              </div>
            ) : (
              alertasPrioritarios.map((alerta) => (
                <div
                  key={alerta.id}
                  className="px-5 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 hover:bg-gray-50/70"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                          alerta.severidade === 'VERMELHO'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {alerta.severidade === 'VERMELHO' ? 'Crítico' : 'Pedagógico'}
                      </span>
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {alerta.alunoNome}
                      </p>
                    </div>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{alerta.descricao}</p>
                  </div>
                  <Link
                    to={`/estudantes/${alerta.alunoId}/prontuario`}
                    className="text-xs font-semibold text-ifpb-teal hover:underline shrink-0"
                  >
                    Abrir
                  </Link>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Bell className="w-4 h-4 text-ifpb-teal" aria-hidden="true" />
              Notificações Recentes
            </h2>
            <Link
              to="/triagem"
              className="inline-flex items-center gap-1 text-xs font-semibold text-ifpb-teal hover:text-ifpb-tealHover shrink-0"
            >
              Ver triagem ({dados.indicacoesPendentes.length})
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-gray-100">
            {carregando ? (
              <div className="p-5 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : dados.notificacoesNaoLidas.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">
                Nenhuma notificação pendente.
              </div>
            ) : (
              dados.notificacoesNaoLidas.slice(0, 5).map((notif) => {
                const rotaPei = rotaPeiDaNotificacao(notif.linkReferencia);
                return (
                  <div key={notif.id} className="px-5 py-3 hover:bg-gray-50/70">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{notif.titulo}</p>
                        <p className="text-xs text-gray-600 mt-0.5">{notif.mensagem}</p>
                        <p className="text-[11px] text-gray-400 mt-1">
                          {formatarDataHora(notif.criadoEm)}
                        </p>
                      </div>
                      {rotaPei && (
                        <Link
                          to={rotaPei}
                          className="text-xs font-semibold text-ifpb-teal hover:underline shrink-0"
                        >
                          Revisar PEI
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default InicioCoordenador;
