package com.br.CLAI.dto.request;

import com.br.CLAI.domain.enums.StatusEstudoCaso;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.UUID;

public class EstudoDeCasoUpdateDTO {

    @NotNull(message = "O status do estudo de caso é obrigatório")
    private StatusEstudoCaso status;

    private String diagnosticoInicial;

    private List<UUID> indicadoresIds;

    public EstudoDeCasoUpdateDTO() {
    }

    public EstudoDeCasoUpdateDTO(StatusEstudoCaso status, String diagnosticoInicial, List<UUID> indicadoresIds) {
        this.status = status;
        this.diagnosticoInicial = diagnosticoInicial;
        this.indicadoresIds = indicadoresIds;
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
