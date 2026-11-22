package com.br.CLAI.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record AtaAssinaturaRequestDTO(
        @NotBlank(message = "O nome do participante é obrigatório")
        @Size(max = 255, message = "O nome do participante deve ter no máximo 255 caracteres")
        String nomeParticipante,

        @NotBlank(message = "O papel do participante é obrigatório")
        @Size(max = 100, message = "O papel do participante deve ter no máximo 100 caracteres")
        String papelParticipante,

        UUID usuarioId
) {
}
