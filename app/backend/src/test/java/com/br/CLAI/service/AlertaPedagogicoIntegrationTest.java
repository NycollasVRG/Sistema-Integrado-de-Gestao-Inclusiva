package com.br.CLAI.service;

import com.br.CLAI.domain.Acompanhamento;
import com.br.CLAI.domain.AlertaPedagogico;
import com.br.CLAI.domain.Aluno;
import com.br.CLAI.domain.AuditLog;
import com.br.CLAI.domain.IndicadorReutilizavel;
import com.br.CLAI.domain.Pea;
import com.br.CLAI.domain.Usuario;
import com.br.CLAI.domain.enums.NivelRestricao;
import com.br.CLAI.domain.enums.Role;
import com.br.CLAI.domain.enums.StatusAluno;
import com.br.CLAI.repository.AcompanhamentoRepository;
import com.br.CLAI.repository.AlertaPedagogicoRepository;
import com.br.CLAI.repository.AlunoRepository;
import com.br.CLAI.repository.AuditLogRepository;
import com.br.CLAI.repository.IndicadorReutilizavelRepository;
import com.br.CLAI.repository.PeaRepository;
import com.br.CLAI.repository.UsuarioRepository;
import com.br.CLAI.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.time.LocalDate;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.is;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
@DisplayName("US 05 - Integração Ponta a Ponta: Motor SUAP x PEA/Tags, Filtros do Dashboard e Histórico (TA5.1 a TA5.4)")
class AlertaPedagogicoIntegrationTest {

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
    private AcompanhamentoRepository acompanhamentoRepository;

    @Autowired
    private PeaRepository peaRepository;

    @Autowired
    private AlertaPedagogicoRepository alertaRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    private MockMvc mockMvc;
    private Usuario coordenador;
    private String tokenCoordenador;
    private String sufixo;
    private Aluno alunoJp;
    private Aluno alunoCg;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(SecurityMockMvcConfigurers.springSecurity())
                .build();

        sufixo = UUID.randomUUID().toString().substring(0, 8);

        coordenador = new Usuario(
                "Coordenador US05 " + sufixo,
                "coord.us05." + sufixo + "@sigi.ifpb.edu.br",
                "hash",
                Role.COORDENADOR,
                NivelRestricao.SUPER_RESTRICAO,
                true
        );
        coordenador.setAcessoAtivo(true);
        coordenador.setTokenVersion(1);
        coordenador = usuarioRepository.saveAndFlush(coordenador);
        tokenCoordenador = jwtService.gerarToken(coordenador);

        IndicadorReutilizavel tagNaoAlfabetizado = indicadorRepository.saveAndFlush(
                new IndicadorReutilizavel("Não Alfabetizado " + sufixo, "Condição de alfabetização US 05")
        );
        IndicadorReutilizavel tagSilabico = indicadorRepository.saveAndFlush(
                new IndicadorReutilizavel("Estágio Silábico " + sufixo, "Estágio silábico US 05")
        );

        alunoJp = new Aluno("Pedro Henrique " + sufixo, "MATJP" + sufixo);
        alunoJp.setCurso("Administração " + sufixo);
        alunoJp.setTurma("M1-" + sufixo);
        alunoJp.setStatus(StatusAluno.ATIVO);
        alunoJp.setAtivo(true);
        alunoJp.setTagsDificuldade(new LinkedHashSet<>(Set.of(tagNaoAlfabetizado)));
        alunoJp = alunoRepository.saveAndFlush(alunoJp);

