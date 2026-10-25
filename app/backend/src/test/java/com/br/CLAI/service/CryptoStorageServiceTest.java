package com.br.CLAI.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;

import static org.junit.jupiter.api.Assertions.*;

class CryptoStorageServiceTest {

    private static final String TEST_AES_KEY_32_CHARS = "0123456789abcdef0123456789abcdef";
    private static final String TEST_AES_KEY_64_HEX = "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f";

    @TempDir
    Path tempVolumeDir;

    private CryptoStorageService cryptoStorageService;

    @BeforeEach
    void setUp() {
        cryptoStorageService = new CryptoStorageService(TEST_AES_KEY_32_CHARS, tempVolumeDir.toString());
    }

    @Test
    @DisplayName("Deve criptografar com AES-256-GCM e descriptografar em memória preservando 100% dos bytes originais")
    void deveCriptografarEDescriptografarEmMemoriaComIntegridade() {
        byte[] pdfSimulado = "%PDF-1.7\n%Laudo Médico Confidencial - CID F84.0 (TEA) - Paciente Teste\n%%EOF"
                .getBytes(StandardCharsets.UTF_8);

        CryptoStorageService.EncryptedPayload resultado = cryptoStorageService.encrypt(pdfSimulado);

        assertNotNull(resultado);
        assertNotNull(resultado.ciphertext());
        assertNotNull(resultado.iv());
        assertNotNull(resultado.ivBase64());
        assertEquals(CryptoStorageService.GCM_IV_LENGTH_BYTES, resultado.iv().length);
        // No GCM com tag de 128 bits (16 bytes), o ciphertext tem tamanho = plaintext.length + 16
        assertEquals(pdfSimulado.length + 16, resultado.ciphertext().length);

        // Garantir que os bytes cifrados não possuem a assinatura "%PDF-" nem texto legível (TA11.1)
        String conteudoCifradoComoString = new String(resultado.ciphertext(), StandardCharsets.ISO_8859_1);
        assertFalse(conteudoCifradoComoString.startsWith("%PDF-"), "O arquivo cifrado não pode conter cabeçalho %PDF- aberto");
        assertFalse(conteudoCifradoComoString.contains("CID F84.0"), "O texto sensível não pode aparecer em claro nos bytes cifrados");

        // Descriptografar em memória usando o IV em Base64
        byte[] descriptografado = cryptoStorageService.decrypt(resultado.ciphertext(), resultado.ivBase64());
        assertArrayEquals(pdfSimulado, descriptografado);
    }

    @Test
    @DisplayName("Deve gerar IVs aleatórios e ciphertexts distintos para o mesmo arquivo (Segurança Semântica GCM)")
    void deveGerarIvUnicoParaCadaCriptografia() {
        byte[] mesmoConteudo = "%PDF-1.4 Diagnóstico Neuropsicológico".getBytes(StandardCharsets.UTF_8);

        CryptoStorageService.EncryptedPayload cifragem1 = cryptoStorageService.encrypt(mesmoConteudo);
        CryptoStorageService.EncryptedPayload cifragem2 = cryptoStorageService.encrypt(mesmoConteudo);

        assertFalse(Arrays.equals(cifragem1.iv(), cifragem2.iv()), "Dois uploads nunca devem reutilizar o mesmo IV");
        assertNotEquals(cifragem1.ivBase64(), cifragem2.ivBase64());
        assertFalse(Arrays.equals(cifragem1.ciphertext(), cifragem2.ciphertext()), "Ciphertexts devem ser distintos quando o IV muda");

        // Ambos devem descriptografar para o mesmo conteúdo original
        assertArrayEquals(mesmoConteudo, cryptoStorageService.decrypt(cifragem1.ciphertext(), cifragem1.iv()));
        assertArrayEquals(mesmoConteudo, cryptoStorageService.decrypt(cifragem2.ciphertext(), cifragem2.iv()));
    }

