package com.br.CLAI.domain;

import com.br.CLAI.domain.enums.StatusAluno;
import jakarta.persistence.*;
import org.hibernate.annotations.BatchSize;

import java.util.LinkedHashSet;
import java.util.Set;

@Entity
@Table(name = "aluno", schema = "sigi")
public class Aluno extends BaseEntity {

    @Column(name = "nome", nullable = false)
    private String nomeCompleto;

    @Column(name = "matricula", nullable = false, unique = true, length = 50)
    private String matricula;

    @Column(name = "curso", length = 100)
    private String curso;

    @Column(name = "turma", length = 50)
    private String turma;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private StatusAluno status = StatusAluno.ATIVO;

    /**
     * Inativação lógica de negócio (US 12). Não confundir com o @SoftDelete do Hibernate (coluna "deleted"),
     * que esconde a linha das consultas e quebraria os vínculos com Estudo de Caso, PEI e PEA.
     */
    @Column(name = "ativo", nullable = false)
    private Boolean ativo = Boolean.TRUE;

    @ManyToMany
    @JoinTable(
            name = "aluno_tag_dificuldade",
            schema = "sigi",
            joinColumns = @JoinColumn(name = "aluno_id"),
            inverseJoinColumns = @JoinColumn(name = "indicador_id")
    )
    @BatchSize(size = 50)
    private Set<IndicadorReutilizavel> tagsDificuldade = new LinkedHashSet<>();

    public Aluno() {
    }

    public Aluno(String nomeCompleto, String matricula) {
        this.nomeCompleto = nomeCompleto;
        this.matricula = matricula;
    }

    public String getNomeCompleto() {
        return nomeCompleto;
    }

    public void setNomeCompleto(String nomeCompleto) {
        this.nomeCompleto = nomeCompleto;
    }

    public String getMatricula() {
        return matricula;
    }

    public void setMatricula(String matricula) {
        this.matricula = matricula;
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

    public StatusAluno getStatus() {
        return status;
    }

    public void setStatus(StatusAluno status) {
        this.status = status;
    }

    public Boolean getAtivo() {
        return ativo;
    }

    public void setAtivo(Boolean ativo) {
        this.ativo = ativo;
    }

    public Set<IndicadorReutilizavel> getTagsDificuldade() {
        return tagsDificuldade;
    }

    public void setTagsDificuldade(Set<IndicadorReutilizavel> tagsDificuldade) {
        this.tagsDificuldade = tagsDificuldade;
    }
}
