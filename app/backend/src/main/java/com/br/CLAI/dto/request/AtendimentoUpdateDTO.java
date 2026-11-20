package com.br.CLAI.dto.request;

import com.br.CLAI.domain.enums.TipoAtendimento;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/**
 * Substituição completa do conteúdo editável do atendimento (semântica de PUT).
 * O estudante vinculado não pode ser alterado; {@code encaminhamentos} nulo limpa o campo.
 */
public record AtendimentoUpdateDTO(
        @NotNull(message = "A natureza do atendimento é obrigatória")
        TipoAtendimento tipoAtendimento,

        @NotNull(message = "A data do atendimento é obrigatória")
        LocalDate dataAtendimento,

        @NotBlank(message = "O profissional ou setor responsável é obrigatório")
        @Size(max = 255, message = "O profissional responsável deve ter no máximo 255 caracteres")
        String profissionalResponsavel,

        @NotBlank(message = "O relato do atendimento é obrigatório")
        String descricao,

        String encaminhamentos
) {
}
