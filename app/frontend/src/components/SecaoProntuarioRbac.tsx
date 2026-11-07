import React, { useEffect, useState } from 'react';
import { Download, FileLock2, FileText, HeartHandshake, Lock, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AnexoService, buscarProntuarioConsolidado } from '../services/anexoService';
import { notificarAcessoNegado } from '../services/authSessao';
import { isProblem } from '../services/apiClient';
import { isAnexoSensivel, ROTULO_CLASSIFICACAO, type AnexoEstudanteDTO } from '../types/anexo';
import type { ProntuarioConsolidadoDTO } from '../types/prontuario';

interface Props {
  alunoId: string;
}

function formatarTamanho(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Seção RBAC do Prontuário Unificado (US 09):
 * - TA11.3: históricos familiar/socioemocional só aparecem para Restrição Moderada ou superior
 *   E quando o back-end os enviou (chaves omitidas para ACESSO_FUNCIONAL).
 * - TA11.2: laudos sensíveis exibem cadeado e só baixam com SUPER_RESTRICAO + autorizacaoSaude.
 * Use `key={alunoId}` no pai para reiniciar o estado ao trocar de aluno.
 */
export const SecaoProntuarioRbac: React.FC<Props> = ({ alunoId }) => {
  const { podeAcessarDadosSensiveis, podeBaixarLaudo } = useAuth();
  const [prontuario, setProntuario] = useState<ProntuarioConsolidadoDTO | null>(null);
  const [anexos, setAnexos] = useState<AnexoEstudanteDTO[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [baixandoId, setBaixandoId] = useState<string | null>(null);

  useEffect(() => {
    const controlador = new AbortController();
    Promise.allSettled([
      buscarProntuarioConsolidado(alunoId, controlador.signal),
      AnexoService.listarPorAluno(alunoId, controlador.signal),
    ]).then(([resPront, resAnexos]) => {
      if (controlador.signal.aborted) return;
      if (resPront.status === 'fulfilled') setProntuario(resPront.value);
      if (resAnexos.status === 'fulfilled') setAnexos(resAnexos.value);
      if (resPront.status === 'rejected' && resAnexos.status === 'rejected') {
        const motivo = resPront.reason as unknown;
        setErro(isProblem(motivo) ? motivo.detail : 'Não foi possível carregar o prontuário.');
      }
      setCarregando(false);
    });
    return () => controlador.abort();
  }, [alunoId]);

  const baixar = async (anexo: AnexoEstudanteDTO) => {
    // TA11.2: bloqueio preventivo, sem sequer chamar a API.
    if (isAnexoSensivel(anexo.classificacao) && !podeBaixarLaudo) {
      notificarAcessoNegado();
      return;
    }
    setBaixandoId(anexo.id);
    try {
      await AnexoService.baixar(anexo);
    } catch {
      // 401/403 já tratados globalmente (logout / modal LGPD).
    } finally {
      setBaixandoId(null);
    }
  };

  // TA11.3: ocultação total (nenhum placeholder) quando sem permissão ou sem dados.
  const mostrarFamiliar = podeAcessarDadosSensiveis && !!prontuario?.historicoFamiliar;
  const mostrarSocioemocional = podeAcessarDadosSensiveis && !!prontuario?.historicoSocioemocional;

  return (
    <div className="space-y-6">
      {(mostrarFamiliar || mostrarSocioemocional) && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-4">
          <h3 className="text-sm font-bold text-ifpb-dark flex items-center">
            <Lock className="w-4 h-4 mr-2 text-ifpb-teal" />
            Históricos Sensíveis (acesso restrito)
          </h3>
          {mostrarFamiliar && (
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase flex items-center">
                <Users className="w-3.5 h-3.5 mr-1" /> Histórico Familiar
              </span>
              <p className="text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg p-3 mt-1 whitespace-pre-line">
                {prontuario?.historicoFamiliar}
              </p>
            </div>
          )}
          {mostrarSocioemocional && (
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase flex items-center">
                <HeartHandshake className="w-3.5 h-3.5 mr-1" /> Histórico Socioemocional
              </span>
              <p className="text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg p-3 mt-1 whitespace-pre-line">
                {prontuario?.historicoSocioemocional}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-3">
        <h3 className="text-sm font-bold text-ifpb-dark flex items-center">
          <FileText className="w-4 h-4 mr-2 text-ifpb-teal" />
          Anexos e Documentos
        </h3>

        {carregando && <p className="text-xs text-gray-500">Carregando anexos...</p>}
        {erro && !carregando && <p className="text-xs text-red-700">{erro}</p>}
        {!carregando && !erro && anexos.length === 0 && (
          <p className="text-xs text-gray-500">Nenhum anexo cadastrado para este estudante.</p>
        )}

        <ul className="divide-y divide-gray-100">
          {anexos.map((anexo) => {
            const sensivel = isAnexoSensivel(anexo.classificacao);
            const bloqueado = sensivel && !podeBaixarLaudo;
            return (
              <li key={anexo.id} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {bloqueado ? (
                    <FileLock2
                      className="w-5 h-5 text-red-600 shrink-0"
                      aria-label="Documento protegido por sigilo clínico"
                    />
                  ) : (
                    <FileText className="w-5 h-5 text-ifpb-teal shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{anexo.nomeOriginal}</p>
                    <p className="text-xs text-gray-500">
                      {ROTULO_CLASSIFICACAO[anexo.classificacao] ?? anexo.classificacao} &bull;{' '}
                      {formatarTamanho(anexo.tamanhoBytes)} &bull;{' '}
                      {new Date(anexo.criadoEm).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => baixar(anexo)}
                  disabled={baixandoId === anexo.id}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border shrink-0 cursor-pointer disabled:opacity-50 ${
                    bloqueado
                      ? 'text-red-700 bg-red-50 border-red-200 hover:bg-red-100'
                      : 'text-ifpb-teal border-ifpb-teal hover:bg-ifpb-tealLight'
                  }`}
                >
                  {bloqueado ? <Lock className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
                  {sensivel ? 'Visualizar/Baixar Laudo' : 'Baixar'}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};
