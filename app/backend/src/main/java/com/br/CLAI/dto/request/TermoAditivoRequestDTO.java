package com.br.CLAI.dto.request;

import jakarta.validation.constraints.NotBlank;

public record TermoAditivoRequestDTO(
        @NotBlank(message = "O texto explicativo do termo aditivo é obrigatório")
        String texto
) {
}
