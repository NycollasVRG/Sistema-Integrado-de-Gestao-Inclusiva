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

        List<UUID> indicadoresIds
) {
}
