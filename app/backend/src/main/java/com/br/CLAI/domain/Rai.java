package com.br.CLAI.domain;

import com.br.CLAI.domain.enums.TipoRelatorio;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Relatório de Acompanhamento Individualizado (RAI) bimestral. Também comporta o
 * RAE (Relatório de Atendimento Educacional) através de {@link #tipoRelatorio}.
 *
 * <p>O vínculo com {@code sigi.aluno}, {@code sigi.acompanhamento} e {@code sigi.pei}
 * é obrigatório/ facultativo conforme a DDL e permite a agregação do evento na
 * Linha do Tempo do estudante.</p>
 */
@Entity
@Table(name = "rai", schema = "sigi")
public class Rai extends BaseEntity {

    @Column(name = "aluno_id", nullable = false)
    private UUID alunoId;

    @Column(name = "pei_id")
    private UUID peiId;

    @Column(name = "acompanhamento_id")
    private UUID acompanhamentoId;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_relatorio", nullable = false, length = 20)
    private TipoRelatorio tipoRelatorio = TipoRelatorio.RAI;

    @Column(nullable = false)
    private Integer bimestre;

    /** TA3.3: indicativo de regressão dispara a notificação ao COORDENADOR. */
    @Column(name = "indicativo_regressao", nullable = false)
    private Boolean indicativoRegressao = false;

    @Column(columnDefinition = "TEXT")
    private String descricao;

    public Rai() {
    }

    public Rai(UUID alunoId, UUID peiId, UUID acompanhamentoId, TipoRelatorio tipoRelatorio,
               Integer bimestre, Boolean indicativoRegressao, String descricao) {
        this.alunoId = alunoId;
        this.peiId = peiId;
        this.acompanhamentoId = acompanhamentoId;
        this.tipoRelatorio = tipoRelatorio != null ? tipoRelatorio : TipoRelatorio.RAI;
        this.bimestre = bimestre;
        this.indicativoRegressao = indicativoRegressao != null ? indicativoRegressao : false;
        this.descricao = descricao;
    }

    /**
     * Construtor de compatibilidade com os primeiros chamadores do módulo de RAI.
     */
    public Rai(UUID id, UUID alunoId, UUID peiId, UUID acompanhamentoId, Integer bimestre,
               Boolean indicativoRegressao, String descricao, LocalDateTime criadoEm) {
        this(alunoId, peiId, acompanhamentoId, TipoRelatorio.RAI, bimestre, indicativoRegressao, descricao);
        setId(id);
        setCriadoEm(criadoEm);
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
        this.tipoRelatorio = tipoRelatorio != null ? tipoRelatorio : TipoRelatorio.RAI;
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
        this.indicativoRegressao = indicativoRegressao != null ? indicativoRegressao : false;
    }

    public String getDescricao() {
        return descricao;
    }

    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }
}
