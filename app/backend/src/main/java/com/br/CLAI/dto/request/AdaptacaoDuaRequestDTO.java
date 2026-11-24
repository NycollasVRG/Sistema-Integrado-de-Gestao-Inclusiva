package com.br.CLAI.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record AdaptacaoDuaRequestDTO(
        @NotNull(message = "O ID do estudante é obrigatório.")
        UUID alunoId,

        @NotBlank(message = "O texto da prova é obrigatório para adaptação DUA.")
        String textoProva
) {
}
