package com.br.CLAI.domain;

import com.br.CLAI.domain.enums.StatusAluno;
import com.br.CLAI.domain.enums.StatusIndicacao;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.hibernate.annotations.BatchSize;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;

/**
 * Indicação direta de um estudante por demanda espontânea (US 10).
 * Coloca o aluno em triagem ({@link StatusAluno#EM_TRIAGEM}) e aguarda decisão da equipe CLAI.
 */
@Entity
@Table(name = "indicacao", schema = "sigi")
public class Indicacao extends BaseEntity {

    @ManyToOne(optional = false)
    @JoinColumn(name = "aluno_id", nullable = false)
    private Aluno aluno;

    @ManyToOne(optional = false)
    @JoinColumn(name = "solicitante_id", nullable = false)
    private Usuario solicitante;

    @Column(name = "justificativa_pedagogica", nullable = false, columnDefinition = "TEXT")
    private String justificativaPedagogica;

    @ElementCollection
    @CollectionTable(
            name = "indicacao_disciplina",
            schema = "sigi",
            joinColumns = @JoinColumn(name = "indicacao_id")
    )
    @Column(name = "disciplina", nullable = false, length = 150)
    @BatchSize(size = 50)
    private Set<String> disciplinasObservadas = new LinkedHashSet<>();

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private StatusIndicacao status = StatusIndicacao.PENDENTE;

    @Column(name = "justificativa_decisao", columnDefinition = "TEXT")
    private String justificativaDecisao;

    @Column(name = "decidido_por")
    private UUID decididoPor;

    @Column(name = "decidido_em")
    private LocalDateTime decididoEm;

    @Enumerated(EnumType.STRING)
    @Column(name = "status_aluno_anterior", length = 20)
    private StatusAluno statusAlunoAnterior;

    @ManyToOne
    @JoinColumn(name = "estudo_de_caso_id")
    private EstudoDeCaso estudoDeCaso;

    public Indicacao() {
    }

    public Indicacao(Aluno aluno,
                     Usuario solicitante,
                     String justificativaPedagogica,
                     Collection<String> disciplinasObservadas,
                     StatusAluno statusAlunoAnterior) {
        this.aluno = aluno;
        this.solicitante = solicitante;
        this.justificativaPedagogica = justificativaPedagogica;
        setDisciplinasObservadas(disciplinasObservadas);
        this.status = StatusIndicacao.PENDENTE;
        this.statusAlunoAnterior = statusAlunoAnterior;
    }

    public Aluno getAluno() {
        return aluno;
    }

    public void setAluno(Aluno aluno) {
        this.aluno = aluno;
    }

    public Usuario getSolicitante() {
        return solicitante;
    }

    public void setSolicitante(Usuario solicitante) {
        this.solicitante = solicitante;
    }

    public String getJustificativaPedagogica() {
        return justificativaPedagogica;
    }

    public void setJustificativaPedagogica(String justificativaPedagogica) {
        this.justificativaPedagogica = justificativaPedagogica;
    }

    public Set<String> getDisciplinasObservadas() {
        return disciplinasObservadas;
    }

    public void setDisciplinasObservadas(Collection<String> disciplinasObservadas) {
        this.disciplinasObservadas = disciplinasObservadas != null
                ? new LinkedHashSet<>(disciplinasObservadas)
                : new LinkedHashSet<>();
    }

    public StatusIndicacao getStatus() {
        return status;
    }

    public void setStatus(StatusIndicacao status) {
        this.status = status;
    }

    public String getJustificativaDecisao() {
        return justificativaDecisao;
    }

    public void setJustificativaDecisao(String justificativaDecisao) {
        this.justificativaDecisao = justificativaDecisao;
    }

    public UUID getDecididoPor() {
        return decididoPor;
    }

    public void setDecididoPor(UUID decididoPor) {
        this.decididoPor = decididoPor;
    }

    public LocalDateTime getDecididoEm() {
        return decididoEm;
    }

    public void setDecididoEm(LocalDateTime decididoEm) {
        this.decididoEm = decididoEm;
    }

    public StatusAluno getStatusAlunoAnterior() {
        return statusAlunoAnterior;
    }

    public void setStatusAlunoAnterior(StatusAluno statusAlunoAnterior) {
        this.statusAlunoAnterior = statusAlunoAnterior;
    }

    public EstudoDeCaso getEstudoDeCaso() {
        return estudoDeCaso;
    }

    public void setEstudoDeCaso(EstudoDeCaso estudoDeCaso) {
        this.estudoDeCaso = estudoDeCaso;
    }
}
