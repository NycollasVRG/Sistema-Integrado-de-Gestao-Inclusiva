# Plano de Implementação: API Agregadora da Linha do Tempo (US 09)

## 1. Visão Geral (Checkpoints)

**O que já foi feito (Checkpoints Anteriores):**
- [x] Implementação de Soft Delete na `BaseEntity`.
- [x] Estrutura de auditoria com campo `criadoEm`.
- [x] Implementação de `EstudoDeCaso`.
- [x] Implementação de `PEI`.
- [x] Implementação de `PEA`.
- [x] Repositórios já disponibilizando consultas por aluno ou por relacionamento com `Acompanhamento`.

**O que foi feito nesta Task (Checkpoint Atual - Dividido em Mini-Tasks):**
- [x] **Mini-Task 1**: Criação do `TimelineEventDTO`.
- [x] **Mini-Task 2**: Criação do `TimelineService` para agregar Estudo de Caso, PEI e PEA.
- [x] **Mini-Task 3**: Ordenação dos eventos pela data de criação.
- [x] **Mini-Task 4**: Criação do endpoint REST da Timeline.
- [x] **Mini-Task 5**: Teste do endpoint através do Thunder Client.
- [x] **Mini-Task 6**: Validação de que registros com Soft Delete não aparecem na Timeline.

*A Timeline reaproveita os repositories já existentes, evitando duplicação das regras dos CRUDs individuais.*

## 2. Arquitetura em Camadas

A implementação foi organizada dentro da estrutura já existente em `com.br.CLAI`.

* `controller`: Contém `TimelineController`, responsável por expor a rota da Timeline.
* `dto`
  * `response`: Contém `TimelineEventDTO`, usado para padronizar os diferentes tipos de evento.
* `service`: Contém `TimelineService`, responsável por buscar, transformar, agregar e ordenar os eventos.
* `repository`: Reutiliza `EstudoDeCasoRepository`, `PeiRepository` e `PeaRepository` já existentes.

### Arquivos criados

- `src/main/java/com/br/CLAI/dto/response/TimelineEventDTO.java`
- `src/main/java/com/br/CLAI/service/TimelineService.java`
- `src/main/java/com/br/CLAI/controller/TimelineController.java`

Não foi necessário alterar os arquivos do PEI ou do PEA já implementados pelos outros módulos.

## 3. Detalhamento do Critério de Aceite

### Ref. TA9.2: O endpoint deve retornar um array de eventos ordenados estritamente por data de criação

A Timeline precisa reunir eventos de origens diferentes e devolvê-los em uma única lista.

Atualmente são agregados:

- `EstudoDeCaso`
- `PEI`
- `PEA`

### Como os registros são relacionados ao aluno

O `EstudoDeCaso` possui relacionamento direto com `Aluno`.

```text
EstudoDeCaso
      ↓
    Aluno
```

PEI e PEA estão associados ao aluno através do `Acompanhamento`.

```text
PEI / PEA
    ↓
Acompanhamento
    ↓
  Aluno
```

As consultas utilizadas são:

```java
estudoDeCasoRepository.findByAlunoId(alunoId);
```

```java
peiRepository.findByAcompanhamento_Aluno_Id(alunoId);
```

```java
peaRepository.findByAcompanhamento_Aluno_Id(alunoId);
```

### Padronização com `TimelineEventDTO`

Como cada entidade possui campos diferentes, foi criado um DTO comum contendo apenas os dados necessários para representar um evento no painel.

```java
private UUID id;
private String tipo;
private LocalDateTime dataCriacao;
```

Exemplo de retorno:

```json
{
  "id": "35d550d5-3ae8-4120-bc6c-bc56e55f51ad",
  "tipo": "PEA",
  "dataCriacao": "2026-10-12T21:33:09.976374"
}
```

Os valores atualmente utilizados em `tipo` são:

```text
ESTUDO_DE_CASO
PEI
PEA
```

### Agregação dos eventos

O `TimelineService` cria uma única lista:

```java
List<TimelineEventDTO> eventos = new ArrayList<>();
```

Depois, os registros encontrados nos três módulos são transformados em `TimelineEventDTO` e adicionados à mesma coleção.

O fluxo fica:

