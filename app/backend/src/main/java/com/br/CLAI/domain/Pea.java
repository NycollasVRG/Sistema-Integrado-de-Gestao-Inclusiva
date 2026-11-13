package com.br.CLAI.domain;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "pea", schema = "sigi")
public class Pea extends BaseEntity {

    @ManyToOne
    @JoinColumn(name = "acompanhamento_id", nullable = false)
    private Acompanhamento acompanhamento;

    @ManyToOne
    @JoinColumn(name = "pei_id")
    private Pei pei;

    @Column(name = "disciplina_id")
    private UUID disciplinaId;

    @Column(name = "componente_curricular", length = 200)
    private String componenteCurricular;

    @Column(name = "semestre_ano", length = 30)
    private String semestreAno;

    @Column(name = "docente", length = 255)
    private String docente;

    @Column(name = "objetivo_geral", columnDefinition = "TEXT")
    private String objetivoGeral;

    @Column(name = "objetivos_especificos", columnDefinition = "TEXT")
    private String objetivosEspecificos;

    @Column(name = "conteudos_programaticos", columnDefinition = "TEXT")
    private String conteudosProgramaticos;

    @Column(name = "metodologia", columnDefinition = "TEXT")
    private String metodologia;

    @Column(name = "avaliacao", columnDefinition = "TEXT")
    private String avaliacao;

    @Column(name = "bibliografia_basica", columnDefinition = "TEXT")
    private String bibliografiaBasica;

    @Column(name = "bibliografia_complementar", columnDefinition = "TEXT")
    private String bibliografiaComplementar;

    public Pea() {
    }

    public Pea(Acompanhamento acompanhamento, UUID disciplinaId, String objetivoGeral, String metodologia, String avaliacao) {
        this.acompanhamento = acompanhamento;
        this.disciplinaId = disciplinaId;
        this.objetivoGeral = objetivoGeral;
        this.metodologia = metodologia;
        this.avaliacao = avaliacao;
    }

    public Pea(
            Acompanhamento acompanhamento,
            Pei pei,
            UUID disciplinaId,
            String componenteCurricular,
            String semestreAno,
            String docente,
            String objetivoGeral,
            String objetivosEspecificos,
            String conteudosProgramaticos,
            String metodologia,
            String avaliacao,
            String bibliografiaBasica,
            String bibliografiaComplementar) {
        this.acompanhamento = acompanhamento;
        this.pei = pei;
        this.disciplinaId = disciplinaId;
        this.componenteCurricular = componenteCurricular;
        this.semestreAno = semestreAno;
        this.docente = docente;
        this.objetivoGeral = objetivoGeral;
        this.objetivosEspecificos = objetivosEspecificos;
        this.conteudosProgramaticos = conteudosProgramaticos;
        this.metodologia = metodologia;
        this.avaliacao = avaliacao;
        this.bibliografiaBasica = bibliografiaBasica;
        this.bibliografiaComplementar = bibliografiaComplementar;
    }

    public Acompanhamento getAcompanhamento() {
        return acompanhamento;
    }

    public void setAcompanhamento(Acompanhamento acompanhamento) {
        this.acompanhamento = acompanhamento;
    }

    public Pei getPei() {
        return pei;
    }

    public void setPei(Pei pei) {
        this.pei = pei;
    }

    public UUID getDisciplinaId() {
        return disciplinaId;
    }

    public void setDisciplinaId(UUID disciplinaId) {
        this.disciplinaId = disciplinaId;
    }

    public String getComponenteCurricular() {
        return componenteCurricular;
    }

    public void setComponenteCurricular(String componenteCurricular) {
        this.componenteCurricular = componenteCurricular;
    }

    public String getSemestreAno() {
        return semestreAno;
    }

    public void setSemestreAno(String semestreAno) {
        this.semestreAno = semestreAno;
    }

    public String getDocente() {
        return docente;
    }

    public void setDocente(String docente) {
        this.docente = docente;
    }

    public String getObjetivoGeral() {
        return objetivoGeral;
    }

    public void setObjetivoGeral(String objetivoGeral) {
        this.objetivoGeral = objetivoGeral;
    }

    public String getObjetivosEspecificos() {
        return objetivosEspecificos;
    }

    public void setObjetivosEspecificos(String objetivosEspecificos) {
        this.objetivosEspecificos = objetivosEspecificos;
    }

    public String getConteudosProgramaticos() {
        return conteudosProgramaticos;
    }

    public void setConteudosProgramaticos(String conteudosProgramaticos) {
        this.conteudosProgramaticos = conteudosProgramaticos;
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

    public String getBibliografiaBasica() {
        return bibliografiaBasica;
    }

    public void setBibliografiaBasica(String bibliografiaBasica) {
        this.bibliografiaBasica = bibliografiaBasica;
    }

    public String getBibliografiaComplementar() {
        return bibliografiaComplementar;
    }

    public void setBibliografiaComplementar(String bibliografiaComplementar) {
        this.bibliografiaComplementar = bibliografiaComplementar;
    }
}
