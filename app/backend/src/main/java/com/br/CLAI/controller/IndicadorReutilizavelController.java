package com.br.CLAI.controller;

import com.br.CLAI.repository.IndicadorReutilizavelRepository;
import com.br.CLAI.service.IndicadorReutilizavelService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/** Catálogo de tags para os formulários da US12. Exige JWT pelo SecurityConfig. */
@RestController
@RequestMapping("/api/indicadores")
public class IndicadorReutilizavelController {

    private final IndicadorReutilizavelService service;

    @Autowired
    public IndicadorReutilizavelController(IndicadorReutilizavelService service) {
        this.service = service;
    }

    public IndicadorReutilizavelController(IndicadorReutilizavelRepository repository) {
        this(new IndicadorReutilizavelService(repository));
    }

    @GetMapping
    public List<IndicadorResposta> listar() {
        return service.listar();
    }

    public record IndicadorResposta(UUID id, String nome, String descricao) {}
}
