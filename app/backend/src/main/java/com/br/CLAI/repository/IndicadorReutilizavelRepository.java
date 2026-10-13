package com.br.CLAI.repository;

import com.br.CLAI.domain.IndicadorReutilizavel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface IndicadorReutilizavelRepository extends JpaRepository<IndicadorReutilizavel, UUID> {
}
