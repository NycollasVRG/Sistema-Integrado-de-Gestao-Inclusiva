package com.br.CLAI.dto.response;

import com.br.CLAI.domain.AnexoEstudante;
import com.br.CLAI.domain.enums.TipoClassificacaoAnexo;

import java.time.LocalDateTime;
import java.util.UUID;

public record AnexoEstudanteResponseDTO(
        UUID id,
        UUID alunoId,
        String nomeOriginal,
        String contentType,
        Long tamanhoBytes,
        TipoClassificacaoAnexo classificacao,
        Boolean criptografado,
        LocalDateTime criadoEm
) {
    public static AnexoEstudanteResponseDTO fromEntity(AnexoEstudante entity) {
        return new AnexoEstudanteResponseDTO(
                entity.getId(),
                entity.getAluno() != null ? entity.getAluno().getId() : null,
                entity.getNomeOriginal(),
                entity.getContentType(),
                entity.getTamanhoBytes(),
                entity.getClassificacao(),
                entity.getCriptografado(),
                entity.getCriadoEm()
        );
    }
}
