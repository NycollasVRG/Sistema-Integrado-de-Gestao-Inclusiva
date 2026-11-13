package com.br.CLAI.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record PeaRequestDTO(
        @NotNull(message = "O ID do acompanhamento é obrigatório")
        UUID acompanhamentoId,

        UUID peiId,

        UUID disciplinaId,

        @Size(max = 200, message = "O componente curricular deve ter no máximo 200 caracteres")
        String componenteCurricular,

        @Size(max = 30, message = "O semestre/ano deve ter no máximo 30 caracteres")
        String semestreAno,

        @Size(max = 255, message = "O nome do docente deve ter no máximo 255 caracteres")
        String docente,

        @NotBlank(message = "O objetivo geral é obrigatório")
        String objetivoGeral,

        String objetivosEspecificos,

        String conteudosProgramaticos,

        @NotBlank(message = "A metodologia é obrigatória")
        String metodologia,

        @NotBlank(message = "A avaliação é obrigatória")
        String avaliacao,

        String bibliografiaBasica,

        String bibliografiaComplementar
) {
    public PeaRequestDTO(
            UUID acompanhamentoId,
            UUID disciplinaId,
            String objetivoGeral,
            String metodologia,
            String avaliacao) {
        this(
                acompanhamentoId,
                null,
                disciplinaId,
                null,
                null,
                null,
                objetivoGeral,
                null,
                null,
                metodologia,
                avaliacao,
                null,
                null
        );
    }
}

