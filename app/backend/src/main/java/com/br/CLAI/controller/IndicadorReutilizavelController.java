package com.br.CLAI.controller;

import com.br.CLAI.domain.IndicadorReutilizavel;
import com.br.CLAI.repository.IndicadorReutilizavelRepository;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/** Catálogo de tags para os formulários da US12. Exige JWT pelo SecurityConfig. */
@RestController
@RequestMapping("/api/v1/indicadores")
public class IndicadorReutilizavelController {

    private final IndicadorReutilizavelRepository repository;

    public IndicadorReutilizavelController(IndicadorReutilizavelRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<IndicadorResposta> listar() {
        // O @SoftDelete herdado de BaseEntity oculta registros excluídos.
        return repository.findAll(Sort.by(Sort.Direction.ASC, "nome"))
                .stream()
                .map(indicador -> new IndicadorResposta(
                        indicador.getId(), indicador.getNome(), indicador.getDescricao()))
                .toList();
    }

    public record IndicadorResposta(UUID id, String nome, String descricao) {}
}
