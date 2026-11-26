import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  FileBarChart,
  Info,
  Lock,
  Plus,
  Printer,
  RotateCw,
  Save,
  Tag,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { Aluno, ProblemDetailRFC9457 } from '../types/estudoDeCaso';
import {
  OPCOES_HABILIDADES_COGNITIVAS_RAI,
  OPCOES_HABILIDADES_SOCIOEMOCIONAIS_RAI,
  OPCOES_RELACIONAMENTO_RAI,
  ROTULO_NIVEL_APRENDIZADO,
  type NivelAprendizado,
  type RaiHabilidadeDTO,
  type RaiRequestDTO,
  type RaiResponseDTO,
  type TipoRelatorio,
} from '../types/rai';
import { imprimirAnexoVRai } from '../utils/impressaoAnexosClai';
import { ConfirmModal } from './ConfirmModal';

const VALOR_NOVO_RAI = '__NOVO_RAI__';

interface FormularioRaiProps {
  aluno: Aluno;
  raiExistente: RaiResponseDTO | null;
  raisExistentes?: RaiResponseDTO[];
  peiId?: string | null;
  acompanhamentoId?: string | null;
  onSelecionarRai?: (raiId: string) => void;
  onNovoRai?: () => void;
  onSalvar: (dados: RaiRequestDTO) => Promise<void>;
  onExcluir?: (raiId: string) => Promise<void>;
  onVoltar: () => void;
  isLoading?: boolean;
}

function bimestreAtual(): number {
  return Math.floor(new Date().getMonth() / 3) + 1;
}

function criarHabilidadeVazia(ordem: number): RaiHabilidadeDTO {
  return {
    ordem,
    habilidadeDesenvolvida: '',
    nivelAprendizado: 'SATISFATORIO',
    observacoes: '',
  };
}

