package com.br.CLAI.dto.response;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO com os detalhes aprofundados de histórico familiar e desenvolvimento socioemocional.
 * Acesso exclusivo a profissionais com nível RESTRICAO_MODERADA ou SUPER_RESTRICAO (TA11.3).
 */
public record HistoricoSocioemocionalResponseDTO(
        UUID alunoId,
        String nomeAluno,
        String matricula,
        UUID estudoDeCasoId,
        String historicoFamiliar,
        String historicoSocioemocional,
        LocalDateTime atualizadoEm
) {
}
