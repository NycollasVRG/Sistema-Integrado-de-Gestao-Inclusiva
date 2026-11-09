package com.br.CLAI.repository;

import com.br.CLAI.domain.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, UUID> {

    Optional<Usuario> findByEmail(String email);

    boolean existsByEmail(String email);

    @Modifying
    @Query("UPDATE Usuario u SET u.tokenVersion = u.tokenVersion + 1, u.acessoAtivo = false WHERE u.id = :id")
    int revogarAcessoPorId(@Param("id") UUID id);
}
