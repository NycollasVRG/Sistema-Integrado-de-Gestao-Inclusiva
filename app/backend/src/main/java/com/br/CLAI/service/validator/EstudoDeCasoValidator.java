package com.br.CLAI.service.validator;

import com.br.CLAI.domain.enums.StatusEstudoCaso;
import com.br.CLAI.dto.request.EstudoDeCasoRequestDTO;
import com.br.CLAI.dto.request.EstudoDeCasoUpdateDTO;
import com.br.CLAI.exception.RegraDeNegocioException;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Component
public class EstudoDeCasoValidator {

    public void validarConclusao(EstudoDeCasoRequestDTO dto) {
        validarCamposConclusao(dto.status(), dto.diagnosticoInicial(), dto.historico(), dto.indicadoresIds());
    }

    public void validarConclusao(EstudoDeCasoUpdateDTO dto) {
        validarCamposConclusao(dto.status(), dto.diagnosticoInicial(), dto.historico(), dto.indicadoresIds());
    }

    private void validarCamposConclusao(
            StatusEstudoCaso status,
            String diagnosticoInicial,
            String historico,
            List<UUID> indicadoresIds) {

        boolean tentandoConcluir = StatusEstudoCaso.ENCERRADO.equals(status)
                || StatusEstudoCaso.ATIVO.equals(status);

        if (!tentandoConcluir) {
            return;
        }

        List<String> camposAusentes = new ArrayList<>();

        if (diagnosticoInicial == null || diagnosticoInicial.trim().isEmpty()) {
            camposAusentes.add("Diagnóstico Inicial");
        }
        if (historico == null || historico.trim().isEmpty()) {
            camposAusentes.add("Histórico");
        }
        if (indicadoresIds == null || indicadoresIds.isEmpty()) {
            camposAusentes.add("Dificuldades Mapeadas (indicadores)");
        }

        if (!camposAusentes.isEmpty()) {
            throw new RegraDeNegocioException(
                    "Não é possível concluir o Estudo de Caso. Campo(s) obrigatório(s) ausente(s): "
                            + String.join(", ", camposAusentes) + "."
            );
        }
    }
}
