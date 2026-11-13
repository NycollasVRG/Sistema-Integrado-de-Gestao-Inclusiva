package com.br.CLAI.dto.request;

import jakarta.validation.constraints.Size;

import java.util.UUID;

public record PeaUpdateDTO(
        UUID peiId,

        UUID disciplinaId,

        @Size(max = 200, message = "O componente curricular deve ter no máximo 200 caracteres")
        String componenteCurricular,

        @Size(max = 30, message = "O semestre/ano deve ter no máximo 30 caracteres")
        String semestreAno,

        @Size(max = 255, message = "O nome do docente deve ter no máximo 255 caracteres")
        String docente,

        String objetivoGeral,

        String objetivosEspecificos,

        String conteudosProgramaticos,

        String metodologia,

        String avaliacao,

        String bibliografiaBasica,

        String bibliografiaComplementar
) {
    public PeaUpdateDTO(
            UUID disciplinaId,
            String objetivoGeral,
            String metodologia,
            String avaliacao) {
        this(
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

