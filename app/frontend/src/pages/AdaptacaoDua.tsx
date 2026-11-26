import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  FileText,
  Info,
  RotateCcw,
  Search,
  Upload,
  X,
} from 'lucide-react';
import { CardAcessoRestrito } from '../components/CardAcessoRestrito';
import { PreviewAdaptacaoDua } from '../components/PreviewAdaptacaoDua';
import { useAuth } from '../contexts/AuthContext';
import { isAbortError, toProblem, type ApiProblem } from '../services/apiClient';
import { adaptarProvaDua } from '../services/duaService';
import { GestaoEstudantesService } from '../services/gestaoEstudantesService';
import type { AdaptacaoDuaResponseDTO } from '../types/dua';
import type { EstudanteResumo } from '../types/gestaoEstudantes';
import {
  EXTENSOES_ARQUIVO_DUA,
  LIMITE_ARQUIVO_DUA_BYTES,
  MSG_ARQUIVO_GRANDE_DUA,
  MSG_ARQUIVO_INVALIDO_DUA,
  MSG_ARQUIVO_VAZIO_DUA,
  MSG_ESTUDANTE_OBRIGATORIO_DUA,
  MSG_PROVA_OBRIGATORIA_DUA,
} from '../utils/dua';

export interface AdaptacaoDuaProps {
  onNotificar?: (tipo: 'sucesso' | 'erro' | 'alerta', titulo: string, mensagem: string) => void;
}

const DEBOUNCE_BUSCA_MS = 300;
const MAX_RESULTADOS = 8;

