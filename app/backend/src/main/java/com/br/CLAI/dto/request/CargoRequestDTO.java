package com.br.CLAI.dto.request;

import com.br.CLAI.domain.enums.NivelRestricao;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Payload de criação e atualização de cargos institucionais (/api/cargos).
 */
public record CargoRequestDTO(
        @NotBlank(message = "O código do cargo é obrigatório")
        @Size(min = 2, max = 50, message = "O código do cargo deve ter entre 2 e 50 caracteres")
        @Pattern(
                regexp = "^[A-Za-z][A-Za-z0-9_\\s-]{1,49}$",
                message = "O código deve iniciar com letra e conter apenas letras, números, espaços, hífen ou sublinhado"
        )
        String codigo,

        @NotBlank(message = "O nome do cargo é obrigatório")
        @Size(min = 2, max = 100, message = "O nome do cargo deve ter entre 2 e 100 caracteres")
        String nome,

        @Size(max = 1000, message = "A descrição do cargo não pode exceder 1000 caracteres")
        String descricao,

        @NotNull(message = "O nível de restrição padrão é obrigatório")
        NivelRestricao nivelRestricaoPadrao,

        Boolean autorizacaoSaudePadrao,

        Boolean ativo
) {
}
