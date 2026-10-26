package com.br.CLAI.dto.response;

import com.br.CLAI.domain.enums.StatusEstudoCaso;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record EstudoDeCasoResponseDTO(
        UUID id,
        UUID alunoId,
        StatusEstudoCaso status,
        String diagnosticoInicial,
        String historicoFamiliar,
        String historicoSocioemocional,
        List<UUID> indicadoresIds,
        LocalDateTime criadoEm,
        LocalDateTime atualizadoEm
) {
    public EstudoDeCasoResponseDTO(
            UUID id,
            UUID alunoId,
            StatusEstudoCaso status,
            String diagnosticoInicial,
            List<UUID> indicadoresIds,
            LocalDateTime criadoEm,
            LocalDateTime atualizadoEm
    ) {
        this(id, alunoId, status, diagnosticoInicial, null, null, indicadoresIds, criadoEm, atualizadoEm);
    }
}
