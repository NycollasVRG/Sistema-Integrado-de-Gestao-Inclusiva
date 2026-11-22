package com.br.CLAI.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record AtaAssinaturasRequestDTO(
        @NotEmpty(message = "Informe ao menos uma assinatura digital de participante")
        List<@Valid AtaAssinaturaRequestDTO> assinaturas
) {
}
