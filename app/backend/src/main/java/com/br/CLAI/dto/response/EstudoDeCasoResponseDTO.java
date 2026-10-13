package com.br.CLAI.dto.response;

import com.br.CLAI.domain.enums.StatusEstudoCaso;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class EstudoDeCasoResponseDTO {

    private UUID id;
    private UUID alunoId;
    private StatusEstudoCaso status;
    private String diagnosticoInicial;
    private List<UUID> indicadoresIds;
    private LocalDateTime criadoEm;
    private LocalDateTime atualizadoEm;

    public EstudoDeCasoResponseDTO() {
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getAlunoId() {
        return alunoId;
    }

    public void setAlunoId(UUID alunoId) {
        this.alunoId = alunoId;
    }

    public StatusEstudoCaso getStatus() {
        return status;
    }

    public void setStatus(StatusEstudoCaso status) {
        this.status = status;
    }

    public String getDiagnosticoInicial() {
        return diagnosticoInicial;
    }

    public void setDiagnosticoInicial(String diagnosticoInicial) {
        this.diagnosticoInicial = diagnosticoInicial;
    }

    public List<UUID> getIndicadoresIds() {
        return indicadoresIds;
    }

    public void setIndicadoresIds(List<UUID> indicadoresIds) {
        this.indicadoresIds = indicadoresIds;
    }

    public LocalDateTime getCriadoEm() {
        return criadoEm;
    }

    public void setCriadoEm(LocalDateTime criadoEm) {
        this.criadoEm = criadoEm;
    }

    public LocalDateTime getAtualizadoEm() {
        return atualizadoEm;
    }

    public void setAtualizadoEm(LocalDateTime atualizadoEm) {
        this.atualizadoEm = atualizadoEm;
    }
}
