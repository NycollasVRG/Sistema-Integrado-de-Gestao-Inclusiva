import React from 'react';
import type { Aluno, EstudoDeCasoResponseDTO, IndicadorReutilizavel } from '../types/estudoDeCaso';
import type { PeiResponseDTO } from '../types/pei';
import { ClipboardList, FileText, PlusCircle, AlertCircle, CheckCircle2, Clock, ArrowRight, ShieldAlert } from 'lucide-react';

interface TelaAlunoProps {
  alunoSelecionado: Aluno;
  estudoAtual: EstudoDeCasoResponseDTO | null;
  indicadores: IndicadorReutilizavel[];
  onAbrirFormularioEstudo: () => void;
  onCriarPlanoAcao: () => void;
  peiAtual?: PeiResponseDTO | null;
  onAbrirFormularioPei?: () => void;
  onAbrirFormularioPea?: () => void;
}

export const TelaAluno: React.FC<TelaAlunoProps> = ({
  alunoSelecionado,
  estudoAtual,
  indicadores,
  onAbrirFormularioEstudo,
  onCriarPlanoAcao,
  peiAtual = null,
  onAbrirFormularioPei,
  onAbrirFormularioPea,
}) => {
  // Determina o status consolidado do Estudo de Caso
  const isPendente = !estudoAtual;
  const isRascunho = estudoAtual?.status === 'RASCUNHO';
  const isConcluido = estudoAtual?.status === 'ENCERRADO' || estudoAtual?.status === 'ATIVO';

  // TA2.1: Bloquear criação de Plano de Ação se Pendente ou Rascunho
  const podeCriarPlanoAcao = isConcluido;

  // Busca os nomes das dificuldades vinculadas ao estudo atual
  const dificuldadesDoEstudo = estudoAtual?.indicadoresIds
    ? indicadores.filter((ind) => estudoAtual.indicadoresIds.includes(ind.id))
    : [];

  return (
    <div className="space-y-6">
      {/* Card Principal: Perfil do Aluno e Status do Estudo de Caso */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        {/* Topo do Card com gradiente suave nas cores institucionais */}
        <div className="bg-gradient-to-r from-ifpb-teal to-[#164e4b] px-6 py-5 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <span className="text-xs uppercase tracking-wider text-green-200 font-semibold">
              Ficha do Estudante &bull; CLAI Cajazeiras
            </span>
            <h2 className="text-2xl font-bold mt-0.5">{alunoSelecionado.nome}</h2>
            <div className="flex items-center space-x-4 text-xs text-gray-200 mt-1">
              <span>Matrícula: <strong className="text-white font-mono">{alunoSelecionado.matricula}</strong></span>
              <span>&bull;</span>
              <span>Campus: <strong className="text-white">Cajazeiras</strong></span>
            </div>
          </div>

          {/* Badge de Status do Estudo de Caso */}
          <div className="flex items-center">
            {isPendente && (
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-300">
                <AlertCircle className="w-4 h-4 mr-1.5 text-gray-500" />
                Estudo de Caso: Pendente
              </span>
            )}
            {isRascunho && (
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                <Clock className="w-4 h-4 mr-1.5 text-amber-600" />
                Estudo de Caso: Rascunho
              </span>
            )}
            {isConcluido && (
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-600" />
                Estudo de Caso: Concluído ({estudoAtual?.status})
              </span>
            )}
          </div>
        </div>

        {/* Corpo do Card: Informações do Estudo e Ações */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bloco 1: Detalhes do Estudo de Caso */}
            <div className="border border-gray-100 rounded-lg p-5 bg-gray-50/60 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-ifpb-dark flex items-center">
                  <FileText className="w-4 h-4 mr-2 text-ifpb-teal" />
                  Situação do Estudo de Caso
                </h3>
              </div>

              {isPendente && (
                <div className="text-sm text-gray-600 space-y-2">
                  <p>
                    O estudante ainda não possui um Estudo de Caso iniciado pela equipe multidisciplinar.
                  </p>
                  <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded border border-amber-200">
                    O preenchimento do estudo é a etapa preliminar obrigatória para posterior criação do Plano de Ação.
                  </p>
                </div>
              )}

              {isRascunho && (
                <div className="text-sm text-gray-600 space-y-2">
                  <p>
                    Existe um <strong>Rascunho</strong> em edição para este aluno.
                  </p>
                  {estudoAtual?.atualizadoEm && (
                    <p className="text-xs text-gray-500">
                      Última atualização: {new Date(estudoAtual.atualizadoEm).toLocaleString('pt-BR')}
                    </p>
                  )}
                  {estudoAtual?.diagnosticoInicial && (
                    <div className="text-xs bg-white p-2 rounded border border-gray-200 text-gray-700 italic">
                      "{estudoAtual.diagnosticoInicial.slice(0, 100)}..."
                    </div>
                  )}
                </div>
              )}

              {isConcluido && (
                <div className="text-sm text-gray-600 space-y-3">
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase block">Diagnóstico Inicial:</span>
                    <p className="text-xs text-gray-800 bg-white p-2.5 rounded border border-gray-200 mt-1">
                      {estudoAtual?.diagnosticoInicial || 'Não informado.'}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase block">Dificuldades / Indicadores:</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {dificuldadesDoEstudo.length > 0 ? (
                        dificuldadesDoEstudo.map((dif) => (
                          <span
                            key={dif.id}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-ifpb-tealLight text-ifpb-teal border border-ifpb-teal/20"
                          >
                            {dif.nome}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400">Nenhuma dificuldade associada</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onAbrirFormularioEstudo}
                  className="inline-flex items-center text-xs font-semibold text-ifpb-teal hover:text-ifpb-tealHover hover:underline cursor-pointer"
                >
                  {isPendente ? 'Iniciar Formulário de Estudo de Caso' : 'Editar / Ver Formulário de Estudo de Caso'}
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </button>
              </div>
            </div>

            {/* Bloco 2: Ação de Criação de Plano de Ação (Ref. TA2.1) */}
            <div className="border border-gray-200 rounded-lg p-5 bg-white flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-sm font-bold text-ifpb-dark flex items-center">
                  <PlusCircle className="w-4 h-4 mr-2 text-ifpb-teal" />
                  Próxima Etapa: Plano de Ação
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  O Plano de Ação define as metas pedagógicas e intervenções inclusivas personalizadas para o estudante.
                </p>
              </div>

              {/* Regra de Aceite Ref. TA2.1 */}
              {!podeCriarPlanoAcao ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3.5 space-y-2">
                  <div className="flex items-start space-x-2">
                    <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-red-800">
                        Ação Bloqueada
                      </h4>
                      <p className="text-xs text-red-700 mt-0.5">
                        A opção de criar Plano de Ação está desabilitada porque o Estudo de Caso deste aluno está como{' '}
                        <strong>{isPendente ? 'Pendente' : 'Rascunho'}</strong>.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled
                    className="w-full py-2.5 px-4 rounded-md text-xs font-semibold bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300 flex items-center justify-center space-x-2"
                    title="Desabilitado: Conclua o Estudo de Caso primeiro"
                  >
                    <PlusCircle className="w-4 h-4 text-gray-400" />
                    <span>Criar Plano de Ação (Bloqueado)</span>
                  </button>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3.5 space-y-2">
                  <div className="flex items-start space-x-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-emerald-800">
                        Liberado para Plano de Ação
                      </h4>
                      <p className="text-xs text-emerald-700 mt-0.5">
                        O Estudo de Caso está <strong>Concluído</strong>. O aluno está apto para receber seu Plano de Ação.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={onCriarPlanoAcao}
                    className="w-full py-2.5 px-4 rounded-md text-xs font-bold bg-ifpb-teal hover:bg-ifpb-tealHover text-white shadow transition-all duration-150 flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4 text-white" />
                    <span>Criar Plano de Ação</span>
                  </button>
                </div>
              )}

              {onAbrirFormularioPei && (
                <button
                  type="button"
                  onClick={onAbrirFormularioPei}
                  className="w-full py-2.5 px-4 rounded-md text-xs font-bold border border-ifpb-teal text-ifpb-teal hover:bg-ifpb-tealLight transition-colors flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <ClipboardList className="w-4 h-4" />
                  <span>{peiAtual ? 'Editar PEI' : 'Elaborar PEI'}</span>
                </button>
              )}
          
              {onAbrirFormularioPea && (
                <button
                  type="button"
                  onClick={onAbrirFormularioPea}
                  className="w-full py-2.5 px-4 rounded-md text-xs font-bold border border-ifpb-teal text-ifpb-teal hover:bg-ifpb-tealLight transition-colors flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <ClipboardList className="w-4 h-4" />
                  <span>Acessar PEA</span>
                </button>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
