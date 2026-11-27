import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Briefcase,
  ClipboardList,
  ClipboardPlus,
  FileText,
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
import { CardAcaoRapida } from '../../components/inicio/CardAcaoRapida';

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
    <div className="space-y-6">
      <BannerBoasVindasCargo
        sessao={sessao}
        icone={LayoutDashboard}
        carregando={carregando}
        onAtualizar={recarregar}
      />

      {/* Indicadores Gerenciais */}
      <section aria-label="Indicadores da coordenação" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <CardResumoKpi
          titulo="Alertas Críticos"
          valor={alertasCriticos.length}
          descricao={`${dados.alertasAtivos.length} alerta(s) ativo(s) no total`}
          icone={ShieldAlert}
          tom={alertasCriticos.length > 0 ? 'red' : 'green'}
          carregando={carregando}
          to="/dashboard"
        />
        <CardResumoKpi
          titulo="Triagem Pendente"
          valor={dados.indicacoesPendentes.length}
          descricao="Indicações aguardando decisão da CLAI"
          icone={ClipboardList}
          tom={dados.indicacoesPendentes.length > 0 ? 'amber' : 'teal'}
          carregando={carregando}
          to="/triagem"
        />
        <CardResumoKpi
          titulo="Notificações Pendentes"
          valor={dados.notificacoesNaoLidas.length}
          descricao="Avisos de revisão de PEI e eventos do sistema"
          icone={Bell}
          tom={dados.notificacoesNaoLidas.length > 0 ? 'purple' : 'slate'}
          carregando={carregando}
        />
        <CardResumoKpi
          titulo="Estudantes Ativos"
          valor={dados.totalEstudantes ?? '—'}
          descricao="Discentes em acompanhamento no campus"
          icone={Users}
          tom="teal"
          carregando={carregando}
          to="/estudantes"
        />
      </section>

      {/* Painéis Prioritários */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Alertas Prioritários */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" aria-hidden="true" />
                Alertas Prioritários
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Risco de jubilamento, retenção e incoerências pedagógicas
              </p>
            </div>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1 text-xs font-semibold text-ifpb-teal hover:text-ifpb-tealHover shrink-0"
            >
              Abrir dashboard
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-gray-100">
            {carregando ? (
              <div className="p-5 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : alertasPrioritarios.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">
                Nenhum alerta pedagógico pendente no momento.
              </div>
            ) : (
              alertasPrioritarios.map((alerta) => (
                <div
                  key={alerta.id}
                  className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 hover:bg-[#F8FAF8]"
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
                    Ver prontuário
                  </Link>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Notificações e Revisões de PEI */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Bell className="w-4 h-4 text-ifpb-teal" aria-hidden="true" />
                Notificações &amp; Revisões de PEI
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Pendências direcionadas ao perfil de Coordenação
              </p>
            </div>
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
                  <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : dados.notificacoesNaoLidas.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">
                Todas as notificações da Coordenação estão em dia.
              </div>
            ) : (
              dados.notificacoesNaoLidas.slice(0, 5).map((notif) => {
                const rotaPei = rotaPeiDaNotificacao(notif.linkReferencia);
                return (
                  <div key={notif.id} className="px-5 py-3.5 hover:bg-[#F8FAF8]">
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

      {/* Atalhos Rápidos */}
      <section aria-label="Atalhos da coordenação">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3">
          Ações Rápidas
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <CardAcaoRapida
            titulo="Dashboard de Alertas"
            descricao="Filtrar alertas por unidade, curso e turma e registrar tratativas."
            to="/dashboard"
            icone={LayoutDashboard}
          />
          <CardAcaoRapida
            titulo="Triagem de Indicações"
            descricao="Aprovar indicações para Estudo de Caso ou registrar parecer."
            to="/triagem"
            icone={ClipboardList}
            badge={`${dados.indicacoesPendentes.length} pendente(s)`}
          />
          <CardAcaoRapida
            titulo="Cadastrar Estudante"
            descricao="Incluir novo discente no acompanhamento inclusivo da CLAI."
            to="/estudantes/novo"
            icone={UserRoundPlus}
            destaque="green"
          />
          <CardAcaoRapida
            titulo="Adaptação DUA"
            descricao="Enviar provas para adaptação assistida e revisar resultado."
            to="/adaptacao-dua"
            icone={FileText}
          />
          <CardAcaoRapida
            titulo="Indicar Estudante"
            descricao="Registrar encaminhamento pedagógico espontâneo para a equipe."
            to="/indicacoes/nova"
            icone={ClipboardPlus}
          />
          <CardAcaoRapida
            titulo="Gestão de Cargos"
            descricao="Cadastrar, editar e gerenciar cargos institucionais."
            to="/cargos"
            icone={Briefcase}
          />
        </div>
      </section>
    </div>
  );
};

export default InicioCoordenador;
