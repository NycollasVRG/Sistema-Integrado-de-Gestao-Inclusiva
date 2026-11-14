import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ClipboardList,
  Info,
  Lock,
  RotateCw,
  Save,
  Tag,
  Trash2,
} from 'lucide-react';
import type { Aluno, ProblemDetailRFC9457 } from '../types/estudoDeCaso';
import type { DadosFormularioPlanoAcao, PlanoAcaoResponseDTO } from '../types/planoAcao';
import { ConfirmModal } from './ConfirmModal';

const VALOR_NOVO_PLANO = '__NOVO_PLANO__';

type CampoPlanoAcao = keyof DadosFormularioPlanoAcao;

interface ConfigCampo {
  chave: CampoPlanoAcao;
  rotulo: string;
  ajuda?: string;
  obrigatorio: boolean;
  tipo: 'input' | 'textarea';
  /** Limites alinhados às validações @Size do backend (PlanoAcaoRequestDTO). */
  maxLength?: number;
  linhas?: number;
}

interface SecaoFormulario {
  id: string;
  titulo: string;
  campos: ConfigCampo[];
}

const SECOES: SecaoFormulario[] = [
  {
    id: 'demandas',
    titulo: 'Demandas e Propostas de Intervenção',
    campos: [
      {
        chave: 'demandasIdentificadas',
        rotulo: 'Demandas Identificadas',
        ajuda: 'Necessidades educacionais identificadas a partir do Estudo de Caso.',
        obrigatorio: true,
        tipo: 'textarea',
        linhas: 4,
      },
      {
        chave: 'propostasIntervencao',
        rotulo: 'Propostas de Intervenção',
        ajuda: 'Intervenções pedagógicas e de acessibilidade propostas para atender às demandas.',
        obrigatorio: true,
        tipo: 'textarea',
        linhas: 4,
      },
    ],
  },
  {
    id: 'componente',
    titulo: 'Componente Curricular',
    campos: [
      {
        chave: 'componenteCurricular',
        rotulo: 'Componente Curricular',
        obrigatorio: true,
        tipo: 'input',
        maxLength: 200,
      },
      {
        chave: 'semestreAno',
        rotulo: 'Semestre/Ano',
        ajuda: 'Ex.: 2026.1',
        obrigatorio: true,
        tipo: 'input',
        maxLength: 30,
      },
      {
        chave: 'docente',
        rotulo: 'Docente',
        obrigatorio: true,
        tipo: 'input',
        maxLength: 255,
      },
    ],
  },
  {
    id: 'planejamento',
    titulo: 'Planejamento Pedagógico',
    campos: [
      { chave: 'objetivoGeral', rotulo: 'Objetivo Geral', obrigatorio: true, tipo: 'textarea', linhas: 3 },
      {
        chave: 'objetivosEspecificos',
        rotulo: 'Objetivos Específicos',
        obrigatorio: false,
        tipo: 'textarea',
        linhas: 3,
      },
      {
        chave: 'conteudosProgramaticos',
        rotulo: 'Conteúdos Programáticos',
        obrigatorio: false,
        tipo: 'textarea',
        linhas: 3,
      },
      { chave: 'metodologia', rotulo: 'Metodologia', obrigatorio: true, tipo: 'textarea', linhas: 3 },
      { chave: 'avaliacao', rotulo: 'Avaliação', obrigatorio: true, tipo: 'textarea', linhas: 3 },
    ],
  },
  {
    id: 'bibliografia',
    titulo: 'Bibliografia',
    campos: [
      {
        chave: 'bibliografiaBasica',
        rotulo: 'Bibliografia Básica',
        obrigatorio: false,
        tipo: 'textarea',
        linhas: 3,
      },
      {
        chave: 'bibliografiaComplementar',
        rotulo: 'Bibliografia Complementar',
        obrigatorio: false,
        tipo: 'textarea',
        linhas: 3,
      },
    ],
  },
];

const CAMPOS: ConfigCampo[] = SECOES.flatMap((secao) => secao.campos);

function paraFormulario(plano: PlanoAcaoResponseDTO | null): DadosFormularioPlanoAcao {
  return {
    demandasIdentificadas: plano?.demandasIdentificadas ?? '',
    propostasIntervencao: plano?.propostasIntervencao ?? '',
    componenteCurricular: plano?.componenteCurricular ?? '',
    semestreAno: plano?.semestreAno ?? '',
    docente: plano?.docente ?? '',
    objetivoGeral: plano?.objetivoGeral ?? '',
    objetivosEspecificos: plano?.objetivosEspecificos ?? '',
    conteudosProgramaticos: plano?.conteudosProgramaticos ?? '',
    metodologia: plano?.metodologia ?? '',
    avaliacao: plano?.avaliacao ?? '',
    bibliografiaBasica: plano?.bibliografiaBasica ?? '',
    bibliografiaComplementar: plano?.bibliografiaComplementar ?? '',
  };
}

