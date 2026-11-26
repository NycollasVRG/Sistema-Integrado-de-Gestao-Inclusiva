package com.br.CLAI.service;

import com.br.CLAI.domain.Acompanhamento;
import com.br.CLAI.domain.Aluno;
import com.br.CLAI.domain.Pei;
import com.br.CLAI.domain.Rai;
import com.br.CLAI.domain.RaiHabilidade;
import com.br.CLAI.domain.enums.Role;
import com.br.CLAI.domain.enums.TipoRelatorio;
import com.br.CLAI.dto.request.RaiHabilidadeDTO;
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

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
public class RaiService {

    /** Perfil notificado quando o RAI indica regressão (TA3.3). */
    public static final String PERFIL_NOTIFICADO = Role.COORDENADOR.name();
    private static final String SEPARADOR_OPCOES = "||";

    private final RaiRepository raiRepository;
    private final NotificacaoService notificacaoService;
    private final AlunoRepository alunoRepository;
    private final PeiRepository peiRepository;
    private final AcompanhamentoRepository acompanhamentoRepository;

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
        aplicarCamposAnexoV(rai, dto, usuarioId);
        rai.setCriadoPor(usuarioId);
        rai.setAtualizadoPor(usuarioId);

        Rai raiSalvo = raiRepository.save(rai);

        // TA3.3: indicativo de regressão gera notificação pendente para o COORDENADOR revisar o PEI.
        if (Boolean.TRUE.equals(raiSalvo.getIndicativoRegressao())) {
            notificarRegressao(raiSalvo, aluno);
        }

