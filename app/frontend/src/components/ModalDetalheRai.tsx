import React, { useEffect, useState } from 'react';
import { AlertCircle, FileBarChart, Printer, RotateCw } from 'lucide-react';
import { toProblem } from '../services/apiClient';
import { RaiService } from '../services/raiService';
import { ROTULO_NIVEL_APRENDIZADO, type RaiResponseDTO } from '../types/rai';
import { imprimirAnexoVRai } from '../utils/impressaoAnexosClai';
import { ModalBase } from './ModalBase';

interface ModalDetalheRaiProps {
  relatorioId: string;
  onClose: () => void;
}

function formatarData(dateTime?: string | null): string {
  if (!dateTime) return '—';
  try {
    return new Date(dateTime).toLocaleString('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  } catch {
    return dateTime;
  }
}

/** Detalhe de RAI/RAE a partir da Linha do Tempo (TA9.2 / TA9.3 / Anexo V). */
export const ModalDetalheRai: React.FC<ModalDetalheRaiProps> = ({
  relatorioId,
  onClose,
}) => {
  const [relatorio, setRelatorio] = useState<RaiResponseDTO | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const controlador = new AbortController();
    setCarregando(true);
    setErro(null);

    RaiService.buscarPorId(relatorioId, controlador.signal)
      .then((dados) => {
        if (!controlador.signal.aborted) setRelatorio(dados);
      })
      .catch((e: unknown) => {
        if (controlador.signal.aborted) return;
        const prob = toProblem(e);
        setErro(prob.detail || prob.title || 'Não foi possível carregar o relatório.');
      })
      .finally(() => {
        if (!controlador.signal.aborted) setCarregando(false);
      });

    return () => controlador.abort();
  }, [relatorioId]);

  const handleImprimir = () => {
    if (!relatorio) return;
    imprimirAnexoVRai(
      {
        nome: relatorio.nomeEstudante || 'Estudante',
        matricula: relatorio.matriculaEstudante || '',
        curso: relatorio.cursoEstudante || '',
      },
      relatorio
    );
  };

  return (
    <ModalBase
      isOpen
      onClose={onClose}
      isLoading={carregando}
      titulo={
        relatorio?.tipoRelatorio === 'RAE'
          ? 'Detalhes do RAE'
          : 'Detalhes do RAI (Anexo V)'
      }
      subtitulo="Registro emitido e disponível na Linha do Tempo do estudante"
      icone={<FileBarChart className="w-5 h-5" />}
      footer={
        <div className="flex items-center gap-2">
          {relatorio && (
            <button
              type="button"
              onClick={handleImprimir}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold text-ifpb-teal bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir / PDF
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg text-xs font-bold text-white bg-ifpb-teal hover:bg-ifpb-tealHover shadow-sm transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      }
    >
      {carregando && (
        <div className="flex items-center justify-center py-8 text-xs text-gray-500">
          <RotateCw className="w-4 h-4 animate-spin mr-2 text-ifpb-teal" />
          Carregando relatório...
        </div>
      )}

      {erro && !carregando && (
        <div
          role="alert"
          className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2"
        >
          <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
          <p className="text-xs text-red-800 break-words">{erro}</p>
        </div>
      )}

      {relatorio && !carregando && !erro && (
        <div className="space-y-4">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-ifpb-breadcrumb/60 border border-gray-200">
              <dt className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                Tipo / Período
              </dt>
              <dd className="mt-1 text-sm font-semibold text-ifpb-dark">
                {relatorio.tipoRelatorio} &bull; {relatorio.bimestre}º bimestre
                {relatorio.periodoLetivo ? ` (${relatorio.periodoLetivo})` : ''}
              </dd>
            </div>
            <div className="p-3 rounded-lg bg-ifpb-breadcrumb/60 border border-gray-200">
              <dt className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                Componente / Docente
              </dt>
              <dd className="mt-1 text-xs font-semibold text-ifpb-dark">
                {relatorio.componenteCurricular || 'Não informado'}
                {relatorio.docente ? ` — ${relatorio.docente}` : ''}
              </dd>
            </div>
            <div className="p-3 rounded-lg bg-ifpb-breadcrumb/60 border border-gray-200">
              <dt className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                Emitido em
              </dt>
              <dd className="mt-1 text-sm font-semibold text-ifpb-dark">
                {formatarData(relatorio.criadoEm)}
              </dd>
            </div>
            <div className="p-3 rounded-lg bg-ifpb-breadcrumb/60 border border-gray-200">
              <dt className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                Indicativo de regressão
              </dt>
              <dd className="mt-1">
                {relatorio.indicativoRegressao ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                    Sim — PEI encaminhado ao Coordenador
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Não — progressão registrada
                  </span>
                )}
              </dd>
            </div>
          </dl>

          {((relatorio.relacionamentoOpcoes && relatorio.relacionamentoOpcoes.length > 0) ||
            (relatorio.habilidadesCognitivasOpcoes && relatorio.habilidadesCognitivasOpcoes.length > 0) ||
            (relatorio.habilidadesSocioemocionaisOpcoes &&
              relatorio.habilidadesSocioemocionaisOpcoes.length > 0)) && (
            <div className="p-3 rounded-lg border border-gray-200 bg-gray-50/70 space-y-2 text-xs">
              <p className="font-bold text-ifpb-dark uppercase">Aspectos Observados</p>
              {relatorio.relacionamentoOpcoes && relatorio.relacionamentoOpcoes.length > 0 && (
                <p>
                  <strong>Relacionamento:</strong> {relatorio.relacionamentoOpcoes.join(', ')}
                  {relatorio.relacionamentoOutros ? ` (${relatorio.relacionamentoOutros})` : ''}
                </p>
              )}
              {relatorio.habilidadesCognitivasOpcoes &&
                relatorio.habilidadesCognitivasOpcoes.length > 0 && (
                  <p>
                    <strong>Habilidades Cognitivas:</strong>{' '}
                    {relatorio.habilidadesCognitivasOpcoes.join(', ')}
                    {relatorio.habilidadesCognitivasOutros
                      ? ` (${relatorio.habilidadesCognitivasOutros})`
                      : ''}
                  </p>
                )}
              {relatorio.habilidadesSocioemocionaisOpcoes &&
                relatorio.habilidadesSocioemocionaisOpcoes.length > 0 && (
                  <p>
                    <strong>Habilidades Socioemocionais:</strong>{' '}
                    {relatorio.habilidadesSocioemocionaisOpcoes.join(', ')}
                    {relatorio.habilidadesSocioemocionaisOutros
                      ? ` (${relatorio.habilidadesSocioemocionaisOutros})`
                      : ''}
                  </p>
                )}
            </div>
          )}

          {relatorio.avancosGerais && (
            <div>
              <p className="text-xs font-bold text-ifpb-dark mb-1">Avanços Gerais no Período</p>
              <div className="p-3 rounded-lg border border-gray-200 bg-white text-xs text-gray-700 whitespace-pre-wrap">
                {relatorio.avancosGerais}
              </div>
            </div>
          )}

          {relatorio.dificuldadesAprendizagem && (
            <div>
              <p className="text-xs font-bold text-ifpb-dark mb-1">Dificuldades de Aprendizagem</p>
              <div className="p-3 rounded-lg border border-gray-200 bg-white text-xs text-gray-700 whitespace-pre-wrap">
                {relatorio.dificuldadesAprendizagem}
              </div>
            </div>
          )}

          {relatorio.habilidadesDesenvolvidas && relatorio.habilidadesDesenvolvidas.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-ifpb-dark">Habilidades e Competências Desenvolvidas</p>
              <ul className="space-y-2">
                {relatorio.habilidadesDesenvolvidas.map((h, idx) => (
                  <li
                    key={h.id ?? idx}
                    className="p-2.5 rounded-lg border border-gray-200 bg-gray-50 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-gray-800">{h.habilidadeDesenvolvida}</span>
                      <span className="px-2 py-0.5 rounded bg-ifpb-tealLight text-ifpb-teal font-bold text-[11px]">
                        {ROTULO_NIVEL_APRENDIZADO[h.nivelAprendizado] ?? h.nivelAprendizado}
                      </span>
                    </div>
                    {h.observacoes && <p className="text-gray-600">{h.observacoes}</p>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <p className="text-xs font-bold text-ifpb-dark mb-1">Parecer / Evidências</p>
            <div className="p-3 rounded-lg border border-gray-200 bg-white text-xs text-gray-700 whitespace-pre-wrap break-words leading-relaxed">
              {relatorio.parecer?.trim() ||
                relatorio.descricao?.trim() ||
                'Nenhuma descrição informada.'}
            </div>
          </div>

          {relatorio.assinaturaDocente && (
            <p className="text-xs text-gray-500 pt-1">
              <strong>Assinatura do(a) docente:</strong> {relatorio.assinaturaDocente}
              {relatorio.dataRelatorio ? ` • Data: ${relatorio.dataRelatorio}` : ''}
            </p>
          )}
        </div>
      )}
    </ModalBase>
  );
};
