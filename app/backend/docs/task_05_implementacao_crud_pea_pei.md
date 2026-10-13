# Plano de Implementação: CRUD de PEA e PEI (US 03)

## 1. Visão Geral (Checkpoints)

**O que já foi feito (Checkpoints Anteriores):**
- [x] Configuração de Soft Delete na `BaseEntity`.
- [x] Estrutura de auditoria com `criadoEm`, `atualizadoEm`, `criadoPor` e `atualizadoPor`.
- [x] Implementação das entidades de domínio necessárias, incluindo `Aluno` e `Acompanhamento`.
- [x] Configuração do acesso aos dados através do Spring Data JPA.

**O que foi feito nesta Task (Checkpoint Atual - Dividido em Mini-Tasks):**
- [x] **Mini-Task 1**: Implementação da estrutura de DTOs de PEA.
- [x] **Mini-Task 2**: Implementação da estrutura de DTOs de PEI.
- [x] **Mini-Task 3**: Implementação dos Mappers de PEA e PEI.
- [x] **Mini-Task 4**: Implementação dos Repositories de PEA e PEI.
- [x] **Mini-Task 5**: Implementação das Services com as regras de negócio.
- [x] **Mini-Task 6**: Implementação dos Controllers e endpoints REST.
- [x] **Mini-Task 7**: Inclusão de validações nos DTOs de criação.
- [x] **Mini-Task 8**: Implementação e validação do Soft Delete.
- [x] **Mini-Task 9**: Implementação do acesso aos anexos sensíveis do PEI.
- [x] **Mini-Task 10**: Testes manuais dos endpoints com Thunder Client e PostgreSQL.

*A implementação foi separada por camadas para manter as responsabilidades bem definidas e facilitar futuras integrações com outras funcionalidades do sistema.*

## 2. Arquitetura em Camadas

A implementação de PEA e PEI segue a arquitetura já utilizada dentro do pacote `com.br.CLAI`.

* `controller`
  * `PeaController`
  * `PeiController`
* `dto`
  * `request`
    * `PeaRequestDTO`
    * `PeaUpdateDTO`
    * `PeiRequestDTO`
    * `PeiUpdateDTO`
  * `response`
    * `PeaResponseDTO`
    * `PeiResponseDTO`
* `service`
  * `PeaService`
  * `PeiService`
* `mapper`
  * `PeaMapper`
  * `PeiMapper`
* `repository`
  * `PeaRepository`
  * `PeiRepository`

Essa divisão evita que o Controller acesse diretamente o banco ou manipule entidades JPA sem uma camada intermediária.

## 3. Estrutura do PEA

O PEA representa o Plano Educacional Adaptado e está relacionado a um `Acompanhamento`.

A entidade possui, entre outros, os seguintes campos:

```java
private Acompanhamento acompanhamento;
private UUID disciplinaId;
private String objetivoGeral;
private String metodologia;
private String avaliacao;
```

O relacionamento principal é:

```text
PEA
 ↓
Acompanhamento
 ↓
Aluno
```

### Validações do `PeaRequestDTO`

O campo `acompanhamentoId` é obrigatório:

```java
@NotNull(message = "O ID do acompanhamento é obrigatório")
private UUID acompanhamentoId;
```

Os campos pedagógicos obrigatórios utilizam `@NotBlank`:

```java
@NotBlank(message = "O objetivo geral é obrigatório")
private String objetivoGeral;
```

```java
@NotBlank(message = "A metodologia é obrigatória")
private String metodologia;
```

```java
@NotBlank(message = "A avaliação é obrigatória")
private String avaliacao;
```

Essas validações impedem valores nulos, strings vazias ou preenchidas apenas com espaços.

O campo `disciplinaId` permanece opcional.

## 4. Estrutura do PEI

O PEI representa o Plano Educacional Individualizado e também está relacionado a um `Acompanhamento`.

A entidade possui:

```java
private Acompanhamento acompanhamento;
private String habilidadesInteresses;
private String propostasAdaptacoes;
```

O relacionamento também segue:

```text
PEI
 ↓
Acompanhamento
 ↓
Aluno
```

### Validações do `PeiRequestDTO`

