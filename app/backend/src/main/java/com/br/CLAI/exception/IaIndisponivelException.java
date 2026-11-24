package com.br.CLAI.exception;

/** Lançada quando o motor de IA está inacessível ou responde com erro (mapeada para HTTP 503). */
public class IaIndisponivelException extends RuntimeException {
    public IaIndisponivelException(String message, Throwable cause) {
        super(message, cause);
    }
}
