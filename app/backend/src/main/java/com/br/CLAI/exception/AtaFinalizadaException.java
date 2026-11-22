package com.br.CLAI.exception;

import java.util.UUID;

/**
 * Exceção lançada ao tentar alterar via PUT/upload/assinatura uma ata já FINALIZADA (TA8.4).
 * Traduzida para HTTP 409 Conflict (RFC 9457) indicando o endpoint de Termo Aditivo.
 */
public class AtaFinalizadaException extends RuntimeException {

    private final UUID ataId;

    public AtaFinalizadaException(UUID ataId) {
        super("Atas finalizadas não podem ser alteradas. Registre um termo aditivo explicativo.");
        this.ataId = ataId;
    }

    public AtaFinalizadaException(UUID ataId, String message) {
        super(message);
        this.ataId = ataId;
    }

    public UUID getAtaId() {
        return ataId;
    }
}
