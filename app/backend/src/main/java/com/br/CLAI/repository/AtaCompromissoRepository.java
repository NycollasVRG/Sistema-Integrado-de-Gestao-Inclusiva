package com.br.CLAI.repository;

import com.br.CLAI.domain.AtaCompromisso;
import com.br.CLAI.domain.enums.StatusAta;
import com.br.CLAI.domain.enums.StatusCompromisso;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface AtaCompromissoRepository extends JpaRepository<AtaCompromisso, UUID> {

    /**
     * Busca compromissos pendentes de atas FINALIZADAS cujo prazo está vencido ou dentro da janela
     * de antecedência configurada, ainda sem lembrete enviado e cujo responsável encontra-se ativo (TA8.3).
     */
    @Query("""
            SELECT c FROM AtaCompromisso c
            JOIN FETCH c.ata a
            JOIN FETCH a.aluno al
            JOIN FETCH c.responsavel r
            WHERE c.status = :statusCompromisso
              AND c.lembreteEnviadoEm IS NULL
              AND a.status = :statusAta
              AND c.prazo <= :limite
              AND r.acessoAtivo = TRUE
            ORDER BY c.prazo ASC, c.criadoEm ASC
            """)
    List<AtaCompromisso> buscarPendentesParaLembrete(
            @Param("statusCompromisso") StatusCompromisso statusCompromisso,
            @Param("statusAta") StatusAta statusAta,
            @Param("limite") LocalDate limite
    );

    default List<AtaCompromisso> buscarPendentesParaLembrete(LocalDate limite) {
        return buscarPendentesParaLembrete(StatusCompromisso.PENDENTE, StatusAta.FINALIZADA, limite);
    }
}
