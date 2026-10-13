package com.br.CLAI.service.validator;

import com.br.CLAI.domain.enums.StatusEstudoCaso;
import com.br.CLAI.dto.request.EstudoDeCasoRequestDTO;
import com.br.CLAI.exception.RegraDeNegocioException;
import org.springframework.stereotype.Component;

@Component
public class EstudoDeCasoValidator {

    public void validarConclusao(EstudoDeCasoRequestDTO dto) {
        validarCamposConclusao(dto.getStatus(), dto.getDiagnosticoInicial(), dto.getIndicadoresIds());
    }

    public void validarConclusao(com.br.CLAI.dto.request.EstudoDeCasoUpdateDTO dto) {
        validarCamposConclusao(dto.getStatus(), dto.getDiagnosticoInicial(), dto.getIndicadoresIds());
    }

    private void validarCamposConclusao(StatusEstudoCaso status, String diagnosticoInicial, java.util.List<java.util.UUID> indicadoresIds) {
        if (StatusEstudoCaso.ENCERRADO.equals(status)) {
            if (diagnosticoInicial == null || diagnosticoInicial.trim().isEmpty()) {
                throw new RegraDeNegocioException("O Diagnóstico Inicial é obrigatório para concluir o Estudo de Caso.");
            }
            if (indicadoresIds == null || indicadoresIds.isEmpty()) {
                throw new RegraDeNegocioException("Pelo menos um Indicador é obrigatório para concluir o Estudo de Caso.");
            }
        }
    }
}
