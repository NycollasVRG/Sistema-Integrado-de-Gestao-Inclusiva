package com.br.CLAI.dto.request;

import com.br.CLAI.domain.enums.TipoReuniao;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.List;

public record AtaReuniaoUpdateDTO(
        @NotNull(message = "O tipo da reunião é obrigatório")
        TipoReuniao tipoReuniao,

        @NotNull(message = "A data e hora da reunião são obrigatórias")
        LocalDateTime dataReuniao,

        @Size(max = 255, message = "O local da reunião deve ter no máximo 255 caracteres")
        String localReuniao,

        @NotBlank(message = "A pauta da reunião é obrigatória")
        String pauta,

        String deliberacoes,

        @Valid
        List<AtaCompromissoRequestDTO> compromissos
) {
}
