package com.br.CLAI.dto.response;

import com.br.CLAI.domain.enums.TipoRelatorio;
import com.br.CLAI.dto.request.RaiHabilidadeDTO;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class RaiResponseDTO {

    private UUID id;
    private UUID alunoId;
    private String nomeEstudante;
    private String matriculaEstudante;
    private String cursoEstudante;
    private UUID peiId;
    private UUID acompanhamentoId;
    private TipoRelatorio tipoRelatorio;
    private Integer bimestre;
    private Boolean indicativoRegressao;
    private String descricao;

    private String periodoLetivo;
    private String componenteCurricular;
    private String docente;

    private List<String> relacionamentoOpcoes;
    private String relacionamentoOutros;
    private String relacionamentoComentario;

    private List<String> habilidadesCognitivasOpcoes;
    private String habilidadesCognitivasOutros;
    private String habilidadesCognitivasComentario;

    private List<String> habilidadesSocioemocionaisOpcoes;
    private String habilidadesSocioemocionaisOutros;
    private String habilidadesSocioemocionaisComentario;

    private String avancosGerais;
    private String dificuldadesAprendizagem;
    private String fatoresExternos;
    private String parecer;

    private List<RaiHabilidadeDTO> habilidadesDesenvolvidas;

    private LocalDate dataRelatorio;
    private String assinaturaDocente;

    private LocalDateTime criadoEm;
    private LocalDateTime atualizadoEm;

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

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getAlunoId() { return alunoId; }
    public void setAlunoId(UUID alunoId) { this.alunoId = alunoId; }

    public String getNomeEstudante() { return nomeEstudante; }
    public void setNomeEstudante(String nomeEstudante) { this.nomeEstudante = nomeEstudante; }

    public String getMatriculaEstudante() { return matriculaEstudante; }
    public void setMatriculaEstudante(String matriculaEstudante) { this.matriculaEstudante = matriculaEstudante; }

    public String getCursoEstudante() { return cursoEstudante; }
    public void setCursoEstudante(String cursoEstudante) { this.cursoEstudante = cursoEstudante; }

    public UUID getPeiId() { return peiId; }
    public void setPeiId(UUID peiId) { this.peiId = peiId; }

    public UUID getAcompanhamentoId() { return acompanhamentoId; }
    public void setAcompanhamentoId(UUID acompanhamentoId) { this.acompanhamentoId = acompanhamentoId; }

    public TipoRelatorio getTipoRelatorio() { return tipoRelatorio; }
    public void setTipoRelatorio(TipoRelatorio tipoRelatorio) { this.tipoRelatorio = tipoRelatorio; }

    public Integer getBimestre() { return bimestre; }
    public void setBimestre(Integer bimestre) { this.bimestre = bimestre; }

    public Boolean getIndicativoRegressao() { return indicativoRegressao; }
    public void setIndicativoRegressao(Boolean indicativoRegressao) { this.indicativoRegressao = indicativoRegressao; }

    public String getDescricao() { return descricao; }
    public void setDescricao(String descricao) { this.descricao = descricao; }

    public String getPeriodoLetivo() { return periodoLetivo; }
    public void setPeriodoLetivo(String periodoLetivo) { this.periodoLetivo = periodoLetivo; }

    public String getComponenteCurricular() { return componenteCurricular; }
    public void setComponenteCurricular(String componenteCurricular) { this.componenteCurricular = componenteCurricular; }

    public String getDocente() { return docente; }
    public void setDocente(String docente) { this.docente = docente; }

    public List<String> getRelacionamentoOpcoes() { return relacionamentoOpcoes; }
    public void setRelacionamentoOpcoes(List<String> relacionamentoOpcoes) { this.relacionamentoOpcoes = relacionamentoOpcoes; }

    public String getRelacionamentoOutros() { return relacionamentoOutros; }
    public void setRelacionamentoOutros(String relacionamentoOutros) { this.relacionamentoOutros = relacionamentoOutros; }

    public String getRelacionamentoComentario() { return relacionamentoComentario; }
    public void setRelacionamentoComentario(String relacionamentoComentario) { this.relacionamentoComentario = relacionamentoComentario; }

    public List<String> getHabilidadesCognitivasOpcoes() { return habilidadesCognitivasOpcoes; }
    public void setHabilidadesCognitivasOpcoes(List<String> habilidadesCognitivasOpcoes) { this.habilidadesCognitivasOpcoes = habilidadesCognitivasOpcoes; }

    public String getHabilidadesCognitivasOutros() { return habilidadesCognitivasOutros; }
    public void setHabilidadesCognitivasOutros(String habilidadesCognitivasOutros) { this.habilidadesCognitivasOutros = habilidadesCognitivasOutros; }

    public String getHabilidadesCognitivasComentario() { return habilidadesCognitivasComentario; }
    public void setHabilidadesCognitivasComentario(String habilidadesCognitivasComentario) { this.habilidadesCognitivasComentario = habilidadesCognitivasComentario; }

    public List<String> getHabilidadesSocioemocionaisOpcoes() { return habilidadesSocioemocionaisOpcoes; }
    public void setHabilidadesSocioemocionaisOpcoes(List<String> habilidadesSocioemocionaisOpcoes) { this.habilidadesSocioemocionaisOpcoes = habilidadesSocioemocionaisOpcoes; }

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

    public List<RaiHabilidadeDTO> getHabilidadesDesenvolvidas() { return habilidadesDesenvolvidas; }
    public void setHabilidadesDesenvolvidas(List<RaiHabilidadeDTO> habilidadesDesenvolvidas) { this.habilidadesDesenvolvidas = habilidadesDesenvolvidas; }

    public LocalDate getDataRelatorio() { return dataRelatorio; }
    public void setDataRelatorio(LocalDate dataRelatorio) { this.dataRelatorio = dataRelatorio; }

    public String getAssinaturaDocente() { return assinaturaDocente; }
    public void setAssinaturaDocente(String assinaturaDocente) { this.assinaturaDocente = assinaturaDocente; }

    public LocalDateTime getCriadoEm() { return criadoEm; }
    public void setCriadoEm(LocalDateTime criadoEm) { this.criadoEm = criadoEm; }

    public LocalDateTime getAtualizadoEm() { return atualizadoEm; }
    public void setAtualizadoEm(LocalDateTime atualizadoEm) { this.atualizadoEm = atualizadoEm; }
}
