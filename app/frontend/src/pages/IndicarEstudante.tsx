import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ClipboardPlus, Info, Search, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { BadgeStatusEstudante } from '../components/BadgeStatusEstudante';
import { CardAcessoRestrito } from '../components/CardAcessoRestrito';
import { FormularioIndicacao } from '../components/FormularioIndicacao';
import { GestaoEstudantesService } from '../services/gestaoEstudantesService';
import type { EstudanteResumo } from '../types/gestaoEstudantes';
import type { IndicacaoResponseDTO } from '../types/indicacao';
import { estudanteAceitaIndicacao } from '../utils/indicacao';

export interface IndicarEstudanteProps {
  onNotificar?: (tipo: 'sucesso' | 'erro' | 'alerta', titulo: string, mensagem: string) => void;
}

const DEBOUNCE_BUSCA_MS = 300;
const MAX_RESULTADOS = 8;

/** Página "Indicar Estudante" (acesso pelo menu): escolhe o estudante e preenche a indicação. */
export function IndicarEstudante({ onNotificar }: IndicarEstudanteProps) {
  const navigate = useNavigate();
  const { podeIndicarEstudante } = useAuth();
  const [termo, setTermo] = useState('');
  const [resultados, setResultados] = useState<EstudanteResumo[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [erroBusca, setErroBusca] = useState('');
  const [selecionado, setSelecionado] = useState<EstudanteResumo | null>(null);
  const [enviando, setEnviando] = useState(false);

  const termoLimpo = termo.trim();

  useEffect(() => {
    if (!podeIndicarEstudante || selecionado || termoLimpo.length < 2) return;

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
  }, [termoLimpo, selecionado, podeIndicarEstudante]);

  if (!podeIndicarEstudante) {
    return (
      <CardAcessoRestrito mensagem="Seu perfil não tem permissão para indicar estudantes para a triagem da CLAI." />
    );
  }

  function aoEnviar(indicacao: IndicacaoResponseDTO) {
    const mensagemSucesso = `Indicação de ${indicacao.nomeEstudante} registrada. O estudante está Em Triagem e a equipe CLAI foi notificada.`;
    onNotificar?.('sucesso', 'Indicação Enviada', mensagemSucesso);
    navigate('/estudantes', { state: { mensagemSucesso } });
  }

  const indicaveis = resultados.filter(estudanteAceitaIndicacao);
  // Só exibe resultados quando há busca válida (evita lista velha ao apagar o termo).
  const resultadosVisiveis = termoLimpo.length >= 2 ? indicaveis : [];
  const semResultados =
    termoLimpo.length >= 2 && !buscando && !erroBusca && resultadosVisiveis.length === 0;

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden max-w-3xl mx-auto">
      <div className="bg-gradient-to-r from-[#0F6460] to-[#12534f] text-white px-6 py-5 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/estudantes')}
          disabled={enviando}
          className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer disabled:opacity-50"
          title="Voltar para Gestão de Estudantes"
          aria-label="Voltar para Gestão de Estudantes"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <ClipboardPlus className="w-5 h-5 text-green-300" />
            <h2 className="text-xl font-bold tracking-tight">Indicar Estudante</h2>
          </div>
          <p className="text-xs text-green-100 mt-0.5">
            Encaminhe uma demanda espontânea para triagem da equipe CLAI
          </p>
        </div>
      </div>

      <div className="bg-[#EEF1EC] border-b border-[#DDE5DB] px-6 py-3 text-xs text-ifpb-dark flex items-start gap-2">
        <Info className="w-4 h-4 text-ifpb-teal shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-ifpb-teal">Como funciona:</span> ao enviar, o estudante passa a
          constar como <strong>Em Triagem</strong> e a CLAI decide se inicia o Estudo de Caso. Campos com{' '}
          <span className="text-ifpb-red font-semibold">*</span> são obrigatórios.
        </div>
      </div>

      <div className="p-6 sm:p-8 space-y-6">
        {selecionado ? (
          <>
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-ifpb-dark">Dados da indicação</h3>
              <button
                type="button"
                onClick={() => setSelecionado(null)}
                disabled={enviando}
                className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-ifpb-teal cursor-pointer disabled:opacity-50"
              >
                <X className="w-3.5 h-3.5" />
                Trocar estudante
              </button>
            </div>
            <FormularioIndicacao
              key={selecionado.id}
              estudante={selecionado}
              onSucesso={aoEnviar}
              onCancelar={() => navigate('/estudantes')}
              onEnviandoChange={setEnviando}
            />
          </>
        ) : (
          <section aria-labelledby="titulo-buscar-estudante" className="space-y-3">
            <h3 id="titulo-buscar-estudante" className="text-sm font-bold text-ifpb-dark">
              1. Escolha o estudante
            </h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={termo}
                onChange={(e) => setTermo(e.target.value)}
                placeholder="Digite o nome ou a matrícula (mín. 2 caracteres)..."
                aria-label="Buscar estudante por nome ou matrícula"
                autoFocus
                className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ifpb-teal/30 focus:border-ifpb-teal"
              />
            </div>

            {buscando && (
              <p className="flex items-center gap-2 text-sm text-gray-500">
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
              <p className="text-sm text-gray-500">
                Nenhum estudante ativo encontrado para “{termoLimpo}”.
              </p>
            )}

            {resultadosVisiveis.length > 0 && (
              <ul className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
                {resultadosVisiveis.map((estudante) => (
                  <li key={estudante.id}>
                    <button
                      type="button"
                      onClick={() => setSelecionado(estudante)}
                      className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-ifpb-tealLight/50 cursor-pointer transition-colors"
                    >
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-gray-900 truncate">
                          {estudante.nomeCompleto}
                        </span>
                        <span className="block text-xs text-gray-500">
                          <span className="font-mono">{estudante.matricula}</span>
                          {(estudante.curso || estudante.turma) &&
                            ` • ${[estudante.curso, estudante.turma].filter(Boolean).join(' / ')}`}
                        </span>
                      </span>
                      <BadgeStatusEstudante status={estudante.status} ativo={estudante.ativo} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
