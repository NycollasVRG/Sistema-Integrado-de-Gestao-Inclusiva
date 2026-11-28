import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  FileUp,
  Plus,
  RotateCw,
  Save,
  ScrollText,
  ShieldCheck,
  Trash2,
  Users,
} from 'lucide-react';
import { ModalBase } from './ModalBase';
import { AtaService } from '../services/ataService';
import { isProblem } from '../services/apiClient';
import { useAuth } from '../contexts/AuthContext';
import type { AlunoModalData } from '../types/prontuarioAcoes';
import type {
  AtaReuniaoResponseDTO,
  AtaReuniaoUpdateDTO,
  TipoReuniao,
} from '../types/ata';
import {
  EXTENSOES_DOCUMENTO_ATA,
  ROTULO_TIPO_REUNIAO,
  TAMANHO_MAXIMO_DOCUMENTO_ATA_BYTES,
} from '../types/ata';

export type AcaoAta = 'CRIADO' | 'ATUALIZADO' | 'DOCUMENTO' | 'ASSINATURAS' | 'FINALIZADO';

interface ModalAtaProps {
  isOpen: boolean;
  onClose: () => void;
  aluno: AlunoModalData;
  /** Rascunho existente a ser continuado; atas finalizadas devem abrir o detalhe, não este modal. */
  ataExistente?: AtaReuniaoResponseDTO | null;
  onSuccess: (ata: AtaReuniaoResponseDTO, acao: AcaoAta) => void | Promise<void>;
}

interface CompromissoLinha {
  chave: string;
  descricao: string;
  responsavelId: string;
  responsavelNome: string;
  prazo: string;
}

interface ParticipanteLinha {
  chave: string;
  tipo: 'INTERNO' | 'EXTERNO';
  nomeParticipante: string;
  papelParticipante: string;
  usuarioId: string;
}

type Operacao = 'SALVAR' | 'DOCUMENTO' | 'ASSINATURAS' | 'FINALIZAR' | null;

let contadorLinhas = 0;
function novaChave(): string {
  contadorLinhas += 1;
  return `linha-${contadorLinhas}`;
}

function agoraInput(): string {
  const agora = new Date();
  const dois = (n: number) => String(n).padStart(2, '0');
  return `${agora.getFullYear()}-${dois(agora.getMonth() + 1)}-${dois(agora.getDate())}T${dois(agora.getHours())}:${dois(agora.getMinutes())}`;
}

function paraInputDataHora(valor?: string | null): string {
  return valor && valor.length >= 16 ? valor.slice(0, 16) : '';
}

function mensagemErro(e: unknown, fallback: string): string {
  if (isProblem(e)) {
    if (e.termoAditivoUri) {
      return `${e.detail || e.title}. Esta ata não pode mais ser alterada: use "Emitir Termo Aditivo".`;
    }
    return e.detail || e.title || fallback;
  }
  return fallback;
}

