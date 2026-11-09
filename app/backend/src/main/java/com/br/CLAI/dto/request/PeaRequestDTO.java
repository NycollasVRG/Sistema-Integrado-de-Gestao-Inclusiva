package com.br.CLAI.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record PeaRequestDTO(
        @NotNull(message = "O ID do acompanhamento é obrigatório")
        UUID acompanhamentoId,

        UUID disciplinaId,

        @NotBlank(message = "O objetivo geral é obrigatório")
        String objetivoGeral,

        @NotBlank(message = "A metodologia é obrigatória")
        String metodologia,

        @NotBlank(message = "A avaliação é obrigatória")
        String avaliacao
) {
}
