import { apiFetch } from './apiClient';
import type {
  AtaAssinaturasRequestDTO,
  AtaCompromissoResponseDTO,
  AtaReuniaoRequestDTO,
  AtaReuniaoResponseDTO,
  AtaReuniaoUpdateDTO,
  TermoAditivoRequestDTO,
  TermoAditivoResponseDTO,
} from '../types/ata';

/** Reexportado para os componentes não precisarem conhecer o DTO envelope do backend. */
export type { AtaAssinaturasRequestDTO } from '../types/ata';

/**
 * Serviço da US 08: registro, assinatura, anexo assinado, finalização,
 * termo aditivo e acompanhamento de compromissos de Atas de Reunião.
 * Toda a cifragem do documento é feita no backend (AES-256-GCM).
 */
export const AtaService = {
  /** GET /api/atas/aluno/{alunoId} */
  async listarPorAluno(alunoId: string, signal?: AbortSignal): Promise<AtaReuniaoResponseDTO[]> {
    const res = await apiFetch(`/api/atas/aluno/${encodeURIComponent(alunoId)}`, { signal });
    return (await res.json()) as AtaReuniaoResponseDTO[];
  },

  /** GET /api/atas/{id} */
  async buscarPorId(id: string, signal?: AbortSignal): Promise<AtaReuniaoResponseDTO> {
    const res = await apiFetch(`/api/atas/${encodeURIComponent(id)}`, { signal });
    return (await res.json()) as AtaReuniaoResponseDTO;
  },

  /** POST /api/atas — cria sempre em RASCUNHO. */
  async criar(dto: AtaReuniaoRequestDTO): Promise<AtaReuniaoResponseDTO> {
    const res = await apiFetch('/api/atas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
    return (await res.json()) as AtaReuniaoResponseDTO;
  },

  /** PUT /api/atas/{id} — permitido somente em RASCUNHO (409 quando FINALIZADA). */
  async atualizar(id: string, dto: AtaReuniaoUpdateDTO): Promise<AtaReuniaoResponseDTO> {
    const res = await apiFetch(`/api/atas/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
    return (await res.json()) as AtaReuniaoResponseDTO;
  },

  /** POST /api/atas/{id}/documento-assinado (multipart/form-data, campo `arquivo`). */
  async anexarDocumentoAssinado(id: string, arquivo: File): Promise<AtaReuniaoResponseDTO> {
    const formData = new FormData();
    formData.append('arquivo', arquivo);
    const res = await apiFetch(`/api/atas/${encodeURIComponent(id)}/documento-assinado`, {
      method: 'POST',
      body: formData,
    });
    return (await res.json()) as AtaReuniaoResponseDTO;
  },

  /** GET /api/atas/{id}/documento-assinado — download descriptografado em memória. */
  async baixarDocumentoAssinado(
    ata: Pick<AtaReuniaoResponseDTO, 'id' | 'documentoNomeOriginal'>,
  ): Promise<void> {
    const res = await apiFetch(`/api/atas/${encodeURIComponent(ata.id)}/documento-assinado`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = ata.documentoNomeOriginal || `ata-${ata.id}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  },

  /** POST /api/atas/{id}/assinaturas */
  async registrarAssinaturas(
    id: string,
    dto: AtaAssinaturasRequestDTO,
  ): Promise<AtaReuniaoResponseDTO> {
    const res = await apiFetch(`/api/atas/${encodeURIComponent(id)}/assinaturas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
    return (await res.json()) as AtaReuniaoResponseDTO;
  },

  /** POST /api/atas/{id}/finalizar */
  async finalizar(id: string): Promise<AtaReuniaoResponseDTO> {
    const res = await apiFetch(`/api/atas/${encodeURIComponent(id)}/finalizar`, {
      method: 'POST',
    });
    return (await res.json()) as AtaReuniaoResponseDTO;
  },

  /** POST /api/atas/{id}/termos-aditivos — somente para ata FINALIZADA. */
  async adicionarTermoAditivo(
    id: string,
    dto: TermoAditivoRequestDTO,
  ): Promise<TermoAditivoResponseDTO> {
    const res = await apiFetch(`/api/atas/${encodeURIComponent(id)}/termos-aditivos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
    return (await res.json()) as TermoAditivoResponseDTO;
  },

  /** GET /api/atas/{id}/termos-aditivos */
  async listarTermosAditivos(id: string, signal?: AbortSignal): Promise<TermoAditivoResponseDTO[]> {
    const res = await apiFetch(`/api/atas/${encodeURIComponent(id)}/termos-aditivos`, { signal });
    return (await res.json()) as TermoAditivoResponseDTO[];
  },

  /** PATCH /api/atas/{id}/compromissos/{compromissoId}/concluir */
  async concluirCompromisso(
    ataId: string,
    compromissoId: string,
  ): Promise<AtaCompromissoResponseDTO> {
    const res = await apiFetch(
      `/api/atas/${encodeURIComponent(ataId)}/compromissos/${encodeURIComponent(compromissoId)}/concluir`,
      { method: 'PATCH' },
    );
    return (await res.json()) as AtaCompromissoResponseDTO;
  },
};
