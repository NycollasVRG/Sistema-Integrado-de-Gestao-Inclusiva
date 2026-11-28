import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  History,
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
    <div className="space-y-5">
      <BannerBoasVindasCargo
        sessao={sessao}
        icone={Shield}
        carregando={carregando}
        onAtualizar={recarregar}
      />

      <section
        aria-label="Indicadores administrativos"
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
      >
        <CardResumoKpi
          titulo="Usuários Ativos"
          valor={usuariosAtivos}
          descricao={
            usuariosRevogados > 0
              ? `${usuariosRevogados} revogado(s) de ${dados.usuarios.length}`
              : `${dados.usuarios.length} cadastrado(s)`
          }
          icone={UserCheck}
          carregando={carregando}
          to="/admin/usuarios"
        />
        <CardResumoKpi
          titulo="Estudantes Ativos"
          valor={dados.totalEstudantes ?? '—'}
          icone={Users}
          carregando={carregando}
          to="/estudantes"
        />
        <CardResumoKpi
          titulo="Alertas Ativos"
          valor={dados.alertasAtivos.length}
          icone={AlertTriangle}
          carregando={carregando}
          to="/dashboard"
        />
        <CardResumoKpi
          titulo="Registros de Auditoria"
          valor={dados.totalLogs ?? '—'}
          icone={History}
          carregando={carregando}
          to="/admin/auditoria"
        />
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <section className="xl:col-span-2 bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <History className="w-4 h-4 text-ifpb-teal" aria-hidden="true" />
              Atividade Recente
            </h2>
            <Link
              to="/admin/auditoria"
              className="inline-flex items-center gap-1 text-xs font-semibold text-ifpb-teal hover:text-ifpb-tealHover shrink-0"
            >
              Ver tudo
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-gray-100">
            {carregando ? (
              <div className="p-5 space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : dados.logsRecentes.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">
                Nenhuma atividade recente registrada.
              </div>
            ) : (
              dados.logsRecentes.map((log) => (
                <div
                  key={log.id}
                  className="px-5 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 hover:bg-gray-50/70"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-ifpb-tealLight text-ifpb-teal">
                        {log.acao}
                      </span>
                      <span className="text-xs font-medium text-gray-800">{log.entidade}</span>
                    </div>
                    {log.detalhes && (
                      <p className="text-xs text-gray-500 mt-1 truncate">{log.detalhes}</p>
                    )}
                  </div>
                  <span className="text-[11px] text-gray-400 shrink-0">
                    {formatarDataHora(log.timestamp)}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden flex flex-col">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-ifpb-teal" aria-hidden="true" />
              Usuários por Cargo
            </h2>
            <Link
              to="/cargos"
              className="text-xs font-semibold text-ifpb-teal hover:text-ifpb-tealHover"
            >
              Gerir cargos
            </Link>
          </div>

          <div className="p-4 space-y-2.5 flex-1">
            {carregando ? (
              <div className="space-y-2.5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-9 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : distribuicaoPorCargo.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhum usuário carregado.</p>
            ) : (
              distribuicaoPorCargo.map(([role, quantidade]) => (
                <div
                  key={role}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#F8FAF8] border border-gray-100"
                >
                  <span className="text-xs font-medium text-gray-800">
                    {ROTULO_ROLE[role] ?? role}
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-ifpb-tealLight text-ifpb-teal">
                    {quantidade}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default InicioAdmin;
