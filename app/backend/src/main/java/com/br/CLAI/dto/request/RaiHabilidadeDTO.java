package com.br.CLAI.dto.request;

import com.br.CLAI.domain.enums.NivelAprendizado;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record RaiHabilidadeDTO(
        UUID id,
        Integer ordem,
        @NotBlank(message = "A habilidade desenvolvida é obrigatória.")
        String habilidadeDesenvolvida,
        @NotNull(message = "O nível de aprendizado é obrigatório (SATISFATORIO, BOM ou OTIMO).")
        NivelAprendizado nivelAprendizado,
        String observacoes
) {
}
