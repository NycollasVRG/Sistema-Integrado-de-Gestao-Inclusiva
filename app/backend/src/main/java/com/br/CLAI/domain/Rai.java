package com.br.CLAI.domain;

import com.br.CLAI.domain.enums.TipoRelatorio;
import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Relatório de Acompanhamento Individualizado (RAI - Anexo V). Também comporta o
 * RAE (Relatório de Atendimento Educacional) através de {@link #tipoRelatorio}.
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

    // Cabeçalho Anexo V
    @Column(name = "periodo_letivo", length = 30)
    private String periodoLetivo;

    @Column(name = "componente_curricular", length = 200)
    private String componenteCurricular;

    @Column(name = "docente", length = 255)
    private String docente;

    // Aspectos Observados — Relacionamento
    @Column(name = "relacionamento_opcoes", columnDefinition = "TEXT")
    private String relacionamentoOpcoes;

    @Column(name = "relacionamento_outros", length = 255)
    private String relacionamentoOutros;

    @Column(name = "relacionamento_comentario", columnDefinition = "TEXT")
    private String relacionamentoComentario;

    // Aspectos Observados — Habilidades Cognitivas
    @Column(name = "habilidades_cognitivas_opcoes", columnDefinition = "TEXT")
    private String habilidadesCognitivasOpcoes;

    @Column(name = "habilidades_cognitivas_outros", length = 255)
    private String habilidadesCognitivasOutros;

    @Column(name = "habilidades_cognitivas_comentario", columnDefinition = "TEXT")
    private String habilidadesCognitivasComentario;

    // Aspectos Observados — Habilidades Socioemocionais
    @Column(name = "habilidades_socioemocionais_opcoes", columnDefinition = "TEXT")
    private String habilidadesSocioemocionaisOpcoes;

    @Column(name = "habilidades_socioemocionais_outros", length = 255)
    private String habilidadesSocioemocionaisOutros;

    @Column(name = "habilidades_socioemocionais_comentario", columnDefinition = "TEXT")
    private String habilidadesSocioemocionaisComentario;

    // Relatos e Parecer do Anexo V
    @Column(name = "avancos_gerais", columnDefinition = "TEXT")
    private String avancosGerais;

    @Column(name = "dificuldades_aprendizagem", columnDefinition = "TEXT")
    private String dificuldadesAprendizagem;

    @Column(name = "fatores_externos", columnDefinition = "TEXT")
    private String fatoresExternos;

    @Column(name = "parecer", columnDefinition = "TEXT")
    private String parecer;

    // Rodapé — Data e Assinatura do(a) Docente
    @Column(name = "data_relatorio")
    private LocalDate dataRelatorio;

    @Column(name = "assinatura_docente", length = 255)
    private String assinaturaDocente;

    @OneToMany(mappedBy = "rai", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("ordem ASC")
    private List<RaiHabilidade> habilidadesDesenvolvidas = new ArrayList<>();

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

    public Rai(UUID id, UUID alunoId, UUID peiId, UUID acompanhamentoId, Integer bimestre,
               Boolean indicativoRegressao, String descricao, LocalDateTime criadoEm) {
        this(alunoId, peiId, acompanhamentoId, TipoRelatorio.RAI, bimestre, indicativoRegressao, descricao);
        setId(id);
        setCriadoEm(criadoEm);
    }

    public void substituirHabilidades(List<RaiHabilidade> novas) {
        this.habilidadesDesenvolvidas.clear();
        if (novas != null) {
            for (RaiHabilidade h : novas) {
                h.setRai(this);
                this.habilidadesDesenvolvidas.add(h);
            }
        }
    }

    public UUID getAlunoId() { return alunoId; }
    public void setAlunoId(UUID alunoId) { this.alunoId = alunoId; }

    public UUID getPeiId() { return peiId; }
    public void setPeiId(UUID peiId) { this.peiId = peiId; }

    public UUID getAcompanhamentoId() { return acompanhamentoId; }
    public void setAcompanhamentoId(UUID acompanhamentoId) { this.acompanhamentoId = acompanhamentoId; }

    public TipoRelatorio getTipoRelatorio() { return tipoRelatorio; }
    public void setTipoRelatorio(TipoRelatorio tipoRelatorio) {
        this.tipoRelatorio = tipoRelatorio != null ? tipoRelatorio : TipoRelatorio.RAI;
    }

    public Integer getBimestre() { return bimestre; }
    public void setBimestre(Integer bimestre) { this.bimestre = bimestre; }

    public Boolean getIndicativoRegressao() { return indicativoRegressao; }
    public void setIndicativoRegressao(Boolean indicativoRegressao) {
        this.indicativoRegressao = indicativoRegressao != null ? indicativoRegressao : false;
    }

    public String getDescricao() { return descricao; }
    public void setDescricao(String descricao) { this.descricao = descricao; }

    public String getPeriodoLetivo() { return periodoLetivo; }
    public void setPeriodoLetivo(String periodoLetivo) { this.periodoLetivo = periodoLetivo; }

    public String getComponenteCurricular() { return componenteCurricular; }
    public void setComponenteCurricular(String componenteCurricular) { this.componenteCurricular = componenteCurricular; }

    public String getDocente() { return docente; }
    public void setDocente(String docente) { this.docente = docente; }

    public String getRelacionamentoOpcoes() { return relacionamentoOpcoes; }
    public void setRelacionamentoOpcoes(String relacionamentoOpcoes) { this.relacionamentoOpcoes = relacionamentoOpcoes; }

    public String getRelacionamentoOutros() { return relacionamentoOutros; }
    public void setRelacionamentoOutros(String relacionamentoOutros) { this.relacionamentoOutros = relacionamentoOutros; }

    public String getRelacionamentoComentario() { return relacionamentoComentario; }
    public void setRelacionamentoComentario(String relacionamentoComentario) { this.relacionamentoComentario = relacionamentoComentario; }

    public String getHabilidadesCognitivasOpcoes() { return habilidadesCognitivasOpcoes; }
    public void setHabilidadesCognitivasOpcoes(String habilidadesCognitivasOpcoes) { this.habilidadesCognitivasOpcoes = habilidadesCognitivasOpcoes; }

    public String getHabilidadesCognitivasOutros() { return habilidadesCognitivasOutros; }
    public void setHabilidadesCognitivasOutros(String habilidadesCognitivasOutros) { this.habilidadesCognitivasOutros = habilidadesCognitivasOutros; }

    public String getHabilidadesCognitivasComentario() { return habilidadesCognitivasComentario; }
    public void setHabilidadesCognitivasComentario(String habilidadesCognitivasComentario) { this.habilidadesCognitivasComentario = habilidadesCognitivasComentario; }

    public String getHabilidadesSocioemocionaisOpcoes() { return habilidadesSocioemocionaisOpcoes; }
    public void setHabilidadesSocioemocionaisOpcoes(String habilidadesSocioemocionaisOpcoes) { this.habilidadesSocioemocionaisOpcoes = habilidadesSocioemocionaisOpcoes; }

    public String getHabilidadesSocioemocionaisOutros() { return habilidadesSocioemocionaisOutros; }
    public void setHabilidadesSocioemocionaisOutros(String habilidadesSocioemocionaisOutros) { this.habilidadesSocioemocionaisOutros = habilidadesSocioemocionaisOutros; }

    public String getHabilidadesSocioemocionaisComentario() { return habilidadesSocioemocionaisComentario; }
    public void setHabilidadesSocioemocionaisComentario(String habilidadesSocioemocionaisComentario) { this.habilidadesSocioemocionaisComentario = habilidadesSocioemocionaisComentario; }

    public String getAvancosGerais() { return avancosGerais; }
    public void setAvancosGerais(String avancosGerais) { this.avancosGerais = avancosGerais; }

    public String getDificuldadesAprendizagem() { return dificuldadesAprendizagem; }
    public void setDificuldadesAprendizagem(String dificuldadesAprendizagem) { this.dificuldadesAprendizagem = dificuldadesAprendizagem; }

    public String getFatoresExternos() { return fatoresExternos; }
    public void setFatoresExternos(String fatoresExternos) { this.fatoresExternos = fatoresExternos; }

    public String getParecer() { return parecer; }
    public void setParecer(String parecer) { this.parecer = parecer; }

    public LocalDate getDataRelatorio() { return dataRelatorio; }
    public void setDataRelatorio(LocalDate dataRelatorio) { this.dataRelatorio = dataRelatorio; }

    public String getAssinaturaDocente() { return assinaturaDocente; }
    public void setAssinaturaDocente(String assinaturaDocente) { this.assinaturaDocente = assinaturaDocente; }

    public List<RaiHabilidade> getHabilidadesDesenvolvidas() { return habilidadesDesenvolvidas; }
    public void setHabilidadesDesenvolvidas(List<RaiHabilidade> habilidadesDesenvolvidas) {
        this.habilidadesDesenvolvidas = habilidadesDesenvolvidas != null ? habilidadesDesenvolvidas : new ArrayList<>();
    }
}
