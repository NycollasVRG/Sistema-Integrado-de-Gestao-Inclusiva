package com.br.CLAI.domain.enums;

/**
 * Escopo de exportação do Dossiê Jurídico do estudante (US 06 / TA6.2 / TA6.4).
 * <ul>
 *     <li>{@code INTERNO}: Defesa institucional completa para órgãos de controle (MPF/BDL).</li>
 *     <li>{@code EXTERNO}: Transferências e envios externos — omite automaticamente laudos médicos
 *     e registros clínicos de nível {@code SUPER_RESTRICAO} conforme LGPD (TA6.4).</li>
 * </ul>
 */
public enum EscopoDossie {
    INTERNO,
    EXTERNO
}
