package com.br.CLAI.dto.request;

import com.fasterxml.jackson.annotation.JsonAlias;

public record AprovacaoIndicacaoRequestDTO(
        @JsonAlias("justificativa")
        String justificativaDecisao
) {
}
