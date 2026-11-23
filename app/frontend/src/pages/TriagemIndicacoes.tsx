import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ClipboardList, RotateCw, XCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { BadgeStatusIndicacao } from '../components/BadgeStatusIndicacao';
import { CardAcessoRestrito } from '../components/CardAcessoRestrito';
import { DecisaoIndicacao } from '../components/DecisaoIndicacao';
import {
  ModalDecisaoIndicacao,
  type ModoDecisaoIndicacao,
} from '../components/ModalDecisaoIndicacao';
import { IndicacaoService } from '../services/indicacaoService';
import { isAbortError, toProblem } from '../services/apiClient';
import type { IndicacaoResponseDTO, StatusIndicacao } from '../types/indicacao';
import { formatarDataHora } from '../utils/indicacao';

export interface TriagemIndicacoesProps {
  onNotificar?: (tipo: 'sucesso' | 'erro' | 'alerta', titulo: string, mensagem: string) => void;
}

type Aba = StatusIndicacao | 'TODAS';

const ABAS: { id: Aba; rotulo: string }[] = [
  { id: 'PENDENTE', rotulo: 'Pendentes' },
  { id: 'APROVADA', rotulo: 'Aprovadas' },
  { id: 'REJEITADA', rotulo: 'Rejeitadas' },
  { id: 'TODAS', rotulo: 'Histórico completo' },
];

const MENSAGEM_VAZIA: Record<Aba, string> = {
  PENDENTE: 'Nenhuma indicação aguardando triagem. Tudo em dia!',
  APROVADA: 'Nenhuma indicação aprovada até o momento.',
  REJEITADA: 'Nenhuma indicação rejeitada até o momento.',
  TODAS: 'Ainda não há indicações registradas.',
};

interface DecisaoEmAndamento {
  indicacao: IndicacaoResponseDTO;
  modo: ModoDecisaoIndicacao;
}

