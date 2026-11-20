import React, { useRef, useState, type FormEvent } from 'react';
import { AlertTriangle, FileUp, Lock, RotateCw, Upload } from 'lucide-react';
import { ModalBase } from './ModalBase';
import { AnexoService } from '../services/anexoService';
import { isProblem } from '../services/apiClient';
import {
  isAnexoSensivel,
  ROTULO_CLASSIFICACAO,
  type AnexoEstudanteDTO,
  type TipoClassificacaoAnexo,
} from '../types/anexo';

const TAMANHO_MAXIMO_BYTES = 10 * 1024 * 1024; // 10 MB

const OPCOES_CLASSIFICACAO: TipoClassificacaoAnexo[] = [
  'LAUDO_MEDICO',
  'DIAGNOSTICO_NEUROPSICOLOGICO',
  'DOCUMENTO_PEDAGOGICO',
];

function formatarTamanhoArquivo(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export interface ModalUploadAnexoProps {
  isOpen: boolean;
  onClose: () => void;
  alunoId: string;
  /** Quando informada, fixa a classificação do upload (ex.: LAUDO_MEDICO no Estudo de Caso). */
  classificacaoFixa?: TipoClassificacaoAnexo;
  onUploadSucesso: (anexo: AnexoEstudanteDTO) => void;
}

interface ConteudoModalProps extends Omit<ModalUploadAnexoProps, 'isOpen'> {
  onClose: () => void;
}

const ConteudoModalUploadAnexo: React.FC<ConteudoModalProps> = ({
  onClose,
  alunoId,
  classificacaoFixa,
  onUploadSucesso,
}) => {
  const [classificacao, setClassificacao] = useState<TipoClassificacaoAnexo | ''>(
    classificacaoFixa ?? '',
  );
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const classificacaoEfetiva = classificacaoFixa ?? classificacao;
  const documentoSensivel = Boolean(classificacaoEfetiva) && isAnexoSensivel(classificacaoEfetiva as TipoClassificacaoAnexo);

  const handleSelecionarArquivo = (file: File | null) => {
    setErro(null);
    if (!file) {
      setArquivo(null);
      return;
    }
    if (file.size === 0) {
      setArquivo(null);
      setErro('O arquivo selecionado está vazio.');
      return;
    }
    if (file.size > TAMANHO_MAXIMO_BYTES) {
      setArquivo(null);
      setErro('O arquivo excede o tamanho máximo permitido de 10 MB.');
      return;
    }
    setArquivo(file);
  };

  const handleSubmit = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    setErro(null);

    if (!classificacaoEfetiva) {
      setErro('Selecione a classificação do documento antes de enviar.');
      return;
    }
    if (!arquivo) {
      setErro('Selecione um arquivo (ex.: PDF) para enviar.');
      return;
    }

    setEnviando(true);
    try {
      const anexoCriado = await AnexoService.upload(
        alunoId,
        arquivo,
        classificacaoEfetiva as TipoClassificacaoAnexo,
      );
      onUploadSucesso(anexoCriado);
      onClose();
    } catch (err: unknown) {
      if (isProblem(err)) {
        setErro(err.detail || err.title || 'Não foi possível enviar o anexo.');
      } else {
        setErro('Falha ao enviar o arquivo. Verifique sua conexão e tente novamente.');
      }
    } finally {
      setEnviando(false);
    }
  };

  return (
    <ModalBase
      isOpen
      onClose={onClose}
      titulo={classificacaoFixa === 'LAUDO_MEDICO' ? 'Enviar Laudo Médico' : 'Enviar Anexo do Estudante'}
      subtitulo="Documentos médicos sensíveis são cifrados automaticamente em repouso (AES-256-GCM)"
      icone={<FileUp className="w-5 h-5" />}
      maxWidthClass="max-w-lg"
      isLoading={enviando}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={enviando}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="form-upload-anexo"
            disabled={enviando || !arquivo || !classificacaoEfetiva}
            className="inline-flex items-center justify-center gap-1.5 px-5 py-2 rounded-lg text-xs font-bold text-white bg-ifpb-teal hover:bg-ifpb-tealHover transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {enviando ? (
              <RotateCw className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            {enviando ? 'Enviando...' : 'Enviar Documento'}
          </button>
        </>
      }
    >
      <form id="form-upload-anexo" onSubmit={handleSubmit} className="space-y-4" noValidate>
        {erro && (
          <div
            role="alert"
            className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-800 flex items-start gap-2"
          >
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{erro}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <label
            htmlFor="select-classificacao-anexo"
            className="block text-xs font-bold text-ifpb-dark uppercase"
          >
            Classificação do Documento <span className="text-ifpb-red">*</span>
          </label>
          <select
            id="select-classificacao-anexo"
            value={classificacaoEfetiva}
            disabled={Boolean(classificacaoFixa) || enviando}
            required
            onChange={(e) => {
              setClassificacao(e.target.value as TipoClassificacaoAnexo | '');
              if (erro) setErro(null);
            }}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ifpb-teal/30 focus:border-ifpb-teal disabled:bg-gray-100 disabled:text-gray-600"
          >
            {!classificacaoFixa && <option value="">Selecione a classificação...</option>}
            {OPCOES_CLASSIFICACAO.map((opcao) => (
              <option key={opcao} value={opcao}>
                {ROTULO_CLASSIFICACAO[opcao]} ({opcao})
              </option>
            ))}
          </select>
        </div>

        {documentoSensivel && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 flex items-start gap-2">
            <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <span>
              <strong>Documento sensível (LGPD / TA11.1):</strong> este arquivo será criptografado com
              AES-256-GCM em repouso no servidor e protegido por controle estrito de acesso.
            </span>
          </div>
        )}

        <div className="space-y-1.5">
          <label
            htmlFor="input-arquivo-anexo"
            className="block text-xs font-bold text-ifpb-dark uppercase"
          >
            Arquivo <span className="text-ifpb-red">*</span>
          </label>
          <input
            ref={inputRef}
            id="input-arquivo-anexo"
            type="file"
            accept=".pdf,application/pdf,image/png,image/jpeg"
            disabled={enviando}
            onChange={(e) => handleSelecionarArquivo(e.target.files?.[0] ?? null)}
            className="block w-full text-xs text-gray-700 border border-gray-300 rounded-lg p-2 bg-gray-50 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-ifpb-teal file:text-white hover:file:bg-ifpb-tealHover cursor-pointer disabled:opacity-50"
          />
          <p className="text-[11px] text-gray-500">
            Formatos recomendados: PDF, PNG ou JPG (tamanho máximo: 10 MB).
          </p>
          {arquivo && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-xs text-emerald-900 flex items-center justify-between gap-2">
              <span className="truncate font-medium">{arquivo.name}</span>
              <span className="shrink-0 font-mono text-[11px] text-emerald-700">
                {formatarTamanhoArquivo(arquivo.size)}
              </span>
            </div>
          )}
        </div>
      </form>
    </ModalBase>
  );
};

export const ModalUploadAnexo: React.FC<ModalUploadAnexoProps> = ({ isOpen, ...props }) => {
  if (!isOpen) return null;
  return <ConteudoModalUploadAnexo {...props} />;
};
