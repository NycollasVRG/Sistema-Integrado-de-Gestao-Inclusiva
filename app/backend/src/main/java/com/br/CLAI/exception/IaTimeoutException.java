package com.br.CLAI.exception;

/** Lançada quando o motor de IA excede o timeout configurado (mapeada para HTTP 504). */
public class IaTimeoutException extends RuntimeException {
    public IaTimeoutException(String message, Throwable cause) {
        super(message, cause);
    }
}
