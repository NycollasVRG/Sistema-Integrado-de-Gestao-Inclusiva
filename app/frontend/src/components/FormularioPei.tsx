import React, { useState, useEffect } from 'react';
import type { Aluno, IndicadorReutilizavel } from '../types/estudoDeCaso';
import type { DadosFormularioPei, PeiResponseDTO } from '../types/pei';
import type { PeaResponseDTO } from '../types/pea';
import {
  ArrowLeft,
  Save,
  Lock,
  Info,
  AlertTriangle,
  ClipboardList,
  Tag,
  RotateCw,
  BookOpen,
  PlusCircle,
  ExternalLink,
} from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

interface FormularioPeiProps {
  aluno: Aluno;
  peiExistente: PeiResponseDTO | null;
  dificuldades: IndicadorReutilizavel[];
  peasVinculados?: PeaResponseDTO[];
  onAbrirPea?: (pea?: PeaResponseDTO | null) => void;
  onSalvar: (dados: DadosFormularioPei) => Promise<void>;
  onVoltar: () => void;
  isLoading?: boolean;
}

interface CampoBloqueadoProps {
  id: string;
  rotulo: string;
  valor: string;
  mono?: boolean;
}

// TA3.1: dados institucionais exibidos somente leitura conforme cabeçalho do Anexo III
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