    @Test
    @DisplayName("Deve detectar adulteração nos bytes cifrados (AEAD GCM Tag 128 bits) e bloquear descriptografia")
    void deveBloquearDescriptografiaQuandoCiphertextForAdulterado() {
        byte[] original = "%PDF-1.5 Laudo Médico Sensível".getBytes(StandardCharsets.UTF_8);
        CryptoStorageService.EncryptedPayload payload = cryptoStorageService.encrypt(original);

        byte[] ciphertextAdulterado = Arrays.copyOf(payload.ciphertext(), payload.ciphertext().length);
        // Inverter 1 bit no primeiro byte do payload cifrado
        ciphertextAdulterado[0] ^= 0x01;

        assertThrows(SecurityException.class, () ->
                cryptoStorageService.decrypt(ciphertextAdulterado, payload.ivBase64())
        );
    }

    @Test
    @DisplayName("Deve falhar na descriptografia se o IV estiver incorreto ou se a chave AES for diferente")
    void deveFalharComIvIncorretoOuChaveDiferente() {
        byte[] original = "%PDF-1.5 Conteúdo Protegido LGPD".getBytes(StandardCharsets.UTF_8);
        CryptoStorageService.EncryptedPayload payload = cryptoStorageService.encrypt(original);

        // 1. Testar com outro IV válido de 12 bytes
        CryptoStorageService.EncryptedPayload outroPayload = cryptoStorageService.encrypt(original);
        assertThrows(SecurityException.class, () ->
                cryptoStorageService.decrypt(payload.ciphertext(), outroPayload.ivBase64())
        );

        // 2. Testar com instância usando outra chave AES de 256 bits
        CryptoStorageService outroServiceComChaveDiferente = new CryptoStorageService(
                TEST_AES_KEY_64_HEX,
                tempVolumeDir.toString()
        );
        assertThrows(SecurityException.class, () ->
                outroServiceComChaveDiferente.decrypt(payload.ciphertext(), payload.ivBase64())
        );
    }

    @Test
    @DisplayName("Deve rejeitar chaves AES que não possuam 256 bits (32 bytes)")
    void deveValidarTamanhoDaChaveAes() {
        assertThrows(IllegalArgumentException.class, () ->
                new CryptoStorageService("chave-curta-16b!", tempVolumeDir.toString())
        );
        assertThrows(IllegalArgumentException.class, () ->
                new CryptoStorageService("", tempVolumeDir.toString())
        );
        assertDoesNotThrow(() ->
                new CryptoStorageService(TEST_AES_KEY_64_HEX, tempVolumeDir.toString())
        );
    }

    @Test
    @DisplayName("Deve persistir bytes cifrados no volume e bloquear tentativas de Path Traversal")
    void deveSalvarELerDoVolumeComSegurancaContraPathTraversal() throws Exception {
        byte[] original = "%PDF-1.7 Laudo no Volume Docker".getBytes(StandardCharsets.UTF_8);
        CryptoStorageService.EncryptedPayload payload = cryptoStorageService.encrypt(original);

        String caminhoSalvo = cryptoStorageService.salvarNoVolume("estudante-123/laudo_cifrado.enc", payload.ciphertext());
        assertEquals("estudante-123/laudo_cifrado.enc", caminhoSalvo);

        // Verificar que o arquivo existe fisicamente no volume e não contém texto aberto
        Path arquivoFisico = tempVolumeDir.resolve(caminhoSalvo);
        assertTrue(Files.exists(arquivoFisico));
        byte[] bytesNoDisco = Files.readAllBytes(arquivoFisico);
        assertFalse(new String(bytesNoDisco, StandardCharsets.ISO_8859_1).contains("%PDF-"));

        // Ler de volta via service e descriptografar em memória
        byte[] bytesLidos = cryptoStorageService.lerDoVolume(caminhoSalvo);
        byte[] recuperadoEmMemoria = cryptoStorageService.decrypt(bytesLidos, payload.ivBase64());
        assertArrayEquals(original, recuperadoEmMemoria);

        // Bloquear Path Traversal
        assertThrows(SecurityException.class, () ->
                cryptoStorageService.salvarNoVolume("../../fora_do_volume.enc", payload.ciphertext())
        );
        assertThrows(SecurityException.class, () ->
                cryptoStorageService.lerDoVolume("../../etc/passwd")
        );
    }
}
