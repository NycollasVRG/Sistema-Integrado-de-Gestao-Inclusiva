import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  ClipboardList,
  FileText,
  History,
  LayoutDashboard,
  Shield,
  UserCheck,
  Users,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ROTULO_ROLE, type Role } from '../../types/auth';
import type { UsuarioAdminDTO } from '../../types/adminUsuarios';
import type { AuditLogDTO } from '../../types/dossie';
import type { AlertaPedagogicoDTO } from '../../types/alertaDashboard';
import { AdminUsuariosService } from '../../services/adminUsuariosService';
import { AuditoriaService } from '../../services/auditoriaService';
import { DashboardAlertaService } from '../../services/dashboardAlertaService';
import { GestaoEstudantesService } from '../../services/gestaoEstudantesService';
import { formatarDataHora } from '../../utils/indicacao';
import { BannerBoasVindasCargo } from '../../components/inicio/BannerBoasVindasCargo';
import { CardResumoKpi } from '../../components/inicio/CardResumoKpi';
import { CardAcaoRapida } from '../../components/inicio/CardAcaoRapida';

interface EstadoAdmin {
  usuarios: UsuarioAdminDTO[];
  totalEstudantes: number | null;
  alertasAtivos: AlertaPedagogicoDTO[];
  logsRecentes: AuditLogDTO[];
  totalLogs: number | null;
}

const ESTADO_INICIAL: EstadoAdmin = {
  usuarios: [],
  totalEstudantes: null,
  alertasAtivos: [],
  logsRecentes: [],
  totalLogs: null,
};

