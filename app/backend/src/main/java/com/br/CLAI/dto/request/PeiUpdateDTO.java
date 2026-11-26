package com.br.CLAI.dto.request;

import jakarta.validation.constraints.Size;

import java.util.List;

public record PeiUpdateDTO(
        @Size(max = 30, message = "O semestre/ano deve ter no máximo 30 caracteres")
        String semestreAno,

        String historicoEstudante,

        String necessidadesEspecificas,

        String habilidadesInteresses,

        String dificuldadesApresentadas,

        String propostasAdaptacoes,

        @Size(max = 255)
        String assinaturaClai,

        @Size(max = 255)
        String assinaturaSetorPedagogico,

        @Size(max = 255)
        String assinaturaCoordenadorCurso,

        @Size(max = 255)
        String assinaturaEstudanteResponsavel,

        List<String> assinaturasDocentes
) {
    public PeiUpdateDTO(
            String habilidadesInteresses,
            String propostasAdaptacoes) {
        this(null, null, null, habilidadesInteresses, null, propostasAdaptacoes,
                null, null, null, null, null);
    }

    public PeiUpdateDTO(
            String semestreAno,
            String historicoEstudante,
            String necessidadesEspecificas,
            String habilidadesInteresses,
            String dificuldadesApresentadas,
            String propostasAdaptacoes) {
        this(semestreAno, historicoEstudante, necessidadesEspecificas,
                habilidadesInteresses, dificuldadesApresentadas, propostasAdaptacoes,
                null, null, null, null, null);
    }
}
