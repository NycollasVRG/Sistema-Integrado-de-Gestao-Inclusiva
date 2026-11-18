package com.br.CLAI.domain;

import com.br.CLAI.domain.enums.TipoAtendimento;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.LocalDate;

/**
 * Registro de atendimento diário prestado a um estudante (US 04).
 * Herda auditoria e @SoftDelete de {@link BaseEntity}. A autoria ({@code criadoPor}) e o
 * instante de criação ({@code criadoEm}) sustentam a trava de edição de 24h.
 */
@Entity
@Table(name = "atendimento", schema = "sigi")
public class Atendimento extends BaseEntity {

    @ManyToOne(optional = false)
    @JoinColumn(name = "aluno_id", nullable = false)
    private Aluno aluno;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_atendimento", nullable = false, length = 30)
    private TipoAtendimento tipoAtendimento;

    @Column(name = "data_atendimento", nullable = false)
    private LocalDate dataAtendimento;

    @Column(name = "profissional_responsavel", nullable = false)
    private String profissionalResponsavel;

    @Column(name = "descricao", nullable = false, columnDefinition = "TEXT")
    private String descricao;

    @Column(name = "encaminhamentos", columnDefinition = "TEXT")
    private String encaminhamentos;

    public Atendimento() {
    }

    public Atendimento(Aluno aluno,
                       TipoAtendimento tipoAtendimento,
                       LocalDate dataAtendimento,
                       String profissionalResponsavel,
                       String descricao,
                       String encaminhamentos) {
        this.aluno = aluno;
        this.tipoAtendimento = tipoAtendimento;
        this.dataAtendimento = dataAtendimento;
        this.profissionalResponsavel = profissionalResponsavel;
        this.descricao = descricao;
        this.encaminhamentos = encaminhamentos;
    }

    public Aluno getAluno() {
        return aluno;
    }

    public void setAluno(Aluno aluno) {
        this.aluno = aluno;
    }

    public TipoAtendimento getTipoAtendimento() {
        return tipoAtendimento;
    }

    public void setTipoAtendimento(TipoAtendimento tipoAtendimento) {
        this.tipoAtendimento = tipoAtendimento;
    }

    public LocalDate getDataAtendimento() {
        return dataAtendimento;
    }

    public void setDataAtendimento(LocalDate dataAtendimento) {
        this.dataAtendimento = dataAtendimento;
    }

    public String getProfissionalResponsavel() {
        return profissionalResponsavel;
    }

    public void setProfissionalResponsavel(String profissionalResponsavel) {
        this.profissionalResponsavel = profissionalResponsavel;
    }

    public String getDescricao() {
        return descricao;
    }

    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }

    public String getEncaminhamentos() {
        return encaminhamentos;
    }

    public void setEncaminhamentos(String encaminhamentos) {
        this.encaminhamentos = encaminhamentos;
    }
}