        alunoCg = new Aluno("Ana Beatriz " + sufixo, "MATCG" + sufixo);
        alunoCg.setCurso("Educação Física " + sufixo);
        alunoCg.setTurma("M2-" + sufixo);
        alunoCg.setStatus(StatusAluno.ATIVO);
        alunoCg.setAtivo(true);
        alunoCg.setTagsDificuldade(new LinkedHashSet<>(Set.of(tagSilabico)));
        alunoCg = alunoRepository.saveAndFlush(alunoCg);
    }

    @Test
    @DisplayName("Ref. TA5.1 + TA5.2 + TA5.3 + TA5.4: Fluxo completo de análise SUAP, filtros por Unidade/Curso/Turma e tratamento")
    void fluxoCompletoMotorAlertasFiltrosETratamento() throws Exception {
        String unidadeJp = "Campus João Pessoa " + sufixo;
        String unidadeCg = "Campus Campina Grande " + sufixo;

        // 1. TA5.1 + TA5.2 para alunoJp (retenção -> VERMELHO + nota máxima em Filosofia sem PEA -> PEDAGOGICO)
        String payloadJp = """
                {
                  "alunoId": "%s",
                  "unidade": "%s",
                  "retido": true,
                  "riscoJubilamento": false,
                  "disciplinas": [
                    {
                      "componenteCurricular": "Filosofia",
                      "teorica": true,
                      "nota": 100,
                      "notaMaxima": 100
                    }
                  ]
                }
                """.formatted(alunoJp.getId(), unidadeJp);

        mockMvc.perform(post("/api/dashboard/alertas/analisar")
                        .header("Authorization", "Bearer " + tokenCoordenador)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payloadJp))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].severidade").value("VERMELHO"))
                .andExpect(jsonPath("$[0].tipoAlerta").value("RETENCAO"))
                .andExpect(jsonPath("$[1].severidade").value("PEDAGOGICO"))
                .andExpect(jsonPath("$[1].tipoAlerta").value("INCOERENCIA_PEDAGOGICA"))
                .andExpect(jsonPath("$[1].descricao", containsString("Filosofia")));

        // 2. TA5.1 + TA5.2 para alunoCg (iminência de jubilamento -> VERMELHO; História COM PEA cadastrado -> NÃO gera incoerência)
        Acompanhamento acompanhamentoCg = acompanhamentoRepository.saveAndFlush(
                new Acompanhamento(alunoCg, LocalDate.of(2026, 2, 1))
        );
        Pea peaHistoria = new Pea();
        peaHistoria.setAcompanhamento(acompanhamentoCg);
        peaHistoria.setComponenteCurricular("História");
        peaHistoria.setObjetivoGeral("Adaptação curricular de História");
        peaRepository.saveAndFlush(peaHistoria);

        String payloadCg = """
                {
                  "matricula": "%s",
                  "unidade": "%s",
                  "retido": false,
                  "riscoJubilamento": true,
                  "disciplinas": [
                    {
                      "componenteCurricular": "História",
                      "teorica": true,
                      "nota": 100,
                      "notaMaxima": 100
                    }
                  ]
                }
                """.formatted(alunoCg.getMatricula(), unidadeCg);

        MvcResult resultCg = mockMvc.perform(post("/api/dashboard/alertas/analisar")
                        .header("Authorization", "Bearer " + tokenCoordenador)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payloadCg))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].severidade").value("VERMELHO"))
                .andExpect(jsonPath("$[0].tipoAlerta").value("RISCO_JUBILAMENTO"))
                .andReturn();

        UUID alertaJubilamentoId = extrairPrimeiroUuid(resultCg.getResponse().getContentAsString());

        // 3. TA5.3: Filtrar por unidade, curso e turma (inclusive sem acentos) -> retorna apenas alertas de alunoJp
        mockMvc.perform(get("/api/dashboard/alertas")
                        .param("unidade", "joao pessoa " + sufixo)
                        .param("curso", "administracao " + sufixo)
                        .param("turma", "m1-" + sufixo)
                        .header("Authorization", "Bearer " + tokenCoordenador))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[*].alunoId", everyItem(is(alunoJp.getId().toString()))));

        // 3b. TA5.3: Filtrar para Campina Grande / Educacao Fisica / M2 -> retorna apenas o alerta de alunoCg
        mockMvc.perform(get("/api/dashboard/alertas")
                        .param("unidade", unidadeCg)
                        .param("curso", "educacao fisica " + sufixo)
                        .param("turma", "M2-" + sufixo)
                        .header("Authorization", "Bearer " + tokenCoordenador))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(alertaJubilamentoId.toString()))
                .andExpect(jsonPath("$[0].alunoId").value(alunoCg.getId().toString()));

        // 4. TA5.4: Marcar alerta de jubilamento como "Ciente/Tratado"
        mockMvc.perform(patch("/api/dashboard/alertas/{id}/tratar", alertaJubilamentoId)
                        .header("Authorization", "Bearer " + tokenCoordenador))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(alertaJubilamentoId.toString()))
                .andExpect(jsonPath("$.tratado").value(true))
                .andExpect(jsonPath("$.tratadoPor").value(coordenador.getId().toString()))
                .andExpect(jsonPath("$.tratadoEm").isNotEmpty());

        // 4b. Verificar persistência real no banco
        AlertaPedagogico salvoNoBanco = alertaRepository.findById(alertaJubilamentoId).orElseThrow();
        assertTrue(salvoNoBanco.getTratado());
        assertEquals(coordenador.getId(), salvoNoBanco.getTratadoPor());
        assertNotNull(salvoNoBanco.getTratadoEm());

        // 4c. TA5.4: Listagem ativa (tratado=false padrão) não contém mais o alerta tratado
        mockMvc.perform(get("/api/dashboard/alertas")
                        .param("unidade", unidadeCg)
                        .header("Authorization", "Bearer " + tokenCoordenador))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));

        // 4d. TA5.4: Log de histórico (tratado=true) contém o alerta tratado
        mockMvc.perform(get("/api/dashboard/alertas")
                        .param("unidade", unidadeCg)
                        .param("tratado", "true")
                        .header("Authorization", "Bearer " + tokenCoordenador))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(alertaJubilamentoId.toString()))
                .andExpect(jsonPath("$[0].tratado").value(true))
                .andExpect(jsonPath("$[0].tratadoPor").value(coordenador.getId().toString()));

        // 5. Confirma trilha de auditoria para PATCH /api/dashboard/alertas/{id}/tratar
        List<AuditLog> logs = auditLogRepository.findByUsuarioIdOrderByTimestampDesc(coordenador.getId());
        assertFalse(logs.isEmpty());
        assertTrue(logs.stream().anyMatch(l ->
                "ALERTA_PEDAGOGICO".equals(l.getEntidade())
                        && "PATCH".equals(l.getMetodoHttp())
                        && l.getEndpoint().endsWith("/api/dashboard/alertas/" + alertaJubilamentoId + "/tratar")
        ));
    }

    private UUID extrairPrimeiroUuid(String json) {
        Matcher matcher = JSON_ID_PATTERN.matcher(json);
        assertTrue(matcher.find(), "JSON de resposta deveria conter um campo 'id' UUID válido: " + json);
        return UUID.fromString(matcher.group(1));
    }
}
