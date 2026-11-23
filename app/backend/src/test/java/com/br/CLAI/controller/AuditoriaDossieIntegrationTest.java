package com.br.CLAI.controller;

import com.br.CLAI.domain.Aluno;
import com.br.CLAI.domain.AuditLog;
import com.br.CLAI.domain.IndicadorReutilizavel;
import com.br.CLAI.domain.Usuario;
import com.br.CLAI.domain.enums.NivelRestricao;
import com.br.CLAI.domain.enums.Role;
import com.br.CLAI.domain.enums.StatusAluno;
import com.br.CLAI.domain.enums.TipoClassificacaoAnexo;
import com.br.CLAI.repository.AlunoRepository;
import com.br.CLAI.repository.AuditLogRepository;
import com.br.CLAI.repository.IndicadorReutilizavelRepository;
import com.br.CLAI.repository.UsuarioRepository;
import com.br.CLAI.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "sigi.storage.attachments-dir=${java.io.tmpdir}/sigi-us06-test-storage"
})
@DisplayName("US 06 - Integração Ponta a Ponta: Auditoria Invisível (TA6.1), Dossiê Jurídico (TA6.2), Imutabilidade (TA6.3) e LGPD Externo (TA6.4)")
class AuditoriaDossieIntegrationTest {

    private static final Pattern JSON_ID_PATTERN = Pattern.compile(
            "\"id\"\\s*:\\s*\"([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})\""
    );

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private AlunoRepository alunoRepository;

    @Autowired
    private IndicadorReutilizavelRepository indicadorRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    private MockMvc mockMvc;
    private Usuario adminUser;
    private Usuario professorUser;
    private String tokenAdmin;
    private String tokenProfessor;
    private Aluno aluno;
    private IndicadorReutilizavel indicador;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(SecurityMockMvcConfigurers.springSecurity())
                .build();

        String sufixo = UUID.randomUUID().toString().substring(0, 8);

        adminUser = new Usuario(
                "Admin Auditoria " + sufixo,
                "admin.us06." + sufixo + "@sigi.ifpb.edu.br",
                "hash",
                Role.ADMIN,
                NivelRestricao.SUPER_RESTRICAO,
                true
        );
        adminUser.setAcessoAtivo(true);
        adminUser.setTokenVersion(1);
        adminUser = usuarioRepository.saveAndFlush(adminUser);

        professorUser = new Usuario(
                "Professor " + sufixo,
                "prof.us06." + sufixo + "@sigi.ifpb.edu.br",
                "hash",
                Role.PROFESSOR,
                NivelRestricao.ACESSO_FUNCIONAL,
                false
        );
        professorUser.setAcessoAtivo(true);
        professorUser.setTokenVersion(1);
        professorUser = usuarioRepository.saveAndFlush(professorUser);

        tokenAdmin = jwtService.gerarToken(adminUser);
        tokenProfessor = jwtService.gerarToken(professorUser);

        aluno = new Aluno("Estudante Dossiê " + sufixo, "MATUS06" + sufixo);
        aluno.setCurso("ADS");
        aluno.setTurma("2026.1");
        aluno.setStatus(StatusAluno.ATIVO);
        aluno.setAtivo(true);
        aluno = alunoRepository.saveAndFlush(aluno);