function validar(valores: DadosFormularioPlanoAcao): Partial<Record<CampoPlanoAcao, string>> {
  const erros: Partial<Record<CampoPlanoAcao, string>> = {};
  CAMPOS.forEach((campo) => {
    const valor = valores[campo.chave].trim();
    if (campo.obrigatorio && !valor) {
      erros[campo.chave] = `${campo.rotulo} é obrigatório.`;
    } else if (campo.maxLength && valor.length > campo.maxLength) {
      erros[campo.chave] = `${campo.rotulo} deve ter no máximo ${campo.maxLength} caracteres.`;
    }
  });
  return erros;
}

function rotuloPlano(plano: PlanoAcaoResponseDTO, indice: number): string {
  const componente = plano.componenteCurricular || `Plano de Ação ${indice + 1}`;
  const semestre = plano.semestreAno ? ` (${plano.semestreAno})` : '';
  const docente = plano.docente ? ` — ${plano.docente}` : '';
  return `${componente}${semestre}${docente}`;
}

interface FormularioPlanoAcaoProps {
  aluno: Aluno;
  /** Plano em edição; null para criação de um novo plano. */
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
 * Formulário do Plano de Ação (Anexo III). Deve ser montado com `key` do plano em foco,
 * de modo que o estado inicial seja derivado das props sem efeitos de sincronização.
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
  const [valores, setValores] = useState<DadosFormularioPlanoAcao>(() =>
    paraFormulario(planoExistente)
  );
  const [erros, setErros] = useState<Partial<Record<CampoPlanoAcao, string>>>({});
  const [erroFormulario, setErroFormulario] = useState<string | null>(null);
  const [tentouSalvar, setTentouSalvar] = useState<boolean>(false);
  const [acaoPendente, setAcaoPendente] = useState<(() => void) | null>(null);
  const [confirmarExclusao, setConfirmarExclusao] = useState<boolean>(false);

  const inicial = paraFormulario(planoExistente);
  const isDirty = CAMPOS.some((campo) => valores[campo.chave] !== inicial[campo.chave]);

  const comConfirmacaoDeDescarte = (acao: () => void) => {
    if (isDirty) {
      setAcaoPendente(() => acao);
      return;
    }
    acao();
  };

  const atualizarCampo = (campo: ConfigCampo, valor: string) => {
    setValores((prev) => ({ ...prev, [campo.chave]: valor }));
    if (tentouSalvar) {
      setErros((prev) => {
        const proximo = { ...prev };
        const erroAtual = validar({ ...valores, [campo.chave]: valor })[campo.chave];
        if (erroAtual) proximo[campo.chave] = erroAtual;
        else delete proximo[campo.chave];
        return proximo;
      });
    }
  };

  const handleSalvar = async () => {
    setTentouSalvar(true);
    setErroFormulario(null);

    const novosErros = validar(valores);
    setErros(novosErros);
    if (Object.keys(novosErros).length > 0) {
      setErroFormulario('Preencha os campos obrigatórios destacados abaixo.');
      return;
    }

    try {
      await onSalvar(valores);
    } catch (err: unknown) {
      // Erros RFC 9457 (ProblemDetail): mensagem geral e erros por campo, quando houver
      const prob = err as Partial<ProblemDetailRFC9457>;
      if (prob?.errors && typeof prob.errors === 'object') {
        setErros(prob.errors as Partial<Record<CampoPlanoAcao, string>>);
      }
      setErroFormulario(prob?.detail || prob?.title || 'Falha ao salvar o Plano de Ação.');
    }
  };

  const classeCampo = (campo: CampoPlanoAcao) =>
    `w-full px-3.5 py-2.5 border rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
      erros[campo]
        ? 'border-ifpb-red focus:ring-red-200 bg-red-50/30'
        : 'border-gray-300 focus:border-ifpb-teal focus:ring-ifpb-tealLight'
    }`;

  const renderCampo = (campo: ConfigCampo) => {
    const id = `plano-acao-${campo.chave}`;
    const valor = valores[campo.chave];
    return (
      <div key={campo.chave} className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor={id} className="text-sm font-bold text-ifpb-dark">
            {campo.rotulo}
            {campo.obrigatorio && (
              <span className="text-ifpb-red ml-1" title="Obrigatório">*</span>
            )}
          </label>
          {campo.maxLength && (
            <span className="text-[11px] text-gray-400">
              {valor.length}/{campo.maxLength}
            </span>
          )}
        </div>
        {campo.ajuda && <p className="text-xs text-gray-500">{campo.ajuda}</p>}
        {campo.tipo === 'textarea' ? (
          <textarea
            id={id}
            rows={campo.linhas ?? 3}
            value={valor}
            onChange={(e) => atualizarCampo(campo, e.target.value)}
            disabled={isLoading}
            aria-invalid={!!erros[campo.chave]}
            className={classeCampo(campo.chave)}
          />
        ) : (
          <input
            id={id}
            type="text"
            value={valor}
            maxLength={campo.maxLength}
            onChange={(e) => atualizarCampo(campo, e.target.value)}
            disabled={isLoading}
            aria-invalid={!!erros[campo.chave]}
            className={classeCampo(campo.chave)}
          />
        )}
        {erros[campo.chave] && (
          <p className="text-xs text-ifpb-red font-semibold flex items-center">
            <AlertTriangle className="w-3.5 h-3.5 mr-1 shrink-0" />
            {erros[campo.chave]}
          </p>
        )}
      </div>
    );
  };

