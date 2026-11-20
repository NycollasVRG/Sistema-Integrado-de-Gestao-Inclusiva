package com.br.CLAI.dto.response;

import com.br.CLAI.domain.AnexoEstudante;
import com.br.CLAI.domain.enums.Role;
import com.br.CLAI.domain.enums.TipoClassificacaoAnexo;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record AnexoEstudanteResponseDTO(
        UUID id,
        UUID alunoId,
        String nomeOriginal,
        String contentType,
        Long tamanhoBytes,
        TipoClassificacaoAnexo classificacao,
        Boolean criptografado,
        LocalDateTime criadoEm,
        List<Role> rolesPermitidas
) {
    public AnexoEstudanteResponseDTO(
            UUID id,
            UUID alunoId,
            String nomeOriginal,
            String contentType,
            Long tamanhoBytes,
            TipoClassificacaoAnexo classificacao,
            Boolean criptografado,
            LocalDateTime criadoEm
    ) {
        this(id, alunoId, nomeOriginal, contentType, tamanhoBytes, classificacao, criptografado, criadoEm, null);
    }

    public static AnexoEstudanteResponseDTO fromEntity(AnexoEstudante entity) {
        return fromEntity(entity, false);
    }

    public static AnexoEstudanteResponseDTO fromEntity(AnexoEstudante entity, boolean incluirRolesPermitidas) {
        List<Role> roles = null;
        if (incluirRolesPermitidas && entity.getClassificacao() == TipoClassificacaoAnexo.LAUDO_MEDICO) {
            roles = entity.getRolesPermitidas() == null
                    ? List.of()
                    : entity.getRolesPermitidas().stream()
                            .filter(role -> role != null && role != Role.COORDENADOR)
                            .sorted(Comparator.comparing(Enum::name))
                            .toList();
        }
        return new AnexoEstudanteResponseDTO(
                entity.getId(),
                entity.getAluno() != null ? entity.getAluno().getId() : null,
                entity.getNomeOriginal(),
                entity.getContentType(),
                entity.getTamanhoBytes(),
                entity.getClassificacao(),
                entity.getCriptografado(),
                entity.getCriadoEm(),
                roles
        );
    }
}
