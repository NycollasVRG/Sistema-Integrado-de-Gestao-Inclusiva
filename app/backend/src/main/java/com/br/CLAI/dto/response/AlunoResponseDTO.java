package com.br.CLAI.dto.response;

import com.br.CLAI.domain.enums.StatusAluno;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record AlunoResponseDTO(
        UUID id,
        String nomeCompleto,
        String matricula,
        String curso,
        String turma,
        StatusAluno status,
        Boolean ativo,
        List<String> tagsDificuldade,
        List<UUID> tagsDificuldadeIds,
        LocalDateTime criadoEm,
        LocalDateTime atualizadoEm
) {
}
