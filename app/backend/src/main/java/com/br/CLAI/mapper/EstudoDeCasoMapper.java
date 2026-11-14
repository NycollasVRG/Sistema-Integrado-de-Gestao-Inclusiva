package com.br.CLAI.mapper;

import com.br.CLAI.domain.EstudoDeCaso;
import com.br.CLAI.domain.IndicadorReutilizavel;
import com.br.CLAI.domain.BaseEntity;
import com.br.CLAI.domain.Usuario;
import com.br.CLAI.dto.request.EstudoDeCasoRequestDTO;
import com.br.CLAI.dto.request.EstudoDeCasoUpdateDTO;
import com.br.CLAI.dto.response.EstudoDeCasoResponseDTO;
import com.br.CLAI.dto.response.ResponsavelAuditoriaDTO;
import com.br.CLAI.repository.UsuarioRepository;
import com.br.CLAI.security.RbacGuard;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
public class EstudoDeCasoMapper {

    private final RbacGuard rbacGuard;
    private final UsuarioRepository usuarioRepository;

    @Autowired
    public EstudoDeCasoMapper(RbacGuard rbacGuard, UsuarioRepository usuarioRepository) {
        this.rbacGuard = rbacGuard;
        this.usuarioRepository = usuarioRepository;
    }

    public EstudoDeCasoMapper(RbacGuard rbacGuard) {
        this(rbacGuard, null);
    }

    public EstudoDeCasoMapper() {
        this(new RbacGuard(), null);
    }

    public EstudoDeCasoResponseDTO toResponse(EstudoDeCaso entity) {
        if (entity == null) {
            return null;
        }

        List<UUID> indicadoresIds = null;
        if (entity.getIndicadores() != null) {
            indicadoresIds = entity.getIndicadores().stream()
                    .map(BaseEntity::getId)
                    .collect(Collectors.toList());
        }

        String historicoFamiliar = null;
        String historicoSocioemocional = null;

        // TA11.3: Apenas perfis com Restrição Moderada ou superior visualizam dados socioemocionais/familiares
        if (rbacGuard != null && rbacGuard.podeAcessarDadosSensiveis()) {
            historicoFamiliar = entity.getHistoricoFamiliar();
            historicoSocioemocional = entity.getHistoricoSocioemocional();
        }

        ResponsavelAuditoriaDTO atualizadoPor = resolverAtualizadoPor(entity.getAtualizadoPor());

        return new EstudoDeCasoResponseDTO(
                entity.getId(),
                entity.getAluno() != null ? entity.getAluno().getId() : null,
                entity.getStatus(),
                entity.getDiagnosticoInicial(),
                entity.getHistorico(),
                historicoFamiliar,
                historicoSocioemocional,
                indicadoresIds,
                entity.getVersao() != null ? entity.getVersao() : 1,
                entity.getEstudoOrigem() != null ? entity.getEstudoOrigem().getId() : null,
                entity.getCriadoEm(),
                entity.getAtualizadoEm(),
                atualizadoPor
        );
    }

    private ResponsavelAuditoriaDTO resolverAtualizadoPor(UUID usuarioId) {
        if (usuarioId == null) {
            return null;
        }
        String nome = null;
        if (usuarioRepository != null) {
            nome = usuarioRepository.findById(usuarioId)
                    .map(Usuario::getNome)
                    .orElse(null);
        }
        return new ResponsavelAuditoriaDTO(usuarioId, nome);
    }

    public EstudoDeCaso toEntity(EstudoDeCasoRequestDTO dto, 
                                 com.br.CLAI.domain.Aluno aluno, 
                                 List<IndicadorReutilizavel> indicadores) {
        if (dto == null) {
            return null;
        }

        EstudoDeCaso entidade = new EstudoDeCaso();
        entidade.setAluno(aluno);
        entidade.setStatus(dto.status());
        entidade.setDiagnosticoInicial(dto.diagnosticoInicial());
        entidade.setHistorico(dto.historico());
        entidade.setHistoricoFamiliar(dto.historicoFamiliar());
        entidade.setHistoricoSocioemocional(dto.historicoSocioemocional());
        if (indicadores != null) {
            entidade.setIndicadores(new java.util.ArrayList<>(indicadores));
        }

        return entidade;
    }

    public void updateEntityFromDto(EstudoDeCaso entidade, 
                                    EstudoDeCasoUpdateDTO dto, 
                                    List<IndicadorReutilizavel> indicadores) {
        if (entidade == null || dto == null) {
            return;
        }

        entidade.setStatus(dto.status());
        entidade.setDiagnosticoInicial(dto.diagnosticoInicial());
        if (dto.historico() != null) {
            entidade.setHistorico(dto.historico());
        }
        if (dto.historicoFamiliar() != null) {
            entidade.setHistoricoFamiliar(dto.historicoFamiliar());
        }
        if (dto.historicoSocioemocional() != null) {
            entidade.setHistoricoSocioemocional(dto.historicoSocioemocional());
        }
        if (indicadores != null) {
            entidade.setIndicadores(new java.util.ArrayList<>(indicadores));
        }
    }
}
