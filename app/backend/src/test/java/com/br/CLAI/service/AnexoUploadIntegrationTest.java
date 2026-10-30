package com.br.CLAI.service;

import com.br.CLAI.controller.AnexoEstudanteController;
import com.br.CLAI.domain.Aluno;
import com.br.CLAI.domain.AnexoEstudante;
import com.br.CLAI.domain.enums.TipoClassificacaoAnexo;
import com.br.CLAI.handler.GlobalExceptionHandler;
import com.br.CLAI.repository.AlunoRepository;
import com.br.CLAI.repository.AnexoEstudanteRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Base64;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AnexoUploadIntegrationTest {

    private static final String TEST_AES_KEY = "0123456789abcdef0123456789abcdef";

    @TempDir
    Path tempVolumeDir;

    @Mock
    private AnexoEstudanteRepository anexoEstudanteRepository;

    @Mock
    private AlunoRepository alunoRepository;

    private CryptoStorageService cryptoStorageService;
    private AnexoEstudanteService anexoEstudanteService;
    private MockMvc mockMvc;

    private UUID estudanteId;
    private Aluno alunoMock;

    @BeforeEach
    void setUp() {
        cryptoStorageService = new CryptoStorageService(TEST_AES_KEY, tempVolumeDir.toString());
        anexoEstudanteService = new AnexoEstudanteService(
                anexoEstudanteRepository,
                alunoRepository,
                cryptoStorageService
        );
        AnexoEstudanteController controller = new AnexoEstudanteController(anexoEstudanteService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        estudanteId = UUID.fromString("11111111-2222-3333-4444-555555555555");
        alunoMock = new Aluno("Carlos Eduardo Silva", "20261001");
        alunoMock.setId(estudanteId);
    }

    @Test
    @DisplayName("TA11.1 [Checkpoint 2]: Upload de LAUDO_MEDICO deve cifrar os bytes em repouso no volume e impedir leitura externa do PDF")
    void deveCifrarLaudoMedicoEmRepousoNoVolume() throws Exception {
        when(alunoRepository.findById(estudanteId)).thenReturn(Optional.of(alunoMock));
        when(anexoEstudanteRepository.save(any(AnexoEstudante.class))).thenAnswer(invocation -> {
            AnexoEstudante ent = invocation.getArgument(0);
            ent.setId(UUID.randomUUID());
            return ent;
        });

        byte[] pdfSensivelBytes = (
                "%PDF-1.7\n" +
                "1 0 obj << /Type /Catalog >> endobj\n" +
                "DIAGNÓSTICO CLÍNICO CONFIDENCIAL: CID-10 F84.0 (Transtorno do Espectro Autista)\n" +
                "%%EOF"
        ).getBytes(StandardCharsets.UTF_8);

        MockMultipartFile multipartFile = new MockMultipartFile(
                "arquivo",
                "laudo_medico_autismo.pdf",
                MediaType.APPLICATION_PDF_VALUE,
                pdfSensivelBytes
        );

        mockMvc.perform(multipart("/api/v1/alunos/{id}/anexos", estudanteId)
                        .file(multipartFile)
                        .param("classificacao", TipoClassificacaoAnexo.LAUDO_MEDICO.name()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.alunoId").value(estudanteId.toString()))
                .andExpect(jsonPath("$.nomeOriginal").value("laudo_medico_autismo.pdf"))
                .andExpect(jsonPath("$.contentType").value("application/pdf"))
                .andExpect(jsonPath("$.classificacao").value("LAUDO_MEDICO"))
                .andExpect(jsonPath("$.criptografado").value(true))
                // Garantir que caminho físico e IV não vazam no payload JSON de resposta
                .andExpect(jsonPath("$.iv").doesNotExist())
                .andExpect(jsonPath("$.caminhoArmazenamento").doesNotExist());

        ArgumentCaptor<AnexoEstudante> captor = ArgumentCaptor.forClass(AnexoEstudante.class);
        verify(anexoEstudanteRepository).save(captor.capture());
        AnexoEstudante entidadeSalva = captor.getValue();

        assertTrue(entidadeSalva.isCriptografado());
        assertNotNull(entidadeSalva.getIv(), "O IV deve ser obrigatoriamente salvo para anexos sensíveis");
        assertEquals(12, Base64.getDecoder().decode(entidadeSalva.getIv()).length, "O IV deve ter 12 bytes (96 bits)");
        assertTrue(entidadeSalva.getCaminhoArmazenamento().endsWith(".enc"));

        // =========================================================================
        // INSPEÇÃO FÍSICA DO VOLUME (COMPROVAÇÃO TA11.1 - ILEGIBILIDADE EM REPOUSO)
        // =========================================================================
        Path arquivoFisicoNoVolume = tempVolumeDir.resolve(entidadeSalva.getCaminhoArmazenamento());
        assertTrue(Files.exists(arquivoFisicoNoVolume), "O arquivo cifrado deve existir no volume de storage");

        byte[] bytesEmRepousoNoDisco = Files.readAllBytes(arquivoFisicoNoVolume);
        String representacaoBrutaDisco = new String(bytesEmRepousoNoDisco, StandardCharsets.ISO_8859_1);

        // 1. O arquivo em disco NÃO pode começar com os magic bytes "%PDF-"
        assertFalse(representacaoBrutaDisco.startsWith("%PDF-"),
                "Violação TA11.1: O arquivo em disco ainda possui cabeçalho PDF aberto!");
        // 2. O texto médico confidencial NÃO pode constar em claro no disco
        assertFalse(representacaoBrutaDisco.contains("CID-10 F84.0"),
                "Violação TA11.1: Dados clínicos em texto claro encontrados no volume!");
        assertFalse(representacaoBrutaDisco.contains("Transtorno do Espectro Autista"),
                "Violação TA11.1: Dados clínicos em texto claro encontrados no volume!");

        // 3. Apenas com a chave AES-256 e o IV persistido é possível restaurar o PDF original em memória
        byte[] pdfRestauradoEmMemoria = cryptoStorageService.decrypt(bytesEmRepousoNoDisco, entidadeSalva.getIv());
        assertArrayEquals(pdfSensivelBytes, pdfRestauradoEmMemoria);
    }

    @Test
    @DisplayName("TA11.1: Upload de DIAGNOSTICO_NEUROPSICOLOGICO também deve ser cifrado obrigatoriamente")
    void deveCifrarDiagnosticoNeuropsicologicoEmRepouso() throws Exception {
        when(alunoRepository.findById(estudanteId)).thenReturn(Optional.of(alunoMock));
        when(anexoEstudanteRepository.save(any(AnexoEstudante.class))).thenAnswer(invocation -> {
            AnexoEstudante ent = invocation.getArgument(0);
            ent.setId(UUID.randomUUID());
            return ent;
        });

        byte[] pdfNeuro = "%PDF-1.7 Avaliação Neuropsicológica WISC-IV Sigilosa".getBytes(StandardCharsets.UTF_8);
        MockMultipartFile multipartFile = new MockMultipartFile(
                "arquivo",
                "avaliacao_neuro.pdf",
                MediaType.APPLICATION_PDF_VALUE,
                pdfNeuro
        );

        mockMvc.perform(multipart("/api/v1/alunos/{id}/anexos", estudanteId)
                        .file(multipartFile)
                        .param("classificacao", TipoClassificacaoAnexo.DIAGNOSTICO_NEUROPSICOLOGICO.name()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.classificacao").value("DIAGNOSTICO_NEUROPSICOLOGICO"))
                .andExpect(jsonPath("$.criptografado").value(true));

        ArgumentCaptor<AnexoEstudante> captor = ArgumentCaptor.forClass(AnexoEstudante.class);
        verify(anexoEstudanteRepository).save(captor.capture());
        AnexoEstudante salvo = captor.getValue();

        Path arquivoNoVolume = tempVolumeDir.resolve(salvo.getCaminhoArmazenamento());
        byte[] bytesNoDisco = Files.readAllBytes(arquivoNoVolume);
        assertFalse(new String(bytesNoDisco, StandardCharsets.ISO_8859_1).contains("WISC-IV"));
    }

    @Test
    @DisplayName("Fluxo Padrão: Upload de DOCUMENTO_PEDAGOGICO deve ser salvo sem cifragem de saúde (criptografado = false, iv = null)")
    void deveSalvarDocumentoPedagogicoSemCifragemMedica() throws Exception {
        when(alunoRepository.findById(estudanteId)).thenReturn(Optional.of(alunoMock));
        when(anexoEstudanteRepository.save(any(AnexoEstudante.class))).thenAnswer(invocation -> {
            AnexoEstudante ent = invocation.getArgument(0);
            ent.setId(UUID.randomUUID());
            return ent;
        });

        byte[] pdfPedagogico = "%PDF-1.4 Atividade Adaptada de Matemática".getBytes(StandardCharsets.UTF_8);
        MockMultipartFile multipartFile = new MockMultipartFile(
                "arquivo",
                "atividade_matematica.pdf",
                MediaType.APPLICATION_PDF_VALUE,
                pdfPedagogico
        );

        mockMvc.perform(multipart("/api/v1/alunos/{id}/anexos", estudanteId)
                        .file(multipartFile)
                        .param("classificacao", TipoClassificacaoAnexo.DOCUMENTO_PEDAGOGICO.name()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.classificacao").value("DOCUMENTO_PEDAGOGICO"))
                .andExpect(jsonPath("$.criptografado").value(false));

        ArgumentCaptor<AnexoEstudante> captor = ArgumentCaptor.forClass(AnexoEstudante.class);
        verify(anexoEstudanteRepository).save(captor.capture());
        AnexoEstudante salvo = captor.getValue();

        assertFalse(salvo.isCriptografado());
        assertNull(salvo.getIv());

        Path arquivoNoVolume = tempVolumeDir.resolve(salvo.getCaminhoArmazenamento());
        assertArrayEquals(pdfPedagogico, Files.readAllBytes(arquivoNoVolume));
    }

    @Test
    @DisplayName("Deve retornar 404 Not Found ao tentar enviar anexo para estudante inexistente")
    void deveRetornar404ParaEstudanteInexistente() throws Exception {
        UUID idInexistente = UUID.randomUUID();
        when(alunoRepository.findById(idInexistente)).thenReturn(Optional.empty());

        MockMultipartFile multipartFile = new MockMultipartFile(
                "arquivo",
                "laudo.pdf",
                MediaType.APPLICATION_PDF_VALUE,
                "%PDF-1.4 teste".getBytes(StandardCharsets.UTF_8)
        );

        mockMvc.perform(multipart("/api/v1/alunos/{id}/anexos", idInexistente)
                        .file(multipartFile)
                        .param("classificacao", TipoClassificacaoAnexo.LAUDO_MEDICO.name()))
                .andExpect(status().isNotFound());
    }
}
