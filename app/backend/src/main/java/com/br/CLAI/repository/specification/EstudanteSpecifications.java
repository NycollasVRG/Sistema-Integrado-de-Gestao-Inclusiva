package com.br.CLAI.repository.specification;

import com.br.CLAI.domain.Aluno;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

/**
 * Filtros dinâmicos combinados (AND) da listagem de estudantes. Filtros nulos/vazios são ignorados.
 */
public final class EstudanteSpecifications {

    private EstudanteSpecifications() {
    }

    public static Specification<Aluno> comFiltros(String termo, String curso, String turma, String tag, Boolean ativo) {
        return (root, query, cb) -> {
            List<Predicate> predicados = new ArrayList<>();

            if (temTexto(termo)) {
                String padrao = "%" + escapeLike(termo.trim().toLowerCase()) + "%";
                predicados.add(cb.or(
                        cb.like(cb.lower(root.get("nomeCompleto")), padrao, '\\'),
                        cb.like(cb.lower(root.get("matricula")), padrao, '\\')
                ));
            }

            if (temTexto(curso)) {
                predicados.add(cb.equal(cb.lower(root.get("curso")), curso.trim().toLowerCase()));
            }

            if (temTexto(turma)) {
                predicados.add(cb.equal(cb.lower(root.get("turma")), turma.trim().toLowerCase()));
            }

            if (temTexto(tag)) {
                Join<Object, Object> tags = root.join("tagsDificuldade", JoinType.INNER);
                predicados.add(cb.equal(cb.lower(tags.get("nome")), tag.trim().toLowerCase()));
            }

            if (ativo != null) {
                predicados.add(cb.equal(root.get("ativo"), ativo));
            }

            return cb.and(predicados.toArray(new Predicate[0]));
        };
    }

    private static boolean temTexto(String valor) {
        return valor != null && !valor.isBlank();
    }

    private static String escapeLike(String valor) {
        return valor.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }
}
