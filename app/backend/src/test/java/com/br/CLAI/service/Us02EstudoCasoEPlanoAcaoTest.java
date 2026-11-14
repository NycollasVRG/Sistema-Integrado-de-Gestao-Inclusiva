package com.br.CLAI.service;

import com.br.CLAI.controller.EstudoDeCasoController;
import com.br.CLAI.controller.PlanoAcaoController;
import com.br.CLAI.domain.Acompanhamento;
import com.br.CLAI.domain.Aluno;
import com.br.CLAI.domain.EstudoDeCaso;
import com.br.CLAI.domain.IndicadorReutilizavel;
import com.br.CLAI.domain.PlanoAcao;
import com.br.CLAI.domain.Usuario;
import com.br.CLAI.domain.enums.NivelRestricao;
import com.br.CLAI.domain.enums.Role;
import com.br.CLAI.domain.enums.StatusEstudoCaso;
import com.br.CLAI.handler.GlobalExceptionHandler;
import com.br.CLAI.mapper.EstudoDeCasoMapper;
import com.br.CLAI.mapper.PlanoAcaoMapper;
import com.br.CLAI.repository.AcompanhamentoRepository;
import com.br.CLAI.repository.AlunoRepository;
import com.br.CLAI.repository.EstudoDeCasoRepository;
import com.br.CLAI.repository.IndicadorReutilizavelRepository;
import com.br.CLAI.repository.PlanoAcaoRepository;
import com.br.CLAI.repository.UsuarioRepository;
import com.br.CLAI.security.JwtService;
import com.br.CLAI.security.RbacGuard;
import com.br.CLAI.security.SecurityConfig;
import com.br.CLAI.service.validator.EstudoDeCasoValidator;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationProvider;
import org.springframework.security.oauth2.server.resource.web.authentication.BearerTokenAuthenticationFilter;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.hamcrest.Matchers.containsString;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
@DisplayName("US 02 - Validação Completa dos Critérios TA2.1, TA2.2, TA2.3 e TA2.4")
class Us02EstudoCasoEPlanoAcaoTest {

    private static final String TEST_JWT_SECRET = "sigi-clai-dev-jwt-secret-key-2026-ifpb-change-in-prod";

    @Mock
    private EstudoDeCasoRepository estudoDeCasoRepository;

    @Mock
    private AlunoRepository alunoRepository;

    @Mock
    private IndicadorReutilizavelRepository indicadorRepository;

    @Mock
    private PlanoAcaoRepository planoAcaoRepository;

    @Mock
    private AcompanhamentoRepository acompanhamentoRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    private JwtService jwtService;
    private MockMvc mockMvc;

    private UUID alunoId;
    private UUID acompanhamentoId;
    private UUID indicadorId;
    private Aluno alunoTeste;
    private Acompanhamento acompanhamentoTeste;
    private IndicadorReutilizavel indicadorTeste;
    private Usuario psicopedagogaUser;
    private Usuario coordenadorUser;

    private final Map<String, Usuario> usuariosPorEmail = new HashMap<>();
    private final Map<UUID, Usuario> usuariosPorId = new HashMap<>();
    private final List<EstudoDeCaso> estudosEmMemoria = new ArrayList<>();
    private final Map<UUID, PlanoAcao> planosEmMemoria = new HashMap<>();

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
        usuariosPorEmail.clear();
        usuariosPorId.clear();
        estudosEmMemoria.clear();
        planosEmMemoria.clear();

        SecurityConfig securityConfig = new SecurityConfig(TEST_JWT_SECRET);
        jwtService = new JwtService(securityConfig.jwtEncoder(), 28800000L);
        RbacGuard rbacGuard = new RbacGuard();

        EstudoDeCasoMapper estudoMapper = new EstudoDeCasoMapper(rbacGuard, usuarioRepository);
        EstudoDeCasoValidator estudoValidator = new EstudoDeCasoValidator();
        EstudoDeCasoService estudoService = new EstudoDeCasoService(
                estudoDeCasoRepository,
                alunoRepository,
                indicadorRepository,
                estudoValidator,
                estudoMapper
        );

