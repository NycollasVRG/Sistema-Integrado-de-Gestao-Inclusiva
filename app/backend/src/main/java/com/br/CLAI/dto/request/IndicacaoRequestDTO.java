package com.br.CLAI.dto.request;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

public record IndicacaoRequestDTO(
        @NotNull(message = "O ID do estudante é obrigatório")
        UUID alunoId,

        @JsonAlias("justificativa")
        @NotBlank(message = "A justificativa pedagógica é obrigatória")
        String justificativaPedagogica,

        @JsonAlias("disciplinas")
        @NotEmpty(message = "Informe ao menos uma disciplina onde a dificuldade foi observada")
        List<@NotBlank(message = "O nome da disciplina não pode estar em branco")
             @Size(max = 150, message = "O nome da disciplina deve ter no máximo 150 caracteres")
             String> disciplinasObservadas
) {
}
