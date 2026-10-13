package com.br.CLAI.dto.request;

import com.br.CLAI.domain.enums.StatusEstudoCaso;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.UUID;

public class EstudoDeCasoRequestDTO {

    @NotNull(message = "O ID do aluno é obrigatório")
    private UUID alunoId;

    @NotNull(message = "O status do estudo de caso é obrigatório")
    private StatusEstudoCaso status;

    @NotNull(message = "O diagnóstico inicial é obrigatório")
    private String diagnosticoInicial;
    
    private List<UUID> indicadoresIds;

    public EstudoDeCasoRequestDTO() {
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
}
