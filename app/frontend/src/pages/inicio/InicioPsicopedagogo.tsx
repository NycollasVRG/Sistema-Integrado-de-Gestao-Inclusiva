import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Brain,
  ClipboardList,
  UserRoundPlus,
  Users,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import type { EstudanteResumo } from '../../types/gestaoEstudantes';
import type { IndicacaoResponseDTO } from '../../types/indicacao';
import type { AlertaPedagogicoDTO } from '../../types/alertaDashboard';
import { GestaoEstudantesService } from '../../services/gestaoEstudantesService';
import { IndicacaoService } from '../../services/indicacaoService';
import { DashboardAlertaService } from '../../services/dashboardAlertaService';
import { formatarDataHora } from '../../utils/indicacao';
import { BannerBoasVindasCargo } from '../../components/inicio/BannerBoasVindasCargo';
import { CardResumoKpi } from '../../components/inicio/CardResumoKpi';
import { ListaEstudantesRapida } from '../../components/inicio/ListaEstudantesRapida';

interface InicioPsicopedagogoProps {
  onAbrirProntuario?: (estudante: EstudanteResumo) => void;
}

interface EstadoPsicopedagogo {
  indicacoesPendentes: IndicacaoResponseDTO[];
  estudantes: EstudanteResumo[];
  totalEstudantes: number | null;
  alertasAtivos: AlertaPedagogicoDTO[];
}

const ESTADO_INICIAL: EstadoPsicopedagogo = {
  indicacoesPendentes: [],
  estudantes: [],
  totalEstudantes: null,
  alertasAtivos: [],
};

export const InicioPsicopedagogo: React.FC<InicioPsicopedagogoProps> = ({
  onAbrirProntuario,
}) => {
  const { sessao } = useAuth();
  const [dados, setDados] = useState<EstadoPsicopedagogo>(ESTADO_INICIAL);
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
      IndicacaoService.listar('PENDENTE', signal),
      GestaoEstudantesService.listar(
        { termo: '', curso: '', turma: '', tag: '', ativo: true, page: 0, size: 6 },
        signal,
      ),
      DashboardAlertaService.listar(false, signal),
    ])
      .then(([resIndicacoes, resEstudantes, resAlertas]) => {
        if (signal.aborted) return;
        setDados({
          indicacoesPendentes: resIndicacoes.status === 'fulfilled' ? resIndicacoes.value : [],
          estudantes: resEstudantes.status === 'fulfilled' ? resEstudantes.value.content : [],
          totalEstudantes:
            resEstudantes.status === 'fulfilled' ? resEstudantes.value.totalElements : null,
          alertasAtivos: resAlertas.status === 'fulfilled' ? resAlertas.value : [],
        });
      })
      .finally(() => {
        if (!signal.aborted) setCarregando(false);
      });

    return () => controlador.abort();
  }, [revisao]);

  if (!sessao) return null;

  return (
    <div className="space-y-5">
      <BannerBoasVindasCargo
        sessao={sessao}
        icone={Brain}
        carregando={carregando}
        onAtualizar={recarregar}
        acaoExtra={
          <Link
            to="/estudantes/novo"
            className="inline-flex items-center gap-1.5 rounded-lg bg-ifpb-teal hover:bg-ifpb-tealHover px-3.5 py-2 text-xs font-semibold text-white transition-colors"
          >
            <UserRoundPlus className="w-3.5 h-3.5" />
            Cadastrar estudante
          </Link>
        }
      />

      <section aria-label="Indicadores psicopedagógicos" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <CardResumoKpi
          titulo="Fila de Triagem"
          valor={dados.indicacoesPendentes.length}
          icone={ClipboardList}
          carregando={carregando}
          to="/triagem"
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
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <section className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-ifpb-teal" aria-hidden="true" />
              Fila de Triagem
            </h2>
            <Link
              to="/triagem"
              className="inline-flex items-center gap-1 text-xs font-semibold text-ifpb-teal hover:text-ifpb-tealHover shrink-0"
            >
              Analisar fila
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
            ) : dados.indicacoesPendentes.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">
                Nenhuma indicação pendente.
              </div>
            ) : (
              dados.indicacoesPendentes.slice(0, 5).map((ind) => (
                <div key={ind.id} className="px-5 py-3 hover:bg-gray-50/70">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {ind.nomeEstudante}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Matrícula {ind.matriculaAluno} &bull; {formatarDataHora(ind.criadoEm)}
                      </p>
                    </div>
                    <Link
                      to="/triagem"
                      className="text-xs font-semibold text-ifpb-teal hover:underline shrink-0"
                    >
                      Decidir
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <ListaEstudantesRapida
          titulo="Prontuários Recentes"
          subtitulo="Acesso direto aos prontuários ativos"
          estudantes={dados.estudantes}
          carregando={carregando}
          onAbrirProntuario={onAbrirProntuario}
        />
      </div>
    </div>
  );
};

export default InicioPsicopedagogo;
