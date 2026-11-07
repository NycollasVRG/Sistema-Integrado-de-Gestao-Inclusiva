import { apiFetch } from './apiClient';
import type { AnexoEstudanteDTO } from '../types/anexo';
import type { ProntuarioConsolidadoDTO } from '../types/prontuario';

export const AnexoService = {
  /** GET /api/alunos/{id}/anexos */
  async listarPorAluno(alunoId: string, signal?: AbortSignal): Promise<AnexoEstudanteDTO[]> {
    const res = await apiFetch(`/api/alunos/${encodeURIComponent(alunoId)}/anexos`, { signal });
    return (await res.json()) as AnexoEstudanteDTO[];
  },

  /**
   * GET /api/anexos/{id}/download: o apiFetch envia o Bearer token e o corpo é
   * tratado como Blob. Um 403 do backend aciona o aviso global de sigilo clínico/LGPD.
   */
  async baixar(anexo: Pick<AnexoEstudanteDTO, 'id' | 'nomeOriginal'>): Promise<void> {
    const res = await apiFetch(`/api/anexos/${encodeURIComponent(anexo.id)}/download`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = anexo.nomeOriginal;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
};

/** GET /api/alunos/{estudanteId}/prontuario */
export async function buscarProntuarioConsolidado(
  alunoId: string,
  signal?: AbortSignal,
): Promise<ProntuarioConsolidadoDTO> {
  const res = await apiFetch(`/api/alunos/${encodeURIComponent(alunoId)}/prontuario`, { signal });
  return (await res.json()) as ProntuarioConsolidadoDTO;
}
