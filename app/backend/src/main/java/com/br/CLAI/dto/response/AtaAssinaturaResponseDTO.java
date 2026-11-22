package com.br.CLAI.dto.response;

import com.br.CLAI.domain.AtaAssinatura;

import java.time.LocalDateTime;
import java.util.UUID;

public record AtaAssinaturaResponseDTO(
        UUID id,
        String nomeParticipante,
        String papelParticipante,
        UUID usuarioId,
        LocalDateTime assinadoEm,
        String ipOrigem,
        String hashConteudo
) {
    public static AtaAssinaturaResponseDTO fromEntity(AtaAssinatura entity) {
        return new AtaAssinaturaResponseDTO(
                entity.getId(),
                entity.getNomeParticipante(),
                entity.getPapelParticipante(),
                entity.getUsuario() != null ? entity.getUsuario().getId() : null,
                entity.getAssinadoEm(),
                entity.getIpOrigem(),
                entity.getHashConteudo()
        );
    }
}
