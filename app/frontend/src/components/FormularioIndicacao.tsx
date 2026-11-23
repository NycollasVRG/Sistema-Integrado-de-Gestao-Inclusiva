import React, { useId, useState, type FormEvent, type KeyboardEvent } from 'react';
import { AlertTriangle, Hourglass, Plus, RotateCw, Send, X } from 'lucide-react';
import { IndicacaoService } from '../services/indicacaoService';
import { toProblem } from '../services/apiClient';
import type { EstudanteIndicavel, IndicacaoResponseDTO } from '../types/indicacao';
import {
  LIMITE_CARACTERES_DISCIPLINA,
  adicionarDisciplinas,
  ehEmTriagem,
  validarIndicacao,
  type ErrosIndicacao,
} from '../utils/indicacao';

export interface FormularioIndicacaoProps {
  estudante: EstudanteIndicavel;
  onSucesso: (indicacao: IndicacaoResponseDTO) => void;
  onCancelar: () => void;
  /** Permite ao contêiner (modal) bloquear o fechamento enquanto o envio está em andamento. */
  onEnviandoChange?: (enviando: boolean) => void;
}

const CLASSE_CAMPO =
  'block mt-1 w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ifpb-teal/30 focus:border-ifpb-teal';

/**
 * Formulário de "Indicar Estudante" (US 10 / TA10.1).
 * Justificativa pedagógica e ao menos uma disciplina são obrigatórias: sem elas
 * nenhuma requisição é enviada e o motivo é exibido junto ao campo.
 */
