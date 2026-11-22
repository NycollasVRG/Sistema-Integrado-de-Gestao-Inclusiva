package com.br.CLAI.dto.request;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;

public record RejeicaoIndicacaoRequestDTO(
        @JsonAlias("justificativa")
        @NotBlank(message = "A justificativa documentada é obrigatória para rejeitar uma indicação")
        String justificativaDecisao
) {
}
