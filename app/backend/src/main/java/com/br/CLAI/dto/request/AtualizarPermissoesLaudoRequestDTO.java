package com.br.CLAI.dto.request;

import com.br.CLAI.domain.enums.Role;
import jakarta.validation.constraints.NotNull;

import java.util.Set;

/**
 * Payload enviado exclusivamente pela Coordenação da CLAI para liberar ou revogar
 * dinamicamente os cargos (Roles) autorizados a visualizar/baixar um Laudo Médico.
 */
public record AtualizarPermissoesLaudoRequestDTO(
        @NotNull(message = "A lista de cargos permitidos é obrigatória")
        Set<@NotNull(message = "O cargo permitido não pode ser nulo") Role> rolesPermitidas
) {
}
