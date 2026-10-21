package com.br.CLAI.domain;

import com.br.CLAI.domain.enums.NivelRestricao;
import com.br.CLAI.domain.enums.Role;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;

@Entity
@Table(name = "usuario", schema = "sigi")
public class Usuario extends BaseEntity {

    @Column(name = "nome", nullable = false)
    private String nome;

    @Column(name = "email", nullable = false, unique = true)
    private String email;

    @Column(name = "senha", nullable = false)
    private String senha;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 50)
    private Role role;

    @Enumerated(EnumType.STRING)
    @Column(name = "nivel_restricao", nullable = false, length = 50)
    private NivelRestricao nivelRestricao;

    @Column(name = "autorizacao_saude", nullable = false)
    private Boolean autorizacaoSaude = false;

    @Column(name = "acesso_ativo", nullable = false)
    private Boolean acessoAtivo = true;

    @Column(name = "token_version", nullable = false)
    private Integer tokenVersion = 1;

    public Usuario() {
    }

    public Usuario(String nome, String email, String senha, Role role, NivelRestricao nivelRestricao, Boolean autorizacaoSaude) {
        this.nome = nome;
        this.email = email;
        this.senha = senha;
        this.role = role;
        this.nivelRestricao = nivelRestricao;
        this.autorizacaoSaude = autorizacaoSaude != null ? autorizacaoSaude : false;
        this.acessoAtivo = true;
        this.tokenVersion = 1;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getSenha() {
        return senha;
    }

    public void setSenha(String senha) {
        this.senha = senha;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public NivelRestricao getNivelRestricao() {
        return nivelRestricao;
    }

    public void setNivelRestricao(NivelRestricao nivelRestricao) {
        this.nivelRestricao = nivelRestricao;
    }

    public Boolean getAutorizacaoSaude() {
        return autorizacaoSaude;
    }

    public void setAutorizacaoSaude(Boolean autorizacaoSaude) {
        this.autorizacaoSaude = autorizacaoSaude;
    }

    public Boolean getAcessoAtivo() {
        return acessoAtivo;
    }

    public void setAcessoAtivo(Boolean acessoAtivo) {
        this.acessoAtivo = acessoAtivo;
    }

    public Integer getTokenVersion() {
        return tokenVersion;
    }

    public void setTokenVersion(Integer tokenVersion) {
        this.tokenVersion = tokenVersion;
    }

    public void incrementarTokenVersion() {
        if (this.tokenVersion == null) {
            this.tokenVersion = 1;
        }
        this.tokenVersion++;
    }
}
