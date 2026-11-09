import { apiFetch } from './apiClient';
import type { UsuarioAdminDTO, UsuarioRevogadoResponseDTO } from '../types/adminUsuarios';

export const AdminUsuariosService = {
  /**
   * Consulta a lista de usuários cadastrados com suas permissões de RBAC.
   * Exige ROLE_ADMIN (HTTP 403 para demais perfis).
   */
  async listarUsuarios(signal?: AbortSignal): Promise<UsuarioAdminDTO[]> {
    const res = await apiFetch('/api/admin/usuarios', { signal });
    return (await res.json()) as UsuarioAdminDTO[];
  },

  /**
   * TA11.4: Revoga o acesso do usuário imediatamente.
   * Define acessoAtivo = false e incrementa tokenVersion no backend,
   * invalidando sumariamente todas as sessões e tokens JWT anteriores.
   */
  async revogarAcesso(id: string): Promise<UsuarioRevogadoResponseDTO> {
    const res = await apiFetch(`/api/admin/usuarios/${encodeURIComponent(id)}/revogar-acesso`, {
      method: 'PATCH',
    });
    return (await res.json()) as UsuarioRevogadoResponseDTO;
  },
};
