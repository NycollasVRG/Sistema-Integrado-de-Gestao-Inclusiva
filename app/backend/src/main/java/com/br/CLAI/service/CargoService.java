package com.br.CLAI.service;

import com.br.CLAI.domain.Cargo;
import com.br.CLAI.dto.request.CargoRequestDTO;
import com.br.CLAI.dto.response.CargoResponseDTO;
import com.br.CLAI.exception.ConflitoException;
import com.br.CLAI.exception.NaoEncontradoException;
import com.br.CLAI.exception.RegraDeNegocioException;
import com.br.CLAI.repository.CargoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
public class CargoService {

    private static final Pattern CODIGO_VALIDO_PATTERN = Pattern.compile("^[A-Z][A-Z0-9_]{1,49}$");

    private final CargoRepository cargoRepository;

    public CargoService(CargoRepository cargoRepository) {
        this.cargoRepository = cargoRepository;
    }

    @Transactional(readOnly = true)
    public List<CargoResponseDTO> listar(Boolean apenasAtivos, String busca) {
        List<Cargo> cargos = Boolean.TRUE.equals(apenasAtivos)
                ? cargoRepository.findAllByAtivoTrueOrderBySistemaDescNomeAsc()
                : cargoRepository.findAllByOrderBySistemaDescNomeAsc();

        String termo = (busca != null) ? busca.trim().toLowerCase(Locale.ROOT) : "";
        return cargos.stream()
                .filter(cargo -> termo.isEmpty() || correspondeBusca(cargo, termo))
                .map(CargoResponseDTO::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public CargoResponseDTO buscarPorId(UUID id) {
        return CargoResponseDTO.fromEntity(buscarEntidadePorId(id));
    }

    @Transactional
    public CargoResponseDTO criar(CargoRequestDTO dto) {
        String codigoNormalizado = normalizarCodigo(dto.codigo());
        if (cargoRepository.existsByCodigoIgnoreCase(codigoNormalizado)) {
            throw new ConflitoException("Já existe um cargo cadastrado com o código: " + codigoNormalizado);
        }

        Cargo cargo = new Cargo(
                codigoNormalizado,
                dto.nome().trim(),
                normalizarDescricao(dto.descricao()),
                dto.nivelRestricaoPadrao(),
                Boolean.TRUE.equals(dto.autorizacaoSaudePadrao()),
                dto.ativo() != null ? dto.ativo() : Boolean.TRUE,
                Boolean.FALSE
        );

        return CargoResponseDTO.fromEntity(cargoRepository.save(cargo));
    }

    @Transactional
    public CargoResponseDTO atualizar(UUID id, CargoRequestDTO dto) {
        Cargo cargo = buscarEntidadePorId(id);
        String codigoNormalizado = normalizarCodigo(dto.codigo());

        if (Boolean.TRUE.equals(cargo.getSistema())) {
            if (!cargo.getCodigo().equalsIgnoreCase(codigoNormalizado)) {
                throw new RegraDeNegocioException(
                        "Não é permitido alterar o código identificador de um cargo estrutural do sistema."
                );
            }
            if (Boolean.FALSE.equals(dto.ativo())) {
                throw new RegraDeNegocioException(
                        "Não é permitido desativar um cargo estrutural do sistema."
                );
            }
        } else {
            if (cargoRepository.existsByCodigoIgnoreCaseAndIdNot(codigoNormalizado, id)) {
                throw new ConflitoException("Já existe outro cargo cadastrado com o código: " + codigoNormalizado);
            }
            cargo.setCodigo(codigoNormalizado);
            if (dto.ativo() != null) {
                cargo.setAtivo(dto.ativo());
            }
        }

        cargo.setNome(dto.nome().trim());
        cargo.setDescricao(normalizarDescricao(dto.descricao()));
        cargo.setNivelRestricaoPadrao(dto.nivelRestricaoPadrao());
        if (dto.autorizacaoSaudePadrao() != null) {
            cargo.setAutorizacaoSaudePadrao(dto.autorizacaoSaudePadrao());
        }

        return CargoResponseDTO.fromEntity(cargoRepository.save(cargo));
    }

    @Transactional
    public CargoResponseDTO alterarStatus(UUID id, Boolean ativo) {
        Cargo cargo = buscarEntidadePorId(id);
        if (Boolean.TRUE.equals(cargo.getSistema()) && Boolean.FALSE.equals(ativo)) {
            throw new RegraDeNegocioException(
                    "Não é permitido desativar um cargo estrutural do sistema."
            );
        }

        cargo.setAtivo(Boolean.TRUE.equals(ativo));
        return CargoResponseDTO.fromEntity(cargoRepository.save(cargo));
    }

    @Transactional
    public void excluir(UUID id) {
        Cargo cargo = buscarEntidadePorId(id);
        if (Boolean.TRUE.equals(cargo.getSistema())) {
            throw new RegraDeNegocioException(
                    "Não é permitido excluir um cargo estrutural do sistema."
            );
        }
        cargoRepository.delete(cargo);
    }

    private Cargo buscarEntidadePorId(UUID id) {
        return cargoRepository.findById(id)
                .orElseThrow(() -> new NaoEncontradoException("Cargo não encontrado com o ID: " + id));
    }

    private String normalizarCodigo(String codigo) {
        if (codigo == null || codigo.isBlank()) {
            throw new RegraDeNegocioException("O código do cargo é obrigatório.");
        }
        String normalizado = codigo.trim()
                .replaceAll("[\\s-]+", "_")
                .replaceAll("_+", "_")
                .toUpperCase(Locale.ROOT);

        if (!CODIGO_VALIDO_PATTERN.matcher(normalizado).matches()) {
            throw new RegraDeNegocioException(
                    "Código de cargo inválido. Utilize apenas letras, números e sublinhado, iniciando por letra."
            );
        }
        return normalizado;
    }

    private String normalizarDescricao(String descricao) {
        if (descricao == null) {
            return null;
        }
        String limpa = descricao.trim();
        return limpa.isEmpty() ? null : limpa;
    }

    private boolean correspondeBusca(Cargo cargo, String termo) {
        return (cargo.getCodigo() != null && cargo.getCodigo().toLowerCase(Locale.ROOT).contains(termo))
                || (cargo.getNome() != null && cargo.getNome().toLowerCase(Locale.ROOT).contains(termo))
                || (cargo.getDescricao() != null && cargo.getDescricao().toLowerCase(Locale.ROOT).contains(termo));
    }
}
