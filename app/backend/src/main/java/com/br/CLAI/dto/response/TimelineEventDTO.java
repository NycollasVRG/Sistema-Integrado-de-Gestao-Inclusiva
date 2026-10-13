package com.br.CLAI.dto.response;

import java.time.LocalDateTime;
import java.util.UUID;

public class TimelineEventDTO {

    private UUID id;
    private String tipo;
    private LocalDateTime dataCriacao;

    public TimelineEventDTO() {
    }

    public TimelineEventDTO(UUID id, String tipo, LocalDateTime dataCriacao) {
        this.id = id;
        this.tipo = tipo;
        this.dataCriacao = dataCriacao;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    public LocalDateTime getDataCriacao() {
        return dataCriacao;
    }

    public void setDataCriacao(LocalDateTime dataCriacao) {
        this.dataCriacao = dataCriacao;
    }
}