  const identificacao: Array<{ rotulo: string; valor: string; mono?: boolean }> = [
    { rotulo: 'Estudante', valor: planoExistente?.nomeEstudante || aluno.nome },
    { rotulo: 'Matrícula', valor: planoExistente?.matriculaEstudante || aluno.matricula, mono: true },
    { rotulo: 'Curso', valor: planoExistente?.cursoEstudante || aluno.curso || 'Não informado' },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-[#0F6460] to-[#12534f] text-white px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => comConfirmacaoDeDescarte(onVoltar)}
            disabled={isLoading}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            title="Voltar para a ficha do aluno"
            aria-label="Voltar para a ficha do aluno"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-[11px] uppercase tracking-wider text-green-200 font-semibold block">
              ANEXO III &bull; CLAI / IFPB
            </span>
            <div className="flex items-center space-x-2">
              <ClipboardList className="w-5 h-5 text-green-300" />
              <h2 className="text-xl font-bold tracking-tight">
                {planoExistente ? 'Edição do Plano de Ação' : 'Novo Plano de Ação'}
              </h2>
            </div>
            <p className="text-xs text-green-100 mt-0.5">
              Estudante: <span className="font-semibold text-white">{aluno.nome}</span>
            </p>
          </div>
        </div>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white self-start sm:self-auto">
          {planoExistente ? 'Plano Registrado' : 'Novo Documento'}
        </span>
      </div>

      {planosExistentes.length > 0 && (
        <div className="bg-emerald-50/70 border-b border-emerald-100 px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Tag className="w-4 h-4 text-ifpb-teal shrink-0" />
            <label
              htmlFor="seletor-plano-acao"
              className="text-xs font-bold text-gray-700 uppercase"
            >
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
              className="px-3 py-1.5 text-xs font-semibold bg-white border border-gray-300 rounded-lg shadow-2xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-ifpb-tealLight disabled:opacity-60"
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
          <span className="font-semibold text-ifpb-teal">Orientações:</span>{' '}
          Os dados do estudante são preenchidos automaticamente. O Plano de Ação só pode ser registrado
          após a conclusão do Estudo de Caso. Campos com <span className="text-ifpb-red">*</span> são obrigatórios.
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

        <section
          className="space-y-3 bg-gray-50/70 p-5 rounded-xl border border-gray-200"
          aria-labelledby="plano-identificacao"
        >
          <div className="flex items-center justify-between">
            <h3 id="plano-identificacao" className="text-sm font-bold text-ifpb-dark">
              Identificação do Estudante
            </h3>
            <span className="inline-flex items-center text-[11px] text-gray-500">
              <Lock className="w-3 h-3 mr-1" />
              Dados cadastrais bloqueados para edição
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {identificacao.map((item) => (
              <div key={item.rotulo} className="space-y-1">
                <span className="text-xs font-bold text-gray-500 uppercase flex items-center">
                  <Lock className="w-3 h-3 mr-1 text-gray-400" />
                  {item.rotulo}
                </span>
                <div
                  className={`w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 bg-gray-100 ${
                    item.mono ? 'font-mono' : ''
                  }`}
                >
                  {item.valor}
                </div>
              </div>
            ))}
          </div>
        </section>

        {SECOES.map((secao) => (
          <section key={secao.id} className="space-y-5" aria-labelledby={`plano-secao-${secao.id}`}>
            <h3
              id={`plano-secao-${secao.id}`}
              className="text-sm font-bold text-ifpb-teal uppercase tracking-wide border-b border-gray-200 pb-2"
            >
              {secao.titulo}
            </h3>
            {secao.id === 'componente' ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {secao.campos.map(renderCampo)}
              </div>
            ) : (
              secao.campos.map(renderCampo)
            )}
          </section>
        ))}

        <div className="pt-6 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => comConfirmacaoDeDescarte(onVoltar)}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Voltar
            </button>
            {planoExistente && onExcluir && (
              <button
                type="button"
                onClick={() => setConfirmarExclusao(true)}
                disabled={isLoading}
                className="inline-flex items-center px-3 py-2 text-xs font-semibold text-red-700 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg text-xs font-bold text-white bg-ifpb-teal hover:bg-ifpb-tealHover focus:outline-none focus:ring-2 focus:ring-ifpb-teal/40 shadow-sm transition-all duration-150 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
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
          mensagem="Existem alterações não salvas no Plano de Ação. Deseja realmente continuar e descartá-las?"
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
