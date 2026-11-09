package com.br.CLAI.dto.response;

import java.time.LocalDateTime;
import java.util.UUID;

public record TimelineEventDTO(
        UUID id,
        String tipo,
        LocalDateTime dataCriacao
) {
}
