package com.br.CLAI.service;

import com.br.CLAI.exception.RegraDeNegocioException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;

@Service
public class CryptoStorageService {

    public static final String ALGORITHM = "AES";
    public static final String TRANSFORMATION = "AES/GCM/NoPadding";
    public static final int AES_KEY_SIZE_BYTES = 32; // 256 bits
    public static final int GCM_IV_LENGTH_BYTES = 12; // 96 bits (Recomendado NIST SP 800-38D)
    public static final int GCM_TAG_LENGTH_BITS = 128; // 128 bits authentication tag

    private final SecretKey secretKey;
    private final Path storageRootPath;
    private final SecureRandom secureRandom;

    public record EncryptedPayload(byte[] ciphertext, byte[] iv, String ivBase64) {
    }

    public CryptoStorageService(
            @Value("${sigi.security.aes-key:0123456789abcdef0123456789abcdef}") String aesKeyRaw,
            @Value("${sigi.storage.attachments-dir:/app/storage/anexos}") String attachmentsDir
    ) {
        this.secretKey = buildSecretKey(aesKeyRaw);
        this.storageRootPath = Paths.get(attachmentsDir).toAbsolutePath().normalize();
        this.secureRandom = new SecureRandom();
    }

    private SecretKey buildSecretKey(String aesKeyRaw) {
        if (aesKeyRaw == null || aesKeyRaw.isBlank()) {
            throw new IllegalArgumentException("A chave simétrica AES (AES_KEY) não pode ser nula ou vazia.");
        }

        String trimmed = aesKeyRaw.trim();
        byte[] keyBytes;

        if (trimmed.length() == 64 && trimmed.matches("^[0-9a-fA-F]{64}$")) {
            keyBytes = HexFormat.of().parseHex(trimmed);
        } else {
            keyBytes = trimmed.getBytes(StandardCharsets.UTF_8);
        }

        if (keyBytes.length != AES_KEY_SIZE_BYTES) {
            throw new IllegalArgumentException(
                    "A chave AES (AES_KEY) deve possuir exatamente 32 bytes (256 bits). Tamanho atual: "
                            + keyBytes.length + " bytes."
            );
        }

        return new SecretKeySpec(keyBytes, ALGORITHM);
    }

    /**
     * Criptografa um array de bytes em memória utilizando AES-256-GCM com IV aleatório de 12 bytes
     * e tag de autenticação de 128 bits.
     */
    public EncryptedPayload encrypt(byte[] plaintext) {
        if (plaintext == null || plaintext.length == 0) {
            throw new IllegalArgumentException("O conteúdo a ser criptografado não pode ser nulo ou vazio.");
        }

        try {
            byte[] iv = new byte[GCM_IV_LENGTH_BYTES];
            secureRandom.nextBytes(iv);

            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, parameterSpec);

            byte[] ciphertext = cipher.doFinal(plaintext);
            String ivBase64 = Base64.getEncoder().encodeToString(iv);

            return new EncryptedPayload(ciphertext, iv, ivBase64);
        } catch (GeneralSecurityException ex) {
            throw new SecurityException("Falha crítica ao criptografar anexo sensível com AES-256-GCM.", ex);
        }
    }

    /**
     * Descriptografa os bytes exclusivamente em memória (RAM) utilizando a chave AES-256 e o IV em Base64.
     * Nenhum arquivo temporário é escrito em disco.
     */
    public byte[] decrypt(byte[] ciphertext, String ivBase64) {
        if (ivBase64 == null || ivBase64.isBlank()) {
            throw new IllegalArgumentException("O Initialization Vector (IV) em Base64 é obrigatório para descriptografia.");
        }
        byte[] iv;
        try {
            iv = Base64.getDecoder().decode(ivBase64.trim());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Formato Base64 inválido para o Initialization Vector (IV).", ex);
        }
        return decrypt(ciphertext, iv);
    }

    /**
     * Descriptografa os bytes exclusivamente em memória (RAM) utilizando a chave AES-256 e o IV bruto.
     * Valida autenticamente a tag de 128 bits do GCM contra adulteração.
     */
    public byte[] decrypt(byte[] ciphertext, byte[] iv) {
        if (ciphertext == null || ciphertext.length == 0) {
            throw new IllegalArgumentException("O conteúdo cifrado não pode ser nulo ou vazio.");
        }
        if (iv == null || iv.length != GCM_IV_LENGTH_BYTES) {
            throw new IllegalArgumentException(
                    "O Initialization Vector (IV) para AES-GCM deve possuir exatamente " + GCM_IV_LENGTH_BYTES + " bytes."
            );
        }

        try {
            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, parameterSpec);

            return cipher.doFinal(ciphertext);
        } catch (GeneralSecurityException ex) {
            throw new SecurityException("Falha na descriptografia ou violação de integridade (AEAD GCM Tag inválida).", ex);
        }
    }

    /**
     * Persiste os bytes (já cifrados quando sensíveis) no volume de armazenamento configurado.
     */
    public String salvarNoVolume(String caminhoRelativo, byte[] conteudo) {
        if (caminhoRelativo == null || caminhoRelativo.isBlank()) {
            throw new IllegalArgumentException("O caminho relativo de armazenamento não pode ser vazio.");
        }
        if (conteudo == null || conteudo.length == 0) {
            throw new IllegalArgumentException("O conteúdo para gravação no volume não pode ser vazio.");
        }

        Path destino = storageRootPath.resolve(caminhoRelativo).normalize();
        if (!destino.startsWith(storageRootPath)) {
            throw new SecurityException("Tentativa de Path Traversal bloqueada ao gravar no volume de anexos.");
        }

        try {
            if (destino.getParent() != null) {
                Files.createDirectories(destino.getParent());
            }
            Files.write(destino, conteudo);
            return storageRootPath.relativize(destino).toString().replace('\\', '/');
        } catch (IOException ex) {
            throw new RegraDeNegocioException("Erro de I/O ao persistir o anexo no volume de armazenamento.");
        }
    }

    /**
     * Lê os bytes brutos diretamente do volume de armazenamento para a memória.
     */
    public byte[] lerDoVolume(String caminhoArmazenamento) {
        if (caminhoArmazenamento == null || caminhoArmazenamento.isBlank()) {
            throw new IllegalArgumentException("O caminho de armazenamento não pode ser vazio.");
        }

        Path arquivo = resolverCaminhoSeguro(caminhoArmazenamento);
        if (!Files.exists(arquivo) || !Files.isRegularFile(arquivo)) {
            throw new RegraDeNegocioException("Arquivo físico do anexo não encontrado no volume de armazenamento.");
        }

        try {
            return Files.readAllBytes(arquivo);
        } catch (IOException ex) {
            throw new RegraDeNegocioException("Erro de I/O ao ler o anexo do volume de armazenamento.");
        }
    }

    public Path resolverCaminhoSeguro(String caminhoArmazenamento) {
        Path candidato = Paths.get(caminhoArmazenamento);
        Path resolvido = candidato.isAbsolute()
                ? candidato.normalize()
                : storageRootPath.resolve(caminhoArmazenamento).normalize();

        if (!resolvido.startsWith(storageRootPath)) {
            throw new SecurityException("Tentativa de Path Traversal bloqueada ao acessar o volume de anexos.");
        }
        return resolvido;
    }

    public Path getStorageRootPath() {
        return storageRootPath;
    }
}
