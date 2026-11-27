package com.br.CLAI.controller;

import com.br.CLAI.dto.request.CargoRequestDTO;
import com.br.CLAI.dto.request.CargoStatusRequestDTO;
import com.br.CLAI.dto.response.CargoResponseDTO;
import com.br.CLAI.service.CargoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * Endpoints CRUD do catálogo de cargos do SIGI/CLAI.
 * Leitura liberada para usuários autenticados; criação, atualização, ativação e exclusão
 * são permitidas exclusivamente para ADMIN e COORDENADOR.
 */
@RestController
@RequestMapping("/api/cargos")
public class CargoController {

    private final CargoService cargoService;

    public CargoController(CargoService cargoService) {
        this.cargoService = cargoService;
    }

    @GetMapping
    public ResponseEntity<List<CargoResponseDTO>> listar(
            @RequestParam(value = "apenasAtivos", required = false) Boolean apenasAtivos,
            @RequestParam(value = "busca", required = false) String busca
    ) {
        return ResponseEntity.ok(cargoService.listar(apenasAtivos, busca));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CargoResponseDTO> buscarPorId(@PathVariable UUID id) {
        return ResponseEntity.ok(cargoService.buscarPorId(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'COORDENADOR')")
    public ResponseEntity<CargoResponseDTO> criar(@Valid @RequestBody CargoRequestDTO dto) {
        CargoResponseDTO criado = cargoService.criar(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(criado);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'COORDENADOR')")
    public ResponseEntity<CargoResponseDTO> atualizar(
            @PathVariable UUID id,
            @Valid @RequestBody CargoRequestDTO dto
    ) {
        return ResponseEntity.ok(cargoService.atualizar(id, dto));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'COORDENADOR')")
    public ResponseEntity<CargoResponseDTO> alterarStatus(
            @PathVariable UUID id,
            @Valid @RequestBody CargoStatusRequestDTO dto
    ) {
        return ResponseEntity.ok(cargoService.alterarStatus(id, dto.ativo()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'COORDENADOR')")
    public ResponseEntity<Void> excluir(@PathVariable UUID id) {
        cargoService.excluir(id);
        return ResponseEntity.noContent().build();
    }
}
