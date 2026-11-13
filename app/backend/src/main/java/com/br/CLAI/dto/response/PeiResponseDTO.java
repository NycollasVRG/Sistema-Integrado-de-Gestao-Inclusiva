package com.br.CLAI.dto.response;

import java.time.LocalDateTime;
import java.util.UUID;

public record PeiResponseDTO(
        UUID id,
        UUID acompanhamentoId,
        UUID alunoId,
        String semestreAno,
        String historicoEstudante,
        String necessidadesEspecificas,
        String habilidadesInteresses,
        String dificuldadesApresentadas,
        String propostasAdaptacoes,
        LocalDateTime criadoEm,
        LocalDateTime atualizadoEm
) {
    public PeiResponseDTO(
            UUID id,
            UUID acompanhamentoId,
            UUID alunoId,
            String habilidadesInteresses,
            String propostasAdaptacoes,
            LocalDateTime criadoEm,
            LocalDateTime atualizadoEm) {
        this(
                id,
                acompanhamentoId,
                alunoId,
                null,
                null,
                null,
                habilidadesInteresses,
                null,
                propostasAdaptacoes,
                criadoEm,
                atualizadoEm
        );
    }
}

