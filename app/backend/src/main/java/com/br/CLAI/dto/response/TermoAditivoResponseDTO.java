package com.br.CLAI.dto.response;

import com.br.CLAI.domain.AtaTermoAditivo;

import java.time.LocalDateTime;
import java.util.UUID;

public record TermoAditivoResponseDTO(
        UUID id,
        UUID ataId,
        String texto,
        UUID criadoPor,
        LocalDateTime criadoEm
) {
    public static TermoAditivoResponseDTO fromEntity(AtaTermoAditivo entity) {
        return new TermoAditivoResponseDTO(
                entity.getId(),
                entity.getAta() != null ? entity.getAta().getId() : null,
                entity.getTexto(),
                entity.getCriadoPor(),
                entity.getCriadoEm()
        );
    }
}
