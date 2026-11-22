package com.br.CLAI.dto.response;

import com.br.CLAI.domain.enums.StatusAluno;
import com.br.CLAI.domain.enums.StatusIndicacao;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record IndicacaoResponseDTO(
        UUID id,
        UUID alunoId,
        String nomeEstudante,
        String matriculaAluno,
        StatusAluno statusAluno,
        UUID solicitanteId,
        String solicitanteNome,
        String justificativaPedagogica,
        List<String> disciplinasObservadas,
        StatusIndicacao status,
        String justificativaDecisao,
        UUID decididoPor,
        LocalDateTime decididoEm,
        UUID estudoDeCasoId,
        LocalDateTime criadoEm,
        LocalDateTime atualizadoEm
) {
}
