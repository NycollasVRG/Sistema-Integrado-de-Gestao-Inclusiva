import { useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Download,
  FileText,
  Pencil,
  RotateCcw,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import { baixarProvaAdaptada } from '../services/duaService';
import type {
  AdaptacaoDuaResponseDTO,
  DocumentoDuaDTO,
  QuestaoPreviewDua,
  StatusDecisaoDua,
} from '../types/dua';
import type { EstudanteResumo } from '../types/gestaoEstudantes';
import { formatarDataHora } from '../utils/indicacao';

interface PreviewAdaptacaoDuaProps {
  resposta: AdaptacaoDuaResponseDTO;
  estudante: EstudanteResumo;
  onNotificar: (tipo: 'sucesso' | 'erro' | 'alerta', titulo: string, mensagem: string) => void;
  onDescartar: () => void;
}

const ROTULO_STATUS: Record<StatusDecisaoDua, string> = {
  PENDENTE: 'Aguardando decisão',
  APROVADA: 'Aprovada',
  EDITADA: 'Editada e aprovada',
  REJEITADA: 'Adaptação rejeitada',
};

const CLASSE_STATUS: Record<StatusDecisaoDua, string> = {
  PENDENTE: 'bg-amber-50 text-amber-700 border-amber-200',
  APROVADA: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  EDITADA: 'bg-sky-50 text-sky-700 border-sky-200',
  REJEITADA: 'bg-gray-100 text-gray-600 border-gray-200',
};

/** TA7.3: nenhum documento é gerado antes de o professor revisar e aprovar o preview. */
export function PreviewAdaptacaoDua({
  resposta,
  estudante,
  onNotificar,
  onDescartar,
}: PreviewAdaptacaoDuaProps) {
  const [textoFinal, setTextoFinal] = useState(resposta.textoAdaptado);
  const [editandoTexto, setEditandoTexto] = useState(false);
  const [textoAprovado, setTextoAprovado] = useState(false);
  const [questoes, setQuestoes] = useState<QuestaoPreviewDua[]>(() =>
    resposta.questoesAdaptadas.map((questao) => ({
      ...questao,
      status: 'PENDENTE',
      textoFinal: questao.textoAdaptado,
      justificativaRejeicao: '',
    })),
  );
  const [editandoIndice, setEditandoIndice] = useState<number | null>(null);
  const [rascunhoEdicao, setRascunhoEdicao] = useState('');
  const [rejeitandoIndice, setRejeitandoIndice] = useState<number | null>(null);
  const [rascunhoJustificativa, setRascunhoJustificativa] = useState('');
  const [complexidadeConfirmada, setComplexidadeConfirmada] = useState(false);

  const pendentes = questoes.filter((questao) => questao.status === 'PENDENTE').length;
  const complexidadeAprovada = resposta.complexidadePreservada || complexidadeConfirmada;
  const podeBaixar = textoAprovado && pendentes === 0 && complexidadeAprovada;

  function atualizarQuestao(indice: number, alteracao: Partial<QuestaoPreviewDua>): void {
    setQuestoes((atual) =>
      atual.map((questao, posicao) => (posicao === indice ? { ...questao, ...alteracao } : questao)),
    );
  }

  function iniciarEdicaoTexto(): void {
    setTextoAprovado(false);
    setRascunhoEdicao(textoFinal);
    setEditandoTexto(true);
  }

  function salvarEdicaoTexto(): void {
    if (!rascunhoEdicao.trim()) return;
    setTextoFinal(rascunhoEdicao);
    setTextoAprovado(true);
    setEditandoTexto(false);
  }

  function aprovarTodas(): void {
    setQuestoes((atual) =>
      atual.map((questao) =>
        questao.status === 'PENDENTE' ? { ...questao, status: 'APROVADA' } : questao,
      ),
    );
    setTextoAprovado(true);
  }

  function salvarEdicaoQuestao(indice: number): void {
    if (!rascunhoEdicao.trim()) return;
    atualizarQuestao(indice, {
      status: 'EDITADA',
      textoFinal: rascunhoEdicao,
      justificativaRejeicao: '',
    });
    setEditandoIndice(null);
  }

  function confirmarRejeicao(indice: number): void {
    atualizarQuestao(indice, {
      status: 'REJEITADA',
      textoFinal: questoes[indice].enunciadoOriginal,
      justificativaRejeicao: rascunhoJustificativa.trim(),
    });
    setRejeitandoIndice(null);
  }

  function baixar(formato: 'html' | 'txt'): void {
    const documento: DocumentoDuaDTO = {
      estudante: {
        nome: estudante.nomeCompleto,
        matricula: estudante.matricula,
        curso: estudante.curso,
        turma: estudante.turma,
      },
      textoFinal,
      questoes,
      tagsAplicadas: resposta.tagsDificuldadeAplicadas,
      orientacoes: resposta.orientacoesAplicacao,
      complexidadePreservada: resposta.complexidadePreservada,
      geradoEm: resposta.geradoEm,
    };
    try {
      baixarProvaAdaptada(documento, formato);
      onNotificar(
        'sucesso',
        'Download iniciado',
        formato === 'html'
          ? 'Arquivo HTML gerado. Use o botão Imprimir para salvar como PDF.'
          : 'Arquivo TXT gerado com a prova aprovada.',
      );
    } catch (falha: unknown) {
      onNotificar(
        'erro',
        'Não foi possível gerar o arquivo',
        falha instanceof Error ? falha.message : 'Tente novamente em instantes.',
      );
    }
  }

  return (
    <section aria-labelledby="titulo-preview-dua" className="space-y-5">
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-[#0F6460] to-[#12534f] text-white px-6 py-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <FileText className="w-6 h-6 text-green-300 shrink-0 mt-0.5" />
              <div>
                <h2 id="titulo-preview-dua" className="text-xl font-bold tracking-tight">
                  Preview da prova adaptada
                </h2>
                <p className="text-xs text-green-100 mt-0.5">
                  Revise, aprove ou edite antes de gerar o documento final
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onDescartar}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Descartar preview
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-gray-500">
            <span>
              <strong className="text-ifpb-teal">Estudante:</strong> {estudante.nomeCompleto}
            </span>
            <span className="font-mono">{estudante.matricula}</span>
            <span>
              <strong className="text-ifpb-teal">Gerado em:</strong> {formatarDataHora(resposta.geradoEm)}
            </span>
          </div>

          <div className="bg-[#EEF1EC] border border-[#DDE5DB] rounded-lg px-4 py-3 text-xs text-ifpb-dark space-y-2">
            <p>
              <strong className="text-ifpb-teal">Tags consideradas pela IA:</strong>{' '}
              {resposta.tagsDificuldadeAplicadas.length
                ? resposta.tagsDificuldadeAplicadas.join(', ')
                : 'Nenhuma tag cadastrada para o estudante'}
            </p>
            {resposta.orientacoesAplicacao.length > 0 && (
              <div>
                <strong className="text-ifpb-teal">Orientações de aplicação:</strong>
                <ul className="list-disc pl-5 mt-1 space-y-0.5">
                  {resposta.orientacoesAplicacao.map((orientacao, indice) => (
                    <li key={`orientacao-${indice}`}>{orientacao}</li>
                  ))}
                </ul>
              </div>
            )}
            <p className="text-gray-600">
              Somente os nomes das tags cadastradas no estudante foram usados pela IA. Dados clínicos e
              identificadores pessoais não são enviados ao serviço de inteligência artificial.
            </p>
          </div>

          {!resposta.complexidadePreservada && (
            <div role="alert" className="bg-amber-50 border border-amber-300 rounded-lg p-4 space-y-3">
              <p className="flex items-start gap-2 text-sm text-amber-900">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>
                  <strong>Atenção:</strong> não foi possível confirmar que todos os dados e o nível de
                  complexidade da prova original foram preservados. Confira a versão adaptada antes de
                  aplicá-la.
                </span>
              </p>
              <label className="flex items-center gap-2 text-xs font-medium text-amber-900 cursor-pointer">
                <input
                  type="checkbox"
                  checked={complexidadeConfirmada}
                  onChange={(evento) => setComplexidadeConfirmada(evento.target.checked)}
                  className="h-4 w-4 accent-[#0F6460]"
                />
                Revisei manualmente e confirmo a versão final da prova
              </label>
            </div>
          )}

          <section aria-labelledby="titulo-texto-adaptado" className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 id="titulo-texto-adaptado" className="text-sm font-bold text-ifpb-dark">
                Texto completo da prova adaptada
              </h3>
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                  textoAprovado
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                {textoAprovado ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                {textoAprovado ? 'Aprovado' : 'Aguardando aprovação'}
              </span>
            </div>

            {editandoTexto ? (
              <div className="space-y-2">
                <label htmlFor="texto-final-dua" className="block text-xs font-medium text-gray-600">
                  Edição manual do texto final
                </label>
                <textarea
                  id="texto-final-dua"
                  value={rascunhoEdicao}
                  onChange={(evento) => setRascunhoEdicao(evento.target.value)}
                  rows={12}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm whitespace-pre-wrap focus:outline-none focus:ring-2 focus:ring-ifpb-teal/30 focus:border-ifpb-teal"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={salvarEdicaoTexto}
                    disabled={!rascunhoEdicao.trim()}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white bg-ifpb-teal hover:bg-ifpb-tealHover transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Salvar e aprovar edição
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditandoTexto(false)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-gray-600 border border-gray-300 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 whitespace-pre-wrap break-words text-sm text-gray-800 max-h-80 overflow-y-auto">
                  {textoFinal}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={iniciarEdicaoTexto}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-ifpb-teal border border-ifpb-teal/30 hover:bg-ifpb-tealLight transition-colors cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Editar manualmente
                  </button>
                  <button
                    type="button"
                    onClick={() => setTextoAprovado(true)}
                    disabled={textoAprovado}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white bg-ifpb-teal hover:bg-ifpb-tealHover transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Aprovar texto
                  </button>
                </div>
              </div>
            )}
          </section>

          {questoes.length > 0 && (
            <section aria-labelledby="titulo-questoes-dua" className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 id="titulo-questoes-dua" className="text-sm font-bold text-ifpb-dark">
                  Questões reestruturadas ({questoes.length})
                </h3>
                <button
                  type="button"
                  onClick={aprovarTodas}
                  disabled={pendentes === 0 && textoAprovado}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-ifpb-teal border border-ifpb-teal/30 hover:bg-ifpb-tealLight transition-colors cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Aprovar todas
                </button>
              </div>

              {questoes.map((questao, indice) => (
                <article
                  key={`questao-${questao.numero}-${indice}`}
                  className="rounded-lg border border-gray-200 overflow-hidden"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 bg-gray-50 px-4 py-2.5 border-b border-gray-200">
                    <h4 className="text-sm font-bold text-ifpb-dark">Questão {questao.numero}</h4>
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${CLASSE_STATUS[questao.status]}`}
                    >
                      {ROTULO_STATUS[questao.status]}
                    </span>
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="text-xs text-gray-500">
                      <strong>Comando destacado:</strong>{' '}
                      <span className="font-semibold text-ifpb-teal">{questao.comandoDestacado || '—'}</span>
                    </div>
                    {questao.enunciadoFragmentado.length > 0 && (
                      <ol className="list-decimal pl-5 text-xs text-gray-600 space-y-0.5">
                        {questao.enunciadoFragmentado.map((fragmento, posicao) => (
                          <li key={`fragmento-${posicao}`}>{fragmento}</li>
                        ))}
                      </ol>
                    )}
                    {questao.adaptacoesVisuaisAplicadas.length > 0 && (
                      <p className="text-xs text-gray-500">
                        <strong>Recursos visuais:</strong>{' '}
                        {questao.adaptacoesVisuaisAplicadas.join(', ')}
                      </p>
                    )}

                    {editandoIndice === indice ? (
                      <div className="space-y-2">
                        <label
                          htmlFor={`questao-edicao-${indice}`}
                          className="block text-xs font-medium text-gray-600"
                        >
                          Editar texto da questão {questao.numero}
                        </label>
                        <textarea
                          id={`questao-edicao-${indice}`}
                          value={rascunhoEdicao}
                          onChange={(evento) => setRascunhoEdicao(evento.target.value)}
                          rows={6}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm whitespace-pre-wrap focus:outline-none focus:ring-2 focus:ring-ifpb-teal/30 focus:border-ifpb-teal"
                        />
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => salvarEdicaoQuestao(indice)}
                            disabled={!rascunhoEdicao.trim()}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-ifpb-teal hover:bg-ifpb-tealHover transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <Save className="w-3.5 h-3.5" />
                            Salvar e aprovar edição
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditandoIndice(null)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 border border-gray-300 hover:bg-gray-50 transition-colors cursor-pointer"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 whitespace-pre-wrap break-words text-sm text-gray-800">
                        {questao.textoFinal}
                      </div>
                    )}

                    {rejeitandoIndice === indice && (
                      <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
                        <label
                          htmlFor={`questao-justificativa-${indice}`}
                          className="block text-xs font-medium text-gray-600"
                        >
                          Motivo da rejeição (opcional)
                        </label>
                        <textarea
                          id={`questao-justificativa-${indice}`}
                          value={rascunhoJustificativa}
                          onChange={(evento) => setRascunhoJustificativa(evento.target.value)}
                          rows={2}
                          placeholder="Ex.: a adaptação alterou dados da questão"
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ifpb-teal/30 focus:border-ifpb-teal"
                        />
                        <button
                          type="button"
                          onClick={() => confirmarRejeicao(indice)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-gray-700 hover:bg-gray-800 transition-colors cursor-pointer"
                        >
                          Confirmar rejeição
                        </button>
                      </div>
                    )}

                    {editandoIndice !== indice && (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            atualizarQuestao(indice, {
                              status: 'APROVADA',
                              justificativaRejeicao: '',
                              textoFinal: questao.status === 'REJEITADA' ? questao.enunciadoOriginal : questao.textoFinal,
                            })
                          }
                          disabled={questao.status === 'APROVADA'}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-ifpb-teal hover:bg-ifpb-tealHover transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Aprovar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditandoIndice(indice);
                            setRascunhoEdicao(questao.textoFinal);
                            setRejeitandoIndice(null);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-ifpb-teal border border-ifpb-teal/30 hover:bg-ifpb-tealLight transition-colors cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRejeitandoIndice(indice);
                            setRascunhoJustificativa(questao.justificativaRejeicao);
                            setEditandoIndice(null);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 border border-gray-300 hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          Rejeitar adaptação
                        </button>
                        {questao.status === 'REJEITADA' && (
                          <button
                          type="button"
                          onClick={() =>
                            atualizarQuestao(indice, {
                              status: 'PENDENTE',
                              textoFinal: questao.textoAdaptado,
                              justificativaRejeicao: '',
                            })
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 border border-gray-300 hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Desfazer rejeição
                        </button>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </section>
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="text-xs text-gray-600" aria-live="polite">
          {podeBaixar ? (
            <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
              Revisão concluída: documento liberado para download
            </span>
          ) : (
            <span>
              <strong className="text-amber-700">Aguardando revisão:</strong>{' '}
              {[
                !textoAprovado ? 'aprovar o texto completo' : '',
                pendentes > 0 ? `decidir sobre ${pendentes} questão(ões)` : '',
                !complexidadeAprovada ? 'confirmar a complexidade' : '',
              ]
                .filter(Boolean)
                .join(' • ')}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => baixar('txt')}
            disabled={!podeBaixar}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-ifpb-teal border border-ifpb-teal/30 hover:bg-ifpb-tealLight transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Baixar TXT
          </button>
          <button
            type="button"
            onClick={() => baixar('html')}
            disabled={!podeBaixar}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-ifpb-teal hover:bg-ifpb-tealHover transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FileText className="w-4 h-4" />
            Baixar HTML para imprimir/PDF
          </button>
        </div>
      </div>
    </section>
  );
}
