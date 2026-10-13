package com.br.CLAI.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public class PeaRequestDTO {

    @NotNull(message = "O ID do acompanhamento é obrigatório")
    private UUID acompanhamentoId;

    private UUID disciplinaId;

    @NotBlank(message = "O objetivo geral é obrigatório")
    private String objetivoGeral;

    @NotBlank(message = "A metodologia é obrigatória")
    private String metodologia;

    @NotBlank(message = "A avaliação é obrigatória")
    private String avaliacao;

    public PeaRequestDTO() {
    }

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