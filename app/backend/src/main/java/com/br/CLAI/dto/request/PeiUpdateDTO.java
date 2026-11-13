package com.br.CLAI.dto.request;

import jakarta.validation.constraints.Size;

public record PeiUpdateDTO(
        @Size(max = 30, message = "O semestre/ano deve ter no máximo 30 caracteres")
        String semestreAno,

        String historicoEstudante,

        String necessidadesEspecificas,

        String habilidadesInteresses,

        String dificuldadesApresentadas,

        String propostasAdaptacoes
) {
    public PeiUpdateDTO(
            String habilidadesInteresses,
            String propostasAdaptacoes) {
        this(null, null, null, habilidadesInteresses, null, propostasAdaptacoes);
    }
}

