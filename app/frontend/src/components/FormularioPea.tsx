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
  BookOpen,
} from 'lucide-react';

import type { Aluno, ProblemDetailRFC9457 } from '../types/estudoDeCaso';
import type { DadosFormularioPea, PeaResponseDTO } from '../types/pea';
import { PeaService } from '../services/peaService';
import { ConfirmModal } from './ConfirmModal';
import { useAuth } from '../contexts/AuthContext';
import { ROTULO_ROLE } from '../types/auth';
import { notificarAcessoNegado } from '../services/authSessao';

interface FormularioPeaProps {
  aluno: Aluno;
  peaExistente: PeaResponseDTO | null;
  peasExistentes?: PeaResponseDTO[];
  onSelecionarPea?: (pea: PeaResponseDTO | null) => void;
  onNovoPea?: () => void;
  peiId?: string;
  peiSemestreAno?: string | null;
  onSalvar: (dados: DadosFormularioPea) => Promise<void>;
  onVoltar: () => void;
  isLoading?: boolean;
}

interface CampoBloqueadoProps {
  id: string;
  rotulo: string;
  valor: string;
  mono?: boolean;
}

const CampoBloqueado: React.FC<CampoBloqueadoProps> = ({ id, rotulo, valor, mono }) => (
  <div className="space-y-1">
    <label htmlFor={id} className="text-xs font-bold text-gray-500 uppercase flex items-center">
      <Lock className="w-3 h-3 mr-1 text-gray-400" />
      {rotulo}
    </label>
    <input
      id={id}
      type="text"
      value={valor || 'Não informado'}
      readOnly
      disabled
      aria-readonly="true"
      className={`w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 bg-gray-100 cursor-not-allowed ${
        mono ? 'font-mono' : ''
      }`}
    />
  </div>
);

