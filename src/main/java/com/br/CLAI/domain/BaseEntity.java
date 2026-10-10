package com.br.CLAI.domain;

import jakarta.persistence.MappedSuperclass;
import org.hibernate.annotations.SoftDelete;

@MappedSuperclass
@SoftDelete
public abstract class BaseEntity {

    @jakarta.persistence.Id
    @jakarta.persistence.GeneratedValue(strategy = jakarta.persistence.GenerationType.UUID)
    private java.util.UUID id;

    public BaseEntity() {
    }

    public java.util.UUID getId() {
        return id;
    }

    public void setId(java.util.UUID id) {
        this.id = id;
    }
}