package com.br.CLAI.service;

import com.br.CLAI.domain.Usuario;
import com.br.CLAI.dto.response.UsuarioAdminResponseDTO;
import com.br.CLAI.dto.response.UsuarioRevogadoResponseDTO;
import com.br.CLAI.exception.NaoEncontradoException;
import com.br.CLAI.repository.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class UsuarioAdminService {

    private final UsuarioRepository usuarioRepository;

    public UsuarioAdminService(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    @Transactional(readOnly = true)
    public List<UsuarioAdminResponseDTO> listarTodos() {
        return usuarioRepository.findAll().stream()
                .sorted((u1, u2) -> {
                    if (u1.getNome() == null) return 1;
                    if (u2.getNome() == null) return -1;
                    return u1.getNome().compareToIgnoreCase(u2.getNome());
                })
                .map(UsuarioAdminResponseDTO::fromEntity)
                .toList();
    }

    @Transactional
    public UsuarioRevogadoResponseDTO revogarAcesso(UUID id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new NaoEncontradoException("Usuário não encontrado com o ID: " + id));

        usuario.setAcessoAtivo(false);
        usuario.incrementarTokenVersion();
        Usuario atualizado = usuarioRepository.save(usuario);

        return new UsuarioRevogadoResponseDTO(
                atualizado.getId(),
                atualizado.getEmail(),
                atualizado.getNome(),
                atualizado.getAcessoAtivo(),
                atualizado.getTokenVersion(),
                "Acesso revogado com sucesso. Todas as sessões e tokens JWT anteriores foram invalidados imediatamente."
        );
    }
}