export const FormularioPea: React.FC<FormularioPeaProps> = ({
  aluno,
  peaExistente,
  peasExistentes = [],
  onSelecionarPea,
  onNovoPea,
  peiId,
  peiSemestreAno,
  onSalvar,
  onVoltar,
  isLoading = false,
}) => {
  const { sessao, podeAcessarDadosSensiveis } = useAuth();

  const docentePadraoNovo =
    !peaExistente && sessao?.role === 'PROFESSOR' && sessao?.nome ? sessao.nome : '';
  const semestrePadraoNovo = !peaExistente && peiSemestreAno ? peiSemestreAno : '';

  const [componenteCurricular, setComponenteCurricular] = useState('');
  const [semestreAno, setSemestreAno] = useState('');
  const [docente, setDocente] = useState('');
  const [objetivoGeral, setObjetivoGeral] = useState('');
  const [objetivosEspecificos, setObjetivosEspecificos] = useState('');
  const [conteudosProgramaticos, setConteudosProgramaticos] = useState('');
  const [metodologia, setMetodologia] = useState('');
  const [avaliacao, setAvaliacao] = useState('');
  const [bibliografiaBasica, setBibliografiaBasica] = useState('');
  const [bibliografiaComplementar, setBibliografiaComplementar] = useState('');
  const [disciplinaId, setDisciplinaId] = useState('');

  // Erros estruturados por campo
  const [errosCampos, setErrosCampos] = useState<Record<string, string>>({});

  const [abaAtiva, setAbaAtiva] = useState<'pedagogico' | 'anexos'>('pedagogico');

  const [anexos, setAnexos] = useState<PeaResponseDTO[]>([]);
  const [carregandoAnexos, setCarregandoAnexos] = useState(false);
  const [erroAcesso, setErroAcesso] = useState<string | null>(null);
  const [erroFormulario, setErroFormulario] = useState<string | null>(null);
  const [confirmarSaida, setConfirmarSaida] = useState<boolean>(false);

  const requisicaoAtual = useRef(0);

  const valorInicialComponente = peaExistente?.componenteCurricular ?? '';
  const valorInicialSemestre = peaExistente?.semestreAno ?? semestrePadraoNovo;
  const valorInicialDocente = peaExistente?.docente ?? docentePadraoNovo;

  // Identificação de dirty state para confirmação de saída (N10)
  const isDirty =
    componenteCurricular !== valorInicialComponente ||
    semestreAno !== valorInicialSemestre ||
    docente !== valorInicialDocente ||
    objetivoGeral !== (peaExistente?.objetivoGeral ?? '') ||
    objetivosEspecificos !== (peaExistente?.objetivosEspecificos ?? '') ||
    conteudosProgramaticos !== (peaExistente?.conteudosProgramaticos ?? '') ||
    metodologia !== (peaExistente?.metodologia ?? '') ||
    avaliacao !== (peaExistente?.avaliacao ?? '') ||
    bibliografiaBasica !== (peaExistente?.bibliografiaBasica ?? '') ||
    bibliografiaComplementar !== (peaExistente?.bibliografiaComplementar ?? '') ||
    disciplinaId !== (peaExistente?.disciplinaId ?? '');

  useEffect(() => {
    setComponenteCurricular(peaExistente?.componenteCurricular ?? '');
    setSemestreAno(peaExistente?.semestreAno ?? (!peaExistente && peiSemestreAno ? peiSemestreAno : ''));
    setDocente(
      peaExistente?.docente ??
        (!peaExistente && sessao?.role === 'PROFESSOR' && sessao?.nome ? sessao.nome : '')
    );
    setObjetivoGeral(peaExistente?.objetivoGeral ?? '');
    setObjetivosEspecificos(peaExistente?.objetivosEspecificos ?? '');
    setConteudosProgramaticos(peaExistente?.conteudosProgramaticos ?? '');
    setMetodologia(peaExistente?.metodologia ?? '');
    setAvaliacao(peaExistente?.avaliacao ?? '');
    setBibliografiaBasica(peaExistente?.bibliografiaBasica ?? '');
    setBibliografiaComplementar(peaExistente?.bibliografiaComplementar ?? '');
    setDisciplinaId(peaExistente?.disciplinaId ?? '');
    setErroFormulario(null);
    setErrosCampos({});
  }, [peaExistente, aluno.id, peiSemestreAno, sessao?.role, sessao?.nome]);

  useEffect(() => {
    return () => {
      requisicaoAtual.current += 1;
    };
  }, []);

  const handleVoltar = () => {
    if (isDirty) {
      setConfirmarSaida(true);
      return;
    }
    onVoltar();
  };

  const abrirAnexos = async () => {
    setAbaAtiva('anexos');
    setAnexos([]);
    setErroAcesso(null);

    // Bloqueio preventivo alinhado com TA3.2 e TA11.3 (LGPD / Sigilo Clínico)
    if (!podeAcessarDadosSensiveis) {
      setErroAcesso(
        'Acesso restrito. Seu perfil possui acesso apenas aos dados pedagógicos e não tem autorização para visualizar laudos médicos ou anexos confidenciais.'
      );
      notificarAcessoNegado(
        'Acesso restrito: a visualização de laudos médicos e anexos confidenciais é restrita à equipe multiprofissional (CLAI) e Coordenação.'
      );
      return;
    }

    if (!peiId) {
      setErroAcesso('Não há um PEI associado para consultar os anexos.');
      return;
    }

    const numeroRequisicao = ++requisicaoAtual.current;
    setCarregandoAnexos(true);

    try {
      const resultado = await PeaService.listarAnexosSensiveis(peiId);

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

    if (!componenteCurricular.trim()) {
      novosErros.componenteCurricular = 'O componente curricular é obrigatório.';
    }
    if (!semestreAno.trim()) {
      novosErros.semestreAno = 'O semestre/ano é obrigatório (ex.: 2026.1).';
    }
    if (!docente.trim()) {
      novosErros.docente = 'O nome do(a) docente é obrigatório.';
    }
    if (!objetivoGeral.trim()) {
      novosErros.objetivoGeral = 'O objetivo geral do componente curricular é obrigatório.';
    }
    if (!objetivosEspecificos.trim()) {
      novosErros.objetivosEspecificos = 'Os objetivos específicos são obrigatórios.';
    }
    if (!conteudosProgramaticos.trim()) {
      novosErros.conteudosProgramaticos = 'Os conteúdos programáticos são obrigatórios.';
    }
    if (!metodologia.trim()) {
      novosErros.metodologia = 'A metodologia é obrigatória.';
    }
    if (!avaliacao.trim()) {
      novosErros.avaliacao = 'A avaliação é obrigatória.';
    }
    if (!bibliografiaBasica.trim()) {
      novosErros.bibliografiaBasica = 'A bibliografia básica é obrigatória.';
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
      setErroFormulario('Por favor, preencha todos os campos obrigatórios do Anexo III destacados abaixo.');
      return;
    }

    try {
      await onSalvar({
        peiId: peiId || peaExistente?.peiId || null,
        disciplinaId: disciplina || null,
        componenteCurricular: componenteCurricular.trim(),
        semestreAno: semestreAno.trim(),
        docente: docente.trim(),
        objetivoGeral: objetivoGeral.trim(),
        objetivosEspecificos: objetivosEspecificos.trim(),
        conteudosProgramaticos: conteudosProgramaticos.trim(),
        metodologia: metodologia.trim(),
        avaliacao: avaliacao.trim(),
        bibliografiaBasica: bibliografiaBasica.trim(),
        bibliografiaComplementar: bibliografiaComplementar.trim(),
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
      <div className="bg-gradient-to-r from-[#0F6460] to-[#12534f] text-white px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleVoltar}
            disabled={isLoading}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            aria-label="Voltar para a tela do aluno"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div>
            <span className="text-[11px] uppercase tracking-wider text-green-200 font-semibold block">
              ANEXO III &bull; CLAI / IFPB
            </span>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-green-300" />
              {peaExistente
                ? 'Edição do Plano de Ensino Adaptado (PEA)'
                : 'Plano de Ensino Adaptado (PEA)'}
            </h2>

            <p className="text-xs text-green-100 mt-0.5">
              Estudante: <span className="font-semibold text-white">{aluno.nome}</span>
            </p>
          </div>
        </div>

        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white self-start sm:self-auto">
          {peaExistente ? 'PEA Registrado' : 'Novo Documento'}
        </span>
      </div>

      {/* D3: Alternar entre PEAs existentes ou cadastrar Novo PEA */}
      {peasExistentes && peasExistentes.length > 0 && (
        <div className="bg-emerald-50/70 border-b border-emerald-100 px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-ifpb-teal shrink-0" />
            <span className="text-xs font-bold text-gray-700 uppercase">
              Planos de Ensino Adaptados Registrados ({peasExistentes.length}):
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
              <option value="NOVO">+ Criar Novo PEA (Outro Componente Curricular)</option>
              {peasExistentes.map((pea, idx) => {
                const rotuloComp =
                  pea.componenteCurricular ||
                  (pea.disciplinaId ? `Disc: ${pea.disciplinaId.slice(0, 8)}...` : `PEA ${idx + 1}`);
                const rotuloSemestre = pea.semestreAno ? ` (${pea.semestreAno})` : '';
                const rotuloDocente = pea.docente ? ` — ${pea.docente}` : '';
                return (
                  <option key={pea.id} value={pea.id}>
                    {rotuloComp}
                    {rotuloSemestre}
                    {rotuloDocente}
                  </option>
                );
              })}
            </select>

            {peaExistente && (
              <button
                type="button"
                onClick={() => onNovoPea?.()}
                className="px-2.5 py-1.5 text-xs font-bold text-ifpb-teal hover:bg-emerald-100/70 rounded-lg transition-colors cursor-pointer"
                title="Cadastrar um novo plano para outro componente curricular"
              >
                + Novo PEA
              </button>
            )}
          </div>
        </div>
      )}

      {/* Aviso contextual de sigilo clínico (LGPD) para perfis sem acesso a laudos */}
      {!podeAcessarDadosSensiveis && (
        <div className="m-5 p-4 bg-amber-50 border border-amber-200 rounded-lg flex gap-3">
          <Lock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-amber-800">Acesso restrito por sigilo clínico (LGPD)</h3>
            <p className="text-xs text-amber-700 mt-1">
              O perfil {sessao?.role ? ROTULO_ROLE[sessao.role] : 'Professor'} pode acessar e preencher as informações pedagógicas,
              mas não possui permissão para visualizar os Laudos Médicos e Anexos Confidenciais do estudante.
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
          Plano de Ensino Adaptado (Anexo III)
        </button>

        {/* TA3.2 e TA11.3: Anexos sensíveis protegidos por RBAC */}
        <button
          type="button"
          onClick={abrirAnexos}
          disabled={isLoading}
          className={`pb-3 px-2 text-sm font-semibold border-b-2 cursor-pointer flex items-center gap-1.5 ${
            abaAtiva === 'anexos'
              ? 'border-ifpb-teal text-ifpb-teal'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          {!podeAcessarDadosSensiveis && <Lock className="w-3.5 h-3.5 text-amber-600" />}
          <span>Laudos Médicos / Anexos</span>
        </button>
      </div>

      {/* Formulário pedagógico fiel ao Anexo III */}
      {abaAtiva === 'pedagogico' && (
        <div className="p-6 sm:p-8 space-y-7">
          <div className="flex items-start gap-2 text-xs text-ifpb-dark bg-[#EEF1EC] border border-[#DDE5DB] p-3.5 rounded-lg">
            <Info className="w-4 h-4 text-ifpb-teal shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-ifpb-teal">Nota Institucional (Anexo III):</span>{' '}
              Esse documento integra o PEI e deve ser preenchido por cada docente que precisar realizar adaptações em seu componente curricular.
            </div>
          </div>

          {erroFormulario && (
            <div
              role="alert"
              className="bg-red-50 border-l-4 border-red-600 text-red-800 p-4 rounded-r-lg text-sm flex gap-2 items-start"
            >
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">{erroFormulario}</p>
              </div>
            </div>
          )}

          {/* Bloco de Identificação do Estudante e do Componente Curricular (Anexo III) */}
          <section className="space-y-4 bg-gray-50/70 p-5 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-ifpb-dark flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-ifpb-teal" />
                Identificação do Estudante e do Componente Curricular
              </h3>
              <span className="inline-flex items-center text-[11px] text-gray-500">
                <Lock className="w-3 h-3 mr-1" />
                Dados do estudante somente leitura
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <CampoBloqueado id="pea-nome-estudante" rotulo="Nome do estudante" valor={aluno.nome} />
              <CampoBloqueado id="pea-matricula" rotulo="Matrícula" valor={aluno.matricula} mono />
              <CampoBloqueado id="pea-curso" rotulo="Curso" valor={aluno.curso ?? ''} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="space-y-1">
                <label htmlFor="pea-componente-curricular" className="text-xs font-bold text-gray-700 uppercase">
                  Componente Curricular <span className="text-red-500">*</span>
                </label>
                <input
                  id="pea-componente-curricular"
                  type="text"
                  maxLength={200}
                  value={componenteCurricular}
                  disabled={isLoading}
                  aria-invalid={!!errosCampos.componenteCurricular}
                  onChange={(e) => {
                    setComponenteCurricular(e.target.value);
                    limparErroCampo('componenteCurricular');
                  }}
                  placeholder="Ex.: Banco de Dados I"
                  className={getClasseCampo('componenteCurricular')}
                />
                {errosCampos.componenteCurricular && (
                  <p className="text-xs text-red-600 font-semibold flex items-center gap-1 mt-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    {errosCampos.componenteCurricular}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label htmlFor="pea-semestre-ano" className="text-xs font-bold text-gray-700 uppercase">
                  Semestre/Ano <span className="text-red-500">*</span>
                </label>
                <input
                  id="pea-semestre-ano"
                  type="text"
                  maxLength={30}
                  value={semestreAno}
                  disabled={isLoading}
                  aria-invalid={!!errosCampos.semestreAno}
                  onChange={(e) => {
                    setSemestreAno(e.target.value);
                    limparErroCampo('semestreAno');
                  }}
                  placeholder="Ex.: 2026.1"
                  className={getClasseCampo('semestreAno')}
                />
                {errosCampos.semestreAno && (
                  <p className="text-xs text-red-600 font-semibold flex items-center gap-1 mt-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    {errosCampos.semestreAno}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label htmlFor="pea-docente" className="text-xs font-bold text-gray-700 uppercase">
                  Docente <span className="text-red-500">*</span>
                </label>
                <input
                  id="pea-docente"
                  type="text"
                  maxLength={255}
                  value={docente}
                  disabled={isLoading}
                  aria-invalid={!!errosCampos.docente}
                  onChange={(e) => {
                    setDocente(e.target.value);
                    limparErroCampo('docente');
                  }}
                  placeholder="Nome completo do(a) docente responsável"
                  className={getClasseCampo('docente')}
                />
                {errosCampos.docente && (
                  <p className="text-xs text-red-600 font-semibold flex items-center gap-1 mt-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    {errosCampos.docente}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* 1. OBJETIVO GERAL DO COMPONENTE CURRICULAR */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label htmlFor="pea-objetivo" className="text-sm font-bold text-gray-800">
                1. Objetivo Geral do Componente Curricular <span className="text-red-500">*</span>
              </label>
              <span className="text-xs text-gray-400">{objetivoGeral.length} caracteres</span>
            </div>
            <p className="text-xs text-gray-500">
              Definir o objetivo geral para o(a) estudante foco das adaptações curriculares, a partir do objetivo geral previsto para o componente curricular.
            </p>
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
              placeholder="Descreva o objetivo geral adaptado do componente curricular..."
            />
            {errosCampos.objetivoGeral && (
              <p className="text-xs text-red-600 font-semibold flex items-center gap-1 mt-1">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                {errosCampos.objetivoGeral}
              </p>
            )}
          </div>

          {/* 2. OBJETIVOS ESPECÍFICOS */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label htmlFor="pea-objetivos-especificos" className="text-sm font-bold text-gray-800">
                2. Objetivos Específicos <span className="text-red-500">*</span>
              </label>
              <span className="text-xs text-gray-400">{objetivosEspecificos.length} caracteres</span>
            </div>
            <p className="text-xs text-gray-500">
              Definir objetivos específicos para o(a) estudante foco das adaptações curriculares, a partir dos objetivos específicos previstos para o componente curricular.
            </p>
            <textarea
              id="pea-objetivos-especificos"
              rows={4}
              value={objetivosEspecificos}
              disabled={isLoading}
              aria-invalid={!!errosCampos.objetivosEspecificos}
              onChange={(e) => {
                setObjetivosEspecificos(e.target.value);
                limparErroCampo('objetivosEspecificos');
              }}
              className={getClasseCampo('objetivosEspecificos')}
              placeholder="Liste os objetivos específicos adaptados para o(a) estudante..."
            />
            {errosCampos.objetivosEspecificos && (
              <p className="text-xs text-red-600 font-semibold flex items-center gap-1 mt-1">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                {errosCampos.objetivosEspecificos}
              </p>
            )}
          </div>

          {/* 3. CONTEÚDOS PROGRAMÁTICOS */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label htmlFor="pea-conteudos-programaticos" className="text-sm font-bold text-gray-800">
                3. Conteúdos Programáticos <span className="text-red-500">*</span>
              </label>
              <span className="text-xs text-gray-400">{conteudosProgramaticos.length} caracteres</span>
            </div>
            <p className="text-xs text-gray-500">
              É possível priorizar, substituir conteúdos, dependendo da necessidade, a ser avaliada junto ao corpo docente que atende o estudante e equipe de apoio.
            </p>
            <textarea
              id="pea-conteudos-programaticos"
              rows={4}
              value={conteudosProgramaticos}
              disabled={isLoading}
              aria-invalid={!!errosCampos.conteudosProgramaticos}
              onChange={(e) => {
                setConteudosProgramaticos(e.target.value);
                limparErroCampo('conteudosProgramaticos');
              }}
              className={getClasseCampo('conteudosProgramaticos')}
              placeholder="Especifique os conteúdos programáticos priorizados ou adaptados..."
            />
            {errosCampos.conteudosProgramaticos && (
              <p className="text-xs text-red-600 font-semibold flex items-center gap-1 mt-1">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                {errosCampos.conteudosProgramaticos}
              </p>
            )}
          </div>

          {/* 4. METODOLOGIA */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label htmlFor="pea-metodologia" className="text-sm font-bold text-gray-800">
                4. Metodologia <span className="text-red-500">*</span>
              </label>
              <span className="text-xs text-gray-400">{metodologia.length} caracteres</span>
            </div>
            <p className="text-xs text-gray-500">
              Como será trabalhado para alcançar os objetivos estabelecidos? Aqui podem ser explicitados os recursos didáticos utilizados, as estratégias diferenciadas para o trabalho em sala de aula e nos horários de atendimento.
            </p>
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
              placeholder="Descreva as estratégias metodológicas, recursos didáticos e de atendimento..."
            />
            {errosCampos.metodologia && (
              <p className="text-xs text-red-600 font-semibold flex items-center gap-1 mt-1">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                {errosCampos.metodologia}
              </p>
            )}
          </div>

          {/* 5. AVALIAÇÃO */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label htmlFor="pea-avaliacao" className="text-sm font-bold text-gray-800">
                5. Avaliação <span className="text-red-500">*</span>
              </label>
              <span className="text-xs text-gray-400">{avaliacao.length} caracteres</span>
            </div>
            <p className="text-xs text-gray-500">
              Quais instrumentos avaliativos serão utilizados? Como serão aplicados? Recomenda-se oportunizar diversas formas de expressão da aprendizagem. Exemplos: projetos educacionais (ensino, pesquisa, extensão); atividades diferenciadas (seminários, debates, provas individuais e/ou em duplas/grupos, atividades práticas, avaliação oral); observando o nível de desempenho e contribuição do estudante no desenvolvimento do componente curricular.
            </p>
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
              placeholder="Descreva os instrumentos avaliativos e formas de aplicação adaptadas..."
            />
            {errosCampos.avaliacao && (
              <p className="text-xs text-red-600 font-semibold flex items-center gap-1 mt-1">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                {errosCampos.avaliacao}
              </p>
            )}
          </div>

          {/* 6. BIBLIOGRAFIA BÁSICA */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label htmlFor="pea-bibliografia-basica" className="text-sm font-bold text-gray-800">
                6. Bibliografia Básica <span className="text-red-500">*</span>
              </label>
              <span className="text-xs text-gray-400">{bibliografiaBasica.length} caracteres</span>
            </div>
            <p className="text-xs text-gray-500">
              Padrão Anexo III: <span className="font-mono">Título/Periódico; Autor; Ed.; Local; Editora; Ano; LT</span> (uma referência por linha).
            </p>
            <textarea
              id="pea-bibliografia-basica"
              rows={3}
              value={bibliografiaBasica}
              disabled={isLoading}
              aria-invalid={!!errosCampos.bibliografiaBasica}
              onChange={(e) => {
                setBibliografiaBasica(e.target.value);
                limparErroCampo('bibliografiaBasica');
              }}
              className={getClasseCampo('bibliografiaBasica')}
              placeholder="Ex.: Sistemas de Banco de Dados; ELMASRI, R., NAVATHE, S. B.; 7. ed.; São Paulo; Pearson; 2019; LT"
            />
            {errosCampos.bibliografiaBasica && (
              <p className="text-xs text-red-600 font-semibold flex items-center gap-1 mt-1">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                {errosCampos.bibliografiaBasica}
              </p>
            )}
          </div>

          {/* 7. BIBLIOGRAFIA COMPLEMENTAR */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label htmlFor="pea-bibliografia-complementar" className="text-sm font-bold text-gray-800">
                7. Bibliografia Complementar <span className="text-xs font-normal text-gray-400">(opcional)</span>
              </label>
              <span className="text-xs text-gray-400">{bibliografiaComplementar.length} caracteres</span>
            </div>
            <p className="text-xs text-gray-500">
              Padrão Anexo III: <span className="font-mono">Título/Periódico; Autor; Ed.; Local; Editora; Ano; LT</span> (uma referência por linha).
            </p>
            <textarea
              id="pea-bibliografia-complementar"
              rows={3}
              value={bibliografiaComplementar}
              disabled={isLoading}
              aria-invalid={!!errosCampos.bibliografiaComplementar}
              onChange={(e) => {
                setBibliografiaComplementar(e.target.value);
                limparErroCampo('bibliografiaComplementar');
              }}
              className={getClasseCampo('bibliografiaComplementar')}
              placeholder="Informe as referências complementares ou materiais acessíveis de apoio..."
            />
            {errosCampos.bibliografiaComplementar && (
              <p className="text-xs text-red-600 font-semibold flex items-center gap-1 mt-1">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                {errosCampos.bibliografiaComplementar}
              </p>
            )}
          </div>

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
              className="flex items-center gap-2 px-6 py-2.5 bg-ifpb-teal hover:bg-ifpb-tealHover text-white rounded-lg text-sm font-bold disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed shadow-sm transition-colors"
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
            <span className="text-xs text-gray-500">Controle de Acesso LGPD</span>
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
                      {anexo.componenteCurricular
                        ? `PEA — ${anexo.componenteCurricular}`
                        : 'Plano de Ensino Adaptado (PEA)'}
                    </span>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 font-mono text-gray-600">
                    {anexo.semestreAno || `ID: ${anexo.id.slice(0, 8)}...`}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="font-semibold text-gray-500 uppercase block">Componente Curricular:</span>
                    <span className="text-gray-700">
                      {anexo.componenteCurricular || anexo.disciplinaId || 'Geral'}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-500 uppercase block">Docente:</span>
                    <span className="text-gray-700">
                      {anexo.docente || 'Não informado'}
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

      {confirmarSaida && (
        <ConfirmModal
          titulo="Descartar alterações?"
          mensagem="Existem alterações não salvas no PEA. Deseja realmente sair e descartar as alterações?"
          textoConfirmar="Descartar e Sair"
          textoCancelar="Continuar Editando"
          variante="perigo"
          onConfirmar={() => {
            setConfirmarSaida(false);
            onVoltar();
          }}
          onCancelar={() => setConfirmarSaida(false)}
        />
      )}
    </div>
  );
};
