package com.br.CLAI.dto.request;

import com.br.CLAI.domain.enums.StatusEstudoCaso;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

public record EstudoDeCasoUpdateDTO(
        @NotNull(message = "O status do estudo de caso é obrigatório")
        StatusEstudoCaso status,

        String diagnosticoInicial,

        String historicoFamiliar,

        String historicoSocioemocional,

        List<UUID> indicadoresIds
) {
    public EstudoDeCasoUpdateDTO(
            StatusEstudoCaso status,
            String diagnosticoInicial,
            List<UUID> indicadoresIds
    ) {
        this(status, diagnosticoInicial, null, null, indicadoresIds);
    }
}
