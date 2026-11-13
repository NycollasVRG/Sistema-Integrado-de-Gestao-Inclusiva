package com.br.CLAI.dto.response;

import java.time.LocalDateTime;
import java.util.UUID;

public record PeaResponseDTO(
        UUID id,
        UUID acompanhamentoId,
        UUID peiId,
        UUID alunoId,
        UUID disciplinaId,
        String componenteCurricular,
        String semestreAno,
        String docente,
        String objetivoGeral,
        String objetivosEspecificos,
        String conteudosProgramaticos,
        String metodologia,
        String avaliacao,
        String bibliografiaBasica,
        String bibliografiaComplementar,
        LocalDateTime criadoEm,
        LocalDateTime atualizadoEm
) {
    public PeaResponseDTO(
            UUID id,
            UUID acompanhamentoId,
            UUID alunoId,
            UUID disciplinaId,
            String objetivoGeral,
            String metodologia,
            String avaliacao,
            LocalDateTime criadoEm,
            LocalDateTime atualizadoEm) {
        this(
                id,
                acompanhamentoId,
                null,
                alunoId,
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
                null,
                criadoEm,
                atualizadoEm
        );
    }
}

