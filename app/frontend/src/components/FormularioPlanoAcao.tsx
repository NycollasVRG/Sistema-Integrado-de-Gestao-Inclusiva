import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ClipboardList,
  Info,
  Lock,
  Printer,
  RotateCw,
  Save,
  ShieldCheck,
  Tag,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { Aluno, ProblemDetailRFC9457 } from '../types/estudoDeCaso';
import type { DadosFormularioPlanoAcao, PlanoAcaoResponseDTO } from '../types/planoAcao';
import { imprimirAnexoIIPlanoAcao } from '../utils/impressaoAnexosClai';
import { ConfirmModal } from './ConfirmModal';

const VALOR_NOVO_PLANO = '__NOVO_PLANO__';

type CampoPlanoAcao = keyof DadosFormularioPlanoAcao;

function paraFormulario(plano: PlanoAcaoResponseDTO | null): DadosFormularioPlanoAcao {
  return {
    periodoLetivo: plano?.periodoLetivo ?? '',
    periodoIngresso: plano?.periodoIngresso ?? '',
    dataNascimento: plano?.dataNascimento ?? '',
    telefoneEstudante: plano?.telefoneEstudante ?? '',
    emailEstudante: plano?.emailEstudante ?? '',
    nomeResponsavel: plano?.nomeResponsavel ?? '',
    grauParentescoResponsavel: plano?.grauParentescoResponsavel ?? '',
    telefoneResponsavel: plano?.telefoneResponsavel ?? '',
    emailResponsavel: plano?.emailResponsavel ?? '',
    possuiComorbidade: plano?.possuiComorbidade ?? null,
    comorbidadeDetalhes: plano?.comorbidadeDetalhes ?? '',
    usaMedicacaoContinua: plano?.usaMedicacaoContinua ?? null,
    medicacaoDetalhes: plano?.medicacaoDetalhes ?? '',
    frequentaServicosApoio: plano?.frequentaServicosApoio ?? null,
    servicosApoioDetalhes: plano?.servicosApoioDetalhes ?? '',
    apresentouDocumentosComprobatorios: plano?.apresentouDocumentosComprobatorios ?? null,
    documentosComprobatoriosDetalhes: plano?.documentosComprobatoriosDetalhes ?? '',
    identificacaoNecessidadesEspecificas: plano?.identificacaoNecessidadesEspecificas ?? '',
    relatoPercursoEducacional: plano?.relatoPercursoEducacional ?? '',
    demandasIdentificadas: plano?.demandasIdentificadas ?? '',
    propostasIntervencao: plano?.propostasIntervencao ?? '',
    assinaturaCoordenadorClai: plano?.assinaturaCoordenadorClai ?? '',
    dataAssinatura: plano?.dataAssinatura ?? '',
  };
}

function validar(
  valores: DadosFormularioPlanoAcao,
  validarClinico: boolean
): Partial<Record<CampoPlanoAcao, string>> {
  const erros: Partial<Record<CampoPlanoAcao, string>> = {};
  if (!valores.periodoLetivo.trim()) {
    erros.periodoLetivo = 'Período letivo é obrigatório (ex.: 2026.1).';
  }
  if (!valores.identificacaoNecessidadesEspecificas.trim()) {
    erros.identificacaoNecessidadesEspecificas =
      'A Identificação das Necessidades Específicas (Considerações) é obrigatória.';
  }
  if (!valores.relatoPercursoEducacional.trim()) {
    erros.relatoPercursoEducacional =
      'O Relato Sistematizado do Percurso Educacional é obrigatório.';
  }
  if (!valores.demandasIdentificadas.trim()) {
    erros.demandasIdentificadas = 'As Principais Demandas Identificadas são obrigatórias.';
  }
  if (!valores.propostasIntervencao.trim()) {
    erros.propostasIntervencao = 'A Descrição das Propostas Iniciais de Intervenção é obrigatória.';
  }
  if (validarClinico) {
    if (valores.possuiComorbidade === true && !valores.comorbidadeDetalhes.trim()) {
      erros.comorbidadeDetalhes = 'Informe qual(is) comorbidade(s) relevante(s).';
    }
    if (valores.usaMedicacaoContinua === true && !valores.medicacaoDetalhes.trim()) {
      erros.medicacaoDetalhes = 'Informe qual(is) medicação(ões) de uso contínuo.';
    }
    if (valores.frequentaServicosApoio === true && !valores.servicosApoioDetalhes.trim()) {
      erros.servicosApoioDetalhes = 'Informe qual(is) serviço(s) de apoio frequenta.';
    }
    if (
      valores.apresentouDocumentosComprobatorios === true &&
      !valores.documentosComprobatoriosDetalhes.trim()
    ) {
      erros.documentosComprobatoriosDetalhes =
        'Informe qual(is) documento(s) comprobatório(s) foi(ram) apresentado(s).';
    }
  }
  return erros;
}

