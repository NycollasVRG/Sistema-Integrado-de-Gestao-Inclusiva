package com.br.CLAI.repository;

import com.br.CLAI.domain.Cargo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CargoRepository extends JpaRepository<Cargo, UUID> {

    List<Cargo> findAllByOrderBySistemaDescNomeAsc();

    List<Cargo> findAllByAtivoTrueOrderBySistemaDescNomeAsc();

    Optional<Cargo> findByCodigoIgnoreCase(String codigo);

    boolean existsByCodigoIgnoreCase(String codigo);

    boolean existsByCodigoIgnoreCaseAndIdNot(String codigo, UUID id);
}
