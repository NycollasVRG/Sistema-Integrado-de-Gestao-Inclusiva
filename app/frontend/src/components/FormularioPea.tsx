import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Save,
  Lock,
  ShieldAlert,
  ClipboardList,
  AlertTriangle,
  Info,
  Tag,
} from 'lucide-react';

import type { Aluno, ProblemDetailRFC9457 } from '../types/estudoDeCaso';
import type { PeaResponseDTO, PerfilUsuario } from '../types/pea';
import { PeaService } from '../services/peaService';

interface DadosFormularioPea {
  objetivoGeral: string;
  metodologia: string;
  avaliacao: string;
  disciplinaId: string | null;
}

interface FormularioPeaProps {
  aluno: Aluno;
  peaExistente: PeaResponseDTO | null;
  peasExistentes?: PeaResponseDTO[];
  onSelecionarPea?: (pea: PeaResponseDTO | null) => void;
  onNovoPea?: () => void;
  peiId?: string;
  onSalvar: (dados: DadosFormularioPea) => Promise<void>;
  onVoltar: () => void;
  isLoading?: boolean;
}

export const FormularioPea: React.FC<FormularioPeaProps> = ({
  aluno,
  peaExistente,
  peasExistentes = [],
  onSelecionarPea,
  onNovoPea,
  peiId,
  onSalvar,
  onVoltar,
  isLoading = false,
}) => {
  const [objetivoGeral, setObjetivoGeral] = useState('');
  const [metodologia, setMetodologia] = useState('');
  const [avaliacao, setAvaliacao] = useState('');
  const [disciplinaId, setDisciplinaId] = useState('');

  // Erros estruturados por campo (N9 e A11)
  const [errosCampos, setErrosCampos] = useState<Record<string, string>>({});

  // Mock de perfil para testes da TA3.2.
  const [perfil, setPerfil] = useState<PerfilUsuario>('Professor');

  const [abaAtiva, setAbaAtiva] = useState<'pedagogico' | 'anexos'>('pedagogico');

  const [anexos, setAnexos] = useState<PeaResponseDTO[]>([]);
  const [carregandoAnexos, setCarregandoAnexos] = useState(false);
  const [erroAcesso, setErroAcesso] = useState<string | null>(null);
  const [erroFormulario, setErroFormulario] = useState<string | null>(null);

  // Evita exibir resultados antigos ao trocar o perfil.
  const requisicaoAtual = useRef(0);

  const isProfessor = perfil === 'Professor';

  // Identificação de dirty state para confirmação de saída (N10)
  const isDirty =
    objetivoGeral !== (peaExistente?.objetivoGeral ?? '') ||
    metodologia !== (peaExistente?.metodologia ?? '') ||
    avaliacao !== (peaExistente?.avaliacao ?? '') ||
    disciplinaId !== (peaExistente?.disciplinaId ?? '');

  useEffect(() => {
    setObjetivoGeral(peaExistente?.objetivoGeral ?? '');
    setMetodologia(peaExistente?.metodologia ?? '');
    setAvaliacao(peaExistente?.avaliacao ?? '');
    setDisciplinaId(peaExistente?.disciplinaId ?? '');
    setErroFormulario(null);
    setErrosCampos({});
  }, [peaExistente, aluno.id]);

  useEffect(() => {
    return () => {
      requisicaoAtual.current += 1;
    };
  }, []);

  const alterarPerfil = (novoPerfil: PerfilUsuario) => {
    requisicaoAtual.current += 1;
    setPerfil(novoPerfil);
    setAbaAtiva('pedagogico');
    setAnexos([]);
    setErroAcesso(null);
    setCarregandoAnexos(false);
  };

  const handleVoltar = () => {
    if (isDirty) {
      const confirmar = window.confirm(
        'Existem alterações não salvas no PEA. Deseja realmente sair e descartar as alterações?'
      );
      if (!confirmar) return;
    }
    onVoltar();
  };

  const abrirAnexos = async () => {
    setAbaAtiva('anexos');
    setAnexos([]);
    setErroAcesso(null);

    if (!peiId) {
      setErroAcesso('Não há um PEI associado para consultar os anexos.');
      return;
    }

    const numeroRequisicao = ++requisicaoAtual.current;
    setCarregandoAnexos(true);

    try {
      const resultado = await PeaService.listarAnexosSensiveis(peiId, perfil);

      if (numeroRequisicao !== requisicaoAtual.current) {
        return;
      }

      setAnexos(resultado);
    } catch (erro: unknown) {
      if (numeroRequisicao !== requisicaoAtual.current) {
        return;
      }

      const resposta = erro as { status?: number };

      if (resposta?.status === 403) {
        setErroAcesso(
          'Acesso negado. Você não possui permissão para visualizar esses documentos.'
        );
      } else {
        setErroAcesso('Não foi possível carregar os anexos. Tente novamente.');
      }
    } finally {
      if (numeroRequisicao === requisicaoAtual.current) {
        setCarregandoAnexos(false);
      }
    }
  };

  const limparErroCampo = (campo: string) => {
    if (errosCampos[campo]) {
      setErrosCampos((prev) => {
        const next = { ...prev };
        delete next[campo];
        return next;
      });
    }
  };

  const salvarFormulario = async () => {
    setErroFormulario(null);
    setErrosCampos({});

    const novosErros: Record<string, string> = {};

    if (!objetivoGeral.trim()) {
      novosErros.objetivoGeral = 'O objetivo geral é obrigatório.';
    }
    if (!metodologia.trim()) {
      novosErros.metodologia = 'A metodologia é obrigatória.';
    }
    if (!avaliacao.trim()) {
      novosErros.avaliacao = 'A avaliação é obrigatória.';
    }

    const disciplina = disciplinaId.trim();
    if (
      disciplina &&
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(disciplina)
    ) {
      novosErros.disciplinaId = 'Informe um UUID válido para a disciplina.';
    }

    if (Object.keys(novosErros).length > 0) {
      setErrosCampos(novosErros);
      setErroFormulario('Por favor, corrija os campos destacados antes de salvar.');
      return;
    }

    try {
      await onSalvar({
        objetivoGeral: objetivoGeral.trim(),
        metodologia: metodologia.trim(),
        avaliacao: avaliacao.trim(),
        disciplinaId: disciplina || null,
      });
    } catch (err: unknown) {
      const prob = err as Partial<ProblemDetailRFC9457>;
      if (prob?.errors && typeof prob.errors === 'object') {
        setErrosCampos(prob.errors);
      }
      setErroFormulario(prob?.detail || prob?.title || 'Falha ao salvar PEA.');
    }
  };

  const getClasseCampo = (campo: string) =>
    `w-full p-3 border rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 ${
      errosCampos[campo]
        ? 'border-red-500 focus:ring-red-200 focus:border-red-500 bg-red-50/15'
        : 'border-gray-300 focus:ring-ifpb-tealLight focus:border-ifpb-teal'
    }`;

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      {/* Cabeçalho */}
      <div className="bg-gradient-to-r from-[#0F6460] to-[#12534f] text-white px-6 py-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleVoltar}
            disabled={isLoading}
            className="p-2 rounded-full hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            aria-label="Voltar para a tela do aluno"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ClipboardList className="w-5 h-5" />
              {peaExistente ? 'Editar PEA' : 'Novo PEA'}
            </h2>

            <p className="text-xs text-green-100 mt-1">
              Plano de Ensino Adaptado — {aluno.nome}
            </p>
          </div>
        </div>
      </div>

      {/* D3: Alternar entre PEAs existentes ou cadastrar Novo PEA */}
      {peasExistentes && peasExistentes.length > 0 && (
        <div className="bg-emerald-50/70 border-b border-emerald-100 px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-ifpb-teal shrink-0" />
            <span className="text-xs font-bold text-gray-700 uppercase">
              Planos Registrados ({peasExistentes.length}):
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={peaExistente?.id || 'NOVO'}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'NOVO') {
                  onNovoPea?.();
                } else {
                  const selecionado = peasExistentes.find((p) => p.id === val) || null;
                  onSelecionarPea?.(selecionado);
                }
              }}
              className="px-3 py-1.5 text-xs font-semibold bg-white border border-gray-300 rounded-lg shadow-2xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-ifpb-tealLight"
            >
              <option value="NOVO">+ Criar Novo PEA</option>
              {peasExistentes.map((pea, idx) => (
                <option key={pea.id} value={pea.id}>
                  PEA {idx + 1} {pea.disciplinaId ? `— Disc: ${pea.disciplinaId.slice(0, 8)}...` : '— Geral'} (
                  {pea.criadoEm ? new Date(pea.criadoEm).toLocaleDateString('pt-BR') : 'Sem data'})
                </option>
              ))}
            </select>

            {peaExistente && (
              <button
                type="button"
                onClick={() => onNovoPea?.()}
                className="px-2.5 py-1.5 text-xs font-bold text-ifpb-teal hover:bg-emerald-100/70 rounded-lg transition-colors cursor-pointer"
                title="Cadastrar um novo plano para outra disciplina"
              >
                + Novo PEA
              </button>
            )}
          </div>
        </div>
      )}

      {/* Perfil simulado */}
      <div className="bg-gray-50 border-b p-5 space-y-2">
        <label htmlFor="perfil-pea" className="text-sm font-bold text-gray-700">
          Perfil do usuário (simulação)
        </label>

        <select
          id="perfil-pea"
          value={perfil}
          onChange={(e) => alterarPerfil(e.target.value as PerfilUsuario)}
          className="block w-full sm:w-64 p-2 border border-gray-300 rounded-lg text-sm bg-white"
        >
          <option value="Professor">Professor</option>
          <option value="Coordenador">Coordenador</option>
        </select>

        <p className="text-xs text-gray-500">
          Selecione um perfil para testar as restrições de acesso da regra TA3.2.
        </p>
      </div>

      {/* Aviso para Professor */}
      {isProfessor && (
        <div className="m-5 p-4 bg-amber-50 border border-amber-200 rounded-lg flex gap-3">
          <Lock className="w-5 h-5 text-amber-700 shrink-0" />
          <div>
            <h3 className="text-sm font-bold text-amber-800">Acesso restrito</h3>
            <p className="text-xs text-amber-700 mt-1">
              O perfil Professor pode acessar as informações pedagógicas, mas não possui permissão
              para visualizar os Laudos Médicos / Anexos Confidenciais.
            </p>
          </div>
        </div>
      )}

      {/* Navegação por abas */}
      <div className="flex gap-3 px-6 pt-5 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setAbaAtiva('pedagogico')}
          className={`pb-3 px-2 text-sm font-semibold border-b-2 cursor-pointer ${
            abaAtiva === 'pedagogico'
              ? 'border-ifpb-teal text-ifpb-teal'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Dados Pedagógicos
        </button>

        {/* TA3.2: O usuário clica para disparar a requisição e validar a autorização no Backend */}
        <button
          type="button"
          onClick={abrirAnexos}
          disabled={isLoading}
          className={`pb-3 px-2 text-sm font-semibold border-b-2 cursor-pointer ${
            abaAtiva === 'anexos'
              ? 'border-ifpb-teal text-ifpb-teal'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Laudos Médicos / Anexos
        </button>
      </div>

      {/* Formulário pedagógico */}
      {abaAtiva === 'pedagogico' && (
        <div className="p-6 space-y-6">
          <div className="flex items-start gap-2 text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
            <Info className="w-4 h-4 text-ifpb-teal shrink-0" />
            Preencha os campos pedagógicos do Plano de Ensino Adaptado.
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label htmlFor="pea-objetivo" className="text-sm font-bold text-gray-700">
                Objetivo Geral <span className="text-red-500">*</span>
              </label>
              <span className="text-xs text-gray-400">{objetivoGeral.length}/2000</span>
            </div>

            <textarea
              id="pea-objetivo"
              rows={4}
              value={objetivoGeral}
              disabled={isLoading}
              aria-invalid={!!errosCampos.objetivoGeral}
              onChange={(e) => {
                setObjetivoGeral(e.target.value);
                limparErroCampo('objetivoGeral');
              }}
              className={getClasseCampo('objetivoGeral')}
              placeholder="Descreva os objetivos gerais da adaptação..."
            />
            {errosCampos.objetivoGeral && (
              <p className="text-xs text-red-600 font-semibold flex items-center gap-1 mt-1">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                {errosCampos.objetivoGeral}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label htmlFor="pea-metodologia" className="text-sm font-bold text-gray-700">
                Metodologia <span className="text-red-500">*</span>
              </label>
              <span className="text-xs text-gray-400">{metodologia.length}/4000</span>
            </div>

            <textarea
              id="pea-metodologia"
              rows={4}
              value={metodologia}
              disabled={isLoading}
              aria-invalid={!!errosCampos.metodologia}
              onChange={(e) => {
                setMetodologia(e.target.value);
                limparErroCampo('metodologia');
              }}
              className={getClasseCampo('metodologia')}
              placeholder="Descreva as estratégias metodológicas e recursos utilizados..."
            />
            {errosCampos.metodologia && (
              <p className="text-xs text-red-600 font-semibold flex items-center gap-1 mt-1">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                {errosCampos.metodologia}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label htmlFor="pea-avaliacao" className="text-sm font-bold text-gray-700">
                Avaliação <span className="text-red-500">*</span>
              </label>
              <span className="text-xs text-gray-400">{avaliacao.length}/4000</span>
            </div>

            <textarea
              id="pea-avaliacao"
              rows={4}
              value={avaliacao}
              disabled={isLoading}
              aria-invalid={!!errosCampos.avaliacao}
              onChange={(e) => {
                setAvaliacao(e.target.value);
                limparErroCampo('avaliacao');
              }}
              className={getClasseCampo('avaliacao')}
              placeholder="Critérios e instrumentos avaliativos adaptados..."
            />
            {errosCampos.avaliacao && (
              <p className="text-xs text-red-600 font-semibold flex items-center gap-1 mt-1">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                {errosCampos.avaliacao}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="pea-disciplina" className="text-sm font-bold text-gray-700">
              ID da Disciplina (opcional)
            </label>

            <input
              id="pea-disciplina"
              type="text"
              value={disciplinaId}
              onChange={(e) => {
                setDisciplinaId(e.target.value);
                limparErroCampo('disciplinaId');
              }}
              disabled={isLoading}
              aria-invalid={!!errosCampos.disciplinaId}
              placeholder="UUID da disciplina (ex: 550e8400-e29b-41d4-a716-446655440000)"
              className={getClasseCampo('disciplinaId')}
            />
            {errosCampos.disciplinaId && (
              <p className="text-xs text-red-600 font-semibold flex items-center gap-1 mt-1">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                {errosCampos.disciplinaId}
              </p>
            )}
          </div>

          {erroFormulario && (
            <div
              role="alert"
              className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm flex gap-2"
            >
              <AlertTriangle className="w-5 h-5 shrink-0" />
              {erroFormulario}
            </div>
          )}

          <div className="flex justify-between pt-5 border-t border-gray-200 gap-3">
            <button
              type="button"
              onClick={handleVoltar}
              disabled={isLoading}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Voltar
            </button>

            <button
              type="button"
              onClick={salvarFormulario}
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2 bg-ifpb-teal text-white rounded-lg text-sm font-bold disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {isLoading ? 'Salvando...' : peaExistente ? 'Atualizar PEA' : 'Salvar PEA'}
            </button>
          </div>
        </div>
      )}

      {/* D4 / N8: Anexos legíveis com detalhes do plano */}
      {abaAtiva === 'anexos' && (
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-ifpb-teal" />
              Laudos Médicos / Anexos do Plano
            </h3>
            <span className="text-xs text-gray-500">Regra de Segurança TA3.2</span>
          </div>

          {carregandoAnexos && (
            <div className="py-6 flex items-center justify-center text-sm text-gray-500 gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-ifpb-teal"></div>
              <span>Carregando anexos seguros...</span>
            </div>
          )}

          {erroAcesso && (
            <div
              role="alert"
              className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex gap-2 items-start"
            >
              <Lock className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
              <div>
                <p className="font-bold">Acesso Restrito</p>
                <p className="mt-0.5">{erroAcesso}</p>
              </div>
            </div>
          )}

          {!carregandoAnexos && !erroAcesso && anexos.length === 0 && (
            <div className="p-8 text-center text-gray-500 border border-dashed border-gray-200 rounded-lg text-sm">
              Nenhum anexo ou plano associado disponível para este aluno.
            </div>
          )}

          {!carregandoAnexos &&
            !erroAcesso &&
            anexos.map((anexo) => (
              <div
                key={anexo.id}
                className="p-4 border border-gray-200 rounded-xl bg-white hover:border-gray-300 transition-all shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-ifpb-teal" />
                    <span className="text-sm font-bold text-gray-800">
                      Plano de Ensino Adaptado (PEA)
                    </span>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 font-mono text-gray-600">
                    ID: {anexo.id.slice(0, 8)}...
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="font-semibold text-gray-500 uppercase block">Disciplina:</span>
                    <span className="font-mono text-gray-700">
                      {anexo.disciplinaId || 'Geral (Sem disciplina vinculada)'}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-500 uppercase block">Data de Criação:</span>
                    <span className="text-gray-700">
                      {anexo.criadoEm
                        ? new Date(anexo.criadoEm).toLocaleString('pt-BR')
                        : 'Não informada'}
                    </span>
                  </div>
                </div>

                {anexo.objetivoGeral && (
                  <div className="text-xs bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                    <span className="font-semibold text-gray-600 block mb-1">Objetivo Geral:</span>
                    <p className="text-gray-800 italic">
                      {anexo.objetivoGeral.length > 150
                        ? anexo.objetivoGeral.slice(0, 150) + '...'
                        : anexo.objetivoGeral}
                    </p>
                  </div>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
};
