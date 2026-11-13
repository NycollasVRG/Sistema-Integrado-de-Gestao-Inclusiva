package com.br.CLAI.dto.response;

import com.br.CLAI.domain.enums.StatusEstudoCaso;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record EstudoDeCasoResponseDTO(
        UUID id,
        UUID alunoId,
        StatusEstudoCaso status,
        String diagnosticoInicial,
        String historico,
        String historicoFamiliar,
        String historicoSocioemocional,
        List<UUID> indicadoresIds,
        Integer versao,
        UUID estudoOrigemId,
        LocalDateTime criadoEm,
        LocalDateTime atualizadoEm,
        ResponsavelAuditoriaDTO atualizadoPor
) {
    public EstudoDeCasoResponseDTO(
            UUID id,
            UUID alunoId,
            StatusEstudoCaso status,
            String diagnosticoInicial,
            List<UUID> indicadoresIds,
            LocalDateTime criadoEm,
            LocalDateTime atualizadoEm
    ) {
        this(id, alunoId, status, diagnosticoInicial, null, null, null, indicadoresIds, 1, null, criadoEm, atualizadoEm, null);
    }

    public EstudoDeCasoResponseDTO(
            UUID id,
            UUID alunoId,
            StatusEstudoCaso status,
            String diagnosticoInicial,
            String historicoFamiliar,
            String historicoSocioemocional,
            List<UUID> indicadoresIds,
            LocalDateTime criadoEm,
            LocalDateTime atualizadoEm
    ) {
        this(id, alunoId, status, diagnosticoInicial, null, historicoFamiliar, historicoSocioemocional, indicadoresIds, 1, null, criadoEm, atualizadoEm, null);
    }

    public EstudoDeCasoResponseDTO(
            UUID id,
            UUID alunoId,
            StatusEstudoCaso status,
            String diagnosticoInicial,
            String historico,
            String historicoFamiliar,
            String historicoSocioemocional,
            List<UUID> indicadoresIds,
            Integer versao,
            UUID estudoOrigemId,
            LocalDateTime criadoEm,
            LocalDateTime atualizadoEm
    ) {
        this(id, alunoId, status, diagnosticoInicial, historico, historicoFamiliar, historicoSocioemocional, indicadoresIds, versao, estudoOrigemId, criadoEm, atualizadoEm, null);
    }
}
