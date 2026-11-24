package com.br.CLAI.dto.response;

import java.util.List;

/** Questão reestruturada para preview/edição pelo professor (TA7.3 / TA7.4). */
public record QuestaoAdaptadaDuaDTO(
        Integer numero,
        String enunciadoOriginal,
        String comandoDestacado,
        List<String> enunciadoFragmentado,
        String textoAdaptado,
        List<String> adaptacoesVisuaisAplicadas
) {
}