/** Painel "Triagem e Indicações" da equipe CLAI/Coordenação (US 10 / TA10.3). */
export function TriagemIndicacoes({ onNotificar }: TriagemIndicacoesProps) {
  const navigate = useNavigate();
  const { podeGerirTriagem } = useAuth();
  const [indicacoes, setIndicacoes] = useState<IndicacaoResponseDTO[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [aba, setAba] = useState<Aba>('PENDENTE');
  const [decisao, setDecisao] = useState<DecisaoEmAndamento | null>(null);
  const [revisao, setRevisao] = useState(0);

  // O estado de "carregando" é ligado nos eventos (recarregar) e não dentro do effect.
  useEffect(() => {
    if (!podeGerirTriagem) return;
    const controlador = new AbortController();
    IndicacaoService.listar(undefined, controlador.signal)
      .then((lista) => {
        if (!controlador.signal.aborted) setIndicacoes(lista);
      })
      .catch((falha: unknown) => {
        if (isAbortError(falha) || controlador.signal.aborted) return;
        const problema = toProblem(falha, 'Erro ao carregar indicações', 'Não foi possível carregar as indicações.');
        setErro(problema.detail || problema.title);
      })
      .finally(() => {
        if (!controlador.signal.aborted) setCarregando(false);
      });
    return () => controlador.abort();
  }, [podeGerirTriagem, revisao]);

  const recarregar = useCallback(() => {
    setCarregando(true);
    setErro('');
    setRevisao((v) => v + 1);
  }, []);

  const contagens = useMemo(
    () => ({
      PENDENTE: indicacoes.filter((i) => i.status === 'PENDENTE').length,
      APROVADA: indicacoes.filter((i) => i.status === 'APROVADA').length,
      REJEITADA: indicacoes.filter((i) => i.status === 'REJEITADA').length,
      TODAS: indicacoes.length,
    }),
    [indicacoes],
  );

  const visiveis = useMemo(
    () => (aba === 'TODAS' ? indicacoes : indicacoes.filter((i) => i.status === aba)),
    [indicacoes, aba],
  );

  if (!podeGerirTriagem) {
    return <CardAcessoRestrito mensagem="A triagem de indicações é restrita à equipe CLAI e à Coordenação." />;
  }

  function aoConcluirDecisao(atualizada: IndicacaoResponseDTO, modo: ModoDecisaoIndicacao) {
    setDecisao(null);
    setIndicacoes((anteriores) => anteriores.map((item) => (item.id === atualizada.id ? atualizada : item)));

    if (modo === 'APROVAR') {
      onNotificar?.(
        'sucesso',
        'Indicação Aprovada',
        `Estudo de Caso de ${atualizada.nomeEstudante} iniciado em rascunho.`,
      );
      // TA10.3: aprovação redireciona ao Estudo de Caso do estudante.
      navigate(`/estudantes/${atualizada.alunoId}/estudo-de-caso`);
      return;
    }
    onNotificar?.(
      'sucesso',
      'Indicação Rejeitada',
      `A justificativa foi registrada no histórico da indicação de ${atualizada.nomeEstudante}.`,
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ifpb-teal">Triagem e Indicações</h1>
          <p className="text-sm text-gray-600 mt-1">
            Analise as indicações de demanda espontânea e inicie o Estudo de Caso quando houver necessidade de
            acompanhamento.
          </p>
        </div>
        <button
          type="button"
          onClick={recarregar}
          disabled={carregando}
          className="inline-flex items-center gap-2 self-start rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 cursor-pointer transition-colors"
        >
          <RotateCw className={`w-4 h-4 ${carregando ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      <div role="tablist" aria-label="Filtrar indicações por situação" className="flex flex-wrap gap-2">
        {ABAS.map(({ id, rotulo }) => {
          const ativa = aba === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={ativa}
              onClick={() => setAba(id)}
              className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold border transition-colors cursor-pointer ${
                ativa
                  ? 'bg-ifpb-teal text-white border-ifpb-teal shadow-xs'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {rotulo}
              <span
                className={`min-w-[1.5rem] rounded-full px-1.5 py-0.5 text-[11px] text-center ${
                  ativa ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {contagens[id]}
              </span>
            </button>
          );
        })}
      </div>

      {erro && (
        <p role="alert" className="rounded-lg bg-red-50 border border-red-200 text-red-700 p-3 text-sm">
          {erro}
        </p>
      )}

      {carregando && indicacoes.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-ifpb-teal mb-3" />
          <p className="text-sm font-medium text-gray-600">Carregando indicações...</p>
        </div>
      ) : visiveis.length === 0 && !erro ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <ClipboardList className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-600">{MENSAGEM_VAZIA[aba]}</p>
        </div>
      ) : (
        <ul className="space-y-4" aria-label="Lista de indicações">
          {visiveis.map((indicacao) => (
            <li
              key={indicacao.id}
              className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                <div className="min-w-0">
                  <button
                    type="button"
                    onClick={() => navigate(`/estudantes/${indicacao.alunoId}/prontuario`)}
                    className="text-base font-bold text-gray-900 hover:text-ifpb-teal hover:underline text-left cursor-pointer transition-colors"
                    title={`Abrir prontuário de ${indicacao.nomeEstudante}`}
                  >
                    {indicacao.nomeEstudante}
                  </button>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Matrícula <span className="font-mono">{indicacao.matriculaAluno}</span>
                    {' • '}Indicado por{' '}
                    <span className="font-medium text-gray-700">{indicacao.solicitanteNome ?? 'não informado'}</span>
                    {' • '}
                    {formatarDataHora(indicacao.criadoEm)}
                  </p>
                </div>
                <BadgeStatusIndicacao status={indicacao.status} />
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                  Disciplinas observadas
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {indicacao.disciplinasObservadas.map((disciplina) => (
                    <span
                      key={disciplina}
                      className="rounded-full bg-ifpb-tealLight text-ifpb-teal text-xs font-semibold px-2.5 py-1"
                    >
                      {disciplina}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                  Justificativa pedagógica
                </p>
                <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">
                  {indicacao.justificativaPedagogica}
                </p>
              </div>

              <DecisaoIndicacao
                indicacao={indicacao}
                onAbrirEstudo={() => navigate(`/estudantes/${indicacao.alunoId}/estudo-de-caso`)}
              />

              {indicacao.status === 'PENDENTE' && (
                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setDecisao({ indicacao, modo: 'REJEITAR' })}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold text-red-700 border border-red-300 bg-white hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                    Rejeitar
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecisao({ indicacao, modo: 'APROVAR' })}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold text-white bg-ifpb-teal hover:bg-ifpb-tealHover shadow-xs transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Aprovar e Iniciar Estudo de Caso
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {decisao && (
        <ModalDecisaoIndicacao
          key={`${decisao.indicacao.id}-${decisao.modo}`}
          indicacao={decisao.indicacao}
          modo={decisao.modo}
          onClose={() => setDecisao(null)}
          onConcluida={aoConcluirDecisao}
          onFalha={recarregar}
        />
      )}
    </section>
  );
}
