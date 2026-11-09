package com.br.CLAI.dto.response;

import java.time.LocalDate;
import java.util.UUID;

public record AcompanhamentoResponseDTO(
        UUID id,
        UUID alunoId,
        LocalDate dataInicio
) {
}
