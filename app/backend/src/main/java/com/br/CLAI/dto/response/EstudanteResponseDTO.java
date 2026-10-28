package com.br.CLAI.dto.response;

import com.br.CLAI.domain.enums.StatusEstudante;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record EstudanteResponseDTO(
        UUID id,
        String nomeCompleto,
        String matricula,
        String curso,
        String turma,
        StatusEstudante status,
        Boolean ativo,
        List<String> tagsDificuldade,
        List<UUID> tagsDificuldadeIds,
        LocalDateTime criadoEm,
        LocalDateTime atualizadoEm
) {
}
