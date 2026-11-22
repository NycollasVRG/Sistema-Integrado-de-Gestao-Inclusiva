package com.br.CLAI.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

public record AtaCompromissoRequestDTO(
        @NotBlank(message = "A descrição do compromisso é obrigatória")
        String descricao,

        @NotNull(message = "O ID do usuário responsável é obrigatório")
        UUID responsavelId,

        @NotNull(message = "O prazo do compromisso é obrigatório")
        LocalDate prazo
) {
}
