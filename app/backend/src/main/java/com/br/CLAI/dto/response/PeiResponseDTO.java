package com.br.CLAI.dto.response;

import java.time.LocalDateTime;
import java.util.List;
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
        String assinaturaClai,
        String assinaturaSetorPedagogico,
        String assinaturaCoordenadorCurso,
        String assinaturaEstudanteResponsavel,
        List<String> assinaturasDocentes,
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
                id, acompanhamentoId, alunoId,
                null, null, null, habilidadesInteresses, null, propostasAdaptacoes,
                null, null, null, null, List.of(),
                criadoEm, atualizadoEm
        );
    }

    public PeiResponseDTO(
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
            LocalDateTime atualizadoEm) {
        this(
                id, acompanhamentoId, alunoId,
                semestreAno, historicoEstudante, necessidadesEspecificas,
                habilidadesInteresses, dificuldadesApresentadas, propostasAdaptacoes,
                null, null, null, null, List.of(),
                criadoEm, atualizadoEm
        );
    }
}
