package com.br.CLAI.dto.response;

import java.util.UUID;

public record UsuarioRevogadoResponseDTO(
        UUID id,
        String email,
        String nome,
        Boolean acessoAtivo,
        Integer tokenVersion,
        String mensagem
) {
}
