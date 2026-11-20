package com.br.CLAI.controller;

import com.br.CLAI.dto.request.RaiRequestDTO;
import com.br.CLAI.dto.response.NotificacaoResponseDTO;
import com.br.CLAI.dto.response.RaiResponseDTO;
import com.br.CLAI.handler.GlobalExceptionHandler;
import com.br.CLAI.service.NotificacaoService;
import com.br.CLAI.service.RaiService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
@DisplayName("Contrato HTTP: POST /api/rais e /api/notificacoes")
class RaiNotificacaoControllerTest {

    @Mock
    private RaiService raiService;
    @Mock
    private NotificacaoService notificacaoService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .standaloneSetup(new RaiController(raiService), new NotificacaoController(notificacaoService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    @DisplayName("POST /api/rais persiste o relatório com indicativo de regressão e responde 201")
    void emitirRaiDeveResponder201() throws Exception {
        UUID alunoId = UUID.randomUUID();
        UUID raiId = UUID.randomUUID();
        String payload = """
                {
                  "alunoId": "%s",
                  "bimestre": 2,
                  "indicativoRegressao": true,
                  "descricao": "Regressão nas metas do PEI"
                }
                """.formatted(alunoId);

        when(raiService.emitirRai(any(RaiRequestDTO.class), any()))
                .thenReturn(new RaiResponseDTO(raiId, alunoId, null, null, 2, true, "Regressão nas metas do PEI", null));

        mockMvc.perform(post("/api/rais")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(raiId.toString()))
                .andExpect(jsonPath("$.indicativoRegressao").value(true));

        verify(raiService).emitirRai(any(RaiRequestDTO.class), any());
    }

    @Test
    @DisplayName("POST /api/rais rejeita payload sem alunoId/bimestre com 400")
    void emitirRaiInvalidoDeveResponder400() throws Exception {
        mockMvc.perform(post("/api/rais")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"descricao\":\"sem dados obrigatórios\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("GET /api/notificacoes consulta notificações pendentes do COORDENADOR")
    void buscarNotificacoesDeveRetornarPendentes() throws Exception {
        UUID notificacaoId = UUID.randomUUID();
        when(notificacaoService.buscarPorPerfil(eq("COORDENADOR"), eq(true)))
                .thenReturn(List.of(new NotificacaoResponseDTO(
                        notificacaoId, "COORDENADOR", "Revisão de PEI", "Solicita-se revisão.",
                        "/api/peis/aluno/123", false, null)));

        mockMvc.perform(get("/api/notificacoes")
                        .param("perfil", "COORDENADOR")
                        .param("apenasNaoLidas", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(notificacaoId.toString()))
                .andExpect(jsonPath("$[0].lida").value(false));

        verify(notificacaoService).buscarPorPerfil("COORDENADOR", true);
    }
}
