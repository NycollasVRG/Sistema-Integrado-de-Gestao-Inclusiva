package com.br.CLAI.service.validator;

import com.br.CLAI.domain.enums.StatusEstudoCaso;
import com.br.CLAI.dto.request.EstudoDeCasoRequestDTO;
import com.br.CLAI.dto.request.EstudoDeCasoUpdateDTO;
import com.br.CLAI.exception.RegraDeNegocioException;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

@Component
public class EstudoDeCasoValidator {

    public void validarConclusao(EstudoDeCasoRequestDTO dto) {
        validarCamposConclusao(dto.status(), dto.diagnosticoInicial(), dto.indicadoresIds());
    }

    public void validarConclusao(EstudoDeCasoUpdateDTO dto) {
        validarCamposConclusao(dto.status(), dto.diagnosticoInicial(), dto.indicadoresIds());
    }

    private void validarCamposConclusao(StatusEstudoCaso status, String diagnosticoInicial, List<UUID> indicadoresIds) {
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
