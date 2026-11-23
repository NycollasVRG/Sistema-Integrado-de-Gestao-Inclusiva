package com.br.CLAI.dto.response;

import java.util.List;

/**
 * Página somente-leitura da trilha imutável de auditoria (US 06 / TA6.1 / TA6.3).
 * Nenhuma rota de alteração é exposta: este DTO apenas transporta registros já gravados.
 */
public record AuditoriaListaResponseDTO(
        List<AuditLogResponseDTO> logs,
        int pagina,
        int tamanho,
        long totalElementos,
        int totalPaginas
) {
}
