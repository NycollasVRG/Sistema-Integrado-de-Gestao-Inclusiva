package com.br.CLAI.dto.request;

import com.br.CLAI.domain.enums.StatusEstudante;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

/** Payload de criação (POST) e atualização (PUT) de estudante. */
public record EstudanteRequestDTO(

        @NotBlank(message = "O nome completo é obrigatório")
        @Size(max = 255, message = "O nome completo deve ter no máximo 255 caracteres")
        String nomeCompleto,

        @NotBlank(message = "A matrícula é obrigatória")
        @Size(max = 50, message = "A matrícula deve ter no máximo 50 caracteres")
        String matricula,

        @NotBlank(message = "O curso é obrigatório")
        @Size(max = 100, message = "O curso deve ter no máximo 100 caracteres")
        String curso,

        @NotBlank(message = "A turma é obrigatória")
        @Size(max = 50, message = "A turma deve ter no máximo 50 caracteres")
        String turma,

        @NotNull(message = "O status é obrigatório")
        StatusEstudante status,

        @NotEmpty(message = "Informe ao menos uma tag de dificuldade")
        List<@NotNull(message = "O ID da tag não pode ser nulo") UUID> tagsDificuldadeIds
) {
}
