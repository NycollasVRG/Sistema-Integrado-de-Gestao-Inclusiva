package com.br.CLAI.dto.response;

import com.br.CLAI.domain.enums.NivelRestricao;
import com.br.CLAI.domain.enums.Role;

import java.util.UUID;

public record LoginResponseDTO(
        String token,
        String tipoToken,
        UUID userId,
        String nome,
        String email,
        Role role,
        NivelRestricao nivelRestricao,
        Boolean autorizacaoSaude,
        Integer tokenVersion
) {
}
