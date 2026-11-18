# Plano de Implementação: API de Atendimentos Diários, Trava de 24h e Timeline (US 04 / TA9.2)

## 1. Visão Geral (Checkpoints)

Substitui o mock em `localStorage` do frontend (`ProntuarioService.criarAtendimento`) por persistência real e completa a agregação de atendimentos na Linha do Tempo (US 09 / TA9.2).

- [x] Entidade `Atendimento` estendendo `BaseEntity` (auditoria + `@SoftDelete`) e enum `TipoAtendimento`.
- [x] `AtendimentoRepository`, `AtendimentoMapper`, DTOs, `AtendimentoService` e `AtendimentoController` (`/api/atendimentos`).
- [x] Trava de 24h no `PUT /api/atendimentos/{id}` (autor + janela), `403` fora da regra.
- [x] `TimelineService` passa a incluir eventos `ATENDIMENTO`.
- [x] Testes: `AtendimentoServiceTest`, caso novo em `OrdenacaoETimelineServiceTest`, `FlywaySchemaValidationIntegrationTest` atualizado (V6, 13 tabelas).

## 2. Arquivos

| Camada | Arquivo |
| :--- | :--- |
| domain | `Atendimento`, `enums/TipoAtendimento` |
| repository | `AtendimentoRepository` |
| dto | `request/AtendimentoRequestDTO`, `request/AtendimentoUpdateDTO`, `response/AtendimentoResponseDTO` |
| mapper | `AtendimentoMapper` |
| service | `AtendimentoService`; `TimelineService` (alterado) |
| controller | `AtendimentoController` |
| config | `ClockConfig` (bean `Clock`) |

## 3. Trava de 24h (Regra de Negócio)

`AtendimentoService.atualizar` aplica, nesta ordem:

1. Usuário autenticado obrigatório (`401` se ausente).
2. Atendimento existente e não excluído logicamente (`404`).
3. **Autoria:** `criadoPor == usuário autenticado`, senão `AcessoNegadoException` → **403**.
4. **Janela:** `agora <= criadoEm + 24h`, senão `AcessoNegadoException` → **403**.

Decisões:

- A autoria é checada antes do prazo para não revelar o estado do prazo a quem não é o autor.
- Limite **inclusivo**: em `criadoEm + 24h` exatos a edição ainda é aceita.
- `criadoPor` ou `criadoEm` nulos negam a edição (falha fechada).
- `criadoPor` é `updatable = false` em `BaseEntity`: a autoria não muda após a criação.
- O "agora" vem de um `Clock` injetado (`ClockConfig`, fuso padrão da JVM — o mesmo usado pelo `@CreatedDate`), o que permite testar as bordas com `Clock.fixed`.
- `AtendimentoResponseDTO.edicaoPermitidaAte` (= `criadoEm + 24h`) e `criadoPor` permitem ao frontend exibir/ocultar a ação "Editar".
- Não há `DELETE`: a exclusão lógica contornaria a trava.

## 4. Timeline

`TimelineService.buscarPorAluno` agora também consulta `AtendimentoRepository.findByAlunoId` e adiciona eventos `tipo = "ATENDIMENTO"` com `dataCriacao = criadoEm`. A ordenação continua a de `OrdenacaoAuditoria.ordenarEventosTimeline` (crescente por `dataCriacao`, desempate por `id`, nulos por último). A data usada é `criadoEm` (e não `dataAtendimento`) para manter o mesmo critério dos demais eventos.

## 5. Como validar manualmente

```http
POST /api/atendimentos          # como usuário A → 201, edicaoPermitidaAte = criadoEm + 24h
PUT  /api/atendimentos/{id}     # como usuário A, < 24h → 200
PUT  /api/atendimentos/{id}     # como usuário B → 403 (autoria)
PUT  /api/atendimentos/{id}     # como usuário A, > 24h → 403 (prazo)
GET  /api/alunos/{alunoId}/timeline   # inclui {"tipo":"ATENDIMENTO", ...}
``
