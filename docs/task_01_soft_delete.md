# Task: Configurar suporte nativo a Exclusão Lógica (Soft Delete) [#1]

## Contexto e Requisitos
Esta task tem como objetivo atender ao requisito legal e da User Story (US 03), que determina que documentos pedagógicos e laudos não podem ser excluídos definitivamente do sistema. Para garantir o rastreio e manter o histórico intacto, qualquer exclusão precisa ser apenas "lógica" (marcando o registro como inativo em vez de apagá-lo do banco de dados).

## O que foi implementado
Foi configurada a anotação padrão na classe abstrata `BaseEntity` (a classe base para as entidades do sistema) para que o Spring Data JPA / Hibernate passem a usar o recurso de **Soft Delete**. 

**Arquivo alterado:** `src/main/java/com/br/CLAI/domain/BaseEntity.java`

## Por que utilizar a anotação `@SoftDelete`?

Antigamente (em versões do Hibernate anteriores a 6.4), a implementação de Soft Delete exigia a combinação de vários recursos:
1. Criar manualmente um campo booleano `deleted` (com seus getters e setters).
2. Adicionar uma anotação `@SQLDelete(sql = "UPDATE tabela SET deleted = true WHERE id=?")` em cada entidade (o que não funcionava bem de forma genérica em uma `MappedSuperclass`).
3. Adicionar uma anotação `@Where(clause = "deleted = false")` para forçar os `SELECTs` a ignorarem os excluídos.

Com a atualização para as versões recentes do Spring Boot (3.2+) e Hibernate (6.4+), optamos pelo formato mais moderno e robusto usando **apenas a anotação nativa `@SoftDelete`** na classe base.

### Vantagens da abordagem escolhida:

1. **Menos código repetitivo (Boilerplate):** Não precisamos mais declarar manualmente o atributo `boolean deleted = false;` e criar construtores ou getters/setters na `BaseEntity`. 
2. **Abstração Limpa:** A regra de exclusão pertence ao banco de dados e ao ORM (Hibernate). A classe Java fica limpa e voltada exclusivamente para as regras de negócio. O Hibernate gerencia uma "coluna sintética" nos bastidores de forma invisível.
3. **Escalabilidade (Herança Perfeita):** Ao colocar o `@SoftDelete` na `BaseEntity`, **todas** as entidades do sistema que herdarem dela já ganham automaticamente essa proteção, sem que o desenvolvedor precise lembrar de anotar cada nova classe.
4. **Segurança e Interceptação Automática:** Sempre que o comando genérico `repository.delete(entidade)` for chamado na aplicação, o Hibernate intercepta a requisição e a transforma em um `UPDATE`. E em qualquer busca (`findAll`, `findById`), ele automaticamente aplica o filtro para ignorar os registros já "deletados", garantindo que a regra seja respeitada globalmente sem depender da memória humana.
