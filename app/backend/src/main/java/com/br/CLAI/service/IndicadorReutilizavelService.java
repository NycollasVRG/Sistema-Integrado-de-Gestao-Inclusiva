package com.br.CLAI.service;

import com.br.CLAI.controller.IndicadorReutilizavelController.IndicadorResposta;
import com.br.CLAI.repository.IndicadorReutilizavelRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class IndicadorReutilizavelService {

    private final IndicadorReutilizavelRepository repository;

    public IndicadorReutilizavelService(IndicadorReutilizavelRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<IndicadorResposta> listar() {
        // O @SoftDelete herdado de BaseEntity oculta registros excluídos.
        return repository.findAll(Sort.by(Sort.Direction.ASC, "nome"))
                .stream()
                .map(indicador -> new IndicadorResposta(
                        indicador.getId(), indicador.getNome(), indicador.getDescricao()))
                .toList();
    }
}
