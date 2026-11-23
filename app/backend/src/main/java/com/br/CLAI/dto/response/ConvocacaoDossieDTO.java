package com.br.CLAI.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Representação consolidada de convocações e reuniões de alinhamento com famílias
 * ou comunicações formais no Dossiê Jurídico (US 06 / TA6.2).
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ConvocacaoDossieDTO(
        UUID id,
        String origem,
        String tipo,
        LocalDateTime dataReferencia,
        String titulo,
        String descricao,
        String local,
        String status,
        String linkReferencia
) {
}