export const FormularioIndicacao: React.FC<FormularioIndicacaoProps> = ({
  estudante,
  onSucesso,
  onCancelar,
  onEnviandoChange,
}) => {
  const idBase = useId();
  const idJustificativa = `${idBase}-justificativa`;
  const idDisciplina = `${idBase}-disciplina`;

  const [justificativa, setJustificativa] = useState('');
  const [disciplinas, setDisciplinas] = useState<string[]>([]);
  const [rascunhoDisciplina, setRascunhoDisciplina] = useState('');
  const [erros, setErros] = useState<ErrosIndicacao>({});
  const [erroDisciplinaInput, setErroDisciplinaInput] = useState('');
  const [erroApi, setErroApi] = useState('');
  const [enviando, setEnviando] = useState(false);

  function definirEnviando(valor: boolean) {
    setEnviando(valor);
    onEnviandoChange?.(valor);
  }

  /** Confirma o texto digitado como disciplina(s); devolve a lista resultante ou null se inválido. */
  function confirmarRascunho(): string[] | null {
    if (!rascunhoDisciplina.trim()) return disciplinas;
    const resultado = adicionarDisciplinas(disciplinas, rascunhoDisciplina);
    if (!resultado.ok) {
      setErroDisciplinaInput(resultado.erro);
      return null;
    }
    setDisciplinas(resultado.lista);
    setRascunhoDisciplina('');
    setErroDisciplinaInput('');
    setErros((anterior) => ({ ...anterior, disciplinas: undefined }));
    return resultado.lista;
  }

  function aoTeclarDisciplina(evento: KeyboardEvent<HTMLInputElement>) {
    if (evento.key === 'Enter' || evento.key === ',' || evento.key === ';') {
      evento.preventDefault();
      confirmarRascunho();
    } else if (evento.key === 'Backspace' && !rascunhoDisciplina && disciplinas.length > 0) {
      setDisciplinas((atual) => atual.slice(0, -1));
    }
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (enviando) return;

    // Texto digitado e ainda não confirmado com Enter também conta como disciplina informada.
    const listaFinal = confirmarRascunho();
    if (listaFinal === null) return;

    const errosEncontrados = validarIndicacao(justificativa, listaFinal);
    setErros(errosEncontrados);
    setErroApi('');
    if (errosEncontrados.justificativa || errosEncontrados.disciplinas) return;

    definirEnviando(true);
    try {
      const criada = await IndicacaoService.criar({
        alunoId: estudante.id,
        justificativaPedagogica: justificativa,
        disciplinasObservadas: listaFinal,
      });
      onSucesso(criada);
    } catch (falha: unknown) {
      const problema = toProblem(falha, 'Falha ao enviar indicação', 'Não foi possível registrar a indicação.');
      setErroApi(problema.detail || problema.title);
    } finally {
      definirEnviando(false);
    }
  }

  const detalhesEstudante = [estudante.curso, estudante.turma].filter(Boolean).join(' / ');

  return (
    <form onSubmit={enviar} noValidate className="space-y-5" aria-label="Indicar estudante para triagem">
      {/* Estudante indicado */}
      <div className="rounded-lg border border-gray-200 bg-ifpb-breadcrumb/50 px-4 py-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Estudante indicado</p>
        <p className="text-sm font-semibold text-gray-900 mt-0.5">{estudante.nomeCompleto}</p>
        <p className="text-xs text-gray-600 mt-0.5">
          Matrícula <span className="font-mono">{estudante.matricula}</span>
          {detalhesEstudante && <> &bull; {detalhesEstudante}</>}
        </p>
      </div>

      {ehEmTriagem(estudante.status) && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
          <Hourglass className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" aria-hidden="true" />
          <span>
            Este estudante já está <strong>Em Triagem</strong>. A sua indicação será registrada e
            analisada junto às demais pela equipe CLAI.
          </span>
        </div>
      )}

      {erroApi && (
        <div
          role="alert"
          className="bg-red-50 border-l-4 border-ifpb-red p-3 rounded-r-lg flex items-start gap-2.5 text-sm text-red-800"
        >
          <AlertTriangle className="w-5 h-5 text-ifpb-red shrink-0 mt-0.5" />
          <span>{erroApi}</span>
        </div>
      )}

      {/* Disciplinas */}
      <div>
        <label htmlFor={idDisciplina} className="block text-sm font-medium text-gray-700">
          Disciplinas onde a dificuldade foi observada <span className="text-ifpb-red">*</span>
        </label>
        <div
          className={`mt-1 flex flex-wrap items-center gap-2 rounded-lg border px-2.5 py-2 bg-white focus-within:ring-2 focus-within:ring-ifpb-teal/30 focus-within:border-ifpb-teal ${
            erros.disciplinas || erroDisciplinaInput ? 'border-ifpb-red' : 'border-gray-300'
          }`}
        >
          {disciplinas.map((disciplina) => (
            <span
              key={disciplina}
              className="inline-flex items-center gap-1 rounded-full bg-ifpb-tealLight text-ifpb-teal text-xs font-semibold pl-2.5 pr-1 py-1"
            >
              {disciplina}
              <button
                type="button"
                onClick={() => setDisciplinas((atual) => atual.filter((item) => item !== disciplina))}
                aria-label={`Remover disciplina ${disciplina}`}
                className="rounded-full p-0.5 hover:bg-white/80 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          <input
            id={idDisciplina}
            value={rascunhoDisciplina}
            onChange={(e) => {
              setRascunhoDisciplina(e.target.value);
              if (erroDisciplinaInput) setErroDisciplinaInput('');
            }}
            onKeyDown={aoTeclarDisciplina}
            maxLength={LIMITE_CARACTERES_DISCIPLINA}
            placeholder={disciplinas.length === 0 ? 'Ex.: Matemática (Enter para adicionar)' : 'Adicionar outra...'}
            aria-invalid={Boolean(erros.disciplinas || erroDisciplinaInput)}
            aria-describedby={`${idDisciplina}-ajuda`}
            className="flex-1 min-w-[10rem] border-0 p-1 text-sm focus:outline-none focus:ring-0 bg-transparent"
          />
          <button
            type="button"
            onClick={confirmarRascunho}
            disabled={!rascunhoDisciplina.trim()}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-ifpb-teal hover:bg-ifpb-tealLight disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Adicionar
          </button>
        </div>
        <p id={`${idDisciplina}-ajuda`} className="mt-1 text-xs text-gray-500">
          Pressione Enter ou vírgula para adicionar cada disciplina.
        </p>
        {(erros.disciplinas || erroDisciplinaInput) && (
          <p role="alert" className="mt-1 text-xs font-medium text-ifpb-red">
            {erroDisciplinaInput || erros.disciplinas}
          </p>
        )}
      </div>

      {/* Justificativa */}
      <div>
        <label htmlFor={idJustificativa} className="block text-sm font-medium text-gray-700">
          Justificativa pedagógica <span className="text-ifpb-red">*</span>
        </label>
        <textarea
          id={idJustificativa}
          value={justificativa}
          onChange={(e) => {
            setJustificativa(e.target.value);
            if (erros.justificativa) setErros((anterior) => ({ ...anterior, justificativa: undefined }));
          }}
          rows={5}
          aria-invalid={Boolean(erros.justificativa)}
          aria-describedby={erros.justificativa ? `${idJustificativa}-erro` : undefined}
          placeholder="Descreva o que foi observado em sala, desde quando e quais estratégias já foram tentadas."
          className={`${CLASSE_CAMPO} resize-y ${erros.justificativa ? 'border-ifpb-red' : 'border-gray-300'}`}
        />
        {erros.justificativa && (
          <p id={`${idJustificativa}-erro`} role="alert" className="mt-1 text-xs font-medium text-ifpb-red">
            {erros.justificativa}
          </p>
        )}
      </div>

      <div className="pt-4 border-t border-gray-200 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
        <button
          type="button"
          onClick={onCancelar}
          disabled={enviando}
          className="px-4 py-2.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={enviando}
          className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-lg text-xs font-bold text-white bg-ifpb-teal hover:bg-ifpb-tealHover focus:outline-none focus:ring-2 focus:ring-ifpb-teal/40 shadow-sm transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {enviando ? <RotateCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {enviando ? 'Enviando...' : 'Enviar indicação'}
        </button>
      </div>
    </form>
  );
};