export const InicioAdmin: React.FC = () => {
  const { sessao } = useAuth();
  const [dados, setDados] = useState<EstadoAdmin>(ESTADO_INICIAL);
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
      AdminUsuariosService.listarUsuarios(signal),
      GestaoEstudantesService.listar(
        { termo: '', curso: '', turma: '', tag: '', ativo: true, page: 0, size: 5 },
        signal,
      ),
      DashboardAlertaService.listar(false, signal),
      AuditoriaService.listar({ pagina: 0, tamanho: 5 }, signal),
    ])
      .then(([resUsuarios, resEstudantes, resAlertas, resAuditoria]) => {
        if (signal.aborted) return;
        setDados({
          usuarios: resUsuarios.status === 'fulfilled' ? resUsuarios.value : [],
          totalEstudantes:
            resEstudantes.status === 'fulfilled' ? resEstudantes.value.totalElements : null,
          alertasAtivos: resAlertas.status === 'fulfilled' ? resAlertas.value : [],
          logsRecentes: resAuditoria.status === 'fulfilled' ? resAuditoria.value.logs : [],
          totalLogs:
            resAuditoria.status === 'fulfilled' ? resAuditoria.value.totalElementos : null,
        });
      })
      .finally(() => {
        if (!signal.aborted) setCarregando(false);
      });

    return () => controlador.abort();
  }, [revisao]);

  const usuariosAtivos = useMemo(
    () => dados.usuarios.filter((u) => u.acessoAtivo).length,
    [dados.usuarios],
  );
  const usuariosRevogados = dados.usuarios.length - usuariosAtivos;

  const distribuicaoPorCargo = useMemo(() => {
    const mapa = new Map<Role, number>();
    for (const u of dados.usuarios) {
      mapa.set(u.role, (mapa.get(u.role) ?? 0) + 1);
    }
    return Array.from(mapa.entries()).sort((a, b) => b[1] - a[1]);
  }, [dados.usuarios]);

  if (!sessao) return null;

  return (
    <div className="space-y-6">
      <BannerBoasVindasCargo
        sessao={sessao}
        icone={Shield}
        destaqueCor="purple"
        carregando={carregando}
        onAtualizar={recarregar}
      />

      {/* Indicadores Principais */}
      <section aria-label="Indicadores administrativos" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <CardResumoKpi
          titulo="Usuários Ativos"
          valor={usuariosAtivos}
          descricao={
            usuariosRevogados > 0
              ? `${usuariosRevogados} acesso(s) revogado(s) de ${dados.usuarios.length} total`
              : `${dados.usuarios.length} conta(s) cadastrada(s) no RBAC`
          }
          icone={UserCheck}
          tom="purple"
          carregando={carregando}
          to="/admin/usuarios"
        />
        <CardResumoKpi
          titulo="Estudantes Ativos"
          valor={dados.totalEstudantes ?? '—'}
          descricao="Discentes acompanhados no catálogo SIGI"
          icone={Users}
          tom="teal"
          carregando={carregando}
          to="/estudantes"
        />
        <CardResumoKpi
          titulo="Alertas Ativos"
          valor={dados.alertasAtivos.length}
          descricao="Pendências pedagógicas e risco de evasão"
          icone={AlertTriangle}
          tom={dados.alertasAtivos.length > 0 ? 'amber' : 'green'}
          carregando={carregando}
          to="/dashboard"
        />
        <CardResumoKpi
          titulo="Registros de Auditoria"
          valor={dados.totalLogs ?? '—'}
          descricao="Eventos imutáveis registrados (LGPD)"
          icone={History}
          tom="slate"
          carregando={carregando}
          to="/admin/auditoria"
        />
      </section>

      {/* Painéis de Governança: Auditoria Recente + Distribuição RBAC */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <section className="xl:col-span-2 bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <History className="w-4 h-4 text-purple-700" aria-hidden="true" />
                Atividade Recente na Auditoria
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Últimas operações registradas na trilha imutável do sistema
              </p>
            </div>
            <Link
              to="/admin/auditoria"
              className="inline-flex items-center gap-1 text-xs font-semibold text-purple-700 hover:text-purple-900 shrink-0"
            >
              Ver trilha completa
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-gray-100">
            {carregando ? (
              <div className="p-5 space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-11 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : dados.logsRecentes.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">
                Nenhum evento recente disponível na auditoria.
              </div>
            ) : (
              dados.logsRecentes.map((log) => (
                <div
                  key={log.id}
                  className="px-5 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 hover:bg-gray-50/80"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
                        {log.acao}
                      </span>
                      <span className="text-xs font-semibold text-gray-800">{log.entidade}</span>
                      <span className="text-[11px] font-mono text-gray-500 truncate">
                        {log.metodoHttp} {log.endpoint}
                      </span>
                    </div>
                    {log.detalhes && (
                      <p className="text-xs text-gray-600 mt-1 truncate">{log.detalhes}</p>
                    )}
                  </div>
                  <span className="text-[11px] text-gray-500 shrink-0">
                    {formatarDataHora(log.timestamp)}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-700" aria-hidden="true" />
                Perfis RBAC
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">Distribuição de contas por cargo</p>
            </div>
            <Link
              to="/cargos"
              className="text-xs font-semibold text-purple-700 hover:text-purple-900"
            >
              Gerir cargos
            </Link>
          </div>

          <div className="p-5 space-y-3 flex-1">
            {carregando ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-9 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : distribuicaoPorCargo.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhuma conta carregada.</p>
            ) : (
              distribuicaoPorCargo.map(([role, quantidade]) => (
                <div
                  key={role}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-[#F8FAF8] border border-gray-100"
                >
                  <span className="text-sm font-medium text-gray-800">
                    {ROTULO_ROLE[role] ?? role}
                  </span>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-purple-100 text-purple-900">
                    {quantidade}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Atalhos Rápidos */}
      <section aria-label="Atalhos administrativos">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3">
          Atalhos Rápidos
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <CardAcaoRapida
            titulo="Gestão de Usuários"
            descricao="Consultar perfis, permissões de saúde e revogar sessões imediatamente."
            to="/admin/usuarios"
            icone={Shield}
            destaque="purple"
          />
          <CardAcaoRapida
            titulo="Trilha de Auditoria"
            descricao="Inspecionar logs imutáveis de acesso a prontuários e alterações críticas."
            to="/admin/auditoria"
            icone={History}
            destaque="purple"
          />
          <CardAcaoRapida
            titulo="Dashboard de Alertas"
            descricao="Acompanhar indicadores de evasão, retenção e alertas pedagógicos."
            to="/dashboard"
            icone={LayoutDashboard}
          />
          <CardAcaoRapida
            titulo="Triagem e Estudantes"
            descricao="Revisar indicações pendentes ou acessar o catálogo de discentes."
            to="/triagem"
            icone={ClipboardList}
          />
          <CardAcaoRapida
            titulo="Adaptação DUA"
            descricao="Gerar e revisar provas adaptadas com apoio de inteligência artificial."
            to="/adaptacao-dua"
            icone={FileText}
          />
        </div>
      </section>
    </div>
  );
};

export default InicioAdmin;
