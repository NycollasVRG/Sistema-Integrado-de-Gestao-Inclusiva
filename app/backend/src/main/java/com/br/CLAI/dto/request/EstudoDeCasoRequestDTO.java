package com.br.CLAI.dto.request;

import com.br.CLAI.domain.enums.StatusEstudoCaso;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

public record EstudoDeCasoRequestDTO(
        @NotNull(message = "O ID do aluno é obrigatório")
        UUID alunoId,

        @NotNull(message = "O status do estudo de caso é obrigatório")
        StatusEstudoCaso status,

        String diagnosticoInicial,

        String historico,

        String historicoFamiliar,

        String historicoSocioemocional,

        List<UUID> indicadoresIds
) {
    public EstudoDeCasoRequestDTO(
            UUID alunoId,
            StatusEstudoCaso status,
            String diagnosticoInicial,
            List<UUID> indicadoresIds
    ) {
        this(alunoId, status, diagnosticoInicial, null, null, null, indicadoresIds);
    }

    public EstudoDeCasoRequestDTO(
            UUID alunoId,
            StatusEstudoCaso status,
            String diagnosticoInicial,
            String historicoFamiliar,
            String historicoSocioemocional,
            List<UUID> indicadoresIds
    ) {
        this(alunoId, status, diagnosticoInicial, null, historicoFamiliar, historicoSocioemocional, indicadoresIds);
    }
}