export const FormularioPei: React.FC<FormularioPeiProps> = ({
  aluno,
  peiExistente,
  dificuldades,
  peasVinculados = [],
  onAbrirPea,
  onSalvar,
  onVoltar,
  isLoading = false,
}) => {
  const [semestreAno, setSemestreAno] = useState<string>('');
  const [historicoEstudante, setHistoricoEstudante] = useState<string>('');
  const [necessidadesEspecificas, setNecessidadesEspecificas] = useState<string>('');
  const [habilidades, setHabilidades] = useState<string>('');
  const [dificuldadesApresentadas, setDificuldadesApresentadas] = useState<string>('');
  const [propostas, setPropostas] = useState<string>('');

  const [erros, setErros] = useState<Record<string, string>>({});
  const [tentouSalvar, setTentouSalvar] = useState<boolean>(false);
  const [confirmarSaida, setConfirmarSaida] = useState<boolean>(false);

  useEffect(() => {
    setSemestreAno(peiExistente?.semestreAno || '');
    setHistoricoEstudante(peiExistente?.historicoEstudante || '');
    setNecessidadesEspecificas(peiExistente?.necessidadesEspecificas || '');
    setHabilidades(peiExistente?.habilidadesInteresses || '');
    setDificuldadesApresentadas(peiExistente?.dificuldadesApresentadas || '');
    setPropostas(peiExistente?.propostasAdaptacoes || '');
    setErros({});
    setTentouSalvar(false);
  }, [peiExistente, aluno.id]);

  const mensagensObrigatorias: Record<keyof DadosFormularioPei, string> = {
    semestreAno: 'O Semestre/Ano é obrigatório (ex.: 2026.1).',
    historicoEstudante: 'O Histórico (antes e na instituição) é obrigatório.',
    necessidadesEspecificas: 'O detalhamento das Necessidades Específicas é obrigatório.',
    habilidadesInteresses:
      'Os Conhecimentos, Habilidades, Capacidades, Interesses e Necessidades são obrigatórios.',
    dificuldadesApresentadas: 'A descrição das Dificuldades Apresentadas é obrigatória.',
    propostasAdaptacoes: 'As Propostas de Adaptações Curriculares são obrigatórias.',
  };

  const validarCampos = (valores: DadosFormularioPei): Record<string, string> => {
    const novosErros: Record<string, string> = {};
    (Object.keys(mensagensObrigatorias) as Array<keyof DadosFormularioPei>).forEach((campo) => {
      if (!valores[campo].trim()) {
        novosErros[campo] = mensagensObrigatorias[campo];
      }
    });
    if (valores.semestreAno.trim().length > 30) {
      novosErros.semestreAno = 'O Semestre/Ano deve ter no máximo 30 caracteres.';
    }
    return novosErros;
  };

  const atualizarCampo = (campo: keyof DadosFormularioPei, valor: string, setter: (v: string) => void) => {
    setter(valor);
    if (tentouSalvar) {
      setErros((prev) => {
        const next = { ...prev };
        if (!valor.trim()) {
          next[campo] = mensagensObrigatorias[campo];
        } else {
          delete next[campo];
        }
        return next;
      });
    }
  };

  const handleSalvar = async () => {
    setTentouSalvar(true);
    const valores: DadosFormularioPei = {
      semestreAno: semestreAno.trim(),
      historicoEstudante: historicoEstudante.trim(),
      necessidadesEspecificas: necessidadesEspecificas.trim(),
      habilidadesInteresses: habilidades.trim(),
      dificuldadesApresentadas: dificuldadesApresentadas.trim(),
      propostasAdaptacoes: propostas.trim(),
    };
    const novosErros = validarCampos(valores);
    setErros(novosErros);
    if (Object.keys(novosErros).length > 0) return;

    await onSalvar(valores);
  };

  const classeInput = (erro?: string) =>
    `w-full px-3.5 py-2.5 border rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
      erro
        ? 'border-ifpb-red focus:ring-red-200 bg-red-50/30'
        : 'border-gray-300 focus:border-ifpb-teal focus:ring-ifpb-tealLight'
    }`;

  const classeTextarea = (erro?: string) =>
    `w-full p-3.5 border rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
      erro
        ? 'border-ifpb-red focus:ring-red-200 bg-red-50/30'
        : 'border-gray-300 focus:border-ifpb-teal focus:ring-ifpb-tealLight'
    }`;

  const isDirty =
    semestreAno !== (peiExistente?.semestreAno || '') ||
    historicoEstudante !== (peiExistente?.historicoEstudante || '') ||
    necessidadesEspecificas !== (peiExistente?.necessidadesEspecificas || '') ||
    habilidades !== (peiExistente?.habilidadesInteresses || '') ||
    dificuldadesApresentadas !== (peiExistente?.dificuldadesApresentadas || '') ||
    propostas !== (peiExistente?.propostasAdaptacoes || '');

  const handleVoltar = () => {
    if (isDirty) {
      setConfirmarSaida(true);
      return;
    }
    onVoltar();
  };

  const listaErros = Object.values(erros);

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-[#0F6460] to-[#12534f] text-white px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={handleVoltar}
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
                {peiExistente
                  ? 'Edição do Plano Educacional Individualizado (PEI)'
                  : 'Plano Educacional Individualizado (PEI)'}
              </h2>
            </div>
            <p className="text-xs text-green-100 mt-0.5">
              Estudante: <span className="font-semibold text-white">{aluno.nome}</span>
            </p>
          </div>
        </div>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white self-start sm:self-auto">
          {peiExistente ? 'PEI Registrado' : 'Novo Documento'}
        </span>
      </div>

      <div className="bg-[#EEF1EC] border-b border-[#DDE5DB] px-6 py-3 text-xs text-ifpb-dark flex items-start space-x-2">
        <Info className="w-4 h-4 text-ifpb-teal shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-ifpb-teal">Orientações do Anexo III:</span>{' '}
          Os dados institucionais do estudante (Nome, Matrícula e Curso) são preenchidos automaticamente.
          Complete todas as seções pedagógicas abaixo conforme a atribuição de cada equipe.
        </div>
      </div>

      <form onSubmit={(e) => e.preventDefault()} className="p-6 sm:p-8 space-y-8">
        {tentouSalvar && listaErros.length > 0 && (
          <div className="bg-red-50 border-l-4 border-ifpb-red p-4 rounded-r-lg space-y-1" role="alert">
            <div className="flex items-center text-sm font-bold text-red-800">
              <AlertTriangle className="w-5 h-5 text-ifpb-red mr-2" />
              Campos obrigatórios do Anexo III não preenchidos
            </div>
            <ul className="list-disc list-inside text-xs text-red-700 space-y-0.5 pt-1">
              {listaErros.map((msg, idx) => (
                <li key={idx}>{msg}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Cabeçalho do Anexo III: Nome do estudante, Matrícula, Curso, Semestre/Ano */}
        <section className="space-y-4 bg-gray-50/70 p-5 rounded-xl border border-gray-200" aria-labelledby="pei-dados-institucionais">
          <div className="flex items-center justify-between">
            <h3 id="pei-dados-institucionais" className="text-sm font-bold text-ifpb-dark">
              Identificação do Estudante e Período Letivo
            </h3>
            <span className="inline-flex items-center text-[11px] text-gray-500">
              <Lock className="w-3 h-3 mr-1" />
              Dados cadastrais bloqueados para edição
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <CampoBloqueado id="pei-nome-estudante" rotulo="Nome do estudante" valor={aluno.nome} />
            <CampoBloqueado id="pei-matricula" rotulo="Matrícula" valor={aluno.matricula} mono />
            <CampoBloqueado id="pei-curso" rotulo="Curso" valor={aluno.curso ?? ''} />

            <div className="space-y-1">
              <label htmlFor="pei-semestre-ano" className="text-xs font-bold text-ifpb-dark uppercase flex items-center">
                <span>Semestre/Ano</span>
                <span className="text-ifpb-red ml-1" title="Obrigatório">*</span>
              </label>
              <input
                id="pei-semestre-ano"
                type="text"
                maxLength={30}
                value={semestreAno}
                disabled={isLoading}
                onChange={(e) => atualizarCampo('semestreAno', e.target.value, setSemestreAno)}
                placeholder="Ex.: 2026.1"
                aria-invalid={!!erros.semestreAno}
                className={classeInput(erros.semestreAno)}
              />
              {erros.semestreAno && (
                <p className="text-xs text-ifpb-red font-semibold flex items-center mt-1">
                  <AlertTriangle className="w-3.5 h-3.5 mr-1 shrink-0" />
                  {erros.semestreAno}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* 1. Histórico (antes e na instituição) */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label htmlFor="pei-historico" className="text-sm font-bold text-ifpb-dark flex items-center">
              <span>1. Histórico (antes e na instituição)</span>
              <span className="text-ifpb-red ml-1" title="Obrigatório">*</span>
            </label>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-emerald-50 text-ifpb-teal border border-emerald-200">
                Preenchido pela Equipe Pedagógica, Assistência Estudantil e CLAI
              </span>
              <span className="text-xs text-gray-400">{historicoEstudante.length} caracteres</span>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            A descrição breve do histórico desse estudante é necessária e importante para que se tenha uma ideia mais abrangente de sua trajetória.
          </p>
          <textarea
            id="pei-historico"
            rows={4}
            value={historicoEstudante}
            disabled={isLoading}
            onChange={(e) => atualizarCampo('historicoEstudante', e.target.value, setHistoricoEstudante)}
            placeholder="Descreva a trajetória escolar prévia e o histórico do estudante na instituição..."
            aria-invalid={!!erros.historicoEstudante}
            className={classeTextarea(erros.historicoEstudante)}
          />
          {erros.historicoEstudante && (
            <p className="text-xs text-ifpb-red font-semibold flex items-center mt-1">
              <AlertTriangle className="w-3.5 h-3.5 mr-1" />
              {erros.historicoEstudante}
            </p>
          )}
        </div>

        {/* 2. Necessidades Específicas */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label htmlFor="pei-necessidades" className="text-sm font-bold text-ifpb-dark flex items-center">
              <span>2. Necessidades Específicas</span>
              <span className="text-ifpb-red ml-1" title="Obrigatório">*</span>
            </label>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-emerald-50 text-ifpb-teal border border-emerald-200">
                Preenchido pela Equipe Pedagógica, Assistência Estudantil e CLAI
              </span>
              <span className="text-xs text-gray-400">{necessidadesEspecificas.length} caracteres</span>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Detalhar as condições do estudante e o que ele necessita. Ex.: Se o estudante é cego, sua condição é: cegueira. Precisa de: Braille, leitor de telas, etc. A descrição breve das necessidades específicas desse estudante é necessária e importante para que o docente tenha uma ideia mais abrangente das possibilidades de interação com esse estudante, elaborando as estratégias metodológicas de acordo com as suas especificidades.
          </p>
          <textarea
            id="pei-necessidades"
            rows={4}
            value={necessidadesEspecificas}
            disabled={isLoading}
            onChange={(e) => atualizarCampo('necessidadesEspecificas', e.target.value, setNecessidadesEspecificas)}
            placeholder="Detalhe a condição do estudante e os recursos/tecnologias assistivas necessários..."
            aria-invalid={!!erros.necessidadesEspecificas}
            className={classeTextarea(erros.necessidadesEspecificas)}
          />
          {erros.necessidadesEspecificas && (
            <p className="text-xs text-ifpb-red font-semibold flex items-center mt-1">
              <AlertTriangle className="w-3.5 h-3.5 mr-1" />
              {erros.necessidadesEspecificas}
            </p>
          )}
        </div>

        {/* 3. Conhecimentos, Habilidades, Capacidades, Interesses, Necessidades */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label htmlFor="pei-habilidades" className="text-sm font-bold text-ifpb-dark flex items-center">
              <span>3. Conhecimentos, Habilidades, Capacidades, Interesses, Necessidades</span>
              <span className="text-ifpb-red ml-1" title="Obrigatório">*</span>
            </label>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-emerald-50 text-ifpb-teal border border-emerald-200">
                Preenchido pela Equipe Pedagógica e CLAI
              </span>
              <span className="text-xs text-gray-400">{habilidades.length} caracteres</span>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            O que sabe? Do que gosta/afinidades? Quais são suas potencialidades e interesses acadêmicos?
          </p>
          <textarea
            id="pei-habilidades"
            rows={5}
            value={habilidades}
            disabled={isLoading}
            onChange={(e) => atualizarCampo('habilidadesInteresses', e.target.value, setHabilidades)}
            placeholder="Descreva os conhecimentos prévios, habilidades, capacidades, interesses e afinidades do estudante..."
            aria-invalid={!!erros.habilidadesInteresses}
            className={classeTextarea(erros.habilidadesInteresses)}
          />
          {erros.habilidadesInteresses && (
            <p className="text-xs text-ifpb-red font-semibold flex items-center mt-1">
              <AlertTriangle className="w-3.5 h-3.5 mr-1" />
              {erros.habilidadesInteresses}
            </p>
          )}
        </div>

        {/* 4. Dificuldades apresentadas */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label htmlFor="pei-dificuldades" className="text-sm font-bold text-ifpb-dark flex items-center">
              <span>4. Dificuldades apresentadas</span>
              <span className="text-ifpb-red ml-1" title="Obrigatório">*</span>
            </label>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-emerald-50 text-ifpb-teal border border-emerald-200">
                Preenchido pela Equipe Pedagógica e CLAI
              </span>
              <span className="text-xs text-gray-400">{dificuldadesApresentadas.length} caracteres</span>
            </div>
          </div>

          {dificuldades.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 bg-gray-50 p-2.5 rounded-lg border border-gray-200">
              <span className="text-xs font-semibold text-gray-600 flex items-center mr-1">
                <Tag className="w-3.5 h-3.5 mr-1 text-ifpb-teal" />
                Indicadores do Estudo de Caso:
              </span>
              {dificuldades.map((d) => (
                <span
                  key={d.id}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-ifpb-tealLight text-ifpb-teal border border-ifpb-teal/20"
                >
                  {d.nome}
                </span>
              ))}
            </div>
          )}

          <p className="text-xs text-gray-500">
            Relate as barreiras e dificuldades pedagógicas, comunicacionais, atitudinais ou de acessibilidade apresentadas pelo estudante.
          </p>
          <textarea
            id="pei-dificuldades"
            rows={4}
            value={dificuldadesApresentadas}
            disabled={isLoading}
            onChange={(e) => atualizarCampo('dificuldadesApresentadas', e.target.value, setDificuldadesApresentadas)}
            placeholder="Descreva as dificuldades apresentadas pelo estudante no processo de ensino-aprendizagem..."
            aria-invalid={!!erros.dificuldadesApresentadas}
            className={classeTextarea(erros.dificuldadesApresentadas)}
          />
          {erros.dificuldadesApresentadas && (
            <p className="text-xs text-ifpb-red font-semibold flex items-center mt-1">
              <AlertTriangle className="w-3.5 h-3.5 mr-1" />
              {erros.dificuldadesApresentadas}
            </p>
          )}
        </div>

        {/* 5. Propostas de Adaptações Curriculares */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label htmlFor="pei-propostas" className="text-sm font-bold text-ifpb-dark flex items-center">
              <span>5. Propostas de Adaptações Curriculares</span>
              <span className="text-ifpb-red ml-1" title="Obrigatório">*</span>
            </label>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-emerald-50 text-ifpb-teal border border-emerald-200">
                Preenchido pela Equipe Pedagógica, CLAI e Docentes
              </span>
              <span className="text-xs text-gray-400">{propostas.length} caracteres</span>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Adaptações de pequeno e grande porte, alterações na matriz curricular (diminuição de disciplinas), dilatação de tempo para integralização curricular, etc.
          </p>
          <textarea
            id="pei-propostas"
            rows={6}
            value={propostas}
            disabled={isLoading}
            onChange={(e) => atualizarCampo('propostasAdaptacoes', e.target.value, setPropostas)}
            placeholder="Especifique as adaptações curriculares propostas para o estudante..."
            aria-invalid={!!erros.propostasAdaptacoes}
            className={classeTextarea(erros.propostasAdaptacoes)}
          />
          {erros.propostasAdaptacoes && (
            <p className="text-xs text-ifpb-red font-semibold flex items-center mt-1">
              <AlertTriangle className="w-3.5 h-3.5 mr-1" />
              {erros.propostasAdaptacoes}
            </p>
          )}
        </div>

        {/* Anexos do PEI: Planos de Ensino Adaptados (PEA) dos componentes curriculares */}
        <section className="space-y-3 pt-2 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-ifpb-dark flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-ifpb-teal" />
                Planos de Ensino Adaptados (PEA) Anexados ({peasVinculados.length})
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                * Anexar Planos de Ensino Adaptados (PEA) dos componentes curriculares que necessitaram de alguma adaptação curricular.
              </p>
            </div>
            {onAbrirPea && (
              <button
                type="button"
                onClick={() => onAbrirPea(null)}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-ifpb-teal bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer self-start sm:self-auto"
              >
                <PlusCircle className="w-4 h-4" />
                Elaborar / Anexar PEA
              </button>
            )}
          </div>

          {peasVinculados.length === 0 ? (
            <div className="p-4 rounded-lg border border-dashed border-gray-200 bg-gray-50/60 text-xs text-gray-500">
              Nenhum Plano de Ensino Adaptado (PEA) foi registrado ainda para os componentes curriculares deste estudante.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {peasVinculados.map((pea) => (
                <div
                  key={pea.id}
                  className="p-3.5 rounded-lg border border-gray-200 bg-gray-50/60 hover:border-ifpb-teal/40 transition-colors flex flex-col justify-between gap-2"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-ifpb-dark">
                        {pea.componenteCurricular ||
                          (pea.disciplinaId ? `Disciplina ${pea.disciplinaId.slice(0, 8)}...` : 'Componente não informado')}
                      </span>
                      {pea.semestreAno && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-white border border-gray-200 text-gray-600">
                          {pea.semestreAno}
                        </span>
                      )}
                    </div>
                    {pea.docente && (
                      <p className="text-xs text-gray-600">
                        Docente: <span className="font-medium text-gray-800">{pea.docente}</span>
                      </p>
                    )}
                    {pea.objetivoGeral && (
                      <p className="text-xs text-gray-500 line-clamp-2 italic">
                        {pea.objetivoGeral}
                      </p>
                    )}
                  </div>
                  {onAbrirPea && (
                    <div className="pt-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => onAbrirPea(pea)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-ifpb-teal hover:underline cursor-pointer"
                      >
                        <span>Ver / Editar PEA</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="pt-6 border-t border-gray-200 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-4">
          <button
            type="button"
            onClick={handleVoltar}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
          >
            Voltar
          </button>
          <button
            type="button"
            onClick={handleSalvar}
            disabled={isLoading}
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg text-xs font-bold text-white bg-ifpb-teal hover:bg-ifpb-tealHover focus:outline-none focus:ring-2 focus:ring-ifpb-teal/40 shadow-sm transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <RotateCw className="w-4 h-4 mr-1.5 text-green-300 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-1.5 text-green-300" />
            )}
            {isLoading ? 'Salvando...' : peiExistente ? 'Atualizar PEI' : 'Salvar PEI'}
          </button>
        </div>
      </form>

      {confirmarSaida && (
        <ConfirmModal
          titulo="Descartar alterações?"
          mensagem="Existem alterações não salvas no PEI. Deseja realmente sair e descartar as alterações?"
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