export const FormularioRai: React.FC<FormularioRaiProps> = ({
  aluno,
  raiExistente,
  raisExistentes = [],
  peiId,
  acompanhamentoId,
  onSelecionarRai,
  onNovoRai,
  onSalvar,
  onExcluir,
  onVoltar,
  isLoading = false,
}) => {
  const { sessao } = useAuth();

  const [tipoRelatorio, setTipoRelatorio] = useState<TipoRelatorio>(
    raiExistente?.tipoRelatorio ?? 'RAI'
  );
  const [bimestre, setBimestre] = useState<number>(raiExistente?.bimestre ?? bimestreAtual());
  const [indicativoRegressao, setIndicativoRegressao] = useState<boolean>(
    Boolean(raiExistente?.indicativoRegressao)
  );
  const [periodoLetivo, setPeriodoLetivo] = useState<string>(raiExistente?.periodoLetivo ?? '');
  const [componenteCurricular, setComponenteCurricular] = useState<string>(
    raiExistente?.componenteCurricular ?? ''
  );
  const [docente, setDocente] = useState<string>(
    raiExistente?.docente ?? (sessao?.role === 'PROFESSOR' && sessao?.nome ? sessao.nome : '')
  );

  const [relacionamentoOpcoes, setRelacionamentoOpcoes] = useState<string[]>(
    raiExistente?.relacionamentoOpcoes ?? []
  );
  const [relacionamentoOutros, setRelacionamentoOutros] = useState<string>(
    raiExistente?.relacionamentoOutros ?? ''
  );
  const [relacionamentoComentario, setRelacionamentoComentario] = useState<string>(
    raiExistente?.relacionamentoComentario ?? ''
  );

  const [cognitivasOpcoes, setCognitivasOpcoes] = useState<string[]>(
    raiExistente?.habilidadesCognitivasOpcoes ?? []
  );
  const [cognitivasOutros, setCognitivasOutros] = useState<string>(
    raiExistente?.habilidadesCognitivasOutros ?? ''
  );
  const [cognitivasComentario, setCognitivasComentario] = useState<string>(
    raiExistente?.habilidadesCognitivasComentario ?? ''
  );

  const [socioemocionaisOpcoes, setSocioemocionaisOpcoes] = useState<string[]>(
    raiExistente?.habilidadesSocioemocionaisOpcoes ?? []
  );
  const [socioemocionaisOutros, setSocioemocionaisOutros] = useState<string>(
    raiExistente?.habilidadesSocioemocionaisOutros ?? ''
  );
  const [socioemocionaisComentario, setSocioemocionaisComentario] = useState<string>(
    raiExistente?.habilidadesSocioemocionaisComentario ?? ''
  );

  const [avancosGerais, setAvancosGerais] = useState<string>(raiExistente?.avancosGerais ?? '');
  const [dificuldadesAprendizagem, setDificuldadesAprendizagem] = useState<string>(
    raiExistente?.dificuldadesAprendizagem ?? ''
  );
  const [fatoresExternos, setFatoresExternos] = useState<string>(
    raiExistente?.fatoresExternos ?? ''
  );
  const [habilidades, setHabilidades] = useState<RaiHabilidadeDTO[]>(
    raiExistente?.habilidadesDesenvolvidas && raiExistente.habilidadesDesenvolvidas.length > 0
      ? raiExistente.habilidadesDesenvolvidas
      : [criarHabilidadeVazia(0)]
  );
  const [parecer, setParecer] = useState<string>(
    raiExistente?.parecer ?? raiExistente?.descricao ?? ''
  );
  const [dataRelatorio, setDataRelatorio] = useState<string>(
    () => raiExistente?.dataRelatorio ?? new Date().toISOString().slice(0, 10)
  );
  const [assinaturaDocente, setAssinaturaDocente] = useState<string>(
    raiExistente?.assinaturaDocente ??
      raiExistente?.docente ??
      (sessao?.role === 'PROFESSOR' && sessao?.nome ? sessao.nome : '')
  );

  const [erroFormulario, setErroFormulario] = useState<string | null>(null);
  const [confirmarExclusao, setConfirmarExclusao] = useState<boolean>(false);

  const alternarOpcao = (
    atual: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    opcao: string
  ) => {
    setter(atual.includes(opcao) ? atual.filter((item) => item !== opcao) : [...atual, opcao]);
  };

  const montarPayload = (): RaiRequestDTO => ({
    alunoId: aluno.id,
    peiId: peiId ?? raiExistente?.peiId ?? null,
    acompanhamentoId: acompanhamentoId ?? raiExistente?.acompanhamentoId ?? null,
    tipoRelatorio,
    bimestre,
    indicativoRegressao,
    descricao: parecer.trim() || null,
    periodoLetivo: periodoLetivo.trim() || null,
    componenteCurricular: componenteCurricular.trim() || null,
    docente: docente.trim() || null,
    relacionamentoOpcoes,
    relacionamentoOutros: relacionamentoOpcoes.includes('outros') ? relacionamentoOutros.trim() || null : null,
    relacionamentoComentario: relacionamentoComentario.trim() || null,
    habilidadesCognitivasOpcoes: cognitivasOpcoes,
    habilidadesCognitivasOutros: cognitivasOpcoes.includes('outros') ? cognitivasOutros.trim() || null : null,
    habilidadesCognitivasComentario: cognitivasComentario.trim() || null,
    habilidadesSocioemocionaisOpcoes: socioemocionaisOpcoes,
    habilidadesSocioemocionaisOutros: socioemocionaisOpcoes.includes('outros')
      ? socioemocionaisOutros.trim() || null
      : null,
    habilidadesSocioemocionaisComentario: socioemocionaisComentario.trim() || null,
    avancosGerais: avancosGerais.trim() || null,
    dificuldadesAprendizagem: dificuldadesAprendizagem.trim() || null,
    fatoresExternos: fatoresExternos.trim() || null,
    habilidadesDesenvolvidas: habilidades
      .filter((h) => h.habilidadeDesenvolvida.trim().length > 0)
      .map((h, idx) => ({ ...h, ordem: idx })),
    parecer: parecer.trim() || null,
    dataRelatorio: dataRelatorio || null,
    assinaturaDocente: assinaturaDocente.trim() || null,
  });

  const handleSalvar = async () => {
    setErroFormulario(null);
    if (!periodoLetivo.trim() || !componenteCurricular.trim() || !docente.trim() || !parecer.trim()) {
      setErroFormulario(
        'Preencha Período letivo, Componente Curricular, Docente e Parecer para salvar o Anexo V.'
      );
      return;
    }
    try {
      await onSalvar(montarPayload());
    } catch (err: unknown) {
      const prob = err as Partial<ProblemDetailRFC9457>;
      setErroFormulario(prob?.detail || prob?.title || 'Falha ao salvar o Relatório (Anexo V).');
    }
  };

  const renderGrupoCheckboxes = (
    titulo: string,
    opcoes: readonly string[],
    selecionadas: string[],
    setSelecionadas: React.Dispatch<React.SetStateAction<string[]>>,
    outros: string,
    setOutros: (v: string) => void,
    comentario: string,
    setComentario: (v: string) => void
  ) => (
    <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-3">
      <h4 className="text-sm font-bold text-ifpb-dark">{titulo}</h4>
      <div className="flex flex-wrap gap-2">
        {opcoes.map((opcao) => {
          const marcada = selecionadas.includes(opcao);
          return (
            <label
              key={opcao}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                marcada
                  ? 'bg-ifpb-tealLight text-ifpb-teal border-ifpb-teal'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <input
                type="checkbox"
                checked={marcada}
                disabled={isLoading}
                onChange={() => alternarOpcao(selecionadas, setSelecionadas, opcao)}
                className="accent-[#0F6460]"
              />
              <span className="capitalize">{opcao}</span>
            </label>
          );
        })}
      </div>
      {selecionadas.includes('outros') && (
        <input
          type="text"
          maxLength={255}
          value={outros}
          disabled={isLoading}
          onChange={(e) => setOutros(e.target.value)}
          placeholder="Especifique outros aspectos observados..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ifpb-tealLight focus:border-ifpb-teal"
        />
      )}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-gray-600">Comentário (se necessário)</label>
        <textarea
          rows={2}
          value={comentario}
          disabled={isLoading}
          onChange={(e) => setComentario(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ifpb-tealLight focus:border-ifpb-teal"
        />
      </div>
    </div>
  );

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-[#0F6460] to-[#12534f] text-white px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onVoltar}
            disabled={isLoading}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="Voltar para a ficha do aluno"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-[11px] uppercase tracking-wider text-green-200 font-semibold block">
              ANEXO V &bull; CLAI / IFPB
            </span>
            <div className="flex items-center space-x-2">
              <FileBarChart className="w-5 h-5 text-green-300" />
              <h2 className="text-xl font-bold tracking-tight">
                {raiExistente
                  ? 'Edição do Relatório de Acompanhamento Individualizado (RAI)'
                  : 'Relatório de Acompanhamento Individualizado (RAI)'}
              </h2>
            </div>
            <p className="text-xs text-green-100 mt-0.5">
              Estudante: <span className="font-semibold text-white">{aluno.nome}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => imprimirAnexoVRai(aluno, montarPayload())}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white/15 hover:bg-white/25 text-white border border-white/25 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Imprimir / PDF
          </button>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white">
            {raiExistente ? 'Relatório Registrado' : 'Novo Documento'}
          </span>
        </div>
      </div>

      {raisExistentes.length > 0 && (
        <div className="bg-emerald-50/70 border-b border-emerald-100 px-6 py-3 flex flex-wrap items-center gap-2">
          <Tag className="w-4 h-4 text-ifpb-teal shrink-0" />
          <label htmlFor="seletor-rai" className="text-xs font-bold text-gray-700 uppercase">
            Relatórios Registrados ({raisExistentes.length}):
          </label>
          <select
            id="seletor-rai"
            value={raiExistente?.id ?? VALOR_NOVO_RAI}
            disabled={isLoading}
            onChange={(e) => {
              if (e.target.value === VALOR_NOVO_RAI) onNovoRai?.();
              else onSelecionarRai?.(e.target.value);
            }}
            className="px-3 py-1.5 text-xs font-semibold bg-white border border-gray-300 rounded-lg text-gray-700"
          >
            <option value={VALOR_NOVO_RAI}>+ Novo Relatório (Anexo V)</option>
            {raisExistentes.map((r, idx) => (
              <option key={r.id} value={r.id}>
                {r.tipoRelatorio} — {r.componenteCurricular || `Relatório ${idx + 1}`} (
                {r.periodoLetivo || `${r.bimestre}º bim.`})
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="bg-[#EEF1EC] border-b border-[#DDE5DB] px-6 py-3 text-xs text-ifpb-dark flex items-start space-x-2">
        <Info className="w-4 h-4 text-ifpb-teal shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-ifpb-teal">Orientações do Anexo V:</span>{' '}
          Preencha os aspectos observados, habilidades desenvolvidas no componente curricular e o
          parecer final. Ao marcar indicativo de regressão, a Coordenação da CLAI é notificada
          automaticamente para revisão do PEI (TA3.3).
        </div>
      </div>

      <form onSubmit={(e) => e.preventDefault()} className="p-6 sm:p-8 space-y-8">
        {erroFormulario && (
          <div
            role="alert"
            className="bg-red-50 border-l-4 border-ifpb-red p-4 rounded-r-lg text-sm text-red-800 flex items-start gap-2"
          >
            <AlertTriangle className="w-5 h-5 text-ifpb-red shrink-0 mt-0.5" />
            <p>{erroFormulario}</p>
          </div>
        )}

        {/* Cabeçalho do Anexo V */}
        <section className="space-y-4 bg-gray-50/70 p-5 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-ifpb-dark">Identificação do Estudante e Componente</h3>
            <span className="inline-flex items-center text-[11px] text-gray-500">
              <Lock className="w-3 h-3 mr-1" />
              Dados do estudante somente leitura
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-gray-500 uppercase">Nome do estudante</span>
              <div className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 bg-gray-100">
                {aluno.nome}
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-bold text-gray-500 uppercase">Matrícula</span>
              <div className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 bg-gray-100 font-mono">
                {aluno.matricula}
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-bold text-gray-500 uppercase">Curso</span>
              <div className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 bg-gray-100">
                {aluno.curso || 'Não informado'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            <div className="space-y-1">
              <label htmlFor="rai-periodoLetivo" className="text-xs font-bold text-ifpb-dark uppercase">
                Período letivo <span className="text-ifpb-red">*</span>
              </label>
              <input
                id="rai-periodoLetivo"
                type="text"
                maxLength={30}
                value={periodoLetivo}
                disabled={isLoading}
                onChange={(e) => setPeriodoLetivo(e.target.value)}
                placeholder="Ex.: 2026.1"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="rai-componente" className="text-xs font-bold text-ifpb-dark uppercase">
                Componente Curricular <span className="text-ifpb-red">*</span>
              </label>
              <input
                id="rai-componente"
                type="text"
                maxLength={200}
                value={componenteCurricular}
                disabled={isLoading}
                onChange={(e) => setComponenteCurricular(e.target.value)}
                placeholder="Ex.: Algoritmos e Programação"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="rai-docente" className="text-xs font-bold text-ifpb-dark uppercase">
                Docente <span className="text-ifpb-red">*</span>
              </label>
              <input
                id="rai-docente"
                type="text"
                maxLength={255}
                value={docente}
                disabled={isLoading}
                onChange={(e) => setDocente(e.target.value)}
                placeholder="Nome completo do(a) docente"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1 items-end">
            <div className="space-y-1">
              <label htmlFor="rai-tipo" className="text-xs font-bold text-ifpb-dark uppercase">
                Tipo de Relatório
              </label>
              <select
                id="rai-tipo"
                value={tipoRelatorio}
                disabled={isLoading}
                onChange={(e) => setTipoRelatorio(e.target.value as TipoRelatorio)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white"
              >
                <option value="RAI">RAI — Relatório de Acompanhamento Individualizado</option>
                <option value="RAE">RAE — Relatório de Atendimento Educacional</option>
              </select>
            </div>
            <div className="space-y-1">
              <label htmlFor="rai-bimestre" className="text-xs font-bold text-ifpb-dark uppercase">
                Bimestre de Referência
              </label>
              <select
                id="rai-bimestre"
                value={bimestre}
                disabled={isLoading}
                onChange={(e) => setBimestre(Number(e.target.value))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white"
              >
                <option value={1}>1º bimestre</option>
                <option value={2}>2º bimestre</option>
                <option value={3}>3º bimestre</option>
                <option value={4}>4º bimestre</option>
              </select>
            </div>
            <label className="inline-flex items-start gap-2.5 p-2.5 rounded-lg border border-amber-200 bg-amber-50/70 cursor-pointer">
              <input
                type="checkbox"
                checked={indicativoRegressao}
                disabled={isLoading}
                onChange={(e) => setIndicativoRegressao(e.target.checked)}
                className="mt-0.5 accent-[#0F6460]"
              />
              <span className="text-xs text-amber-900">
                <strong>Indicativo de regressão</strong> (notifica Coordenador para revisar PEI)
              </span>
            </label>
          </div>
        </section>

        {/* ASPECTOS OBSERVADOS */}
        <section className="space-y-4">
          <h3 className="text-sm font-bold text-ifpb-teal uppercase tracking-wide border-b border-gray-200 pb-2">
            ASPECTOS OBSERVADOS
          </h3>
          {renderGrupoCheckboxes(
            'Relacionamento',
            OPCOES_RELACIONAMENTO_RAI,
            relacionamentoOpcoes,
            setRelacionamentoOpcoes,
            relacionamentoOutros,
            setRelacionamentoOutros,
            relacionamentoComentario,
            setRelacionamentoComentario
          )}
          {renderGrupoCheckboxes(
            'Principais habilidades cognitivas',
            OPCOES_HABILIDADES_COGNITIVAS_RAI,
            cognitivasOpcoes,
            setCognitivasOpcoes,
            cognitivasOutros,
            setCognitivasOutros,
            cognitivasComentario,
            setCognitivasComentario
          )}
          {renderGrupoCheckboxes(
            'Principais habilidades socioemocionais',
            OPCOES_HABILIDADES_SOCIOEMOCIONAIS_RAI,
            socioemocionaisOpcoes,
            setSocioemocionaisOpcoes,
            socioemocionaisOutros,
            setSocioemocionaisOutros,
            socioemocionaisComentario,
            setSocioemocionaisComentario
          )}
        </section>

        {/* Relatos do Período */}
        <section className="space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="rai-avancos" className="text-sm font-bold text-ifpb-dark">
              Avanços gerais do(a) estudante no período
            </label>
            <p className="text-xs text-gray-500">
              Essa informação deve contemplar sua formação integral e outros aspectos para além da aprendizagem de maneira geral, como de sociabilidade, amadurecimento intelectual, social e outros.
            </p>
            <textarea
              id="rai-avancos"
              rows={3}
              value={avancosGerais}
              disabled={isLoading}
              onChange={(e) => setAvancosGerais(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="rai-dificuldades" className="text-sm font-bold text-ifpb-dark">
              Relato das dificuldades de aprendizagem observadas (descrever)
            </label>
            <textarea
              id="rai-dificuldades"
              rows={3}
              value={dificuldadesAprendizagem}
              disabled={isLoading}
              onChange={(e) => setDificuldadesAprendizagem(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="rai-fatores" className="text-sm font-bold text-ifpb-dark">
              Fatores externos que estejam influenciando no processo escolar (descrever, se houver)
            </label>
            <textarea
              id="rai-fatores"
              rows={2}
              value={fatoresExternos}
              disabled={isLoading}
              onChange={(e) => setFatoresExternos(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </section>

        {/* HABILIDADES E COMPETÊNCIAS DESENVOLVIDAS */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-gray-200 pb-2">
            <div>
              <h3 className="text-sm font-bold text-ifpb-teal uppercase tracking-wide">
                HABILIDADES E COMPETÊNCIAS DESENVOLVIDAS PELO ESTUDANTE NO COMPONENTE CURRICULAR
              </h3>
              <p className="text-xs text-gray-500">
                Quais as habilidades desenvolvidas após as adaptações realizadas? Liste por tópicos.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setHabilidades((prev) => [...prev, criarHabilidadeVazia(prev.length)])}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-ifpb-teal bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 cursor-pointer self-start"
            >
              <Plus className="w-3.5 h-3.5" />
              Adicionar Habilidade
            </button>
          </div>

          <div className="space-y-3">
            {habilidades.map((hab, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-600 uppercase">
                    Tópico {idx + 1}
                  </span>
                  {habilidades.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setHabilidades((prev) => prev.filter((_, i) => i !== idx))
                      }
                      className="text-xs font-semibold text-red-600 hover:text-red-800 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remover
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  value={hab.habilidadeDesenvolvida}
                  disabled={isLoading}
                  onChange={(e) =>
                    setHabilidades((prev) =>
                      prev.map((item, i) =>
                        i === idx ? { ...item, habilidadeDesenvolvida: e.target.value } : item
                      )
                    )
                  }
                  placeholder="Habilidade desenvolvida..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                />

                <div className="flex flex-wrap items-center gap-4">
                  <span className="text-xs font-bold text-gray-600">Nível de aprendizado:</span>
                  {(['SATISFATORIO', 'BOM', 'OTIMO'] as NivelAprendizado[]).map((nivel) => (
                    <label
                      key={nivel}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name={`nivel-hab-${idx}`}
                        checked={hab.nivelAprendizado === nivel}
                        disabled={isLoading}
                        onChange={() =>
                          setHabilidades((prev) =>
                            prev.map((item, i) =>
                              i === idx ? { ...item, nivelAprendizado: nivel } : item
                            )
                          )
                        }
                        className="accent-[#0F6460]"
                      />
                      {ROTULO_NIVEL_APRENDIZADO[nivel]}
                    </label>
                  ))}
                </div>

                <textarea
                  rows={2}
                  value={hab.observacoes ?? ''}
                  disabled={isLoading}
                  onChange={(e) =>
                    setHabilidades((prev) =>
                      prev.map((item, i) =>
                        i === idx ? { ...item, observacoes: e.target.value } : item
                      )
                    )
                  }
                  placeholder="Observações..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                />
              </div>
            ))}
          </div>
        </section>

        {/* PARECER */}
        <section className="space-y-2">
          <label htmlFor="rai-parecer" className="text-sm font-bold text-ifpb-dark">
            PARECER <span className="text-ifpb-red">*</span>
          </label>
          <p className="text-xs text-gray-500">
            Descrever avanços do estudante, considerando os objetivos previstos para ele no Plano de Ensino Adaptado e principais dificuldades. Procurar mencionar as propostas que tiveram êxito e aquelas que não tiveram, o que se observou em ambos os casos. Pontuar o que pretende para a próxima etapa, em termos de objetivos específicos de atuação junto ao estudante. Também destacar aspectos do seu desenvolvimento social. Caso o estudante tenha acompanhado a turma realizando as mesmas atividades propostas para os demais, sem necessidade de adaptação, descrever. Basear as ações e seus registros no tipo de necessidade específica e suas características.
          </p>
          <textarea
            id="rai-parecer"
            rows={6}
            value={parecer}
            disabled={isLoading}
            onChange={(e) => setParecer(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm"
            placeholder="Elabore o parecer pedagógico completo do período..."
          />
        </section>

        {/* Data e Assinatura do Docente */}
        <section className="space-y-4 bg-gray-50/70 p-5 rounded-xl border border-gray-200">
          <h3 className="text-sm font-bold text-ifpb-dark">Data e Assinatura do(a) Docente</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label htmlFor="rai-data" className="text-xs font-bold text-ifpb-dark uppercase">
                Data
              </label>
              <input
                id="rai-data"
                type="date"
                value={dataRelatorio}
                disabled={isLoading}
                onChange={(e) => setDataRelatorio(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white"
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label htmlFor="rai-assinatura" className="text-xs font-bold text-ifpb-dark uppercase">
                Assinatura do(a) docente
              </label>
              <input
                id="rai-assinatura"
                type="text"
                maxLength={255}
                value={assinaturaDocente}
                disabled={isLoading}
                onChange={(e) => setAssinaturaDocente(e.target.value)}
                placeholder="Nome completo do(a) docente"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white"
              />
            </div>
          </div>
        </section>

        <div className="pt-6 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onVoltar}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer"
            >
              Voltar
            </button>
            {raiExistente && onExcluir && (
              <button
                type="button"
                onClick={() => setConfirmarExclusao(true)}
                disabled={isLoading}
                className="inline-flex items-center px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 rounded-lg cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                Excluir Relatório
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={handleSalvar}
            disabled={isLoading}
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg text-xs font-bold text-white bg-ifpb-teal hover:bg-ifpb-tealHover shadow-sm cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <RotateCw className="w-4 h-4 mr-1.5 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-1.5" />
            )}
            {isLoading ? 'Salvando...' : raiExistente ? 'Salvar Alterações' : 'Emitir Relatório (Anexo V)'}
          </button>
        </div>
      </form>

      {confirmarExclusao && raiExistente && onExcluir && (
        <ConfirmModal
          titulo="Excluir Relatório?"
          mensagem="Tem certeza de que deseja excluir este Relatório de Acompanhamento Individualizado?"
          textoConfirmar="Excluir"
          textoCancelar="Cancelar"
          variante="perigo"
          isLoading={isLoading}
          onConfirmar={async () => {
            setConfirmarExclusao(false);
            await onExcluir(raiExistente.id);
          }}
          onCancelar={() => setConfirmarExclusao(false)}
        />
      )}
    </div>
  );
};
