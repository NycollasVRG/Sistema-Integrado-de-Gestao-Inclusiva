package com.br.CLAI.dto.request;

import java.util.List;

/**
 * Payload enviado ao motor de IA (TA7.1 - Data Minimization / LGPD).
 * Por construção, contém APENAS o texto da prova, os nomes das tags de dificuldade e o prompt DUA.
 * Não possui campos para nome, matrícula, CPF, alunoId nem diagnósticos/laudos.
 */
public record IaAdaptacaoDuaPayloadDTO(
        String textoProva,
        List<String> tagsDificuldade,
        String promptDua
) {
}