function formatarTamanho(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Registro completo da ata em etapas: dados + compromissos -> rascunho salvo ->
 * documento assinado e/ou assinaturas digitais -> finalização (TA8.1 / TA8.4).
 */
export const ModalAta: React.FC<ModalAtaProps> = ({
  isOpen,
  onClose,
  aluno,
  ataExistente = null,
  onSuccess,
}) => {
  const { sessao } = useAuth();
  const usuarioId = sessao?.userId ?? '';
  const nomeUsuario = sessao?.nome ?? 'Usuário logado';

  const [ataAtual, setAtaAtual] = useState<AtaReuniaoResponseDTO | null>(ataExistente);
  const [tipoReuniao, setTipoReuniao] = useState<TipoReuniao>(
    ataExistente?.tipoReuniao ?? 'PEDAGOGICA',
  );
  const [dataReuniao, setDataReuniao] = useState(
    paraInputDataHora(ataExistente?.dataReuniao) || agoraInput(),
  );
  const [localReuniao, setLocalReuniao] = useState(ataExistente?.localReuniao ?? '');
  const [pauta, setPauta] = useState(ataExistente?.pauta ?? '');
  const [deliberacoes, setDeliberacoes] = useState(ataExistente?.deliberacoes ?? '');

  const [compromissos, setCompromissos] = useState<CompromissoLinha[]>(() =>
    (ataExistente?.compromissos ?? []).map((c) => ({
      chave: novaChave(),
      descricao: c.descricao,
      responsavelId: c.responsavelId ?? usuarioId,
      responsavelNome: c.responsavelNome ?? nomeUsuario,
      prazo: c.prazo,
    })),
  );
  const [participantes, setParticipantes] = useState<ParticipanteLinha[]>([]);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [operacao, setOperacao] = useState<Operacao>(null);

  // Assinaturas congelam o hash do conteúdo; alterar os campos originais invalida a coleta.
  const assinaturasColetadas = (ataAtual?.assinaturas.length ?? 0) > 0;
  const podeEditarCampos = !ataAtual || ataAtual.status === 'RASCUNHO' && !assinaturasColetadas;
  const podeFinalizar =
    !!ataAtual &&
    ataAtual.status === 'RASCUNHO' &&
    (ataAtual.documentoAssinadoAnexado || assinaturasColetadas);

  const atualizarCompromisso = (chave: string, campo: keyof CompromissoLinha, valor: string) => {
    setCompromissos((prev) =>
      prev.map((item) => (item.chave === chave ? { ...item, [campo]: valor } : item)),
    );
  };

  const atualizarParticipante = (chave: string, campo: keyof ParticipanteLinha, valor: string) => {
    setParticipantes((prev) =>
      prev.map((item) => (item.chave === chave ? { ...item, [campo]: valor } : item)),
    );
  };

  const trocarTipoParticipante = (chave: string, tipo: 'INTERNO' | 'EXTERNO') => {
    setParticipantes((prev) =>
      prev.map((item) =>
        item.chave === chave
          ? {
              ...item,
              tipo,
              usuarioId: tipo === 'INTERNO' ? usuarioId : '',
              nomeParticipante: tipo === 'INTERNO' ? nomeUsuario : '',
            }
          : item,
      ),
    );
  };

  const validarCampos = (): string | null => {
    if (!tipoReuniao) return 'Selecione o tipo de reunião.';
    if (!dataReuniao) return 'Informe a data e a hora da reunião.';
    if (!pauta.trim()) return 'A pauta da reunião é obrigatória.';
    if (localReuniao.length > 255) return 'O local da reunião deve ter no máximo 255 caracteres.';
    for (const item of compromissos) {
      if (!item.descricao.trim()) return 'Descreva todos os compromissos adicionados.';
      if (!item.responsavelId) return 'Selecione o responsável de cada compromisso.';
      if (!item.prazo) return 'Informe o prazo de todos os compromissos.';
    }
    return null;
  };

  const dadosAta = (): AtaReuniaoUpdateDTO => ({
    tipoReuniao,
    dataReuniao: dataReuniao.length === 16 ? `${dataReuniao}:00` : dataReuniao,
    localReuniao: localReuniao.trim() || null,
    pauta: pauta.trim(),
    deliberacoes: deliberacoes.trim() || null,
    compromissos: compromissos.map((c) => ({
      descricao: c.descricao.trim(),
      responsavelId: c.responsavelId,
      prazo: c.prazo,
    })),
  });

  const salvarRascunho = async () => {
    const invalido = validarCampos();
    if (invalido) {
      setErro(invalido);
      return;
    }
    setErro(null);
    setOperacao('SALVAR');
    try {
      const dto = dadosAta();
      const salva = ataAtual
        ? await AtaService.atualizar(ataAtual.id, dto)
        : await AtaService.criar({ alunoId: aluno.id, ...dto });
      setAtaAtual(salva);
      await onSuccess(salva, ataAtual ? 'ATUALIZADO' : 'CRIADO');
    } catch (e: unknown) {
      setErro(mensagemErro(e, 'Não foi possível salvar o rascunho da ata.'));
    } finally {
      setOperacao(null);
    }
  };

  const selecionarArquivo = (evento: React.ChangeEvent<HTMLInputElement>) => {
    const selecionado = evento.target.files?.[0] ?? null;
    setErro(null);
    if (!selecionado) {
      setArquivo(null);
      return;
    }
    const tiposAceitos = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!tiposAceitos.includes(selecionado.type)) {
      setArquivo(null);
      setErro('O documento assinado deve ser um PDF, PNG ou JPG.');
      return;
    }
    if (selecionado.size === 0 || selecionado.size > TAMANHO_MAXIMO_DOCUMENTO_ATA_BYTES) {
      setArquivo(null);
      setErro('O documento deve ter entre 1 byte e 10 MB.');
      return;
    }
    setArquivo(selecionado);
  };

  const enviarDocumento = async () => {
    if (!ataAtual || !arquivo) return;
    setErro(null);
    setOperacao('DOCUMENTO');
    try {
      const atualizada = await AtaService.anexarDocumentoAssinado(ataAtual.id, arquivo);
      setAtaAtual(atualizada);
      setArquivo(null);
      await onSuccess(atualizada, 'DOCUMENTO');
    } catch (e: unknown) {
      setErro(mensagemErro(e, 'Não foi possível anexar o documento assinado.'));
    } finally {
      setOperacao(null);
    }
  };

  const coletarAssinaturas = async () => {
    if (!ataAtual) return;
    if (participantes.length === 0) {
      setErro('Adicione ao menos um participante para coletar assinaturas digitais.');
      return;
    }
    if (participantes.some((p) => !p.nomeParticipante.trim() || !p.papelParticipante.trim())) {
      setErro('Informe o nome e o papel de todos os participantes.');
      return;
    }
    setErro(null);
    setOperacao('ASSINATURAS');
    try {
      const atualizada = await AtaService.registrarAssinaturas(ataAtual.id, {
        assinaturas: participantes.map((p) => ({
          nomeParticipante: p.nomeParticipante.trim(),
          papelParticipante: p.papelParticipante.trim(),
          usuarioId: p.usuarioId || null,
        })),
      });
      setAtaAtual(atualizada);
      await onSuccess(atualizada, 'ASSINATURAS');
    } catch (e: unknown) {
      setErro(mensagemErro(e, 'Não foi possível registrar as assinaturas digitais.'));
    } finally {
      setOperacao(null);
    }
  };

  const finalizar = async () => {
    if (!ataAtual) return;
    setErro(null);
    setOperacao('FINALIZAR');
    try {
      const finalizada = await AtaService.finalizar(ataAtual.id);
      setAtaAtual(finalizada);
      await onSuccess(finalizada, 'FINALIZADO');
      onClose();
    } catch (e: unknown) {
      setErro(mensagemErro(e, 'Não foi possível finalizar a ata.'));
    } finally {
      setOperacao(null);
    }
  };

  const ocupado = operacao !== null;
  const rotuloBotaoSalvar = operacao === 'SALVAR' ? 'Salvando...' : ataAtual ? 'Salvar Alterações' : 'Salvar Rascunho';

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={() => {
        if (!ocupado) onClose();
      }}
      isLoading={ocupado}
      maxWidthClass="max-w-4xl"
      titulo={ataAtual ? 'Atas de Reunião — Continuar Rascunho' : 'Registrar Ata de Reunião'}
      subtitulo={`Estudante: ${aluno.nome} • ${aluno.matricula}`}
      icone={<ScrollText className="w-5 h-5" />}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={ocupado}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer disabled:opacity-50"
          >
            Fechar
          </button>
          {podeEditarCampos && (
            <button
              type="submit"
              form="form-ata-dados"
              disabled={ocupado || !usuarioId}
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2 rounded-lg text-xs font-bold text-white bg-ifpb-teal hover:bg-ifpb-tealHover transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {operacao === 'SALVAR' ? <RotateCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {rotuloBotaoSalvar}
            </button>
          )}
          {podeFinalizar && (
            <button
              type="button"
              onClick={() => void finalizar()}
              disabled={ocupado}
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2 rounded-lg text-xs font-bold text-white bg-ifpb-green hover:bg-green-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="w-4 h-4" />
              Finalizar Ata
            </button>
          )}
        </>
      }
    >
      {erro && (
        <div role="alert" className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-800 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span className="whitespace-pre-wrap break-words">{erro}</span>
        </div>
      )}

      {!usuarioId && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
          Não foi possível identificar o usuário da sessão. Os compromissos exigem um responsável válido.
        </div>
      )}

      {assinaturasColetadas && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Assinaturas digitais já coletadas: os campos originais ficam bloqueados para preservar o
            hash de integridade. Finalize a ata sem alterá-los; depois use o Termo Aditivo para
            registrar ajustes.
          </span>
        </div>
      )}

      <form id="form-ata-dados" onSubmit={(e) => { e.preventDefault(); void salvarRascunho(); }} className="space-y-4">
        <fieldset disabled={!podeEditarCampos || ocupado} className="space-y-4 disabled:opacity-70">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="space-y-1">
              <span className="block text-xs font-bold uppercase text-ifpb-dark">Tipo de reunião</span>
              <select
                value={tipoReuniao}
                onChange={(e) => setTipoReuniao(e.target.value as TipoReuniao)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white"
              >
                {(Object.keys(ROTULO_TIPO_REUNIAO) as TipoReuniao[]).map((tipo) => (
                  <option key={tipo} value={tipo}>{ROTULO_TIPO_REUNIAO[tipo]}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="block text-xs font-bold uppercase text-ifpb-dark">Data e hora da reunião</span>
              <input
                type="datetime-local"
                value={dataReuniao}
                onChange={(e) => setDataReuniao(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white"
              />
            </label>
          </div>

          <label className="block space-y-1">
            <span className="block text-xs font-bold uppercase text-ifpb-dark">Local da reunião</span>
            <input
              type="text"
              maxLength={255}
              value={localReuniao}
              onChange={(e) => setLocalReuniao(e.target.value)}
              placeholder="Ex.: Sala de coordenação do CLAI"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>

          <label className="block space-y-1">
            <span className="block text-xs font-bold uppercase text-ifpb-dark">Pauta <span className="text-ifpb-red">*</span></span>
            <textarea
              value={pauta}
              onChange={(e) => setPauta(e.target.value)}
              rows={3}
              placeholder="Temas tratados na reunião"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm resize-y"
            />
          </label>

          <label className="block space-y-1">
            <span className="block text-xs font-bold uppercase text-ifpb-dark">Deliberações</span>
            <textarea
              value={deliberacoes}
              onChange={(e) => setDeliberacoes(e.target.value)}
              rows={3}
              placeholder="Encaminhamentos e decisões registradas"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm resize-y"
            />
          </label>

          <div className="rounded-lg border border-gray-200 p-3 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <p className="text-xs font-bold text-ifpb-dark">Compromissos e prazos</p>
                <p className="text-[11px] text-gray-500">O responsável é o usuário que registra a ata.</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setCompromissos((prev) => [
                    ...prev,
                    { chave: novaChave(), descricao: '', responsavelId: usuarioId, responsavelNome: nomeUsuario, prazo: '' },
                  ])
                }
                className="inline-flex items-center gap-1 text-[11px] font-bold text-ifpb-teal hover:underline cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar compromisso
              </button>
            </div>

            {compromissos.length === 0 && (
              <p className="text-xs text-gray-500">Nenhum compromisso adicionado.</p>
            )}

            {compromissos.map((item, indice) => (
              <div key={item.chave} className="grid grid-cols-1 sm:grid-cols-[1fr_150px_130px_auto] gap-2 items-end rounded-md bg-gray-50 p-2">
                <label className="space-y-1">
                  <span className="block text-[10px] font-bold uppercase text-gray-600">Compromisso {indice + 1}</span>
                  <input
                    type="text"
                    value={item.descricao}
                    onChange={(e) => atualizarCompromisso(item.chave, 'descricao', e.target.value)}
                    placeholder="O que foi acordado"
                    className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs"
                  />
                </label>
                <label className="space-y-1">
                  <span className="block text-[10px] font-bold uppercase text-gray-600">Responsável</span>
                  <input
                    type="text"
                    value={item.responsavelNome}
                    readOnly
                    title={item.responsavelId}
                    className="w-full rounded border border-gray-200 bg-gray-100 px-2 py-1.5 text-xs text-gray-600"
                  />
                </label>
                <label className="space-y-1">
                  <span className="block text-[10px] font-bold uppercase text-gray-600">Prazo</span>
                  <input
                    type="date"
                    value={item.prazo}
                    onChange={(e) => atualizarCompromisso(item.chave, 'prazo', e.target.value)}
                    className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setCompromissos((prev) => prev.filter((c) => c.chave !== item.chave))}
                  aria-label={`Remover compromisso ${indice + 1}`}
                  className="p-1.5 rounded text-red-600 hover:bg-red-50 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </fieldset>
      </form>

      {ataAtual && (
        <div className="border-t border-gray-200 pt-4 space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${
                ataAtual.status === 'FINALIZADA'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}>
                {ataAtual.status === 'FINALIZADA' ? 'Finalizada' : 'Rascunho salvo'}
              </span>
              <span className="text-[11px] text-gray-500">ID: {ataAtual.id.slice(0, 8)}</span>
            </div>
            <p className="text-[11px] text-gray-500">
              {ataAtual.compromissos.length} compromisso(s) • {ataAtual.assinaturas.length} assinatura(s)
            </p>
          </div>

          {ataAtual.status === 'RASCUNHO' && (
            <>
              <div className="rounded-lg border border-gray-200 p-3 space-y-3">
                <div className="flex items-center gap-2">
                  <FileUp className="w-4 h-4 text-ifpb-teal" />
                  <p className="text-xs font-bold text-ifpb-dark">Documento assinado (PDF, PNG ou JPG)</p>
                </div>
                {ataAtual.documentoAssinadoAnexado && (
                  <p className="text-[11px] text-emerald-700">
                    Anexado: {ataAtual.documentoNomeOriginal || 'documento'} ({formatarTamanho(ataAtual.documentoTamanhoBytes ?? 0)})
                  </p>
                )}
                <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                  <input
                    type="file"
                    accept={EXTENSOES_DOCUMENTO_ATA}
                    onChange={selecionarArquivo}
                    disabled={ocupado}
                    className="text-xs max-w-full"
                  />
                  <button
                    type="button"
                    onClick={() => void enviarDocumento()}
                    disabled={!arquivo || ocupado}
                    className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-ifpb-teal hover:bg-ifpb-tealHover transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {operacao === 'DOCUMENTO' ? 'Enviando...' : 'Anexar documento'}
                  </button>
                </div>
                <p className="text-[11px] text-gray-500">
                  O arquivo é armazenado com proteção e pode ser baixado no detalhe da ata.
                </p>
              </div>

              <div className="rounded-lg border border-gray-200 p-3 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-ifpb-teal" />
                    <p className="text-xs font-bold text-ifpb-dark">Participantes e assinaturas digitais</p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setParticipantes((prev) => [
                        ...prev,
                        { chave: novaChave(), tipo: 'INTERNO', nomeParticipante: nomeUsuario, papelParticipante: '', usuarioId },
                      ])
                    }
                    disabled={ocupado}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-ifpb-teal hover:underline cursor-pointer disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar participante
                  </button>
                </div>

                {participantes.length === 0 && (
                  <p className="text-[11px] text-gray-500">
                    Cadastre os presentes na reunião e registre as assinaturas em uma única etapa. IPs e hashes são auditados pelo backend.
                  </p>
                )}

                {participantes.map((p, indice) => (
                  <div key={p.chave} className="grid grid-cols-1 sm:grid-cols-[130px_1fr_130px_auto] gap-2 items-end rounded-md bg-gray-50 p-2">
                    <label className="space-y-1">
                      <span className="block text-[10px] font-bold uppercase text-gray-600">Participante {indice + 1}</span>
                      <select
                        value={p.tipo}
                        onChange={(e) => trocarTipoParticipante(p.chave, e.target.value as 'INTERNO' | 'EXTERNO')}
                        className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs"
                      >
                        <option value="INTERNO">Interno</option>
                        <option value="EXTERNO">Externo</option>
                      </select>
                    </label>
                    <label className="space-y-1">
                      <span className="block text-[10px] font-bold uppercase text-gray-600">Nome</span>
                      <input
                        type="text"
                        value={p.nomeParticipante}
                        onChange={(e) => atualizarParticipante(p.chave, 'nomeParticipante', e.target.value)}
                        placeholder="Nome do participante"
                        className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="block text-[10px] font-bold uppercase text-gray-600">Papel</span>
                      <input
                        type="text"
                        value={p.papelParticipante}
                        onChange={(e) => atualizarParticipante(p.chave, 'papelParticipante', e.target.value)}
                        placeholder="Ex.: Coordenação"
                        className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setParticipantes((prev) => prev.filter((item) => item.chave !== p.chave))}
                      aria-label={`Remover participante ${indice + 1}`}
                      className="p-1.5 rounded text-red-600 hover:bg-red-50 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => void coletarAssinaturas()}
                    disabled={participantes.length === 0 || ocupado}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white bg-ifpb-teal hover:bg-ifpb-tealHover transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    {operacao === 'ASSINATURAS' ? 'Registrando...' : 'Coletar assinaturas digitais'}
                  </button>
                </div>
              </div>

              {!podeFinalizar && (
                <p className="text-[11px] text-gray-500">
                  Para finalizar, anexe o documento assinado ou registre ao menos uma assinatura digital.
                </p>
              )}
            </>
          )}

          {ataAtual.status === 'FINALIZADA' && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
              Ata finalizada em {new Date(ataAtual.finalizadaEm || ataAtual.criadoEm).toLocaleString('pt-BR')}. Os campos originais são somente leitura; use o Termo Aditivo na seção de atas para registrar ajustes.
            </div>
          )}
        </div>
      )}
    </ModalBase>
  );
};