        PlanoAcaoMapper planoMapper = new PlanoAcaoMapper();
        PlanoAcaoService planoService = new PlanoAcaoService(
                planoAcaoRepository,
                acompanhamentoRepository,
                estudoDeCasoRepository,
                planoMapper
        );

        EstudoDeCasoController estudoController = new EstudoDeCasoController(estudoService, rbacGuard);
        PlanoAcaoController planoController = new PlanoAcaoController(planoService, rbacGuard);

        JwtAuthenticationProvider jwtAuthProvider = new JwtAuthenticationProvider(
                securityConfig.jwtDecoder(usuarioRepository)
        );
        jwtAuthProvider.setJwtAuthenticationConverter(securityConfig.jwtAuthenticationConverter());
        BearerTokenAuthenticationFilter bearerFilter = new BearerTokenAuthenticationFilter(
                new ProviderManager(jwtAuthProvider)
        );
        bearerFilter.setAuthenticationEntryPoint(securityConfig.authenticationEntryPoint());

        mockMvc = MockMvcBuilders.standaloneSetup(estudoController, planoController)
                .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver())
                .setControllerAdvice(new GlobalExceptionHandler())
                .addFilters(bearerFilter)
                .build();

        alunoId = UUID.fromString("11111111-1111-1111-1111-111111111111");
        acompanhamentoId = UUID.fromString("33333333-3333-3333-3333-333333333333");
        indicadorId = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

        alunoTeste = new Aluno("Maria Clara Silva", "202610025");
        alunoTeste.setId(alunoId);
        alunoTeste.setCurso("Tecnologia em Sistemas para Internet");

        acompanhamentoTeste = new Acompanhamento(alunoTeste, LocalDate.of(2026, 2, 10));
        acompanhamentoTeste.setId(acompanhamentoId);

        indicadorTeste = new IndicadorReutilizavel("Baixa Visão", "Necessita ampliação de contraste e fonte.");
        indicadorTeste.setId(indicadorId);

        psicopedagogaUser = registrarUsuario(
                UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-000000000010"),
                "Dra. Ana Psicopedagoga",
                "ana.psico@sigi.ifpb.edu.br",
                Role.CLAI_PSICOPEDAGOGO,
                NivelRestricao.RESTRICAO_MODERADA
        );

        coordenadorUser = registrarUsuario(
                UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-000000000020"),
                "Prof. Carlos Coordenador",
                "carlos.coord@sigi.ifpb.edu.br",
                Role.COORDENADOR,
                NivelRestricao.SUPER_RESTRICAO
        );

        lenient().when(usuarioRepository.findByEmail(any(String.class))).thenAnswer(inv ->
                Optional.ofNullable(usuariosPorEmail.get((String) inv.getArgument(0)))
        );
        lenient().when(usuarioRepository.findById(any(UUID.class))).thenAnswer(inv ->
                Optional.ofNullable(usuariosPorId.get((UUID) inv.getArgument(0)))
        );
        lenient().when(alunoRepository.findById(alunoId)).thenReturn(Optional.of(alunoTeste));
        lenient().when(alunoRepository.existsById(alunoId)).thenReturn(true);
        lenient().when(acompanhamentoRepository.findById(acompanhamentoId)).thenReturn(Optional.of(acompanhamentoTeste));
        lenient().when(indicadorRepository.findAllById(List.of(indicadorId))).thenReturn(List.of(indicadorTeste));

        lenient().when(estudoDeCasoRepository.findByAlunoId(alunoId)).thenAnswer(inv -> List.copyOf(estudosEmMemoria));
        lenient().when(estudoDeCasoRepository.findById(any(UUID.class))).thenAnswer(inv -> {
            UUID id = inv.getArgument(0);
            return estudosEmMemoria.stream().filter(e -> id.equals(e.getId())).findFirst();
        });
        lenient().when(estudoDeCasoRepository.save(any(EstudoDeCaso.class))).thenAnswer(inv -> salvarEstudoEmMemoria(inv.getArgument(0)));
        lenient().when(estudoDeCasoRepository.saveAndFlush(any(EstudoDeCaso.class))).thenAnswer(inv -> salvarEstudoEmMemoria(inv.getArgument(0)));

        lenient().when(planoAcaoRepository.save(any(PlanoAcao.class))).thenAnswer(inv -> {
            PlanoAcao plano = inv.getArgument(0);
            if (plano.getId() == null) {
                plano.setId(UUID.randomUUID());
                plano.setCriadoEm(LocalDateTime.now());
            }
            plano.setAtualizadoEm(LocalDateTime.now());
            planosEmMemoria.put(plano.getId(), plano);
            return plano;
        });
        lenient().when(planoAcaoRepository.findById(any(UUID.class))).thenAnswer(inv ->
                Optional.ofNullable(planosEmMemoria.get((UUID) inv.getArgument(0)))
        );
        lenient().when(planoAcaoRepository.findByAcompanhamento_Aluno_Id(alunoId)).thenAnswer(inv ->
                List.copyOf(planosEmMemoria.values())
        );
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private Usuario registrarUsuario(UUID id, String nome, String email, Role role, NivelRestricao nivel) {
        Usuario u = new Usuario(nome, email, "hash", role, nivel, true);
        u.setId(id);
        u.setAcessoAtivo(true);
        u.setTokenVersion(1);
        usuariosPorEmail.put(email, u);
        usuariosPorId.put(id, u);
        return u;
    }

    private EstudoDeCaso salvarEstudoEmMemoria(EstudoDeCaso estudo) {
        if (estudo.getId() == null) {
            estudo.setId(UUID.randomUUID());
            estudo.setCriadoEm(LocalDateTime.now());
        }
        if (estudo.getAtualizadoEm() == null) {
            estudo.setAtualizadoEm(LocalDateTime.now());
        }
        estudosEmMemoria.removeIf(e -> estudo.getId().equals(e.getId()));
        estudosEmMemoria.add(estudo);
        return estudo;
    }

    // =========================================================================
    // TA2.1 — Fluxo completo de Plano de Ação e bloqueio sem Estudo concluído
    // =========================================================================

    @Test
    @DisplayName("TA2.1: Deve bloquear POST /api/planos-acao com HTTP 400 RFC 9457 quando Estudo de Caso estiver PENDENTE ou RASCUNHO")
    void ta21DeveBloquearPlanoAcaoSemEstudoConcluido() throws Exception {
        String token = jwtService.gerarToken(psicopedagogaUser);
        String payloadPlano = payloadPlanoAcaoAnexoIII();

        // 1. Aluno sem nenhum estudo (PENDENTE)
        mockMvc.perform(post("/api/planos-acao")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payloadPlano))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.title").value("Erro de Regra de Negócio"))
                .andExpect(jsonPath("$.detail", containsString("PENDENTE")));

        // 2. Aluno apenas com Estudo em RASCUNHO
        EstudoDeCaso rascunho = new EstudoDeCaso(alunoTeste, StatusEstudoCaso.RASCUNHO, "Em análise");
        rascunho.setId(UUID.randomUUID());
        estudosEmMemoria.add(rascunho);

        mockMvc.perform(post("/api/planos-acao")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payloadPlano))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.title").value("Erro de Regra de Negócio"))
                .andExpect(jsonPath("$.detail", containsString("RASCUNHO")));

        verify(planoAcaoRepository, never()).save(any());
    }

    @Test
    @DisplayName("TA2.1: Deve criar, consultar, atualizar e excluir Plano de Ação (Anexo III) quando Estudo de Caso estiver ATIVO ou ENCERRADO")
    void ta21DevePermitirPlanoAcaoQuandoEstudoEstiverConcluido() throws Exception {
        String token = jwtService.gerarToken(psicopedagogaUser);

        EstudoDeCaso estudoAtivo = new EstudoDeCaso(alunoTeste, StatusEstudoCaso.ATIVO, "Diagnóstico fechado");
        estudoAtivo.setId(UUID.randomUUID());
        estudoAtivo.setHistorico("Histórico completo");
        estudosEmMemoria.add(estudoAtivo);

        // POST /api/planos-acao com estudo ATIVO -> 201 Created com dados do aluno e Anexo III
        mockMvc.perform(post("/api/planos-acao")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payloadPlanoAcaoAnexoIII()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.alunoId").value(alunoId.toString()))
                .andExpect(jsonPath("$.nomeEstudante").value("Maria Clara Silva"))
                .andExpect(jsonPath("$.matriculaEstudante").value("202610025"))
                .andExpect(jsonPath("$.cursoEstudante").value("Tecnologia em Sistemas para Internet"))
                .andExpect(jsonPath("$.componenteCurricular").value("Algoritmos e Programação"))
                .andExpect(jsonPath("$.semestreAno").value("2026.1"))
                .andExpect(jsonPath("$.docente").value("Prof. João Mendes"))
                .andExpect(jsonPath("$.objetivoGeral").value("Desenvolver lógica computacional com recursos acessíveis."))
                .andExpect(jsonPath("$.bibliografiaBasica").value("CORMEN, T. H. Algoritmos. 3. ed. Rio de Janeiro: Elsevier, 2012."));

        // Também deve funcionar quando estudo estiver ENCERRADO
        estudoAtivo.setStatus(StatusEstudoCaso.ENCERRADO);
        mockMvc.perform(post("/api/planos-acao")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payloadPlanoAcaoAnexoIII()))
                .andExpect(status().isCreated());

        UUID planoId = planosEmMemoria.keySet().iterator().next();

        // GET /api/planos-acao/{id} e PUT /api/planos-acao/{id} e DELETE /api/planos-acao/{id}
        mockMvc.perform(get("/api/planos-acao/{id}", planoId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(planoId.toString()));

        String payloadUpdate = """
                {
                  "componenteCurricular": "Estrutura de Dados",
                  "avaliacao": "Avaliação prática com tempo ampliado em 50% e leitor de tela."
                }
                """;
        mockMvc.perform(put("/api/planos-acao/{id}", planoId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payloadUpdate))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.componenteCurricular").value("Estrutura de Dados"))
                .andExpect(jsonPath("$.avaliacao").value("Avaliação prática com tempo ampliado em 50% e leitor de tela."));

        mockMvc.perform(delete("/api/planos-acao/{id}", planoId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());
    }

    // =========================================================================
    // TA2.2 — Reabertura de Estudo de Caso e Auditoria (atualizadoPor id/nome)
    // =========================================================================

    @Test
    @DisplayName("TA2.2: PATCH /api/estudos-de-caso/{id}/reabrir deve reverter para RASCUNHO e expor atualizadoPor (id e nome)")
    void ta22DeveReabrirEstudoConcluidoERegistrarAuditoria() throws Exception {
        String tokenCoordenador = jwtService.gerarToken(coordenadorUser);

        EstudoDeCaso concluido = new EstudoDeCaso(alunoTeste, StatusEstudoCaso.ENCERRADO, "Diagnóstico validado");
        UUID estudoId = UUID.fromString("44444444-4444-4444-4444-444444444444");
        concluido.setId(estudoId);
        concluido.setHistorico("Histórico escolar completo");
        concluido.setIndicadores(List.of(indicadorTeste));
        concluido.setAtualizadoPor(psicopedagogaUser.getId());
        estudosEmMemoria.add(concluido);

        mockMvc.perform(patch("/api/estudos-de-caso/{id}/reabrir", estudoId)
                        .header("Authorization", "Bearer " + tokenCoordenador))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(estudoId.toString()))
                .andExpect(jsonPath("$.status").value("RASCUNHO"))
                .andExpect(jsonPath("$.atualizadoEm").isNotEmpty())
                .andExpect(jsonPath("$.atualizadoPor.id").value(coordenadorUser.getId().toString()))
                .andExpect(jsonPath("$.atualizadoPor.nome").value("Prof. Carlos Coordenador"));

        assertEquals(StatusEstudoCaso.RASCUNHO, concluido.getStatus());
        assertEquals(coordenadorUser.getId(), concluido.getAtualizadoPor());
        assertNotNull(concluido.getAtualizadoEm());

        // Tentar reabrir novamente quando já é RASCUNHO deve retornar HTTP 400 RFC 9457
        mockMvc.perform(patch("/api/estudos-de-caso/{id}/reabrir", estudoId)
                        .header("Authorization", "Bearer " + tokenCoordenador))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.title").value("Erro de Regra de Negócio"));
    }

    // =========================================================================
    // TA2.3 — Validação de Conclusão (Histórico, Diagnóstico e Indicadores)
    // =========================================================================

    @Test
    @DisplayName("TA2.3: Deve retornar HTTP 400 RFC 9457 detalhando o campo ausente (Histórico, Diagnóstico Inicial ou Indicadores) ao concluir")
    void ta23DeveExigirHistoricoDiagnosticoEIndicadoresAoConcluir() throws Exception {
        String token = jwtService.gerarToken(psicopedagogaUser);

        // 1. Sem Histórico (Diagnóstico e Indicadores preenchidos)
        String semHistorico = String.format("""
                {
                  "alunoId": "%s",
                  "status": "ENCERRADO",
                  "diagnosticoInicial": "Diagnóstico detalhado",
                  "indicadoresIds": ["%s"]
                }
                """, alunoId, indicadorId);

        mockMvc.perform(post("/api/estudos-de-caso")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(semHistorico))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.detail", containsString("Histórico")));

        // 2. Sem Diagnóstico Inicial
        String semDiagnostico = String.format("""
                {
                  "alunoId": "%s",
                  "status": "ATIVO",
                  "historico": "Histórico acadêmico detalhado",
                  "indicadoresIds": ["%s"]
                }
                """, alunoId, indicadorId);

        mockMvc.perform(post("/api/estudos-de-caso")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(semDiagnostico))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.detail", containsString("Diagnóstico Inicial")));

        // 3. Sem Indicadores
        String semIndicadores = String.format("""
                {
                  "alunoId": "%s",
                  "status": "ENCERRADO",
                  "diagnosticoInicial": "Diagnóstico detalhado",
                  "historico": "Histórico acadêmico detalhado",
                  "indicadoresIds": []
                }
                """, alunoId);

        mockMvc.perform(post("/api/estudos-de-caso")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(semIndicadores))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.detail", containsString("Dificuldades Mapeadas (indicadores)")));

        // 4. RASCUNHO sem esses campos deve ser aceito (201 Created)
        String rascunhoParcial = String.format("""
                {
                  "alunoId": "%s",
                  "status": "RASCUNHO"
                }
                """, alunoId);

        mockMvc.perform(post("/api/estudos-de-caso")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(rascunhoParcial))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("RASCUNHO"))
                .andExpect(jsonPath("$.versao").value(1));
    }

    // =========================================================================
    // TA2.4 — Versionamento e encerramento automático da versão ativa anterior
    // =========================================================================

    @Test
    @DisplayName("TA2.4: Deve encerrar estudo ATIVO anterior, incrementar versao (v1 -> v2 -> v3) e vincular estudoOrigemId ao original")
    void ta24DeveVersionarEstudosEEncerrarAtivoAnterior() throws Exception {
        String tokenPsico = jwtService.gerarToken(psicopedagogaUser);
        String tokenCoord = jwtService.gerarToken(coordenadorUser);

        String payloadAtivo = String.format("""
                {
                  "alunoId": "%s",
                  "status": "ATIVO",
                  "diagnosticoInicial": "Avaliação multidisciplinar",
                  "historico": "Histórico educacional e acompanhamento prévio",
                  "indicadoresIds": ["%s"]
                }
                """, alunoId, indicadorId);

        // Criação v1
        mockMvc.perform(post("/api/estudos-de-caso")
                        .header("Authorization", "Bearer " + tokenPsico)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payloadAtivo))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.versao").value(1))
                .andExpect(jsonPath("$.status").value("ATIVO"))
                .andExpect(jsonPath("$.estudoOrigemId").doesNotExist());

        EstudoDeCaso v1 = estudosEmMemoria.getFirst();
        assertNull(v1.getEstudoOrigem());

        // Criação v2 -> deve encerrar v1, criar v2 com versao=2 e estudoOrigemId=v1.id
        mockMvc.perform(post("/api/estudos-de-caso")
                        .header("Authorization", "Bearer " + tokenCoord)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payloadAtivo))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.versao").value(2))
                .andExpect(jsonPath("$.status").value("ATIVO"))
                .andExpect(jsonPath("$.estudoOrigemId").value(v1.getId().toString()))
                .andExpect(jsonPath("$.atualizadoPor.id").value(coordenadorUser.getId().toString()))
                .andExpect(jsonPath("$.atualizadoPor.nome").value("Prof. Carlos Coordenador"));

        assertEquals(StatusEstudoCaso.ENCERRADO, v1.getStatus());

        // Criação v3 -> deve encerrar v2, criar v3 com versao=3 e estudoOrigemId ainda apontando para v1 (documento original)
        mockMvc.perform(post("/api/estudos-de-caso")
                        .header("Authorization", "Bearer " + tokenPsico)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payloadAtivo))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.versao").value(3))
                .andExpect(jsonPath("$.status").value("ATIVO"))
                .andExpect(jsonPath("$.estudoOrigemId").value(v1.getId().toString()));

        long quantidadeAtivos = estudosEmMemoria.stream()
                .filter(e -> StatusEstudoCaso.ATIVO.equals(e.getStatus()))
                .count();
        assertEquals(1L, quantidadeAtivos, "Deve haver exatamente 1 Estudo de Caso ATIVO simultâneo por aluno.");
        assertEquals(3, estudosEmMemoria.size());
    }

    private String payloadPlanoAcaoAnexoIII() {
        return String.format("""
                {
                  "acompanhamentoId": "%s",
                  "demandasIdentificadas": "Necessidade de ampliação de contraste e tempo adicional em laboratório.",
                  "propostasIntervencao": "Uso de IDE com tema de alto contraste e prorrogação de 50%% nas provas práticas.",
                  "componenteCurricular": "Algoritmos e Programação",
                  "semestreAno": "2026.1",
                  "docente": "Prof. João Mendes",
                  "objetivoGeral": "Desenvolver lógica computacional com recursos acessíveis.",
                  "objetivosEspecificos": "Construir estruturas condicionais, laços e funções modulares.",
                  "conteudosProgramaticos": "1. Variáveis; 2. Estruturas de Controle; 3. Vetores e Funções.",
                  "metodologia": "Roteiros textuais descritivos e atendimento individualizado no contraturno.",
                  "avaliacao": "Listas práticas em dupla e avaliação oral assistida.",
                  "bibliografiaBasica": "CORMEN, T. H. Algoritmos. 3. ed. Rio de Janeiro: Elsevier, 2012.",
                  "bibliografiaComplementar": "ASCENCIO, A. F. G. Fundamentos da Programação de Computadores. 3. ed. São Paulo: Pearson, 2012."
                }
                """, acompanhamentoId);
    }
}
