package com.br.CLAI.controller;

import com.br.CLAI.domain.Usuario;
import com.br.CLAI.dto.request.RaiRequestDTO;
import com.br.CLAI.dto.response.RaiResponseDTO;
import com.br.CLAI.security.RbacGuard;
import com.br.CLAI.service.RaiService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/rais")
public class RaiController {

    private final RaiService raiService;
    private final RbacGuard rbacGuard;

    public RaiController(RaiService raiService) {
        this(raiService, new RbacGuard());
    }

    @Autowired
    public RaiController(RaiService raiService, RbacGuard rbacGuard) {
        this.raiService = raiService;
        this.rbacGuard = rbacGuard;
    }

    /**
     * Emite um RAI (ou RAE, quando {@code tipoRelatorio = RAE}). Com
     * {@code indicativoRegressao = true} o serviço notifica o COORDENADOR (TA3.3)
     * e o registro passa a compor a Linha do Tempo do estudante (TA9.2/TA9.3).
     */
    @PostMapping
    public ResponseEntity<RaiResponseDTO> emitirRai(@Valid @RequestBody RaiRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(raiService.emitirRai(dto, extrairUsuarioIdAutenticado()));
    }

    @GetMapping("/aluno/{alunoId}")
    public ResponseEntity<List<RaiResponseDTO>> buscarPorAluno(@PathVariable UUID alunoId) {
        return ResponseEntity.ok(raiService.buscarPorAluno(alunoId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<RaiResponseDTO> buscarPorId(@PathVariable UUID id) {
        return ResponseEntity.ok(raiService.buscarPorId(id));
    }

    /** Autoria infalsificável quando há sessão; nula apenas em chamadas sem contexto de segurança. */
    private UUID extrairUsuarioIdAutenticado() {
        Optional<Usuario> usuario = rbacGuard.getUsuarioAutenticado();
        return usuario.map(Usuario::getId).orElse(null);
    }
}
