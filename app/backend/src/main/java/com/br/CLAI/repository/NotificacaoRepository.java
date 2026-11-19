package com.br.CLAI.repository;

import com.br.CLAI.domain.Notificacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface NotificacaoRepository extends JpaRepository<Notificacao, UUID> {

    List<Notificacao> findByPerfilDestinatarioAndLidaFalseOrderByCriadoEmDesc(String perfilDestinatario);

    List<Notificacao> findByPerfilDestinatarioOrderByCriadoEmDesc(String perfilDestinatario);

    long countByPerfilDestinatarioAndLidaFalse(String perfilDestinatario);
}
