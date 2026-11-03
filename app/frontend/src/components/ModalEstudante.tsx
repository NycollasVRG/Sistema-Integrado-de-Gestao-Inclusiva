import { useEffect, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { ErroApiAlunos, GestaoEstudantesService } from '../services/gestaoEstudantesService';
import type { DadosEstudanteFormulario, EstudanteResumo, TagDificuldadeDTO } from '../types/gestaoEstudantes';

interface Props {
  aberto: boolean;
  estudante: EstudanteResumo | null;
  tagsDisponiveis: TagDificuldadeDTO[];
  carregandoTags: boolean;
  aoFechar: () => void;
  aoSalvar: (mensagem: string) => void;
}

function resolverIdTag(tag: TagDificuldadeDTO, catalogo: TagDificuldadeDTO[]): string | undefined {
  if (tag.id) return tag.id;
  // Compatibilidade com APIs antigas que retornavam somente o nome.
  return catalogo.find((item) =>
    item.id && item.nome.trim().toLocaleLowerCase('pt-BR') === tag.nome.trim().toLocaleLowerCase('pt-BR')
  )?.id;
}

function obterEstadoInicial(
  estudante: EstudanteResumo | null,
  catalogo: TagDificuldadeDTO[],
): DadosEstudanteFormulario {
  return {
    nomeCompleto: estudante?.nomeCompleto ?? '',
    matricula: estudante?.matricula ?? '',
    curso: estudante?.curso ?? '',
    turma: estudante?.turma ?? '',
    status: estudante?.status === 'EVADIDO' ? 'EVADIDO'
      : estudante?.status === 'INATIVO' ? 'INATIVO' : 'ATIVO',
    tagsDificuldadeIds: estudante?.tagsDificuldade
      .map((tag) => resolverIdTag(tag, catalogo))
      .filter((id): id is string => Boolean(id)) ?? [],
  };
}

export function ModalEstudante({ aberto, estudante, tagsDisponiveis, carregandoTags, aoFechar, aoSalvar }: Props) {
  const [dados, setDados] = useState<DadosEstudanteFormulario>(() => obterEstadoInicial(estudante, tagsDisponiveis));
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!aberto) return;
    setDados(obterEstadoInicial(estudante, tagsDisponiveis));
    setErro('');
  }, [aberto, estudante, tagsDisponiveis]);

  if (!aberto) return null;

  const titulo = estudante ? 'Editar estudante' : 'Novo estudante';
  const tagsValidas = Array.from(new Map(
    tagsDisponiveis.filter((tag) => Boolean(tag.id)).map((tag) => [tag.id, tag]),
  ).values());
  const idsSelecionados = new Set(dados.tagsDificuldadeIds);
  const tagsSemId = estudante?.tagsDificuldade.some((tag) => !resolverIdTag(tag, tagsDisponiveis)) ?? false;

  function alterarCampo(campo: 'nomeCompleto' | 'matricula' | 'curso' | 'turma', valor: string) {
    setDados((anterior) => ({ ...anterior, [campo]: valor }));
    if (erro) setErro('');
  }

  function alterarTag(id: string, selecionada: boolean) {
    setDados((anterior) => ({
      ...anterior,
      tagsDificuldadeIds: selecionada
        ? Array.from(new Set([...anterior.tagsDificuldadeIds, id]))
        : anterior.tagsDificuldadeIds.filter((atual) => atual !== id),
    }));
  }

  async function salvar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const campos = {
      ...dados,
      nomeCompleto: dados.nomeCompleto.trim(),
      matricula: dados.matricula.trim(),
      curso: dados.curso.trim(),
      turma: dados.turma.trim(),
    };
    if (!campos.nomeCompleto || !campos.matricula || !campos.curso || !campos.turma) {
      setErro('Preencha nome completo, matrícula, curso e turma.');
      return;
    }
    if (campos.tagsDificuldadeIds.length === 0) {
      setErro('Selecione pelo menos uma tag de dificuldade para salvar o estudante.');
      return;
    }
    if (tagsSemId) {
      setErro('Não foi possível identificar uma ou mais tags atuais. Atualize a página e confira se o catálogo de tags carregou corretamente.');
      return;
    }
    setSalvando(true);
    setErro('');
    try {
      if (estudante) await GestaoEstudantesService.atualizar(estudante.id, campos);
      else await GestaoEstudantesService.criar(campos);
      aoSalvar(estudante ? 'Estudante atualizado com sucesso.' : 'Estudante cadastrado com sucesso.');
    } catch (falha: unknown) {
      if (falha instanceof ErroApiAlunos && falha.status === 409) {
        setErro('Já existe um estudante cadastrado com essa matrícula. Informe outra matrícula.');
      } else {
        setErro(falha instanceof Error ? falha.message : 'Erro inesperado ao salvar estudante.');
      }
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="presentation">
      <section role="dialog" aria-modal="true" aria-labelledby="titulo-modal-estudante"
        className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-xl p-6 space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="titulo-modal-estudante" className="text-xl font-bold text-[#0F6460]">{titulo}</h2>
            <p className="text-sm text-gray-600 mt-1">Campos marcados com * são obrigatórios.</p>
          </div>
          <button type="button" onClick={aoFechar} disabled={salvando} aria-label="Fechar formulário"
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"><X className="w-5 h-5" /></button>
        </div>

        <form className="space-y-4" onSubmit={salvar} noValidate>
          <label className="block text-sm font-medium text-gray-700">Nome completo *
            <input value={dados.nomeCompleto} required maxLength={255} onChange={(e) => alterarCampo('nomeCompleto', e.target.value)}
              className="block mt-1 w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="Nome do estudante" />
          </label>
          <label className="block text-sm font-medium text-gray-700">Matrícula *
            <input value={dados.matricula} required maxLength={50} onChange={(e) => alterarCampo('matricula', e.target.value)}
              className="block mt-1 w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="Ex.: 20260001" />
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block text-sm font-medium text-gray-700">Curso *
              <input value={dados.curso} required maxLength={100} onChange={(e) => alterarCampo('curso', e.target.value)}
                className="block mt-1 w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="Ex.: Informática" />
            </label>
            <label className="block text-sm font-medium text-gray-700">Turma *
              <input value={dados.turma} required maxLength={50} onChange={(e) => alterarCampo('turma', e.target.value)}
                className="block mt-1 w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="Ex.: 2026.1" />
            </label>
          </div>
          {estudante && (
            <label className="block text-sm font-medium text-gray-700">
              Situação do estudante
              <select
                value={dados.status}
                onChange={(e) => {
                  setDados((anterior) => ({
                    ...anterior,
                    status: e.target.value as DadosEstudanteFormulario['status'],
                  }));
                  if (erro) setErro('');
                }}
                className="block mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 bg-white"
              >
                <option value="ATIVO">Ativo</option>
                <option value="INATIVO">Inativo</option>
                <option value="EVADIDO">Evadido</option>
              </select>
              {!estudante.ativo && dados.status === 'ATIVO' && (
                <span className="block mt-1 text-xs text-emerald-700">
                  Ao salvar, o estudante será reativado e aparecerá no filtro Ativos.
                </span>
              )}
            </label>
          )}
          <fieldset className="border border-gray-200 rounded-lg p-3 space-y-2">
            <legend className="text-sm font-semibold text-gray-700 px-1">Tags de dificuldade (seleção múltipla)</legend>
            {carregandoTags ? (
              <p className="text-sm text-gray-500">Carregando tags disponíveis...</p>
            ) : tagsValidas.length === 0 ? (
              <p className="text-sm text-amber-800">Não há tags cadastradas ou disponíveis. Cadastre indicadores no banco e recarregue esta página antes de salvar.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                {tagsValidas.map((tag) => (
                  <label key={tag.id} className="flex items-center gap-2 rounded-lg border border-gray-200 p-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={idsSelecionados.has(tag.id as string)}
                      onChange={(e) => alterarTag(tag.id as string, e.target.checked)} />
                    <span>{tag.nome}</span>
                  </label>
                ))}
              </div>
            )}
          </fieldset>
          {erro && <p role="alert" className="rounded-lg bg-red-50 text-red-700 p-3 text-sm">{erro}</p>}
          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
            <button type="button" onClick={aoFechar} disabled={salvando}
              className="border border-gray-300 rounded-lg px-4 py-2 text-sm disabled:opacity-50">Cancelar</button>
            <button type="submit" disabled={salvando || carregandoTags || tagsValidas.length === 0}
              className="bg-[#0F6460] text-white font-semibold rounded-lg px-5 py-2 text-sm disabled:opacity-50">
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
