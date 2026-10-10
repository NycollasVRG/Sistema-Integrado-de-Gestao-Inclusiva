package com.br.CLAI.service.validator;

import com.br.CLAI.domain.enums.StatusEstudoCaso;
import com.br.CLAI.dto.request.EstudoDeCasoRequestDTO;
import com.br.CLAI.exception.RegraDeNegocioException;
import org.springframework.stereotype.Component;

@Component
public class EstudoDeCasoValidator {

    public void validarConclusao(EstudoDeCasoRequestDTO dto) {
        if (StatusEstudoCaso.ENCERRADO.equals(dto.getStatus())) {
            if (dto.getDiagnosticoInicial() == null || dto.getDiagnosticoInicial().trim().isEmpty()) {
                throw new RegraDeNegocioException("O Diagnóstico Inicial é obrigatório para concluir o Estudo de Caso.");
            }
            if (dto.getIndicadoresIds() == null || dto.getIndicadoresIds().isEmpty()) {
                throw new RegraDeNegocioException("Pelo menos um Indicador é obrigatório para concluir o Estudo de Caso.");
            }
        }
    }
}
