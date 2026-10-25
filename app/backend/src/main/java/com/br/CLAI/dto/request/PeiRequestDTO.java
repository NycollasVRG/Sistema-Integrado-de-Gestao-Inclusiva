package com.br.CLAI.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record PeiRequestDTO(
        @NotNull(message = "O ID do acompanhamento é obrigatório")
        UUID acompanhamentoId,

        @NotBlank(message = "Os conhecimentos, habilidades e interesses são obrigatórios")
        String habilidadesInteresses,

        @NotBlank(message = "As propostas de adaptações curriculares são obrigatórias")
        String propostasAdaptacoes
) {
}
