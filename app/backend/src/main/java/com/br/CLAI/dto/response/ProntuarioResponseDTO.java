package com.br.CLAI.dto.response;

import com.br.CLAI.domain.enums.StatusEstudoCaso;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO consolidado do Prontuário Unificado do Estudante (US 09 / TA11.3).
 * Campos de histórico familiar e socioemocional são omitidos (@JsonInclude(NON_NULL))
 * caso o usuário autenticado não possua permissão de restrição moderada ou superior.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ProntuarioResponseDTO(
        UUID alunoId,
        String nomeAluno,
        String matricula,
        UUID estudoDeCasoId,
        StatusEstudoCaso statusEstudoDeCaso,
        String diagnosticoInicial,
        String historicoFamiliar,
        String historicoSocioemocional,
        int totalPeis,
        int totalPeas,
        int totalAnexos,
        LocalDateTime atualizadoEm
) {
}