function rotuloPlano(plano: PlanoAcaoResponseDTO, indice: number): string {
  const periodo = plano.periodoLetivo ? `Período ${plano.periodoLetivo}` : `Plano de Ação ${indice + 1}`;
  const data = plano.dataAssinatura ? ` — ${plano.dataAssinatura}` : '';
  return `${periodo}${data}`;
}

interface FormularioPlanoAcaoProps {
  aluno: Aluno;
  planoExistente: PlanoAcaoResponseDTO | null;
  planosExistentes?: PlanoAcaoResponseDTO[];
  onSelecionarPlano?: (planoId: string) => void;
  onNovoPlano?: () => void;
  onSalvar: (dados: DadosFormularioPlanoAcao) => Promise<void>;
  onExcluir?: (planoId: string) => Promise<void>;
  onVoltar: () => void;
  isLoading?: boolean;
}

/**
 * Formulário do Plano de Ação da CLAI — ANEXO II.
 */
export const FormularioPlanoAcao: React.FC<FormularioPlanoAcaoProps> = ({
  aluno,
  planoExistente,
  planosExistentes = [],
  onSelecionarPlano,
  onNovoPlano,
  onSalvar,
  onExcluir,
  onVoltar,
  isLoading = false,
}) => {
  const { podeAcessarDadosSensiveis } = useAuth();
  const [valores, setValores] = useState<DadosFormularioPlanoAcao>(() =>
    paraFormulario(planoExistente)
  );
  const [erros, setErros] = useState<Partial<Record<CampoPlanoAcao, string>>>({});
  const [erroFormulario, setErroFormulario] = useState<string | null>(null);
  const [tentouSalvar, setTentouSalvar] = useState<boolean>(false);
  const [acaoPendente, setAcaoPendente] = useState<(() => void) | null>(null);
  const [confirmarExclusao, setConfirmarExclusao] = useState<boolean>(false);

  const inicial = paraFormulario(planoExistente);
  const isDirty = (Object.keys(inicial) as CampoPlanoAcao[]).some(
    (chave) => valores[chave] !== inicial[chave]
  );

  const comConfirmacaoDeDescarte = (acao: () => void) => {
    if (isDirty) {
      setAcaoPendente(() => acao);
      return;
    }
    acao();
  };

  const atualizarCampo = <K extends CampoPlanoAcao>(chave: K, valor: DadosFormularioPlanoAcao[K]) => {
    setValores((prev) => {
      const proximo = { ...prev, [chave]: valor };
      if (tentouSalvar) {
        setErros(validar(proximo, podeAcessarDadosSensiveis));
      }
      return proximo;
    });
  };

  const handleSalvar = async () => {
    setTentouSalvar(true);
    setErroFormulario(null);

    const novosErros = validar(valores, podeAcessarDadosSensiveis);
    setErros(novosErros);
    if (Object.keys(novosErros).length > 0) {
      setErroFormulario('Preencha os campos obrigatórios do Anexo II destacados abaixo.');
      return;
    }

    try {
      await onSalvar(valores);
    } catch (err: unknown) {
      const prob = err as Partial<ProblemDetailRFC9457>;
      if (prob?.errors && typeof prob.errors === 'object') {
        setErros(prob.errors as Partial<Record<CampoPlanoAcao, string>>);
      }
      setErroFormulario(prob?.detail || prob?.title || 'Falha ao salvar o Plano de Ação da CLAI.');
    }
  };

  const classeCampo = (campo: CampoPlanoAcao) =>
    `w-full px-3.5 py-2.5 border rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
      erros[campo]
        ? 'border-ifpb-red focus:ring-red-200 bg-red-50/30'
        : 'border-gray-300 focus:border-ifpb-teal focus:ring-ifpb-tealLight'
    }`;

  const renderSimNao = (
    pergunta: string,
    chaveBool:
      | 'possuiComorbidade'
      | 'usaMedicacaoContinua'
      | 'frequentaServicosApoio'
      | 'apresentouDocumentosComprobatorios',
    chaveDetalhes:
      | 'comorbidadeDetalhes'
      | 'medicacaoDetalhes'
      | 'servicosApoioDetalhes'
      | 'documentosComprobatoriosDetalhes',
    placeholder: string
  ) => {
    const valorBool = valores[chaveBool];
    return (
      <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <span className="text-sm font-bold text-ifpb-dark">{pergunta}</span>
          <div className="flex items-center gap-4">
            <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 cursor-pointer">
              <input
                type="radio"
                name={chaveBool}
                checked={valorBool === false}
                disabled={isLoading}
                onChange={() => {
                  atualizarCampo(chaveBool, false);
                  atualizarCampo(chaveDetalhes, '');
                }}
                className="accent-[#0F6460]"
              />
              Não
            </label>
            <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 cursor-pointer">
              <input
                type="radio"
                name={chaveBool}
                checked={valorBool === true}
                disabled={isLoading}
                onChange={() => atualizarCampo(chaveBool, true)}
                className="accent-[#0F6460]"
              />
              Sim
            </label>
          </div>
        </div>
        {valorBool === true && (
          <div className="space-y-1">
            <label htmlFor={`plano-${chaveDetalhes}`} className="text-xs font-semibold text-gray-600">
              Qual(is)? <span className="text-ifpb-red">*</span>
            </label>
            <input
              id={`plano-${chaveDetalhes}`}
              type="text"
              value={valores[chaveDetalhes]}
              disabled={isLoading}
              onChange={(e) => atualizarCampo(chaveDetalhes, e.target.value)}
              placeholder={placeholder}
              className={classeCampo(chaveDetalhes)}
            />
            {erros[chaveDetalhes] && (
              <p className="text-xs text-ifpb-red font-semibold flex items-center">
                <AlertTriangle className="w-3.5 h-3.5 mr-1 shrink-0" />
                {erros[chaveDetalhes]}
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-[#0F6460] to-[#12534f] text-white px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => comConfirmacaoDeDescarte(onVoltar)}
            disabled={isLoading}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer disabled:opacity-50"
            title="Voltar para a ficha do aluno"
            aria-label="Voltar para a ficha do aluno"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-[11px] uppercase tracking-wider text-green-200 font-semibold block">
              ANEXO II &bull; CLAI / IFPB
            </span>
            <div className="flex items-center space-x-2">
              <ClipboardList className="w-5 h-5 text-green-300" />
              <h2 className="text-xl font-bold tracking-tight">
                {planoExistente ? 'Edição do Plano de Ação da CLAI' : 'Plano de Ação da CLAI'}
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
            onClick={() => imprimirAnexoIIPlanoAcao(aluno, valores, podeAcessarDadosSensiveis)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white/15 hover:bg-white/25 text-white border border-white/25 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Imprimir / PDF
          </button>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white">
            {planoExistente ? 'Plano Registrado' : 'Novo Documento'}
          </span>
        </div>
      </div>

      {planosExistentes.length > 0 && (
        <div className="bg-emerald-50/70 border-b border-emerald-100 px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Tag className="w-4 h-4 text-ifpb-teal shrink-0" />
            <label htmlFor="seletor-plano-acao" className="text-xs font-bold text-gray-700 uppercase">
              Planos de Ação Registrados ({planosExistentes.length}):
            </label>
            <select
              id="seletor-plano-acao"
              value={planoExistente?.id ?? VALOR_NOVO_PLANO}
              disabled={isLoading}
              onChange={(e) => {
                const valor = e.target.value;
                if (valor === (planoExistente?.id ?? VALOR_NOVO_PLANO)) return;
                comConfirmacaoDeDescarte(() => {
                  if (valor === VALOR_NOVO_PLANO) onNovoPlano?.();
                  else onSelecionarPlano?.(valor);
                });
              }}
              className="px-3 py-1.5 text-xs font-semibold bg-white border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-ifpb-tealLight"
            >
              <option value={VALOR_NOVO_PLANO}>+ Criar Novo Plano de Ação</option>
              {planosExistentes.map((plano, indice) => (
                <option key={plano.id} value={plano.id}>
                  {rotuloPlano(plano, indice)}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="bg-[#EEF1EC] border-b border-[#DDE5DB] px-6 py-3 text-xs text-ifpb-dark flex items-start space-x-2">
        <Info className="w-4 h-4 text-ifpb-teal shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-ifpb-teal">Orientações do Anexo II:</span>{' '}
          Nome, Matrícula e Curso são preenchidos automaticamente. O Plano de Ação da CLAI só pode
          ser registrado após a conclusão do Estudo de Caso. Campos com{' '}
          <span className="text-ifpb-red">*</span> são obrigatórios.
        </div>
      </div>

      <form onSubmit={(e) => e.preventDefault()} className="p-6 sm:p-8 space-y-8" noValidate>
        {erroFormulario && (
          <div
            role="alert"
            className="bg-red-50 border-l-4 border-ifpb-red p-4 rounded-r-lg text-sm text-red-800 flex items-start gap-2"
          >
            <AlertTriangle className="w-5 h-5 text-ifpb-red shrink-0 mt-0.5" />
            <p>{erroFormulario}</p>
          </div>
        )}

        {/* 1. Identificação do(a) Estudante */}
        <section className="space-y-4 bg-gray-50/70 p-5 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-ifpb-dark">Identificação do(a) Estudante</h3>
            <span className="inline-flex items-center text-[11px] text-gray-500">
              <Lock className="w-3 h-3 mr-1" />
              Nome, Matrícula e Curso somente leitura
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-gray-500 uppercase">Nome do(a) estudante</span>
              <div className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 bg-gray-100">
                {planoExistente?.nomeEstudante || aluno.nome}
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-bold text-gray-500 uppercase">Matrícula</span>
              <div className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 bg-gray-100 font-mono">
                {planoExistente?.matriculaEstudante || aluno.matricula}
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-bold text-gray-500 uppercase">Curso</span>
              <div className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 bg-gray-100">
                {planoExistente?.cursoEstudante || aluno.curso || 'Não informado'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            <div className="space-y-1">
              <label htmlFor="plano-periodoLetivo" className="text-xs font-bold text-ifpb-dark uppercase">
                Período letivo <span className="text-ifpb-red">*</span>
              </label>
              <input
                id="plano-periodoLetivo"
                type="text"
                maxLength={30}
                value={valores.periodoLetivo}
                disabled={isLoading}
                onChange={(e) => atualizarCampo('periodoLetivo', e.target.value)}
                placeholder="Ex.: 2026.1"
                className={classeCampo('periodoLetivo')}
              />
              {erros.periodoLetivo && (
                <p className="text-xs text-ifpb-red font-semibold flex items-center">
                  <AlertTriangle className="w-3.5 h-3.5 mr-1 shrink-0" />
                  {erros.periodoLetivo}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="plano-periodoIngresso" className="text-xs font-bold text-ifpb-dark uppercase">
                Período de ingresso
              </label>
              <input
                id="plano-periodoIngresso"
                type="text"
                maxLength={30}
                value={valores.periodoIngresso}
                disabled={isLoading}
                onChange={(e) => atualizarCampo('periodoIngresso', e.target.value)}
                placeholder="Ex.: 2025.1"
                className={classeCampo('periodoIngresso')}
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="plano-dataNascimento" className="text-xs font-bold text-ifpb-dark uppercase">
                Data de nascimento
              </label>
              <input
                id="plano-dataNascimento"
                type="date"
                value={valores.dataNascimento}
                disabled={isLoading}
                onChange={(e) => atualizarCampo('dataNascimento', e.target.value)}
                className={classeCampo('dataNascimento')}
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="plano-telefoneEstudante" className="text-xs font-bold text-ifpb-dark uppercase">
                Telefone
              </label>
              <input
                id="plano-telefoneEstudante"
                type="tel"
                maxLength={30}
                value={valores.telefoneEstudante}
                disabled={isLoading}
                onChange={(e) => atualizarCampo('telefoneEstudante', e.target.value)}
                placeholder="(83) 99999-0000"
                className={classeCampo('telefoneEstudante')}
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label htmlFor="plano-emailEstudante" className="text-xs font-bold text-ifpb-dark uppercase">
                E-mail
              </label>
              <input
                id="plano-emailEstudante"
                type="email"
                maxLength={255}
                value={valores.emailEstudante}
                disabled={isLoading}
                onChange={(e) => atualizarCampo('emailEstudante', e.target.value)}
                placeholder="estudante@academico.ifpb.edu.br"
                className={classeCampo('emailEstudante')}
              />
            </div>
          </div>
        </section>

        {/* 2. Dados do Responsável */}
        <section className="space-y-4">
          <h3 className="text-sm font-bold text-ifpb-teal uppercase tracking-wide border-b border-gray-200 pb-2">
            Dados do Responsável
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="plano-nomeResponsavel" className="text-xs font-bold text-ifpb-dark uppercase">
                Nome do responsável
              </label>
              <input
                id="plano-nomeResponsavel"
                type="text"
                maxLength={255}
                value={valores.nomeResponsavel}
                disabled={isLoading}
                onChange={(e) => atualizarCampo('nomeResponsavel', e.target.value)}
                className={classeCampo('nomeResponsavel')}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="plano-grauParentesco" className="text-xs font-bold text-ifpb-dark uppercase">
                Grau de parentesco
              </label>
              <input
                id="plano-grauParentesco"
                type="text"
                maxLength={100}
                value={valores.grauParentescoResponsavel}
                disabled={isLoading}
                onChange={(e) => atualizarCampo('grauParentescoResponsavel', e.target.value)}
                placeholder="Ex.: Mãe, Pai, Avó, Tutor..."
                className={classeCampo('grauParentescoResponsavel')}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="plano-telefoneResponsavel" className="text-xs font-bold text-ifpb-dark uppercase">
                Telefone do responsável
              </label>
              <input
                id="plano-telefoneResponsavel"
                type="tel"
                maxLength={30}
                value={valores.telefoneResponsavel}
                disabled={isLoading}
                onChange={(e) => atualizarCampo('telefoneResponsavel', e.target.value)}
                placeholder="(83) 99999-0000"
                className={classeCampo('telefoneResponsavel')}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="plano-emailResponsavel" className="text-xs font-bold text-ifpb-dark uppercase">
                E-mail do responsável
              </label>
              <input
                id="plano-emailResponsavel"
                type="email"
                maxLength={255}
                value={valores.emailResponsavel}
                disabled={isLoading}
                onChange={(e) => atualizarCampo('emailResponsavel', e.target.value)}
                placeholder="responsavel@email.com"
                className={classeCampo('emailResponsavel')}
              />
            </div>
          </div>
        </section>

        {/* 3. Triagem Clínica e Rede de Apoio (protegido por LGPD) */}
        {podeAcessarDadosSensiveis && (
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
              <h3 className="text-sm font-bold text-ifpb-teal uppercase tracking-wide flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                Informações Clínicas, Medicação e Serviços de Apoio
              </h3>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                Sigilo LGPD
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderSimNao(
                'Há comorbidade relevante?',
                'possuiComorbidade',
                'comorbidadeDetalhes',
                'Especifique a(s) comorbidade(s)...'
              )}
              {renderSimNao(
                'Faz uso de medicação de uso contínuo?',
                'usaMedicacaoContinua',
                'medicacaoDetalhes',
                'Informe qual(is) medicação(ões)...'
              )}
              {renderSimNao(
                'Frequenta serviços de apoio (FUNAD, APAE, etc.)?',
                'frequentaServicosApoio',
                'servicosApoioDetalhes',
                'Informe instituição(ões) e/ou profissional(is)...'
              )}
              {renderSimNao(
                'Apresentou documentos comprobatórios?',
                'apresentouDocumentosComprobatorios',
                'documentosComprobatoriosDetalhes',
                'Informe qual(is) documento(s)...'
              )}
            </div>
          </section>
        )}

        {/* 4. Blocos Descritivos Oficiais do Anexo II */}
        <section className="space-y-6">
          <h3 className="text-sm font-bold text-ifpb-teal uppercase tracking-wide border-b border-gray-200 pb-2">
            Análise do Caso e Propostas de Intervenção (Anexo II)
          </h3>

          <div className="space-y-1.5">
            <label htmlFor="plano-identificacaoNecessidadesEspecificas" className="text-sm font-bold text-ifpb-dark">
              IDENTIFICAÇÃO DA(S) NECESSIDADE(S) ESPECÍFICA(S) — Considerações <span className="text-ifpb-red">*</span>
            </label>
            <ul className="text-xs text-gray-500 list-disc list-inside space-y-0.5">
              <li>As idiossincrasias, diagnósticos e encaminhamentos anteriores;</li>
              <li>Comorbidades relevantes e se faz uso de medicação de uso contínuo;</li>
              <li>Dependência/autonomia no contexto familiar/escolar;</li>
              <li>Frequência atual ou anterior em serviços de apoio de outras instituições e/ou profissionais;</li>
              <li>Se há conflito no campo psicossocial relacionado à escolha profissional (desentendimento familiar, desinteresse pelo curso, etc.).</li>
            </ul>
            <textarea
              id="plano-identificacaoNecessidadesEspecificas"
              rows={5}
              value={valores.identificacaoNecessidadesEspecificas}
              disabled={isLoading}
              onChange={(e) => atualizarCampo('identificacaoNecessidadesEspecificas', e.target.value)}
              className={classeCampo('identificacaoNecessidadesEspecificas')}
              placeholder="Descreva as considerações sobre as necessidades específicas do(a) estudante..."
            />
            {erros.identificacaoNecessidadesEspecificas && (
              <p className="text-xs text-ifpb-red font-semibold flex items-center">
                <AlertTriangle className="w-3.5 h-3.5 mr-1 shrink-0" />
                {erros.identificacaoNecessidadesEspecificas}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="plano-relatoPercursoEducacional" className="text-sm font-bold text-ifpb-dark">
              RELATO SISTEMATIZADO DOS AVANÇOS, DIFICULDADES, POTENCIALIDADES DO(A) ESTUDANTE EM SEU PERCURSO EDUCACIONAL{' '}
              <span className="text-ifpb-red">*</span>
            </label>
            <p className="text-xs text-gray-500">
              Ex.: Objetivos de ensino já atingidos em outros níveis de ensino e/ou serviços de apoio; disciplinas em que tem mais facilidade; experiências positivas anteriores no ensino.
            </p>
            <textarea
              id="plano-relatoPercursoEducacional"
              rows={4}
              value={valores.relatoPercursoEducacional}
              disabled={isLoading}
              onChange={(e) => atualizarCampo('relatoPercursoEducacional', e.target.value)}
              className={classeCampo('relatoPercursoEducacional')}
            />
            {erros.relatoPercursoEducacional && (
              <p className="text-xs text-ifpb-red font-semibold flex items-center">
                <AlertTriangle className="w-3.5 h-3.5 mr-1 shrink-0" />
                {erros.relatoPercursoEducacional}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="plano-demandasIdentificadas" className="text-sm font-bold text-ifpb-dark">
              PRINCIPAIS DEMANDAS IDENTIFICADAS NO CASO <span className="text-ifpb-red">*</span>
            </label>
            <p className="text-xs text-gray-500">
              Ex.: Implicações da necessidade específica em relação à aprendizagem; limitações encontradas em outros níveis de ensino e/ou serviços de apoio; disciplinas em que tem mais dificuldade; retenções ou adaptações na temporalidade anteriores; experiências negativas anteriores no ensino.
            </p>
            <textarea
              id="plano-demandasIdentificadas"
              rows={4}
              value={valores.demandasIdentificadas}
              disabled={isLoading}
              onChange={(e) => atualizarCampo('demandasIdentificadas', e.target.value)}
              className={classeCampo('demandasIdentificadas')}
            />
            {erros.demandasIdentificadas && (
              <p className="text-xs text-ifpb-red font-semibold flex items-center">
                <AlertTriangle className="w-3.5 h-3.5 mr-1 shrink-0" />
                {erros.demandasIdentificadas}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="plano-propostasIntervencao" className="text-sm font-bold text-ifpb-dark">
              DESCRIÇÃO DAS PROPOSTAS INICIAIS DE INTERVENÇÃO <span className="text-ifpb-red">*</span>
            </label>
            <p className="text-xs text-gray-500">
              Ex.: Adaptações quanto à acessibilidade e aprendizagem; necessidade de adaptações curriculares de pequeno e grande portes; atendimentos como assistência estudantil e monitoria; apoios complementares, incluindo área, profissional, modalidade, local, frequência.
            </p>
            <textarea
              id="plano-propostasIntervencao"
              rows={5}
              value={valores.propostasIntervencao}
              disabled={isLoading}
              onChange={(e) => atualizarCampo('propostasIntervencao', e.target.value)}
              className={classeCampo('propostasIntervencao')}
            />
            {erros.propostasIntervencao && (
              <p className="text-xs text-ifpb-red font-semibold flex items-center">
                <AlertTriangle className="w-3.5 h-3.5 mr-1 shrink-0" />
                {erros.propostasIntervencao}
              </p>
            )}
          </div>
        </section>

        {/* 5. Assinatura e Data */}
        <section className="space-y-4 bg-gray-50/70 p-5 rounded-xl border border-gray-200">
          <h3 className="text-sm font-bold text-ifpb-dark">Assinatura e Data (Anexo II)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1 md:col-span-2">
              <label htmlFor="plano-assinaturaCoordenadorClai" className="text-xs font-bold text-ifpb-dark uppercase">
                Assinatura do(a) coordenador(a) da CLAI
              </label>
              <input
                id="plano-assinaturaCoordenadorClai"
                type="text"
                maxLength={255}
                value={valores.assinaturaCoordenadorClai}
                disabled={isLoading}
                onChange={(e) => atualizarCampo('assinaturaCoordenadorClai', e.target.value)}
                placeholder="Nome completo do(a) coordenador(a) da CLAI"
                className={classeCampo('assinaturaCoordenadorClai')}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="plano-dataAssinatura" className="text-xs font-bold text-ifpb-dark uppercase">
                Data
              </label>
              <input
                id="plano-dataAssinatura"
                type="date"
                value={valores.dataAssinatura}
                disabled={isLoading}
                onChange={(e) => atualizarCampo('dataAssinatura', e.target.value)}
                className={classeCampo('dataAssinatura')}
              />
            </div>
          </div>
        </section>

        <div className="pt-6 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => comConfirmacaoDeDescarte(onVoltar)}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              Voltar
            </button>
            {planoExistente && onExcluir && (
              <button
                type="button"
                onClick={() => setConfirmarExclusao(true)}
                disabled={isLoading}
                className="inline-flex items-center px-3 py-2 text-xs font-semibold text-red-700 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1 text-red-600" />
                Excluir Plano
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleSalvar}
            disabled={isLoading}
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg text-xs font-bold text-white bg-ifpb-teal hover:bg-ifpb-tealHover shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <RotateCw className="w-4 h-4 mr-1.5 text-green-300 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-1.5 text-green-300" />
            )}
            {isLoading ? 'Salvando...' : planoExistente ? 'Salvar Alterações' : 'Registrar Plano de Ação'}
          </button>
        </div>
      </form>

      {acaoPendente && (
        <ConfirmModal
          titulo="Descartar alterações?"
          mensagem="Existem alterações não salvas no Plano de Ação da CLAI. Deseja realmente continuar e descartá-las?"
          textoConfirmar="Descartar e Continuar"
          textoCancelar="Continuar Editando"
          variante="perigo"
          onConfirmar={() => {
            const acao = acaoPendente;
            setAcaoPendente(null);
            acao();
          }}
          onCancelar={() => setAcaoPendente(null)}
        />
      )}

      {confirmarExclusao && planoExistente && onExcluir && (
        <ConfirmModal
          titulo="Excluir Plano de Ação?"
          mensagem="Tem certeza de que deseja excluir este Plano de Ação? Esta ação não pode ser desfeita."
          textoConfirmar="Excluir Plano"
          textoCancelar="Cancelar"
          variante="perigo"
          isLoading={isLoading}
          onConfirmar={async () => {
            setConfirmarExclusao(false);
            await onExcluir(planoExistente.id);
          }}
          onCancelar={() => setConfirmarExclusao(false)}
        />
      )}
    </div>
  );
};
