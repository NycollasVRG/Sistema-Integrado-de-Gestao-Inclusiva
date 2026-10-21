package com.br.CLAI.dto.response;

import com.br.CLAI.domain.enums.NivelRestricao;
import com.br.CLAI.domain.enums.Role;

import java.util.List;
import java.util.UUID;

public record UsuarioSessaoDTO(
        UUID id,
        String nome,
        String email,
        Role role,
        NivelRestricao nivelRestricao,
        Boolean autorizacaoSaude,
        Boolean acessoAtivo,
        Integer tokenVersion,
        List<String> authorities
) {
}
