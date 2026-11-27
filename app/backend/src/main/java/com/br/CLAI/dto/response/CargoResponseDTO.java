package com.br.CLAI.dto.response;

import com.br.CLAI.domain.Cargo;
import com.br.CLAI.domain.enums.NivelRestricao;

import java.time.LocalDateTime;
import java.util.UUID;

public record CargoResponseDTO(
        UUID id,
        String codigo,
        String nome,
        String descricao,
        NivelRestricao nivelRestricaoPadrao,
        Boolean autorizacaoSaudePadrao,
        Boolean ativo,
        Boolean sistema,
        LocalDateTime criadoEm,
        LocalDateTime atualizadoEm
) {
    public static CargoResponseDTO fromEntity(Cargo cargo) {
        return new CargoResponseDTO(
                cargo.getId(),
                cargo.getCodigo(),
                cargo.getNome(),
                cargo.getDescricao(),
                cargo.getNivelRestricaoPadrao(),
                cargo.getAutorizacaoSaudePadrao(),
                cargo.getAtivo(),
                cargo.getSistema(),
                cargo.getCriadoEm(),
                cargo.getAtualizadoEm()
        );
    }
}
