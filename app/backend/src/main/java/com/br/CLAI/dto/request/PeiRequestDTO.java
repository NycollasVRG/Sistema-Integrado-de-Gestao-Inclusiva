package com.br.CLAI.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

public record PeiRequestDTO(
        @NotNull(message = "O ID do acompanhamento é obrigatório")
        UUID acompanhamentoId,

        @Size(max = 30, message = "O semestre/ano deve ter no máximo 30 caracteres")
        String semestreAno,

        String historicoEstudante,

        String necessidadesEspecificas,

        @NotBlank(message = "Os conhecimentos, habilidades e interesses são obrigatórios")
        String habilidadesInteresses,

        String dificuldadesApresentadas,

        @NotBlank(message = "As propostas de adaptações curriculares são obrigatórias")
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
    public PeiRequestDTO(
            UUID acompanhamentoId,
            String habilidadesInteresses,
            String propostasAdaptacoes) {
        this(acompanhamentoId, null, null, null, habilidadesInteresses, null, propostasAdaptacoes,
                null, null, null, null, null);
    }

    public PeiRequestDTO(
            UUID acompanhamentoId,
            String semestreAno,
            String historicoEstudante,
            String necessidadesEspecificas,
            String habilidadesInteresses,
            String dificuldadesApresentadas,
            String propostasAdaptacoes) {
        this(acompanhamentoId, semestreAno, historicoEstudante, necessidadesEspecificas,
                habilidadesInteresses, dificuldadesApresentadas, propostasAdaptacoes,
                null, null, null, null, null);
    }
}
