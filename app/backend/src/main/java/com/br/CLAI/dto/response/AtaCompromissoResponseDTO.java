package com.br.CLAI.dto.response;

import com.br.CLAI.domain.AtaCompromisso;
import com.br.CLAI.domain.enums.StatusCompromisso;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record AtaCompromissoResponseDTO(
        UUID id,
        String descricao,
        UUID responsavelId,
        String responsavelNome,
        LocalDate prazo,
        StatusCompromisso status,
        LocalDateTime lembreteEnviadoEm
) {
    public static AtaCompromissoResponseDTO fromEntity(AtaCompromisso entity) {
        return new AtaCompromissoResponseDTO(
                entity.getId(),
                entity.getDescricao(),
                entity.getResponsavel() != null ? entity.getResponsavel().getId() : null,
                entity.getResponsavel() != null ? entity.getResponsavel().getNome() : null,
                entity.getPrazo(),
                entity.getStatus(),
                entity.getLembreteEnviadoEm()
        );
    }
}