O acompanhamento é obrigatório:

```java
@NotNull(message = "O ID do acompanhamento é obrigatório")
private UUID acompanhamentoId;
```

Os campos pedagógicos também possuem validações obrigatórias:

```java
@NotBlank(message = "Os conhecimentos, habilidades e interesses são obrigatórios")
private String habilidadesInteresses;
```

```java
@NotBlank(message = "As propostas de adaptações curriculares são obrigatórias")
private String propostasAdaptacoes;
```

Assim, o PEI não pode ser criado sem um acompanhamento ou sem as informações principais do plano.

## 5. DTOs e Mappers

PEA e PEI utilizam DTOs separados para criação, atualização e resposta.

### PEA

```text
PeaRequestDTO
PeaUpdateDTO
PeaResponseDTO
```

### PEI

```text
PeiRequestDTO
PeiUpdateDTO
PeiResponseDTO
```

Os Mappers são responsáveis por realizar:

```text
DTO → Entity
Entity → DTO
```

Essa abordagem evita expor diretamente as entidades JPA através da API.

### Vantagens da abordagem

1. **Separação de responsabilidades:** os Controllers ficam responsáveis somente pela camada HTTP.
2. **Validação centralizada:** as validações básicas ficam nos DTOs de request.
3. **Maior segurança:** somente os campos esperados são recebidos ou retornados.
4. **Facilidade de manutenção:** mudanças internas nas entidades não precisam afetar diretamente o contrato da API.

## 6. Repositories

Os Repositories utilizam Spring Data JPA.

### `PeaRepository`

Além das operações padrão do `JpaRepository`, possui consultas por acompanhamento e por aluno:

```java
List<Pea> findByAcompanhamentoId(UUID acompanhamentoId);
```

```java
List<Pea> findByAcompanhamento_Aluno_Id(UUID alunoId);
```

### `PeiRepository`

Também possui consultas equivalentes:

```java
List<Pei> findByAcompanhamentoId(UUID acompanhamentoId);
```

```java
List<Pei> findByAcompanhamento_Aluno_Id(UUID alunoId);
```

Essas consultas permitem reutilizar os dados posteriormente em funcionalidades agregadoras, como a Timeline do aluno.

## 7. Services

As Services concentram a lógica de negócio.

### `PeaService`

Responsável pelas operações de:

```text
criar
listar
buscar
atualizar
inativar
```

A criação valida a existência do `Acompanhamento` antes de salvar o PEA.

### `PeiService`

Responsável por:

```text
criar
listar
buscar
listar por acompanhamento
listar por aluno
atualizar
inativar
listar anexos sensíveis
```

Na criação do PEI, a Service busca o `Acompanhamento` informado e retorna erro caso ele não exista.

Também são preenchidos os campos de auditoria:

```java
pei.setCriadoPor(usuarioId);
pei.setAtualizadoPor(usuarioId);
```

Durante atualizações, o campo `atualizadoPor` também é atualizado.

## 8. Endpoints REST

### Endpoints principais de PEA

A API de PEA possui operações de CRUD, como:

```http
POST /api/peas
GET /api/peas
GET /api/peas/{id}
PUT /api/peas/{id}
DELETE /api/peas/{id}
```

### Endpoints de PEI

O `PeiController` utiliza a rota base:

```http
/api/peis
```

Os principais endpoints são:

```http
GET /api/peis
GET /api/peis/{id}
GET /api/peis/acompanhamento/{acompanhamentoId}
GET /api/peis/aluno/{alunoId}
POST /api/peis
PUT /api/peis/{id}
DELETE /api/peis/{id}
```

A criação e atualização utilizam o header:

```text
X-User-Id
```

para registrar o usuário responsável pela operação.

## 9. Ref. TA3.2: Anexos Sensíveis do PEI

O PEI disponibiliza uma rota específica para consultar anexos considerados sensíveis.

```http
GET /api/peis/{id}/anexos-sensiveis
```

No contexto atual da implementação, os PEAs relacionados ao mesmo acompanhamento são utilizados como anexos do PEI.

O perfil do usuário é informado através do header:

```text
X-User-Perfil
```

Existe uma regra específica para o perfil:

```text
Professor
```

