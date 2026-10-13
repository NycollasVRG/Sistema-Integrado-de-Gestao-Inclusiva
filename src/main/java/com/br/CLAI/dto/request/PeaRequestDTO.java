package com.br.CLAI.dto.request;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public class PeaRequestDTO {

    @NotNull
    private UUID acompanhamentoId;

    private UUID disciplinaId;

    private String objetivoGeral;

    private String metodologia;

    private String avaliacao;

    public UUID getAcompanhamentoId() {
        return acompanhamentoId;
    }

    public void setAcompanhamentoId(UUID acompanhamentoId) {
        this.acompanhamentoId = acompanhamentoId;
    }

    public UUID getDisciplinaId() {
        return disciplinaId;
    }

    public void setDisciplinaId(UUID disciplinaId) {
        this.disciplinaId = disciplinaId;
    }

    public String getObjetivoGeral() {
        return objetivoGeral;
    }

    public void setObjetivoGeral(String objetivoGeral) {
        this.objetivoGeral = objetivoGeral;
    }

    public String getMetodologia() {
        return metodologia;
    }

    public void setMetodologia(String metodologia) {
        this.metodologia = metodologia;
    }

    public String getAvaliacao() {
        return avaliacao;
    }

    public void setAvaliacao(String avaliacao) {
        this.avaliacao = avaliacao;
    }
}