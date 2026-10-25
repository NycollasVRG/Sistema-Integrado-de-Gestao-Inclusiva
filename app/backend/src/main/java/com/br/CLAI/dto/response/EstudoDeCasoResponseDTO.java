package com.br.CLAI.dto.response;

import com.br.CLAI.domain.enums.StatusEstudoCaso;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record EstudoDeCasoResponseDTO(
        UUID id,
        UUID alunoId,
        StatusEstudoCaso status,
        String diagnosticoInicial,
        List<UUID> indicadoresIds,
        LocalDateTime criadoEm,
        LocalDateTime atualizadoEm
) {
}
