import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Brain,
  ClipboardList,
  ClipboardPlus,
  FileText,
  LayoutDashboard,
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
import { CardAcaoRapida } from '../../components/inicio/CardAcaoRapida';
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
    <div className="space-y-6">
      <BannerBoasVindasCargo
        sessao={sessao}
        icone={Brain}
        carregando={carregando}
        onAtualizar={recarregar}
      />

      {/* Indicadores da Equipe CLAI */}
      <section aria-label="Indicadores psicopedagógicos" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <CardResumoKpi
          titulo="Fila de Triagem"
          valor={dados.indicacoesPendentes.length}
          descricao="Indicações pendentes para abertura de Estudo de Caso"
          icone={ClipboardList}
          tom={dados.indicacoesPendentes.length > 0 ? 'amber' : 'green'}
          carregando={carregando}
          to="/triagem"
        />
        <CardResumoKpi
          titulo="Estudantes Ativos"
          valor={dados.totalEstudantes ?? '—'}
          descricao="Prontuários disponíveis para acompanhamento"
          icone={Users}
          tom="teal"
          carregando={carregando}
          to="/estudantes"
        />
        <CardResumoKpi
          titulo="Alertas Pedagógicos"
          valor={dados.alertasAtivos.length}
          descricao="Sinalizações ativas que requerem atenção da CLAI"
          icone={AlertTriangle}
          tom={dados.alertasAtivos.length > 0 ? 'red' : 'green'}
          carregando={carregando}
          to="/dashboard"
        />
      </section>

      {/* Fila de Triagem + Lista Rápida de Prontuários */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-ifpb-teal" aria-hidden="true" />
                Fila de Triagem Pendente
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Demandas espontâneas encaminhadas por docentes e coordenação
              </p>
            </div>
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
                  <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : dados.indicacoesPendentes.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">
                Nenhuma indicação pendente na fila de triagem.
              </div>
            ) : (
              dados.indicacoesPendentes.slice(0, 5).map((ind) => (
                <div key={ind.id} className="px-5 py-3.5 hover:bg-[#F8FAF8]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {ind.nomeEstudante}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Matrícula {ind.matriculaAluno} &bull; {formatarDataHora(ind.criadoEm)}
                      </p>
                      {ind.disciplinasObservadas.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {ind.disciplinasObservadas.slice(0, 3).map((disc) => (
                            <span
                              key={disc}
                              className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200"
                            >
                              {disc}
                            </span>
                          ))}
                        </div>
                      )}
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
          subtitulo="Abra diretamente Estudo de Caso, PEI, Plano de Ação e Atas"
          estudantes={dados.estudantes}
          carregando={carregando}
          onAbrirProntuario={onAbrirProntuario}
        />
      </div>

      {/* Atalhos Rápidos */}
      <section aria-label="Atalhos do psicopedagogo">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3">
          Ações Rápidas da CLAI
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <CardAcaoRapida
            titulo="Triagem e Indicações"
            descricao="Avaliar encaminhamentos e iniciar novos Estudos de Caso."
            to="/triagem"
            icone={ClipboardList}
          />
          <CardAcaoRapida
            titulo="Cadastrar Estudante"
            descricao="Registrar novo estudante com indicadores de acompanhamento."
            to="/estudantes/novo"
            icone={UserRoundPlus}
            destaque="green"
          />
          <CardAcaoRapida
            titulo="Dashboard de Alertas"
            descricao="Acompanhar indicadores e registrar tratativas pedagógicas."
            to="/dashboard"
            icone={LayoutDashboard}
          />
          <CardAcaoRapida
            titulo="Adaptação DUA"
            descricao="Apoiar docentes na adaptação inclusiva de avaliações."
            to="/adaptacao-dua"
            icone={FileText}
          />
          <CardAcaoRapida
            titulo="Nova Indicação"
            descricao="Registrar nova demanda de acompanhamento para triagem."
            to="/indicacoes/nova"
            icone={ClipboardPlus}
          />
        </div>
      </section>
    </div>
  );
};

export default InicioPsicopedagogo;