        indicador = indicadorRepository.saveAndFlush(
                new IndicadorReutilizavel("TDAH-" + sufixo, "Indicador de teste US 06")
        );
    }

    @Test
    @DisplayName("Ref. TA6.1: Toda requisição POST, PUT, PATCH e DELETE em documentos deve gerar registro em sigi.audit_log com usuario_id, timestamp, endpoint e acao")
    void deveRegistrarTrilhaDeAuditoriaParaPostPutPatchEDeleteEmDocumentos() throws Exception {
        // 1. POST (Inserção de Estudo de Caso)
        String criarEstudoJson = """
                {
                  "alunoId": "%s",
                  "status": "RASCUNHO",
                  "diagnosticoInicial": "Diagnóstico inicial auditado",
                  "historico": "Histórico pedagógico inicial"
                }
                """.formatted(aluno.getId());

        MvcResult postResult = mockMvc.perform(post("/api/estudos-de-caso")
                        .header("Authorization", "Bearer " + tokenAdmin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(criarEstudoJson))
                .andExpect(status().isCreated())
                .andReturn();

        UUID estudoId = extrairUuidDoJson(postResult.getResponse().getContentAsString());

        // 2. PUT (Atualização do Estudo de Caso -> ATIVO)
        String atualizarEstudoJson = """
                {
                  "status": "ATIVO",
                  "diagnosticoInicial": "Diagnóstico atualizado auditado",
                  "historico": "Histórico pedagógico revisado",
                  "historicoFamiliar": "Histórico familiar sigiloso",
                  "historicoSocioemocional": "Histórico socioemocional sigiloso",
                  "indicadoresIds": ["%s"]
                }
                """.formatted(indicador.getId());

        mockMvc.perform(put("/api/estudos-de-caso/{id}", estudoId)
                        .header("Authorization", "Bearer " + tokenAdmin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(atualizarEstudoJson))
                .andExpect(status().isOk());

        // 3. PATCH (Reabertura de Estudo de Caso -> cria nova versão em RASCUNHO)
        MvcResult patchResult = mockMvc.perform(patch("/api/estudos-de-caso/{id}/reabrir", estudoId)
                        .header("Authorization", "Bearer " + tokenAdmin))
                .andExpect(status().isOk())
                .andReturn();

        UUID estudoReabertoId = extrairUuidDoJson(patchResult.getResponse().getContentAsString());

        // 4. DELETE (Exclusão lógica do rascunho reaberto)
        mockMvc.perform(delete("/api/estudos-de-caso/{id}", estudoReabertoId)
                        .header("Authorization", "Bearer " + tokenAdmin))
                .andExpect(status().isNoContent());

        List<AuditLog> logs = auditLogRepository.findByUsuarioIdOrderByTimestampDesc(adminUser.getId());

        assertTrue(logs.stream().anyMatch(l ->
                "POST".equals(l.getMetodoHttp())
                        && "INSERCAO".equals(l.getAcao())
                        && "/api/estudos-de-caso".equals(l.getEndpoint())
                        && adminUser.getId().equals(l.getUsuarioId())
                        && l.getTimestamp() != null
                        && estudoId.equals(l.getEntidadeId())
        ), "Deve existir log de auditoria para POST em /api/estudos-de-caso");

        assertTrue(logs.stream().anyMatch(l ->
                "PUT".equals(l.getMetodoHttp())
                        && "ATUALIZACAO".equals(l.getAcao())
                        && ("/api/estudos-de-caso/" + estudoId).equals(l.getEndpoint())
                        && adminUser.getId().equals(l.getUsuarioId())
                        && l.getTimestamp() != null
        ), "Deve existir log de auditoria para PUT em /api/estudos-de-caso/{id}");

        assertTrue(logs.stream().anyMatch(l ->
                "PATCH".equals(l.getMetodoHttp())
                        && "ATUALIZACAO".equals(l.getAcao())
                        && ("/api/estudos-de-caso/" + estudoId + "/reabrir").equals(l.getEndpoint())
                        && adminUser.getId().equals(l.getUsuarioId())
                        && l.getTimestamp() != null
        ), "Deve existir log de auditoria para PATCH em /api/estudos-de-caso/{id}/reabrir");

        assertTrue(logs.stream().anyMatch(l ->
                "DELETE".equals(l.getMetodoHttp())
                        && "DELECAO".equals(l.getAcao())
                        && ("/api/estudos-de-caso/" + estudoReabertoId).equals(l.getEndpoint())
                        && adminUser.getId().equals(l.getUsuarioId())
                        && l.getTimestamp() != null
        ), "Deve existir log de auditoria para DELETE em /api/estudos-de-caso/{id}");
    }

    @Test
    @DisplayName("Ref. TA6.2 + TA6.4: Exportação de dossiê INTERNO consolida atas, convocações, notificações e laudos; EXTERNO omite laudos médicos e registros SUPER_RESTRICAO")
    void deveExportarDossieEstruturadoEOmitirDadosSuperRestricaoNoEscopoExterno() throws Exception {
        // 1. Criar Estudo de Caso com histórico familiar/socioemocional sensível
        String estudoJson = """
                {
                  "alunoId": "%s",
                  "status": "ATIVO",
                  "diagnosticoInicial": "Necessidade de adaptação curricular",
                  "historico": "Trajetória acadêmica positiva",
                  "historicoFamiliar": "DADO_CLINICO_FAMILIAR_CONFIDENCIAL",
                  "historicoSocioemocional": "DADO_SOCIOEMOCIONAL_CONFIDENCIAL",
                  "indicadoresIds": ["%s"]
                }
                """.formatted(aluno.getId(), indicador.getId());

        mockMvc.perform(post("/api/estudos-de-caso")
                        .header("Authorization", "Bearer " + tokenAdmin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(estudoJson))
                .andExpect(status().isCreated());

        // 2. Criar Ata de Reunião de Alinhamento com Família (alimenta atasReuniao e convocacoes)
        String ataJson = """
                {
                  "alunoId": "%s",
                  "tipoReuniao": "ALINHAMENTO_FAMILIA",
                  "dataReuniao": "2026-11-10T14:00:00",
                  "localReuniao": "Sala da CLAI",
                  "pauta": "Alinhamento com a família sobre plano inclusivo",
                  "deliberacoes": "Acompanhamento quinzenal aprovado"
                }
                """.formatted(aluno.getId());

        MvcResult ataResult = mockMvc.perform(post("/api/atas")
                        .header("Authorization", "Bearer " + tokenAdmin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(ataJson))
                .andExpect(status().isCreated())
                .andReturn();
        UUID ataId = extrairUuidDoJson(ataResult.getResponse().getContentAsString());

        // 3. Disparar Notificação/Convocação vinculada à ata/estudante (alimenta notificacoes, convocacoes e audit_log)
        String notificacaoJson = """
                {
                  "perfilDestinatario": "COORDENADOR",
                  "titulo": "Convocação por e-mail enviada à família",
                  "mensagem": "Convocação formal referente ao estudante %s (matrícula %s).",
                  "linkReferencia": "/api/atas/%s"
                }
                """.formatted(aluno.getNomeCompleto(), aluno.getMatricula(), ataId);

        mockMvc.perform(post("/api/notificacoes")
                        .header("Authorization", "Bearer " + tokenAdmin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(notificacaoJson))
                .andExpect(status().isCreated());

        // 4. Upload de anexo LAUDO_MEDICO (SUPER_RESTRICAO) e DOCUMENTO_PEDAGOGICO
        MockMultipartFile laudoFile = new MockMultipartFile(
                "arquivo",
                "laudo_medico_sigiloso.pdf",
                MediaType.APPLICATION_PDF_VALUE,
                "%PDF-1.7 LAUDO MEDICO CID F84".getBytes(StandardCharsets.UTF_8)
        );
        mockMvc.perform(multipart("/api/alunos/{id}/anexos", aluno.getId())
                        .file(laudoFile)
                        .param("classificacao", TipoClassificacaoAnexo.LAUDO_MEDICO.name())
                        .header("Authorization", "Bearer " + tokenAdmin))
                .andExpect(status().isCreated());

        MockMultipartFile pedagogicoFile = new MockMultipartFile(
                "arquivo",
                "relatorio_pedagogico.pdf",
                MediaType.APPLICATION_PDF_VALUE,
                "%PDF-1.7 RELATORIO PEDAGOGICO".getBytes(StandardCharsets.UTF_8)
        );
        mockMvc.perform(multipart("/api/alunos/{id}/anexos", aluno.getId())
                        .file(pedagogicoFile)
                        .param("classificacao", TipoClassificacaoAnexo.DOCUMENTO_PEDAGOGICO.name())
                        .header("Authorization", "Bearer " + tokenAdmin))
                .andExpect(status().isCreated());

        // 5. TA6.2: Exportar Dossiê (escopo padrão INTERNO) -> deve consolidar tudo
        mockMvc.perform(get("/api/alunos/{id}/dossie/exportar", aluno.getId())
                        .header("Authorization", "Bearer " + tokenAdmin))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_TYPE, containsString(MediaType.APPLICATION_JSON_VALUE)))
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, containsString("attachment")))
                .andExpect(jsonPath("$.escopo").value("INTERNO"))
                .andExpect(jsonPath("$.alunoId").value(aluno.getId().toString()))
                .andExpect(jsonPath("$.prontuario.historicoFamiliar").value("DADO_CLINICO_FAMILIAR_CONFIDENCIAL"))
                .andExpect(jsonPath("$.atasReuniao.length()").value(1))
                .andExpect(jsonPath("$.convocacoes.length()").value(greaterThanOrEqualTo(2)))
                .andExpect(jsonPath("$.notificacoes.length()").value(greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.laudosMedicos.length()").value(1))
                .andExpect(jsonPath("$.laudosMedicos[0].nomeOriginal").value("laudo_medico_sigiloso.pdf"))
                .andExpect(jsonPath("$.anexos.length()").value(2))
                .andExpect(jsonPath("$.logsAuditoria.length()").value(greaterThanOrEqualTo(4)));

        // 6. TA6.4: Exportar Dossiê com escopo=EXTERNO -> deve omitir laudos médicos e registros SUPER_RESTRICAO
        MvcResult externoResult = mockMvc.perform(get("/api/alunos/{id}/dossie/exportar", aluno.getId())
                        .param("escopo", "EXTERNO")
                        .header("Authorization", "Bearer " + tokenAdmin))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, containsString("externo.json")))
                .andExpect(jsonPath("$.escopo").value("EXTERNO"))
                .andExpect(jsonPath("$.laudosMedicos").doesNotExist())
                .andExpect(jsonPath("$.prontuario.historicoFamiliar").doesNotExist())
                .andExpect(jsonPath("$.prontuario.historicoSocioemocional").doesNotExist())
                .andExpect(jsonPath("$.estudosDeCaso[0].historicoFamiliar").doesNotExist())
                .andExpect(jsonPath("$.estudosDeCaso[0].historicoSocioemocional").doesNotExist())
                .andExpect(jsonPath("$.anexos.length()").value(1))
                .andExpect(jsonPath("$.anexos[0].classificacao").value("DOCUMENTO_PEDAGOGICO"))
                .andExpect(jsonPath("$.anexos[*].classificacao", not(hasItem("LAUDO_MEDICO"))))
                .andExpect(jsonPath("$.atasReuniao.length()").value(1))
                .andExpect(jsonPath("$.convocacoes.length()").value(greaterThanOrEqualTo(2)))
                .andReturn();

        String jsonExterno = externoResult.getResponse().getContentAsString(StandardCharsets.UTF_8);
        assertFalse(jsonExterno.contains("laudo_medico_sigiloso.pdf"),
                "Arquivo de laudo médico não pode vazar no dossiê EXTERNO");
        assertFalse(jsonExterno.contains("LAUDO_MEDICO"),
                "Referências a LAUDO_MEDICO não podem constar no dossiê EXTERNO");
        assertFalse(jsonExterno.contains("SUPER_RESTRICAO"),
                "Registros classificados como SUPER_RESTRICAO devem ser omitidos no dossiê EXTERNO");
        assertFalse(jsonExterno.contains("DADO_CLINICO_FAMILIAR_CONFIDENCIAL"),
                "Histórico familiar sensível não pode vazar no dossiê EXTERNO");
    }

    @Test
    @DisplayName("Ref. TA6.3: Não deve existir nenhuma rota DELETE ou PUT para sigi.audit_log na API, retornando HTTP 404/405 mesmo para ROLE_ADMIN")
    void naoDeveExporRotasDeleteOuPutParaLogsDeAuditoriaMesmoParaAdmin() throws Exception {
        UUID qualquerId = UUID.randomUUID();

        // Tentativas em caminhos de audit_log / auditoria -> HTTP 404 Not Found
        mockMvc.perform(delete("/api/audit-logs/{id}", qualquerId)
                        .header("Authorization", "Bearer " + tokenAdmin))
                .andExpect(result -> {
                    int st = result.getResponse().getStatus();
                    assertTrue(st == 404 || st == 405, "Esperado 404 ou 405, obtido: " + st);
                });

        mockMvc.perform(put("/api/audit-logs/{id}", qualquerId)
                        .header("Authorization", "Bearer " + tokenAdmin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(result -> {
                    int st = result.getResponse().getStatus();
                    assertTrue(st == 404 || st == 405, "Esperado 404 ou 405, obtido: " + st);
                });

        mockMvc.perform(delete("/api/auditoria/{id}", qualquerId)
                        .header("Authorization", "Bearer " + tokenAdmin))
                .andExpect(result -> {
                    int st = result.getResponse().getStatus();
                    assertTrue(st == 404 || st == 405, "Esperado 404 ou 405, obtido: " + st);
                });

        mockMvc.perform(put("/api/auditoria/{id}", qualquerId)
                        .header("Authorization", "Bearer " + tokenAdmin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(result -> {
                    int st = result.getResponse().getStatus();
                    assertTrue(st == 404 || st == 405, "Esperado 404 ou 405, obtido: " + st);
                });

        // Tentativas de DELETE/PUT no endpoint de dossiê -> HTTP 405 Method Not Allowed
        mockMvc.perform(delete("/api/alunos/{id}/dossie/exportar", aluno.getId())
                        .header("Authorization", "Bearer " + tokenAdmin))
                .andExpect(status().isMethodNotAllowed());

        mockMvc.perform(put("/api/alunos/{id}/dossie/exportar", aluno.getId())
                        .header("Authorization", "Bearer " + tokenAdmin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isMethodNotAllowed());
    }

    @Test
    @DisplayName("Ref. TA6.1 (AOP): Disparo indireto de notificação (ex.: RAI com regressão) deve gerar log automático DISPARO_NOTIFICACAO via AuditoriaAspect")
    void deveAuditarDisparoIndiretoDeNotificacaoViaAspectoAop() throws Exception {
        String raiRegressaoJson = """
                {
                  "alunoId": "%s",
                  "tipoRelatorio": "RAI",
                  "bimestre": 2,
                  "indicativoRegressao": true,
                  "descricao": "Queda de rendimento observada no 2º bimestre"
                }
                """.formatted(aluno.getId());

        mockMvc.perform(post("/api/rais")
                        .header("Authorization", "Bearer " + tokenAdmin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(raiRegressaoJson))
                .andExpect(status().isCreated());

        List<AuditLog> logs = auditLogRepository.findByUsuarioIdOrderByTimestampDesc(adminUser.getId());

        assertTrue(logs.stream().anyMatch(l ->
                "RAI".equals(l.getEntidade())
                        && "INSERCAO".equals(l.getAcao())
                        && "/api/rais".equals(l.getEndpoint())
        ), "AuditoriaFilter deve registrar a inserção do RAI");

        assertTrue(logs.stream().anyMatch(l ->
                "NOTIFICACAO".equals(l.getEntidade())
                        && "DISPARO_NOTIFICACAO".equals(l.getAcao())
                        && l.getDetalhes() != null
                        && l.getDetalhes().contains(aluno.getId().toString())
        ), "AuditoriaAspect deve registrar automaticamente o disparo indireto de notificação pelo RaiService");
    }

    @Test
    @DisplayName("RBAC: Professor com ACESSO_FUNCIONAL não pode exportar dossiê jurídico (HTTP 403 Forbidden)")
    void professorNaoDeveExportarDossieJuridico() throws Exception {
        mockMvc.perform(get("/api/alunos/{id}/dossie/exportar", aluno.getId())
                        .header("Authorization", "Bearer " + tokenProfessor))
                .andExpect(status().isForbidden());
    }

    private UUID extrairUuidDoJson(String json) {
        Matcher matcher = JSON_ID_PATTERN.matcher(json);
        assertTrue(matcher.find(), "JSON de resposta deveria conter um campo 'id' UUID válido: " + json);
        return UUID.fromString(matcher.group(1));
    }
}
