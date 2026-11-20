import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Download,
  FileText,
  Lock,
  RotateCw,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AnexoService } from '../services/anexoService';
import { isProblem } from '../services/apiClient';
import { ROTULO_ROLE, type Role } from '../types/auth';
import type { AnexoEstudanteDTO } from '../types/anexo';
import { ModalUploadAnexo } from './ModalUploadAnexo';

/** Cargos do sistema gerenciáveis dinamicamente pela Coordenação da CLAI (COORDENADOR tem acesso fixo). */
const CARGOS_GERENCIAVEIS: Role[] = [
  'ADMIN',
  'CLAI_PSICOPEDAGOGO',
  'PROFESSOR',
  'ALUNO_APOIADOR',
];

function formatarTamanho(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export interface PainelLaudosMedicosEstudoCasoProps {
  alunoId: string;
}

/**
 * Painel de Laudos Médicos (LAUDO_MEDICO) integrado ao Estudo de Caso.
 * - Exibe apenas os laudos médicos autorizados para o cargo do usuário (filtrados pelo backend).
 * - Somente o Coordenador(a) da CLAI visualiza os controles de liberação/revogação por cargo
 *   e o atalho para anexar novo Laudo Médico.
 * Use `key={alunoId}` no pai para reiniciar o estado ao trocar de estudante.
 */
export const PainelLaudosMedicosEstudoCaso: React.FC<PainelLaudosMedicosEstudoCasoProps> = ({
  alunoId,
}) => {
  const { isCoordenador } = useAuth();
  const [laudos, setLaudos] = useState<AnexoEstudanteDTO[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [baixandoId, setBaixandoId] = useState<string | null>(null);
  const [salvandoPermissaoId, setSalvandoPermissaoId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [erroAcao, setErroAcao] = useState<string | null>(null);
  const [modalUploadAberto, setModalUploadAberto] = useState(false);

  useEffect(() => {
    const controlador = new AbortController();
    AnexoService.listarLaudosMedicos(alunoId, controlador.signal)
      .then((lista) => {
        if (controlador.signal.aborted) return;
        setLaudos(lista);
      })
      .catch((err: unknown) => {
        if (controlador.signal.aborted) return;
        setErro(
          isProblem(err)
            ? err.detail || 'Não foi possível carregar os laudos médicos.'
            : 'Não foi possível carregar os laudos médicos.',
        );
      })
      .finally(() => {
        if (!controlador.signal.aborted) setCarregando(false);
      });

    return () => controlador.abort();
  }, [alunoId]);

  const handleBaixarLaudo = async (laudo: AnexoEstudanteDTO) => {
    setErroAcao(null);
    setBaixandoId(laudo.id);
    try {
      await AnexoService.baixar(laudo);
    } catch (err: unknown) {
      setErroAcao(
        isProblem(err)
          ? err.detail || `Não foi possível baixar "${laudo.nomeOriginal}".`
          : `Falha ao baixar "${laudo.nomeOriginal}". Verifique sua conexão e permissões.`,
      );
    } finally {
      setBaixandoId(null);
    }
  };

  const handleAlternarCargo = async (laudo: AnexoEstudanteDTO, cargo: Role, liberar: boolean) => {
    if (!isCoordenador) return;
    setErroAcao(null);
    setFeedback(null);

    const atuais = laudo.rolesPermitidas ?? [];
    const proximoConjunto = liberar
      ? Array.from(new Set([...atuais, cargo]))
      : atuais.filter((item) => item !== cargo);

    setSalvandoPermissaoId(laudo.id);
    try {
      const atualizado = await AnexoService.atualizarPermissoesLaudo(laudo.id, proximoConjunto);
      setLaudos((prev) => prev.map((item) => (item.id === atualizado.id ? atualizado : item)));
      setFeedback(
        liberar
          ? `Acesso liberado para "${ROTULO_ROLE[cargo]}" no laudo "${laudo.nomeOriginal}".`
          : `Acesso revogado para "${ROTULO_ROLE[cargo]}" no laudo "${laudo.nomeOriginal}".`,
      );
    } catch (err: unknown) {
      setErroAcao(
        isProblem(err)
          ? err.detail || 'Não foi possível atualizar as permissões do laudo.'
          : 'Erro inesperado ao atualizar as permissões de visualização.',
      );
    } finally {
      setSalvandoPermissaoId(null);
    }
  };

  const handleUploadSucesso = (novoLaudo: AnexoEstudanteDTO) => {
    setLaudos((prev) => [novoLaudo, ...prev.filter((item) => item.id !== novoLaudo.id)]);
    setErro(null);
    setErroAcao(null);
    setFeedback(
      `Laudo médico "${novoLaudo.nomeOriginal}" anexado e cifrado com sucesso. Por padrão, apenas a Coordenação da CLAI tem acesso até que outros cargos sejam liberados.`,
    );
  };

  return (
    <section
      aria-labelledby="titulo-laudos-estudo-caso"
      className="border-t border-gray-200 bg-gray-50/40 px-6 sm:px-8 py-6 space-y-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3
            id="titulo-laudos-estudo-caso"
            className="text-sm font-bold text-ifpb-dark flex items-center gap-2"
          >
            <ShieldCheck className="w-4 h-4 text-ifpb-teal shrink-0" />
            <span>Laudos Médicos Vinculados ao Estudo de Caso</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-900 border border-amber-200">
              <Lock className="w-3 h-3 mr-1" />
              Sigilo LGPD
            </span>
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {isCoordenador
              ? 'Por padrão, apenas a Coordenação da CLAI visualiza e baixa Laudos Médicos. Selecione abaixo quais cargos podem acessar cada documento.'
              : 'Exibe exclusivamente os Laudos Médicos cuja visualização foi liberada para o seu cargo pela Coordenação da CLAI.'}
          </p>
        </div>

        {isCoordenador && (
          <button
            type="button"
            onClick={() => {
              setFeedback(null);
              setErroAcao(null);
              setModalUploadAberto(true);
            }}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold text-white bg-ifpb-teal hover:bg-ifpb-tealHover shadow-2xs transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Upload className="w-3.5 h-3.5" />
            Anexar Laudo Médico
          </button>
        )}
      </div>

      {feedback && (
        <p
          role="status"
          className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </p>
      )}

      {erroAcao && (
        <p role="alert" className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
          {erroAcao}
        </p>
      )}

      {carregando && (
        <div className="flex items-center gap-2.5 py-4 text-xs text-gray-500">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-ifpb-teal" />
          <span>Carregando laudos médicos...</span>
        </div>
      )}

      {erro && !carregando && (
        <p role="alert" className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
          {erro}
        </p>
      )}

      {!carregando && !erro && laudos.length === 0 && (
        <div className="bg-white border border-dashed border-gray-300 rounded-lg p-5 text-center text-xs text-gray-500 space-y-1">
          <Lock className="w-6 h-6 mx-auto text-gray-300" />
          <p className="font-semibold text-gray-700">
            {isCoordenador
              ? 'Nenhum Laudo Médico anexado para este estudante'
              : 'Nenhum Laudo Médico disponível para o seu cargo'}
          </p>
          <p className="text-gray-400">
            {isCoordenador
              ? 'Utilize o botão "Anexar Laudo Médico" ou a seção de Anexos do Prontuário para cadastrar laudos classificados como LAUDO_MEDICO.'
              : 'A visualização e o download de laudos médicos dependem de liberação explícita pela Coordenação da CLAI.'}
          </p>
        </div>
      )}

      {!carregando && !erro && laudos.length > 0 && (
        <ul className="space-y-3">
          {laudos.map((laudo) => {
            const rolesLiberadas = new Set<Role>(laudo.rolesPermitidas ?? []);
            const salvandoEste = salvandoPermissaoId === laudo.id;

            return (
              <li
                key={laudo.id}
                className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 shadow-2xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-ifpb-tealLight text-ifpb-teal shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {laudo.nomeOriginal}
                      </p>
                      <p className="text-xs text-gray-500">
                        Laudo Médico &bull; {formatarTamanho(laudo.tamanhoBytes)} &bull;{' '}
                        {new Date(laudo.criadoEm).toLocaleDateString('pt-BR')}
                        {laudo.criptografado ? ' • Cifrado (AES-256-GCM)' : ''}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleBaixarLaudo(laudo)}
                    disabled={baixandoId === laudo.id}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold text-ifpb-teal border border-ifpb-teal hover:bg-ifpb-tealLight transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                  >
                    {baixandoId === laudo.id ? (
                      <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    {baixandoId === laudo.id ? 'Descriptografando...' : 'Visualizar / Baixar Laudo'}
                  </button>
                </div>

                {/* Controle exclusivo da Coordenação da CLAI para liberar/revogar cargos */}
                {isCoordenador && (
                  <div className="pt-3 border-t border-gray-100 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wide text-gray-600 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-ifpb-teal" />
                        Cargos com permissão de visualização
                      </span>
                      {salvandoEste && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-ifpb-teal">
                          <RotateCw className="w-3 h-3 animate-spin" />
                          Salvando permissões...
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <label
                        title="A Coordenação da CLAI sempre possui acesso padrão aos laudos médicos"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200 cursor-not-allowed"
                      >
                        <input
                          type="checkbox"
                          checked
                          disabled
                          className="rounded border-emerald-400 accent-[#0F6460]"
                        />
                        <span>{ROTULO_ROLE.COORDENADOR} (padrão)</span>
                      </label>

                      {CARGOS_GERENCIAVEIS.map((cargo) => {
                        const liberado = rolesLiberadas.has(cargo);
                        return (
                          <label
                            key={cargo}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                              salvandoEste
                                ? 'opacity-60 cursor-wait'
                                : 'cursor-pointer'
                            } ${
                              liberado
                                ? 'bg-ifpb-tealLight/70 text-ifpb-teal border-ifpb-teal font-semibold'
                                : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={liberado}
                              disabled={salvandoEste}
                              onChange={(e) => handleAlternarCargo(laudo, cargo, e.target.checked)}
                              className="rounded border-gray-300 accent-[#0F6460]"
                            />
                            <span>{ROTULO_ROLE[cargo]}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {isCoordenador && (
        <ModalUploadAnexo
          isOpen={modalUploadAberto}
          onClose={() => setModalUploadAberto(false)}
          alunoId={alunoId}
          classificacaoFixa="LAUDO_MEDICO"
          onUploadSucesso={handleUploadSucesso}
        />
      )}
    </section>
  );
};
