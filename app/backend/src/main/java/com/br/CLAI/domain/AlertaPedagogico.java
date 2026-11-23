package com.br.CLAI.domain;

import com.br.CLAI.domain.enums.SeveridadeAlerta;
import com.br.CLAI.domain.enums.TipoAlertaPedagogico;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entidade de alerta pedagógico e indicador de risco acadêmico do Dashboard CLAI (US 05 / Issue #106).
 */
@Entity
@Table(name = "alerta_pedagogico", schema = "sigi")
public class AlertaPedagogico extends BaseEntity {

    @ManyToOne
    @JoinColumn(name = "aluno_id", nullable = false)
    private Aluno aluno;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_alerta", nullable = false, length = 50)
    private TipoAlertaPedagogico tipoAlerta;

    @Enumerated(EnumType.STRING)
    @Column(name = "severidade", nullable = false, length = 20)
    private SeveridadeAlerta severidade;

    @Column(name = "unidade", length = 100)
    private String unidade;

    @Column(name = "curso", length = 100)
    private String curso;

    @Column(name = "turma", length = 50)
    private String turma;

    @Column(name = "descricao", nullable = false, columnDefinition = "TEXT")
    private String descricao;

    @Column(name = "tratado", nullable = false)
    private Boolean tratado = Boolean.FALSE;

    @Column(name = "tratado_por")
    private UUID tratadoPor;

    @Column(name = "tratado_em")
    private LocalDateTime tratadoEm;

    public AlertaPedagogico() {
    }

    public AlertaPedagogico(
            Aluno aluno,
            TipoAlertaPedagogico tipoAlerta,
            SeveridadeAlerta severidade,
            String unidade,
            String curso,
            String turma,
            String descricao
    ) {
        this.aluno = aluno;
        this.tipoAlerta = tipoAlerta;
        this.severidade = severidade;
        this.unidade = unidade;
        this.curso = curso;
        this.turma = turma;
        this.descricao = descricao;
        this.tratado = Boolean.FALSE;
    }

    public Aluno getAluno() {
        return aluno;
    }

    public void setAluno(Aluno aluno) {
        this.aluno = aluno;
    }

    public TipoAlertaPedagogico getTipoAlerta() {
        return tipoAlerta;
    }

    public void setTipoAlerta(TipoAlertaPedagogico tipoAlerta) {
        this.tipoAlerta = tipoAlerta;
    }

    public SeveridadeAlerta getSeveridade() {
        return severidade;
    }

    public void setSeveridade(SeveridadeAlerta severidade) {
        this.severidade = severidade;
    }

    public String getUnidade() {
        return unidade;
    }

    public void setUnidade(String unidade) {
        this.unidade = unidade;
    }

    public String getCurso() {
        return curso;
    }

    public void setCurso(String curso) {
        this.curso = curso;
    }

    public String getTurma() {
        return turma;
    }

    public void setTurma(String turma) {
        this.turma = turma;
    }

    public String getDescricao() {
        return descricao;
    }

    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }

    public Boolean getTratado() {
        return tratado;
    }

    public void setTratado(Boolean tratado) {
        this.tratado = tratado;
    }

    public UUID getTratadoPor() {
        return tratadoPor;
    }

    public void setTratadoPor(UUID tratadoPor) {
        this.tratadoPor = tratadoPor;
    }

    public LocalDateTime getTratadoEm() {
        return tratadoEm;
    }

    public void setTratadoEm(LocalDateTime tratadoEm) {
        this.tratadoEm = tratadoEm;
    }
}
