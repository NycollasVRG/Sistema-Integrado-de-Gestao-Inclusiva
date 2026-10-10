package com.br.CLAI.domain;

import jakarta.persistence.MappedSuperclass;
import org.hibernate.annotations.SoftDelete;

@MappedSuperclass
@SoftDelete
public abstract class BaseEntity {

    public BaseEntity() {
    }
}