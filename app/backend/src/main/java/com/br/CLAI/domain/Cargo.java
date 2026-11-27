package com.br.CLAI.domain;

import com.br.CLAI.domain.enums.NivelRestricao;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;

/**
 * Entidade de domínio representando um cargo institucional no SIGI/CLAI.
 * Os cargos estruturais de RBAC possuem {@code sistema = true} e são protegidos contra exclusão
 * ou alteração de código identificador.
 */
@Entity
@Table(name = "cargo", schema = "sigi")
public class Cargo extends BaseEntity {

    @Column(name = "codigo", nullable = false, length = 50)
    private String codigo;

    @Column(name = "nome", nullable = false, length = 100)
    private String nome;

    @Column(name = "descricao", columnDefinition = "TEXT")
    private String descricao;

    @Enumerated(EnumType.STRING)
    @Column(name = "nivel_restricao_padrao", nullable = false, length = 50)
    private NivelRestricao nivelRestricaoPadrao;

    @Column(name = "autorizacao_saude_padrao", nullable = false)
    private Boolean autorizacaoSaudePadrao = Boolean.FALSE;

    @Column(name = "ativo", nullable = false)
    private Boolean ativo = Boolean.TRUE;

    @Column(name = "sistema", nullable = false)
    private Boolean sistema = Boolean.FALSE;

    public Cargo() {
    }

    public Cargo(
            String codigo,
            String nome,
            String descricao,
            NivelRestricao nivelRestricaoPadrao,
            Boolean autorizacaoSaudePadrao,
            Boolean ativo,
            Boolean sistema
    ) {
        this.codigo = codigo;
        this.nome = nome;
        this.descricao = descricao;
        this.nivelRestricaoPadrao = nivelRestricaoPadrao;
        this.autorizacaoSaudePadrao = autorizacaoSaudePadrao != null ? autorizacaoSaudePadrao : Boolean.FALSE;
        this.ativo = ativo != null ? ativo : Boolean.TRUE;
        this.sistema = sistema != null ? sistema : Boolean.FALSE;
    }

    public String getCodigo() {
        return codigo;
    }

    public void setCodigo(String codigo) {
        this.codigo = codigo;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getDescricao() {
        return descricao;
    }

    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }

    public NivelRestricao getNivelRestricaoPadrao() {
        return nivelRestricaoPadrao;
    }

    public void setNivelRestricaoPadrao(NivelRestricao nivelRestricaoPadrao) {
        this.nivelRestricaoPadrao = nivelRestricaoPadrao;
    }

    public Boolean getAutorizacaoSaudePadrao() {
        return autorizacaoSaudePadrao;
    }

    public void setAutorizacaoSaudePadrao(Boolean autorizacaoSaudePadrao) {
        this.autorizacaoSaudePadrao = autorizacaoSaudePadrao;
    }

    public Boolean getAtivo() {
        return ativo;
    }

    public void setAtivo(Boolean ativo) {
        this.ativo = ativo;
    }

    public Boolean getSistema() {
        return sistema;
    }

    public void setSistema(Boolean sistema) {
        this.sistema = sistema;
    }
}
