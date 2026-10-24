package com.br.CLAI.dto.response;

import java.time.LocalDateTime;
import java.util.UUID;

public record PeiResponseDTO(
        UUID id,
        UUID acompanhamentoId,
        UUID alunoId,
        String habilidadesInteresses,
        String propostasAdaptacoes,
        LocalDateTime criadoEm,
        LocalDateTime atualizadoEm
) {
}
