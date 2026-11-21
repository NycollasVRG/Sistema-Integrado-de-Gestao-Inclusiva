package com.br.CLAI.service;

import com.br.CLAI.domain.Acompanhamento;
import com.br.CLAI.domain.Aluno;
import com.br.CLAI.domain.Pei;
import com.br.CLAI.domain.Rai;
import com.br.CLAI.domain.enums.Role;
import com.br.CLAI.domain.enums.TipoRelatorio;
import com.br.CLAI.dto.request.RaiRequestDTO;
import com.br.CLAI.dto.response.RaiResponseDTO;
import com.br.CLAI.exception.NaoEncontradoException;
import com.br.CLAI.exception.RegraDeNegocioException;
import com.br.CLAI.repository.AcompanhamentoRepository;
import com.br.CLAI.repository.AlunoRepository;
import com.br.CLAI.repository.PeiRepository;
import com.br.CLAI.repository.RaiRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class RaiService {

    /** Perfil notificado quando o RAI indica regressão (TA3.3). */
    public static final String PERFIL_NOTIFICADO = Role.COORDENADOR.name();

    private final RaiRepository raiRepository;
    private final NotificacaoService notificacaoService;
    private final AlunoRepository alunoRepository;
    private final PeiRepository peiRepository;
    private final AcompanhamentoRepository acompanhamentoRepository;

    /**
     * Construtor de compatibilidade para testes que não precisam validar os vínculos.
     */
    public RaiService(RaiRepository raiRepository, NotificacaoService notificacaoService) {
        this(raiRepository, notificacaoService, null, null, null);
    }

    @Autowired
    public RaiService(RaiRepository raiRepository,
                      NotificacaoService notificacaoService,
                      AlunoRepository alunoRepository,
                      PeiRepository peiRepository,
                      AcompanhamentoRepository acompanhamentoRepository) {
        this.raiRepository = raiRepository;
        this.notificacaoService = notificacaoService;
        this.alunoRepository = alunoRepository;
        this.peiRepository = peiRepository;
        this.acompanhamentoRepository = acompanhamentoRepository;
    }

    @Transactional
    public RaiResponseDTO emitirRai(RaiRequestDTO dto) {
        return emitirRai(dto, null);
    }

    @Transactional
    public RaiResponseDTO emitirRai(RaiRequestDTO dto, UUID usuarioId) {
        if (dto == null) {
            throw new RegraDeNegocioException("Os dados do relatório são obrigatórios.");
        }
        if (dto.getAlunoId() == null) {
            throw new RegraDeNegocioException("O identificador do estudante é obrigatório.");
        }

        Integer bimestre = dto.getBimestre();
        if (bimestre == null || bimestre < 1 || bimestre > 4) {
            throw new RegraDeNegocioException("O bimestre deve estar entre 1 e 4.");
        }

        Aluno aluno = validarAluno(dto.getAlunoId());
        validarAcompanhamento(dto.getAcompanhamentoId(), dto.getAlunoId());
        validarPei(dto.getPeiId(), dto.getAlunoId());

        Rai rai = new Rai(
                dto.getAlunoId(),
                dto.getPeiId(),
                dto.getAcompanhamentoId(),
                resolverTipoRelatorio(dto.getTipoRelatorio()),
                bimestre,
                Boolean.TRUE.equals(dto.getIndicativoRegressao()),
                normalizarOpcional(dto.getDescricao())
        );
        rai.setCriadoPor(usuarioId);
        rai.setAtualizadoPor(usuarioId);

        Rai raiSalvo = raiRepository.save(rai);

        // TA3.3: indicativo de regressão gera notificação pendente para o COORDENADOR revisar o PEI.
        if (Boolean.TRUE.equals(raiSalvo.getIndicativoRegressao())) {
            notificacaoService.criarNotificacao(
                    PERFIL_NOTIFICADO,
                    "Revisão de PEI necessária — indicativo de regressão no "
                            + raiSalvo.getTipoRelatorio().name(),
                    construirMensagemNotificacao(raiSalvo, aluno),
                    "/api/peis/aluno/" + raiSalvo.getAlunoId()
            );
        }

        return converterParaResponse(raiSalvo);
    }

    @Transactional(readOnly = true)
    public RaiResponseDTO buscarPorId(UUID id) {
        return converterParaResponse(raiRepository.findById(id)
                .orElseThrow(() -> new NaoEncontradoException("RAI não encontrado com o ID: " + id)));
    }

    @Transactional(readOnly = true)
    public List<RaiResponseDTO> buscarPorAluno(UUID alunoId) {
        return raiRepository.findByAlunoIdOrderByCriadoEmAsc(alunoId)
                .stream()
                .map(this::converterParaResponse)
                .toList();
    }

    private Aluno validarAluno(UUID alunoId) {
        if (alunoRepository == null) {
            return null;
        }
        return alunoRepository.findById(alunoId)
                .orElseThrow(() -> new NaoEncontradoException("Estudante não encontrado."));
    }

    private void validarAcompanhamento(UUID acompanhamentoId, UUID alunoId) {
        if (acompanhamentoId == null || acompanhamentoRepository == null) {
            return;
        }
        Acompanhamento acompanhamento = acompanhamentoRepository.findById(acompanhamentoId)
                .orElseThrow(() -> new NaoEncontradoException("Acompanhamento não encontrado."));
        if (acompanhamento.getAluno() == null || !alunoId.equals(acompanhamento.getAluno().getId())) {
            throw new RegraDeNegocioException("O acompanhamento informado não pertence ao estudante.");
        }
    }

    private void validarPei(UUID peiId, UUID alunoId) {
        if (peiId == null || peiRepository == null) {
            return;
        }
        Pei pei = peiRepository.findById(peiId)
                .orElseThrow(() -> new NaoEncontradoException("PEI não encontrado."));
        if (pei.getAcompanhamento() == null
                || pei.getAcompanhamento().getAluno() == null
                || !alunoId.equals(pei.getAcompanhamento().getAluno().getId())) {
            throw new RegraDeNegocioException("O PEI informado não pertence ao estudante.");
        }
    }

    private TipoRelatorio resolverTipoRelatorio(String valor) {
        if (valor == null || valor.isBlank()) {
            return TipoRelatorio.RAI;
        }
        try {
            return TipoRelatorio.valueOf(valor.trim().toUpperCase(java.util.Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new RegraDeNegocioException("Tipo de relatório inválido. Use RAI ou RAE.");
        }
    }

    private String construirMensagemNotificacao(Rai rai, Aluno aluno) {
        String identificadorEstudante = (aluno != null && aluno.getNomeCompleto() != null)
                ? aluno.getNomeCompleto() + " (matrícula " + aluno.getMatricula() + ")"
                : rai.getAlunoId().toString();
        return String.format(
                "O relatório do %dº bimestre de %s registrou indicativo de regressão. "
                        + "Solicita-se a revisão do PEI do estudante.",
                rai.getBimestre(),
                identificadorEstudante
        );
    }

    private String normalizarOpcional(String valor) {
        if (valor == null || valor.isBlank()) {
            return null;
        }
        return valor.trim();
    }

    private RaiResponseDTO converterParaResponse(Rai entity) {
        if (entity == null) {
            return null;
        }
        return new RaiResponseDTO(
                entity.getId(),
                entity.getAlunoId(),
                entity.getPeiId(),
                entity.getAcompanhamentoId(),
                entity.getTipoRelatorio(),
                entity.getBimestre(),
                entity.getIndicativoRegressao(),
                entity.getDescricao(),
                entity.getCriadoEm()
        );
    }
}