        return converterParaResponse(raiSalvo, aluno);
    }

    @Transactional
    public RaiResponseDTO atualizarRai(UUID id, RaiRequestDTO dto, UUID usuarioId) {
        if (dto == null) {
            throw new RegraDeNegocioException("Os dados do relatório são obrigatórios.");
        }
        Rai rai = raiRepository.findById(id)
                .orElseThrow(() -> new NaoEncontradoException("RAI não encontrado com o ID: " + id));

        boolean regressaoAnterior = Boolean.TRUE.equals(rai.getIndicativoRegressao());

        if (dto.getBimestre() != null) {
            if (dto.getBimestre() < 1 || dto.getBimestre() > 4) {
                throw new RegraDeNegocioException("O bimestre deve estar entre 1 e 4.");
            }
            rai.setBimestre(dto.getBimestre());
        }
        if (dto.getTipoRelatorio() != null && !dto.getTipoRelatorio().isBlank()) {
            rai.setTipoRelatorio(resolverTipoRelatorio(dto.getTipoRelatorio()));
        }
        if (dto.getPeiId() != null) {
            validarPei(dto.getPeiId(), rai.getAlunoId());
            rai.setPeiId(dto.getPeiId());
        }
        if (dto.getAcompanhamentoId() != null) {
            validarAcompanhamento(dto.getAcompanhamentoId(), rai.getAlunoId());
            rai.setAcompanhamentoId(dto.getAcompanhamentoId());
        }
        if (dto.getIndicativoRegressao() != null) {
            rai.setIndicativoRegressao(dto.getIndicativoRegressao());
        }
        if (dto.getDescricao() != null) {
            rai.setDescricao(normalizarOpcional(dto.getDescricao()));
        }

        aplicarCamposAnexoV(rai, dto, usuarioId);
        rai.setAtualizadoPor(usuarioId);

        Rai salvo = raiRepository.save(rai);
        Aluno aluno = buscarAlunoOpcional(salvo.getAlunoId());

        if (!regressaoAnterior && Boolean.TRUE.equals(salvo.getIndicativoRegressao())) {
            notificarRegressao(salvo, aluno);
        }

        return converterParaResponse(salvo, aluno);
    }

    @Transactional
    public void excluirRai(UUID id, UUID usuarioId) {
        Rai rai = raiRepository.findById(id)
                .orElseThrow(() -> new NaoEncontradoException("RAI não encontrado com o ID: " + id));
        rai.setAtualizadoPor(usuarioId);
        raiRepository.save(rai);
        raiRepository.delete(rai);
    }

    @Transactional(readOnly = true)
    public RaiResponseDTO buscarPorId(UUID id) {
        Rai rai = raiRepository.findById(id)
                .orElseThrow(() -> new NaoEncontradoException("RAI não encontrado com o ID: " + id));
        return converterParaResponse(rai, buscarAlunoOpcional(rai.getAlunoId()));
    }

    @Transactional(readOnly = true)
    public List<RaiResponseDTO> buscarPorAluno(UUID alunoId) {
        Aluno aluno = buscarAlunoOpcional(alunoId);
        return raiRepository.findByAlunoIdOrderByCriadoEmAsc(alunoId)
                .stream()
                .map(rai -> converterParaResponse(rai, aluno))
                .toList();
    }

    private void aplicarCamposAnexoV(Rai rai, RaiRequestDTO dto, UUID usuarioId) {
        rai.setPeriodoLetivo(normalizarOpcional(dto.getPeriodoLetivo()));
        rai.setComponenteCurricular(normalizarOpcional(dto.getComponenteCurricular()));
        rai.setDocente(normalizarOpcional(dto.getDocente()));

        rai.setRelacionamentoOpcoes(serializarOpcoes(dto.getRelacionamentoOpcoes()));
        rai.setRelacionamentoOutros(normalizarOpcional(dto.getRelacionamentoOutros()));
        rai.setRelacionamentoComentario(normalizarOpcional(dto.getRelacionamentoComentario()));

        rai.setHabilidadesCognitivasOpcoes(serializarOpcoes(dto.getHabilidadesCognitivasOpcoes()));
        rai.setHabilidadesCognitivasOutros(normalizarOpcional(dto.getHabilidadesCognitivasOutros()));
        rai.setHabilidadesCognitivasComentario(normalizarOpcional(dto.getHabilidadesCognitivasComentario()));

        rai.setHabilidadesSocioemocionaisOpcoes(serializarOpcoes(dto.getHabilidadesSocioemocionaisOpcoes()));
        rai.setHabilidadesSocioemocionaisOutros(normalizarOpcional(dto.getHabilidadesSocioemocionaisOutros()));
        rai.setHabilidadesSocioemocionaisComentario(normalizarOpcional(dto.getHabilidadesSocioemocionaisComentario()));

        rai.setAvancosGerais(normalizarOpcional(dto.getAvancosGerais()));
        rai.setDificuldadesAprendizagem(normalizarOpcional(dto.getDificuldadesAprendizagem()));
        rai.setFatoresExternos(normalizarOpcional(dto.getFatoresExternos()));
        rai.setParecer(normalizarOpcional(dto.getParecer()));
        rai.setDataRelatorio(dto.getDataRelatorio());
        rai.setAssinaturaDocente(normalizarOpcional(dto.getAssinaturaDocente()));

        if (dto.getHabilidadesDesenvolvidas() != null) {
            List<RaiHabilidade> novas = new ArrayList<>();
            int idx = 0;
            for (RaiHabilidadeDTO hDto : dto.getHabilidadesDesenvolvidas()) {
                if (hDto == null || hDto.habilidadeDesenvolvida() == null || hDto.habilidadeDesenvolvida().isBlank()) {
                    continue;
                }
                RaiHabilidade entidade = new RaiHabilidade(
                        rai,
                        hDto.ordem() != null ? hDto.ordem() : idx,
                        hDto.habilidadeDesenvolvida().trim(),
                        hDto.nivelAprendizado(),
                        normalizarOpcional(hDto.observacoes())
                );
                entidade.setCriadoPor(usuarioId);
                entidade.setAtualizadoPor(usuarioId);
                novas.add(entidade);
                idx++;
            }
            rai.substituirHabilidades(novas);
        }
    }

    private void notificarRegressao(Rai raiSalvo, Aluno aluno) {
        notificacaoService.criarNotificacao(
                PERFIL_NOTIFICADO,
                "Revisão de PEI necessária — indicativo de regressão no "
                        + raiSalvo.getTipoRelatorio().name(),
                construirMensagemNotificacao(raiSalvo, aluno),
                "/api/peis/aluno/" + raiSalvo.getAlunoId()
        );
    }

    private Aluno validarAluno(UUID alunoId) {
        if (alunoRepository == null) {
            return null;
        }
        return alunoRepository.findById(alunoId)
                .orElseThrow(() -> new NaoEncontradoException("Estudante não encontrado."));
    }

    private Aluno buscarAlunoOpcional(UUID alunoId) {
        if (alunoRepository == null || alunoId == null) {
            return null;
        }
        return alunoRepository.findById(alunoId).orElse(null);
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

    public static String serializarOpcoes(List<String> opcoes) {
        if (opcoes == null || opcoes.isEmpty()) {
            return null;
        }
        List<String> limpas = opcoes.stream()
                .filter(s -> s != null && !s.isBlank())
                .map(String::trim)
                .distinct()
                .toList();
        return limpas.isEmpty() ? null : String.join(SEPARADOR_OPCOES, limpas);
    }

    public static List<String> desserializarOpcoes(String valor) {
        if (valor == null || valor.isBlank()) {
            return List.of();
        }
        return Arrays.stream(valor.split("\\|\\|"))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .toList();
    }

    public static RaiResponseDTO converterParaResponse(Rai entity, Aluno aluno) {
        if (entity == null) {
            return null;
        }
        RaiResponseDTO dto = new RaiResponseDTO(
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
        if (aluno != null) {
            dto.setNomeEstudante(aluno.getNomeCompleto());
            dto.setMatriculaEstudante(aluno.getMatricula());
            dto.setCursoEstudante(aluno.getCurso());
        }
        dto.setPeriodoLetivo(entity.getPeriodoLetivo());
        dto.setComponenteCurricular(entity.getComponenteCurricular());
        dto.setDocente(entity.getDocente());
        dto.setRelacionamentoOpcoes(desserializarOpcoes(entity.getRelacionamentoOpcoes()));
        dto.setRelacionamentoOutros(entity.getRelacionamentoOutros());
        dto.setRelacionamentoComentario(entity.getRelacionamentoComentario());
        dto.setHabilidadesCognitivasOpcoes(desserializarOpcoes(entity.getHabilidadesCognitivasOpcoes()));
        dto.setHabilidadesCognitivasOutros(entity.getHabilidadesCognitivasOutros());
        dto.setHabilidadesCognitivasComentario(entity.getHabilidadesCognitivasComentario());
        dto.setHabilidadesSocioemocionaisOpcoes(desserializarOpcoes(entity.getHabilidadesSocioemocionaisOpcoes()));
        dto.setHabilidadesSocioemocionaisOutros(entity.getHabilidadesSocioemocionaisOutros());
        dto.setHabilidadesSocioemocionaisComentario(entity.getHabilidadesSocioemocionaisComentario());
        dto.setAvancosGerais(entity.getAvancosGerais());
        dto.setDificuldadesAprendizagem(entity.getDificuldadesAprendizagem());
        dto.setFatoresExternos(entity.getFatoresExternos());
        dto.setParecer(entity.getParecer());
        dto.setDataRelatorio(entity.getDataRelatorio());
        dto.setAssinaturaDocente(entity.getAssinaturaDocente());
        dto.setAtualizadoEm(entity.getAtualizadoEm());

        List<RaiHabilidadeDTO> habilidades = entity.getHabilidadesDesenvolvidas() == null
                ? List.of()
                : entity.getHabilidadesDesenvolvidas().stream()
                        .map(h -> new RaiHabilidadeDTO(
                                h.getId(),
                                h.getOrdem(),
                                h.getHabilidadeDesenvolvida(),
                                h.getNivelAprendizado(),
                                h.getObservacoes()
                        ))
                        .toList();
        dto.setHabilidadesDesenvolvidas(habilidades);
        return dto;
    }
}
