import { apiFetch } from './apiClient';
import type { AnexoEstudanteDTO, TipoClassificacaoAnexo } from '../types/anexo';
import type { Role } from '../types/auth';
import type { ProntuarioConsolidadoDTO } from '../types/prontuario';

export const AnexoService = {
  /** GET /api/alunos/{id}/anexos */
  async listarPorAluno(alunoId: string, signal?: AbortSignal): Promise<AnexoEstudanteDTO[]> {
    const res = await apiFetch(`/api/alunos/${encodeURIComponent(alunoId)}/anexos`, { signal });
    return (await res.json()) as AnexoEstudanteDTO[];
  },

  /** GET /api/alunos/{id}/laudos-medicos (somente LAUDO_MEDICO filtrados pelo cargo no backend) */
  async listarLaudosMedicos(alunoId: string, signal?: AbortSignal): Promise<AnexoEstudanteDTO[]> {
    const res = await apiFetch(`/api/alunos/${encodeURIComponent(alunoId)}/laudos-medicos`, {
      signal,
    });
    return (await res.json()) as AnexoEstudanteDTO[];
  },

  /** PUT /api/anexos/{anexoId}/permissoes-acesso (exclusivo COORDENADOR) */
  async atualizarPermissoesLaudo(
    anexoId: string,
    rolesPermitidas: Role[],
  ): Promise<AnexoEstudanteDTO> {
    const res = await apiFetch(
      `/api/anexos/${encodeURIComponent(anexoId)}/permissoes-acesso`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rolesPermitidas }),
      },
    );
    return (await res.json()) as AnexoEstudanteDTO;
  },

  /** POST /api/alunos/{id}/anexos (multipart/form-data com cifragem AES-256-GCM no backend para sensíveis) */
  async upload(
    alunoId: string,
    arquivo: File,
    classificacao: TipoClassificacaoAnexo,
  ): Promise<AnexoEstudanteDTO> {
    const formData = new FormData();
    formData.append('arquivo', arquivo);
    formData.append('classificacao', classificacao);

    const res = await apiFetch(`/api/alunos/${encodeURIComponent(alunoId)}/anexos`, {
      method: 'POST',
      body: formData,
    });
    return (await res.json()) as AnexoEstudanteDTO;
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
