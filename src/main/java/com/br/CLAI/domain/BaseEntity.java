package com.br.CLAI.domain;

import jakarta.persistence.MappedSuperclass;
import org.hibernate.annotations.SoftDelete;

@MappedSuperclass
@SoftDelete
@jakarta.persistence.EntityListeners(org.springframework.data.jpa.domain.support.AuditingEntityListener.class)
public abstract class BaseEntity {

    @jakarta.persistence.Id
    @jakarta.persistence.GeneratedValue(strategy = jakarta.persistence.GenerationType.UUID)
    private java.util.UUID id;

    @org.springframework.data.annotation.CreatedDate
    @jakarta.persistence.Column(name = "criado_em", updatable = false)
    private java.time.LocalDateTime criadoEm;

    @org.springframework.data.annotation.LastModifiedDate
    @jakarta.persistence.Column(name = "atualizado_em")
    private java.time.LocalDateTime atualizadoEm;

    @jakarta.persistence.Column(name = "criado_por", updatable = false)
    private java.util.UUID criadoPor;

    @jakarta.persistence.Column(name = "atualizado_por")
    private java.util.UUID atualizadoPor;

    public BaseEntity() {
    }

    public java.util.UUID getId() {
        return id;
    }

    public void setId(java.util.UUID id) {
        this.id = id;
    }

    public java.time.LocalDateTime getCriadoEm() {
        return criadoEm;
    }

    public void setCriadoEm(java.time.LocalDateTime criadoEm) {
        this.criadoEm = criadoEm;
    }

    public java.time.LocalDateTime getAtualizadoEm() {
        return atualizadoEm;
    }

    public void setAtualizadoEm(java.time.LocalDateTime atualizadoEm) {
        this.atualizadoEm = atualizadoEm;
    }

    public java.util.UUID getCriadoPor() {
        return criadoPor;
    }

    public void setCriadoPor(java.util.UUID criadoPor) {
        this.criadoPor = criadoPor;
    }

    public java.util.UUID getAtualizadoPor() {
        return atualizadoPor;
    }

    public void setAtualizadoPor(java.util.UUID atualizadoPor) {
        this.atualizadoPor = atualizadoPor;
    }
}