/** US 07: envio da prova, retry em 504 e preview editável antes do download (TA7.2/TA7.3). */
export function AdaptacaoDua({ onNotificar }: AdaptacaoDuaProps) {
  const { podeAdaptarDua } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const controladorRef = useRef<AbortController | null>(null);

  const [termo, setTermo] = useState('');
  const [resultados, setResultados] = useState<EstudanteResumo[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [erroBusca, setErroBusca] = useState('');
  const [selecionado, setSelecionado] = useState<EstudanteResumo | null>(null);
  const [catalogoTags, setCatalogoTags] = useState<string[]>([]);
  const [tagsSelecionadas, setTagsSelecionadas] = useState<string[]>([]);
  const [textoProva, setTextoProva] = useState('');
  const [nomeArquivo, setNomeArquivo] = useState('');
  const [erroValidacao, setErroValidacao] = useState('');
  const [erroApi, setErroApi] = useState<ApiProblem | null>(null);
  const [adaptando, setAdaptando] = useState(false);
  const [tentativa, setTentativa] = useState<number | null>(null);
  const [resposta, setResposta] = useState<AdaptacaoDuaResponseDTO | null>(null);

  // Atalho a partir do prontuário: /adaptacao-dua?alunoId=... ou location.state.alunoId.
  const alunoIdInicial = useMemo(() => {
    const estado = location.state as { alunoId?: unknown } | null;
    const doEstado = typeof estado?.alunoId === 'string' ? estado.alunoId : null;
    const daUrl = new URLSearchParams(location.search).get('alunoId');
    const id = doEstado || daUrl;
    return id && /^[0-9a-f-]{36}$/i.test(id) ? id : null;
  }, [location.state, location.search]);

  useEffect(() => {
    if (!podeAdaptarDua) return;
    const controlador = new AbortController();
    GestaoEstudantesService.listarTags(controlador.signal)
      .then((lista) => {
        if (!controlador.signal.aborted) {
          setCatalogoTags(
            Array.from(new Set(lista.map((t) => t.nome?.trim()).filter((n): n is string => Boolean(n)))),
          );
        }
      })
      .catch(() => {
        // Caso o catálogo não carregue, mantém as tags do próprio estudante selecionado.
      });
    return () => controlador.abort();
  }, [podeAdaptarDua]);

  useEffect(() => {
    if (!selecionado) {
      setTagsSelecionadas([]);
      return;
    }
    const tagsDoAluno = selecionado.tagsDificuldade
      .map((t) => t.nome?.trim())
      .filter((n): n is string => Boolean(n));
    setTagsSelecionadas(Array.from(new Set(tagsDoAluno)));
  }, [selecionado]);

  useEffect(() => {
    if (!alunoIdInicial) return;
    const controlador = new AbortController();
    GestaoEstudantesService.buscarPorId(alunoIdInicial, controlador.signal)
      .then((estudante) => setSelecionado((atual) => atual ?? estudante))
      .catch((falha: unknown) => {
        if (!controlador.signal.aborted) {
          setErroBusca(falha instanceof Error ? falha.message : 'Não foi possível localizar o estudante.');
        }
      });
    return () => controlador.abort();
  }, [alunoIdInicial]);

  const termoLimpo = termo.trim();

  useEffect(() => {
    if (!podeAdaptarDua || selecionado || termoLimpo.length < 2) return;

    const controlador = new AbortController();
    const timer = window.setTimeout(() => {
      setBuscando(true);
      setErroBusca('');
      GestaoEstudantesService.listar(
        { termo: termoLimpo, curso: '', turma: '', tag: '', ativo: true, page: 0, size: MAX_RESULTADOS },
        controlador.signal,
      )
        .then((pagina) => {
          if (!controlador.signal.aborted) setResultados(pagina.content);
        })
        .catch((falha: unknown) => {
          if (controlador.signal.aborted) return;
          setResultados([]);
          setErroBusca(falha instanceof Error ? falha.message : 'Não foi possível buscar estudantes.');
        })
        .finally(() => {
          if (!controlador.signal.aborted) setBuscando(false);
        });
    }, DEBOUNCE_BUSCA_MS);

    return () => {
      window.clearTimeout(timer);
      controlador.abort();
    };
  }, [termoLimpo, selecionado, podeAdaptarDua]);

  useEffect(
    () => () => {
      controladorRef.current?.abort();
    },
    [],
  );

  if (!podeAdaptarDua) {
    return (
      <CardAcessoRestrito mensagem="Seu perfil não tem permissão para gerar adaptações DUA de provas." />
    );
  }

  async function aoImportarArquivo(evento: ChangeEvent<HTMLInputElement>): Promise<void> {
    const arquivo = evento.target.files?.[0];
    evento.target.value = '';
    if (!arquivo) return;

    const extensao = arquivo.name.split('.').pop()?.toLowerCase() ?? '';
    const permitido =
      EXTENSOES_ARQUIVO_DUA.some((item) => item === extensao) ||
      arquivo.type === 'text/plain' ||
      arquivo.type === 'text/markdown';
    if (!permitido) {
      setErroValidacao(MSG_ARQUIVO_INVALIDO_DUA);
      return;
    }
    if (arquivo.size > LIMITE_ARQUIVO_DUA_BYTES) {
      setErroValidacao(MSG_ARQUIVO_GRANDE_DUA);
      return;
    }

    try {
      const conteudo = await arquivo.text();
      if (!conteudo.trim()) {
        setErroValidacao(MSG_ARQUIVO_VAZIO_DUA);
        return;
      }
      setTextoProva(conteudo);
      setNomeArquivo(arquivo.name);
      setErroValidacao('');
      setErroApi(null);
    } catch {
      setErroValidacao('Não foi possível ler o arquivo. Tente novamente ou cole o texto da prova.');
    }
  }

  function cancelarAdaptacao(): void {
    controladorRef.current?.abort();
    controladorRef.current = null;
    setAdaptando(false);
    setTentativa(null);
  }

  async function aoAdaptar(): Promise<void> {
    if (!selecionado) {
      setErroValidacao(MSG_ESTUDANTE_OBRIGATORIO_DUA);
      return;
    }
    if (!textoProva.trim()) {
      setErroValidacao(MSG_PROVA_OBRIGATORIA_DUA);
      return;
    }

    setErroValidacao('');
    setErroApi(null);
    const controlador = new AbortController();
    controladorRef.current = controlador;
    setAdaptando(true);
    setTentativa(1);

    try {
      const resultado = await adaptarProvaDua(
        {
          alunoId: selecionado.id,
          textoProva: textoProva.trim(),
          tagsDificuldade: tagsSelecionadas,
        },
        {
          signal: controlador.signal,
          aoStatus: (numero) => setTentativa(numero),
        },
      );
      setResposta(resultado);
      onNotificar?.(
        'sucesso',
        'Prova adaptada gerada',
        'Revise o preview e aprove as alterações antes de gerar o documento final.',
      );
    } catch (falha: unknown) {
      if (isAbortError(falha) || controlador.signal.aborted) return;
      const problema = toProblem(
        falha,
        'Não foi possível adaptar a prova',
        'O serviço de adaptação não respondeu. Tente novamente em instantes.',
      );
      setErroApi(problema);
      // 403 já abre o aviso global de sigilo clínico/LGPD pelo apiClient.
      if (problema.status !== 403) {
        onNotificar?.('erro', problema.title, problema.detail);
      }
    } finally {
      if (controladorRef.current === controlador) {
        controladorRef.current = null;
        setAdaptando(false);
        setTentativa(null);
      }
    }
  }

  const resultadosVisiveis = termoLimpo.length >= 2 ? resultados : [];
  const semResultados =
    termoLimpo.length >= 2 && !buscando && !erroBusca && resultadosVisiveis.length === 0;

  if (resposta && selecionado) {
    return (
      <PreviewAdaptacaoDua
        resposta={resposta}
        estudante={selecionado}
        onNotificar={(tipo, titulo, mensagem) => onNotificar?.(tipo, titulo, mensagem)}
        onDescartar={() => {
          setResposta(null);
          setErroApi(null);
        }}
      />
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden max-w-3xl mx-auto">
      <div className="bg-gradient-to-r from-[#0F6460] to-[#12534f] text-white px-6 py-5 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/estudantes')}
          disabled={adaptando}
          className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer disabled:opacity-50"
          title="Voltar para Gestão de Estudantes"
          aria-label="Voltar para Gestão de Estudantes"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-start gap-3">
          <FileText className="w-6 h-6 text-green-300 shrink-0 mt-0.5" />
          <div>
            <h2 className="text-xl font-bold tracking-tight">Adaptação DUA de Provas</h2>
            <p className="text-xs text-green-100 mt-0.5">
              Envie a prova, revise a sugestão da IA e aprove antes de baixar
            </p>
          </div>
        </div>
      </div>

      <div className="bg-[#EEF1EC] border-b border-[#DDE5DB] px-6 py-3 text-xs text-ifpb-dark flex items-start gap-2">
        <Info className="w-4 h-4 text-ifpb-teal shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-ifpb-teal">Privacidade:</span> antes do envio à IA, o
          sistema remove CPF, matrícula e nome do estudante do texto da prova. Não informe laudos ou
          diagnósticos. As tags cadastradas no estudante são aplicadas automaticamente pelo backend.
        </div>
      </div>

      <div className="p-6 sm:p-8 space-y-6">
        <section aria-labelledby="titulo-selecionar-estudante-dua" className="space-y-3">
          <h3 id="titulo-selecionar-estudante-dua" className="text-sm font-bold text-ifpb-dark">
            1. Selecione o estudante
          </h3>

          {selecionado ? (
            <div className="rounded-lg border border-ifpb-teal/30 bg-ifpb-tealLight/40 p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{selecionado.nomeCompleto}</p>
                  <p className="text-xs text-gray-600 font-mono">{selecionado.matricula}</p>
                  {(selecionado.curso || selecionado.turma) && (
                    <p className="text-xs text-gray-500">
                      {[selecionado.curso, selecionado.turma].filter(Boolean).join(' / ')}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelecionado(null);
                    setTermo('');
                    setResultados([]);
                  }}
                  disabled={adaptando}
                  className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-ifpb-teal cursor-pointer disabled:opacity-50"
                >
                  <X className="w-3.5 h-3.5" />
                  Trocar estudante
                </button>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Tags de dificuldade aplicáveis (pré-selecionadas a partir do cadastro do estudante)
                </p>
                {(() => {
                  const tagsDoAluno = selecionado.tagsDificuldade
                    .map((t) => t.nome?.trim())
                    .filter((n): n is string => Boolean(n));
                  const opcoesTags = Array.from(new Set([...tagsDoAluno, ...catalogoTags]));
                  if (opcoesTags.length === 0) {
                    return (
                      <p className="text-xs text-gray-500 mt-1">
                        Nenhuma tag cadastrada. A IA aplicará boas práticas gerais de DUA sobre o texto da prova.
                      </p>
                    );
                  }
                  return (
                    <div className="flex flex-wrap gap-2 mt-2" role="group" aria-label="Selecionar tags de dificuldade">
                      {opcoesTags.map((nomeTag) => {
                        const ativa = tagsSelecionadas.includes(nomeTag);
                        return (
                          <button
                            key={nomeTag}
                            type="button"
                            disabled={adaptando}
                            aria-pressed={ativa}
                            onClick={() =>
                              setTagsSelecionadas((atual) =>
                                atual.includes(nomeTag)
                                  ? atual.filter((item) => item !== nomeTag)
                                  : [...atual, nomeTag],
                              )
                            }
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 ${
                              ativa
                                ? 'border-ifpb-teal bg-ifpb-teal text-white shadow-2xs'
                                : 'border-gray-300 bg-white text-gray-700 hover:border-ifpb-teal/50'
                            }`}
                          >
                            <span>{nomeTag}</span>
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}
                <p className="text-[11px] text-gray-500 mt-1.5">
                  Clique nas tags para marcar ou desmarcar quais barreiras devem orientar esta adaptação (apenas os nomes das tags são enviados à IA).
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={termo}
                  onChange={(evento) => setTermo(evento.target.value)}
                  placeholder="Digite o nome ou a matrícula (mín. 2 caracteres)..."
                  aria-label="Buscar estudante por nome ou matrícula"
                  className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ifpb-teal/30 focus:border-ifpb-teal"
                />
              </div>
              {buscando && (
                <p className="flex items-center gap-2 text-sm text-gray-500" role="status">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-ifpb-teal inline-block" />
                  Buscando estudantes...
                </p>
              )}
              {erroBusca && (
                <p role="alert" className="bg-red-50 text-red-700 rounded-lg p-3 text-sm">
                  {erroBusca}
                </p>
              )}
              {semResultados && (
                <p className="text-sm text-gray-500">Nenhum estudante ativo encontrado para “{termoLimpo}”.</p>
              )}
              {resultadosVisiveis.length > 0 && (
                <ul className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
                  {resultadosVisiveis.map((estudante) => (
                    <li key={estudante.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelecionado(estudante);
                          setErroValidacao('');
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-ifpb-tealLight/50 cursor-pointer transition-colors"
                      >
                        <span className="block text-sm font-semibold text-gray-900 truncate">
                          {estudante.nomeCompleto}
                        </span>
                        <span className="block text-xs text-gray-500 font-mono">{estudante.matricula}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </section>

        <section aria-labelledby="titulo-texto-prova-dua" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 id="titulo-texto-prova-dua" className="text-sm font-bold text-ifpb-dark">
              2. Informe o texto da prova
            </h3>
            <span className="text-[11px] text-gray-500">{textoProva.length} caracteres</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-3">
            <Upload className="w-4 h-4 text-ifpb-teal" />
            <label htmlFor="arquivo-prova-dua" className="text-xs font-medium text-gray-700 cursor-pointer">
              Importar arquivo .txt ou .md
            </label>
            <input
              id="arquivo-prova-dua"
              type="file"
              accept=".txt,.md,text/plain,text/markdown"
              onChange={(evento) => void aoImportarArquivo(evento)}
              disabled={adaptando}
              className="text-xs max-w-full"
            />
            {nomeArquivo && (
              <span className="inline-flex items-center gap-1 text-[11px] text-ifpb-teal">
                <FileText className="w-3.5 h-3.5" />
                {nomeArquivo}
                <button
                  type="button"
                  onClick={() => {
                    setNomeArquivo('');
                    setTextoProva('');
                  }}
                  title="Remover arquivo importado"
                  aria-label="Remover arquivo importado"
                  className="p-0.5 rounded-full hover:bg-gray-200 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>

          <label htmlFor="texto-prova-dua" className="block text-xs font-medium text-gray-600">
            Texto da avaliação <span className="text-ifpb-red font-semibold">*</span>
          </label>
          <textarea
            id="texto-prova-dua"
            value={textoProva}
            onChange={(evento) => {
              setTextoProva(evento.target.value);
              if (erroValidacao) setErroValidacao('');
            }}
            rows={10}
            placeholder="Cole aqui o enunciado completo da prova, mantendo a numeração das questões..."
            aria-invalid={!!erroValidacao}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm whitespace-pre-wrap focus:outline-none focus:ring-2 focus:ring-ifpb-teal/30 focus:border-ifpb-teal"
          />
          <p className="text-[11px] text-gray-500">
            PDF e DOCX não são lidos automaticamente: abra o arquivo e copie o texto para o campo acima.
          </p>
        </section>

        {erroValidacao && (
          <p role="alert" className="bg-red-50 text-red-700 rounded-lg p-3 text-sm">
            {erroValidacao}
          </p>
        )}

        {erroApi && (
          <div
            role="alert"
            className="bg-amber-50 border border-amber-300 rounded-lg p-4 flex items-start gap-3"
          >
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <p className="text-sm font-bold text-amber-900">
                {erroApi.status === 504 ? 'A IA demorou mais que o esperado' : erroApi.title}
              </p>
              <p className="text-xs text-amber-800">{erroApi.detail}</p>
              {erroApi.status === 504 && (
                <p className="text-xs text-amber-800">
                  O texto informado foi mantido. Você pode tentar novamente ou revisar a prova
                  manualmente.
                </p>
              )}
              <button
                type="button"
                onClick={() => void aoAdaptar()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-ifpb-teal hover:bg-ifpb-tealHover transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Tentar novamente
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 border-t border-gray-100 pt-5">
          <button
            type="button"
            onClick={() => void aoAdaptar()}
            disabled={adaptando}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-ifpb-teal hover:bg-ifpb-tealHover transition-colors cursor-pointer disabled:opacity-60"
          >
            <FileText className="w-4 h-4" />
            {adaptando ? 'Adaptando prova...' : 'Gerar adaptação DUA'}
          </button>
          {adaptando && (
            <>
              <span role="status" className="flex items-center gap-2 text-xs text-gray-600">
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-ifpb-teal inline-block" />
                {tentativa ? `Tentativa ${tentativa} de 3` : ''} — isso pode levar alguns segundos
              </span>
              <button
                type="button"
                onClick={cancelarAdaptacao}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-gray-600 border border-gray-300 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                Cancelar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
