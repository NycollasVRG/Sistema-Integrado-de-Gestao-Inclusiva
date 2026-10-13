package com.br.CLAI.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public class PeiRequestDTO {

    @NotNull(message = "O ID do acompanhamento é obrigatório")
    private UUID acompanhamentoId;

    @NotBlank(message = "Os conhecimentos, habilidades e interesses são obrigatórios")
    private String habilidadesInteresses;

    @NotBlank(message = "As propostas de adaptações curriculares são obrigatórias")
    private String propostasAdaptacoes;

    public PeiRequestDTO() {
    }

    public UUID getAcompanhamentoId() {
        return acompanhamentoId;
    }

    public void setAcompanhamentoId(UUID acompanhamentoId) {
        this.acompanhamentoId = acompanhamentoId;
    }

    public String getHabilidadesInteresses() {
        return habilidadesInteresses;
    }

    public void setHabilidadesInteresses(String habilidadesInteresses) {
        this.habilidadesInteresses = habilidadesInteresses;
    }

    public String getPropostasAdaptacoes() {
        return propostasAdaptacoes;
    }

    public void setPropostasAdaptacoes(String propostasAdaptacoes) {
        this.propostasAdaptacoes = propostasAdaptacoes;
    }
}
