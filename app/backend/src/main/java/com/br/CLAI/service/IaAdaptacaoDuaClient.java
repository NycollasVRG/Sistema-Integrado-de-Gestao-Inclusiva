package com.br.CLAI.service;

import com.br.CLAI.dto.request.IaAdaptacaoDuaPayloadDTO;
import com.br.CLAI.dto.response.IaAdaptacaoDuaResultadoDTO;

/** Porta de integração com o motor de IA para adaptação DUA (US 07). */
public interface IaAdaptacaoDuaClient {

    /**
     * @throws com.br.CLAI.exception.IaTimeoutException     em caso de timeout
     * @throws com.br.CLAI.exception.IaIndisponivelException em caso de falha/indisponibilidade
     */
    IaAdaptacaoDuaResultadoDTO solicitarAdaptacao(IaAdaptacaoDuaPayloadDTO payload);
}
