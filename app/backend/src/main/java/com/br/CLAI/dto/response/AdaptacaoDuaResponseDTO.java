package com.br.CLAI.dto.response;

import java.time.LocalDateTime;
import java.util.List;

/** Preview da prova adaptada (TA7.3): o professor aceita, edita ou rejeita antes do download. */
public record AdaptacaoDuaResponseDTO(
        String textoOriginal,
        String textoAdaptado,
        List<String> tagsDificuldadeAplicadas,
        List<String> orientacoesAplicacao,
        List<QuestaoAdaptadaDuaDTO> questoesAdaptadas,
        boolean complexidadePreservada,
        String promptDuaAplicado,
        LocalDateTime geradoEm
) {
}
