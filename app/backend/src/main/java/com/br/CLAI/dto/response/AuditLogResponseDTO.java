package com.br.CLAI.dto.response;

import com.br.CLAI.domain.AuditLog;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Representação somente-leitura de um registro da trilha de auditoria (sigi.audit_log)
 * para composição do Dossiê Jurídico (US 06 / TA6.1 / TA6.2).
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record AuditLogResponseDTO(
        UUID id,
        UUID usuarioId,
        String acao,
        String entidade,
        UUID entidadeId,
        String endpoint,
        String metodoHttp,
        String detalhes,
        LocalDateTime timestamp
) {
    public static AuditLogResponseDTO fromEntity(AuditLog entity) {
        if (entity == null) {
            return null;
        }
        return new AuditLogResponseDTO(
                entity.getId(),
                entity.getUsuarioId(),
                entity.getAcao(),
                entity.getEntidade(),
                entity.getEntidadeId(),
                entity.getEndpoint(),
                entity.getMetodoHttp(),
                entity.getDetalhes(),
                entity.getTimestamp()
        );
    }
}
