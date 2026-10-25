package com.br.CLAI.dto.response;

import java.time.LocalDateTime;
import java.util.UUID;

public record PeaResponseDTO(
        UUID id,
        UUID acompanhamentoId,
        UUID alunoId,
        UUID disciplinaId,
        String objetivoGeral,
        String metodologia,
        String avaliacao,
        LocalDateTime criadoEm,
        LocalDateTime atualizadoEm
) {
}
