package com.br.CLAI.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public class RaiRequestDTO {

    @NotNull(message = "O identificador do estudante é obrigatório.")
    private UUID alunoId;

    private UUID peiId;

    private UUID acompanhamentoId;

    /** Opcional; quando omitido o relatório é registrado como RAI. */
    @Size(max = 20, message = "O tipo de relatório deve ser RAI ou RAE.")
    private String tipoRelatorio;

    @NotNull(message = "O bimestre de referência é obrigatório.")
    @Min(value = 1, message = "O bimestre deve estar entre 1 e 4.")
    @Max(value = 4, message = "O bimestre deve estar entre 1 e 4.")
    private Integer bimestre;

    private Boolean indicativoRegressao;

    @Size(max = 5000, message = "A descrição não pode exceder 5000 caracteres.")
    private String descricao;

    public RaiRequestDTO() {
    }

    public RaiRequestDTO(UUID alunoId, UUID peiId, UUID acompanhamentoId, Integer bimestre,
                         Boolean indicativoRegressao, String descricao) {
        this(alunoId, peiId, acompanhamentoId, "RAI", bimestre, indicativoRegressao, descricao);
    }

    public RaiRequestDTO(UUID alunoId, UUID peiId, UUID acompanhamentoId, String tipoRelatorio,
                         Integer bimestre, Boolean indicativoRegressao, String descricao) {
        this.alunoId = alunoId;
        this.peiId = peiId;
        this.acompanhamentoId = acompanhamentoId;
        this.tipoRelatorio = tipoRelatorio;
        this.bimestre = bimestre;
        this.indicativoRegressao = indicativoRegressao;
        this.descricao = descricao;
    }

    public UUID getAlunoId() {
        return alunoId;
    }

    public void setAlunoId(UUID alunoId) {
        this.alunoId = alunoId;
    }

    public UUID getPeiId() {
        return peiId;
    }

    public void setPeiId(UUID peiId) {
        this.peiId = peiId;
    }

    public UUID getAcompanhamentoId() {
        return acompanhamentoId;
    }

    public void setAcompanhamentoId(UUID acompanhamentoId) {
        this.acompanhamentoId = acompanhamentoId;
    }

    public String getTipoRelatorio() {
        return tipoRelatorio;
    }

    public void setTipoRelatorio(String tipoRelatorio) {
        this.tipoRelatorio = tipoRelatorio;
    }

    public Integer getBimestre() {
        return bimestre;
    }

    public void setBimestre(Integer bimestre) {
        this.bimestre = bimestre;
    }

    public Boolean getIndicativoRegressao() {
        return indicativoRegressao;
    }

    public void setIndicativoRegressao(Boolean indicativoRegressao) {
        this.indicativoRegressao = indicativoRegressao;
    }

    public String getDescricao() {
        return descricao;
    }

    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }
}
