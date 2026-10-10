# Implementação das Entidades de Domínio

Este documento descreve as decisões e o mapeamento das entidades JPA relacionadas ao pacote `com.br.CLAI.domain`, construídas com base no script de banco de dados (`create_tables.sql`).

## 1. Entidades Criadas

Foram mapeadas as seguintes tabelas do schema `sigi` para entidades no sistema:

- **Aluno:** Representa o aluno no sistema.
- **IndicadorReutilizavel:** Representa tags de dificuldades ou necessidades do aluno.
- **EstudoDeCaso:** Tabela com os dados do caso do aluno. Possui relacionamentos com `Aluno` (ManyToOne) e `IndicadorReutilizavel` (ManyToMany).
- **Acompanhamento:** Ponte de relacionamento entre os `Alunos` e os seus devidos documentos (`PlanoAcao`, `Pei` e `Pea`).
- **PlanoAcao, Pei, Pea:** Entidades dos documentos. Todas possuem relação ManyToOne com a entidade `Acompanhamento`.

## 2. Herança da `BaseEntity`

Todas as entidades mapeadas acima herdam de `BaseEntity`.
A `BaseEntity` foi ajustada para conter:
- O campo `id` do tipo `UUID`, utilizando estratégia de geração primária `GenerationType.UUID`. Isso evita a repetição desse mapeamento em cada tabela, centralizando em um único lugar.
- A anotação `@SoftDelete` já presente para controle de exclusão lógica (Soft Delete) do Hibernate.

*Observação:* Os campos de auditoria do banco de dados (como `data_criacao` e `data_atualizacao`) foram intencionalmente deixados de fora do mapeamento no JPA por enquanto, conforme diretriz para focar apenas nas estruturas principais e evitar retrabalho, delegando o controle padrão do `DEFAULT CURRENT_TIMESTAMP` ao banco de dados na inserção.

## 3. Decisões de Implementação

### 3.1. Restrição de uso do Lombok
O projeto optou por **não** utilizar a biblioteca Lombok. Consequentemente, todas as entidades de domínio possuem construtores vazios (exigência do JPA), construtores parametrizados (para facilitar a criação dos objetos) e seus respectivos *Getters* e *Setters* gerados de forma explícita.

### 3.2. Enum para Status
Foi criado o enum `StatusEstudoCaso` (localizado em `com.br.CLAI.domain.enums`) com as opções `ATIVO`, `ENCERRADO` e `RASCUNHO`, refletindo as restrições declaradas no banco de dados para os estudos de caso. A coluna usa a anotação `@Enumerated(EnumType.STRING)` na classe `EstudoDeCaso`.

### 3.3. FetchType.LAZY e SoftDelete no Hibernate 6+
Durante a inicialização do contexto do Spring, ocorreu o erro `UnsupportedMappingException: To-one attribute cannot be mapped as LAZY as its associated entity is defined with @SoftDelete`. 

**Motivo:** Nas versões recentes do Hibernate (6.x e 7.x), se uma entidade possui a anotação `@SoftDelete` (como na nossa `BaseEntity`), o Hibernate não consegue mapeá-la de maneira preguiçosa (`FetchType.LAZY`) em relacionamentos `@ManyToOne` e `@OneToOne`. Isso ocorre porque, ao criar o proxy da entidade, o Hibernate precisaria verificar no banco de dados se a entidade atrelada foi logicamente deletada (evitando retornar um proxy de algo que está "apagado"). 

**Solução Aplicada:** O parâmetro `fetch = FetchType.LAZY` foi removido de todas as anotações `@ManyToOne`, permitindo que o JPA volte ao padrão (que é `FetchType.EAGER` para atributos do tipo `To-one`). Isso soluciona o erro de inicialização.
