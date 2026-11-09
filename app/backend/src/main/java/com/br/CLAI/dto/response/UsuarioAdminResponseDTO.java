package com.br.CLAI.dto.response;

import com.br.CLAI.domain.Usuario;
import com.br.CLAI.domain.enums.NivelRestricao;
import com.br.CLAI.domain.enums.Role;

import java.util.UUID;

public record UsuarioAdminResponseDTO(
        UUID id,
        String nome,
        String email,
        Role role,
        NivelRestricao nivelRestricao,
        Boolean autorizacaoSaude,
        Boolean acessoAtivo,
        Integer tokenVersion
) {
    public static UsuarioAdminResponseDTO fromEntity(Usuario usuario) {
        return new UsuarioAdminResponseDTO(
                usuario.getId(),
                usuario.getNome(),
                usuario.getEmail(),
                usuario.getRole(),
                usuario.getNivelRestricao(),
                usuario.getAutorizacaoSaude(),
                usuario.getAcessoAtivo(),
                usuario.getTokenVersion()
        );
    }
}
