package com.br.CLAI.dto.request;

import jakarta.validation.constraints.NotNull;

public record CargoStatusRequestDTO(
        @NotNull(message = "O status ativo é obrigatório")
        Boolean ativo
) {
}
