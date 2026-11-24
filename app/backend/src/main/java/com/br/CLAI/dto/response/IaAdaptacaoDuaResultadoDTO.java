package com.br.CLAI.dto.response;

import java.util.List;

/** Resposta estruturada devolvida pelo motor de IA. */
public record IaAdaptacaoDuaResultadoDTO(
        String textoAdaptado,
        List<QuestaoAdaptadaDuaDTO> questoesAdaptadas,
        List<String> orientacoesAplicacao,
        Boolean complexidadePreservada
) {
}
