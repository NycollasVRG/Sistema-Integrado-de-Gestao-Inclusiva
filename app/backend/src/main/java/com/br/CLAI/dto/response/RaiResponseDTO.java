package com.br.CLAI.dto.response;

import com.br.CLAI.domain.enums.TipoRelatorio;

import java.time.LocalDateTime;
import java.util.UUID;

public class RaiResponseDTO {

    private UUID id;
    private UUID alunoId;
    private UUID peiId;
    private UUID acompanhamentoId;
    private TipoRelatorio tipoRelatorio;
    private Integer bimestre;
    private Boolean indicativoRegressao;
    private String descricao;
    private LocalDateTime criadoEm;

    public RaiResponseDTO() {
    }

    public RaiResponseDTO(UUID id, UUID alunoId, UUID peiId, UUID acompanhamentoId, Integer bimestre,
                          Boolean indicativoRegressao, String descricao, LocalDateTime criadoEm) {
        this(id, alunoId, peiId, acompanhamentoId, TipoRelatorio.RAI, bimestre,
                indicativoRegressao, descricao, criadoEm);
    }

    public RaiResponseDTO(UUID id, UUID alunoId, UUID peiId, UUID acompanhamentoId,
                          TipoRelatorio tipoRelatorio, Integer bimestre, Boolean indicativoRegressao,
                          String descricao, LocalDateTime criadoEm) {
        this.id = id;
        this.alunoId = alunoId;
        this.peiId = peiId;
        this.acompanhamentoId = acompanhamentoId;
        this.tipoRelatorio = tipoRelatorio != null ? tipoRelatorio : TipoRelatorio.RAI;
        this.bimestre = bimestre;
        this.indicativoRegressao = indicativoRegressao;
        this.descricao = descricao;
        this.criadoEm = criadoEm;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
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

    public TipoRelatorio getTipoRelatorio() {
        return tipoRelatorio;
    }

    public void setTipoRelatorio(TipoRelatorio tipoRelatorio) {
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

    public LocalDateTime getCriadoEm() {
        return criadoEm;
    }

    public void setCriadoEm(LocalDateTime criadoEm) {
        this.criadoEm = criadoEm;
    }
}