Quando esse perfil tenta acessar os anexos sensíveis, a Service lança uma exceção de acesso negado e a API retorna HTTP `403 Forbidden`.

O fluxo fica:

```text
Requisição
   ↓
X-User-Perfil
   ↓
PeiService
   ↓
Professor?
 ┌───────┴───────┐
 sim             não
 ↓                ↓
403         retorna anexos
```

## 10. Ref. TA3.4: Soft Delete

PEA e PEI herdam de `BaseEntity`, que possui:

```java
@SoftDelete
```

Isso faz com que a exclusão não remova definitivamente o registro do banco.

Quando é executado:

```java
repository.delete(entidade);
```

o Hibernate marca o registro como:

```text
deleted = true
```

O registro continua fisicamente armazenado na tabela, mas deixa de aparecer nas consultas normais realizadas pelo Hibernate.

Esse comportamento é utilizado tanto no PEA quanto no PEI.

## 11. Testes Realizados

### PEA

Foram validados:

- [x] `GET /api/peas` retornando os registros.
- [x] Criação de PEA com `POST`.
- [x] Atualização utilizando `PUT`.
- [x] Exclusão lógica utilizando `DELETE`.
- [x] Retorno `204 No Content` no DELETE.
- [x] Confirmação de `deleted = true` diretamente no PostgreSQL.
- [x] Confirmação de que o registro inativado deixa de aparecer em consultas normais.
- [x] Validações do `PeaRequestDTO`.

### PEI

A implementação disponibiliza:

- [x] Consulta geral.
- [x] Consulta por ID.
- [x] Consulta por acompanhamento.
- [x] Consulta por aluno.
- [x] Criação.
- [x] Atualização.
- [x] Inativação com Soft Delete.
- [x] Consulta de anexos sensíveis com controle pelo perfil informado.

## 12. Integração entre PEI e PEA

PEI e PEA compartilham a entidade `Acompanhamento`.

Isso permite identificar os planos relacionados ao mesmo aluno e ao mesmo acompanhamento.

No `PeiService`, os PEAs relacionados ao acompanhamento do PEI podem ser consultados através de:

```java
peaRepository.findByAcompanhamentoId(
    pei.getAcompanhamento().getId()
);
```

Isso é utilizado no endpoint de anexos sensíveis.

A relação pode ser representada como:

```text
             Aluno
               ↓
        Acompanhamento
          ↙         ↘
        PEI         PEA
```

Essa estrutura também facilita a utilização dos dois módulos em outras funcionalidades, como a Timeline.

## 13. Ordem de Implementação e Commits

### PEA

A implementação do PEA foi organizada em commits separados:

1. **Estrutura do CRUD**

```text
feat: adiciona estrutura do CRUD de PEA
```

2. **Regras de negócio e Soft Delete**

```text
feat: implementa regras e soft delete do PEA
```

3. **Endpoints REST**

```text
feat: adiciona endpoints REST do PEA
```

4. **Validações adicionais**

```text
fix: adiciona validacoes ao PeaRequestDTO
```

### PEI

A implementação do PEI foi desenvolvida como uma funcionalidade separada, contendo sua própria estrutura de DTOs, Mapper, Repository, Service e Controller.

Os arquivos finais utilizados na integração incluem:

```text
Pei.java
PeiRequestDTO.java
PeiUpdateDTO.java
PeiResponseDTO.java
PeiRepository.java
PeiService.java
PeiController.java
```

## 14. Resultado da Implementação

O fluxo final de PEA e PEI segue:

```text
                  API
                   ↓
        ┌──────────┴──────────┐
        ↓                     ↓
 PeaController          PeiController
        ↓                     ↓
   PeaService              PeiService
        ↓                     ↓
 PeaRepository          PeiRepository
        ↓                     ↓
        └──────────┬──────────┘
                   ↓
              PostgreSQL
```

Ambos os módulos utilizam DTOs, Mappers, Services e Repositories independentes, mas compartilham a relação com `Acompanhamento`.

A implementação respeita o Soft Delete global do sistema, utiliza auditoria de usuário e data e deixa PEA e PEI preparados para integração com outras funcionalidades, como a API agregadora da Timeline.
