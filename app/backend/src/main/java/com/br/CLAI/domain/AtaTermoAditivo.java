package com.br.CLAI.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/**
 * Termo aditivo explicativo anexado a uma ata FINALIZADA (TA8.4).
 * Garante a imutabilidade da ata original preservando rastreabilidade histórica.
 */
@Entity
@Table(name = "ata_termo_aditivo", schema = "sigi")
public class AtaTermoAditivo extends BaseEntity {

    @ManyToOne(optional = false)
    @JoinColumn(name = "ata_id", nullable = false)
    private AtaReuniao ata;

    @Column(name = "texto", nullable = false, columnDefinition = "TEXT")
    private String texto;

    public AtaTermoAditivo() {
    }

    public AtaTermoAditivo(AtaReuniao ata, String texto) {
        this.ata = ata;
        this.texto = texto;
    }

    public AtaReuniao getAta() {
        return ata;
    }

    public void setAta(AtaReuniao ata) {
        this.ata = ata;
    }

    public String getTexto() {
        return texto;
    }

    public void setTexto(String texto) {
        this.texto = texto;
    }
}
