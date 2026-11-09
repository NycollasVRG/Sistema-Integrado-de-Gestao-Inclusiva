package com.br.CLAI.dto.request;

import java.util.UUID;

public record PeaUpdateDTO(
        UUID disciplinaId,
        String objetivoGeral,
        String metodologia,
        String avaliacao
) {
}