```text
              alunoId
                 ↓
       ┌─────────┼─────────┐
       ↓         ↓         ↓
    Estudo      PEI       PEA
       ↓         ↓         ↓
       └─────────┼─────────┘
                 ↓
       TimelineEventDTO
                 ↓
        Lista de Eventos
                 ↓
           Ordenação
                 ↓
             Retorno
```

### Ordenação por data de criação

Todas as entidades utilizadas herdam de `BaseEntity`, que fornece o campo `criadoEm`.

A ordenação é feita com:

```java
eventos.sort(
    Comparator
        .comparing(TimelineEventDTO::getDataCriacao)
        .thenComparing(TimelineEventDTO::getId)
);
```

O principal critério é `dataCriacao`, organizando os eventos do mais antigo para o mais recente.

O `id` é usado somente como segundo critério para manter uma ordem determinística caso dois eventos tenham exatamente a mesma data e horário.

## 4. Endpoint Implementado

Foi criada a rota:

```http
GET /api/alunos/{alunoId}/timeline
```

Exemplo:

```http
GET /api/alunos/8abf259b-2cee-4ac6-b1cd-fa5f7058b.../timeline
```

Exemplo de resposta:

```json
[
  {
    "id": "UUID-1",
    "tipo": "ESTUDO_DE_CASO",
    "dataCriacao": "2026-10-10T09:00:00"
  },
  {
    "id": "UUID-2",
    "tipo": "PEA",
    "dataCriacao": "2026-10-12T21:33:09"
  },
  {
    "id": "UUID-3",
    "tipo": "PEI",
    "dataCriacao": "2026-10-13T15:00:00"
  }
]
```

## 5. Integração com Soft Delete

Durante os testes, o aluno utilizado possuía dois registros de PEA no banco.

Entretanto, a Timeline retornou apenas um.

Ao consultar a tabela diretamente no PostgreSQL, foi identificado que o segundo registro estava com:

```text
deleted = true
```

Como as entidades herdam de `BaseEntity`, que utiliza `@SoftDelete`, as consultas normais do Hibernate ignoram automaticamente os registros inativados.

Esse comportamento confirmou que a Timeline respeita a exclusão lógica já adotada no projeto.

## 6. Testes Realizados

Foram realizados testes com Thunder Client e PostgreSQL.

- [x] Endpoint respondendo corretamente para um aluno existente.
- [x] Retorno em formato de array JSON.
- [x] Evento PEA convertido para `TimelineEventDTO`.
- [x] Campo `dataCriacao` retornado corretamente.
- [x] Registro com `deleted = true` não aparecendo na Timeline.
- [x] Consulta de dados do aluno através dos repositories existentes.

### Teste complementar recomendado

Para validar a agregação completa, é recomendado utilizar um aluno que possua simultaneamente:

- 1 Estudo de Caso
- 1 PEI
- 1 ou mais PEAs ativos

Dessa forma, é possível confirmar visualmente que registros de entidades diferentes aparecem na mesma lista e permanecem ordenados por `dataCriacao`.

## 7. Ordem de Implementação e Commits

1. **Commit 1**: Criação do DTO de eventos.

   ```text
   feat: adiciona DTO de eventos da timeline
   ```

2. **Commit 2**: Implementação do serviço agregador e ordenação.

   ```text
   feat: implementa agregacao de eventos da timeline
   ```

3. **Commit 3**: Criação do endpoint REST.

   ```text
   feat: adiciona endpoint da timeline do aluno
   ```

## 8. Resultado da Implementação

O fluxo final da Timeline ficou:

```text
GET /api/alunos/{alunoId}/timeline
                 ↓
        TimelineController
                 ↓
          TimelineService
                 ↓
    ┌────────────┼────────────┐
    ↓            ↓            ↓
 Estudo         PEI          PEA
    ↓            ↓            ↓
    └────────────┼────────────┘
                 ↓
        TimelineEventDTO
                 ↓
      ordenação por criadoEm
                 ↓
            JSON final
```

A solução reutiliza os repositories existentes e mantém cada CRUD independente da Timeline.

Com isso, o Prontuário passa a ter uma rota única preparada para centralizar os eventos pedagógicos do aluno, atendendo ao requisito de agregação e ao critério **TA9.2**.
