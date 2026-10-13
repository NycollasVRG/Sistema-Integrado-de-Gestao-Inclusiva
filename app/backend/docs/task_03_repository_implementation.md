# Implementação da Camada de Repositório

Este documento descreve a criação das interfaces de repositório (camada de persistência) para as entidades de domínio criadas no pacote `com.br.CLAI.domain`.

## 1. Visão Geral

Foram criados **7 repositórios** baseados no Spring Data JPA, localizados no pacote `com.br.CLAI.repository`. Todas as interfaces herdam de `JpaRepository<Entity, UUID>`, o que já disponibiliza automaticamente as operações básicas de banco de dados (CRUD) como `save`, `findById`, `findAll` e `delete`.

## 2. Repositórios Criados e Métodos Customizados

Abaixo está a relação das interfaces criadas, juntamente com os métodos de busca auxiliares (*Query Methods*) que já foram implementados para facilitar o acesso aos dados com base nos relacionamentos lógicos do negócio:

### 2.1. `AlunoRepository`
- **Entidade:** `Aluno`
- **Método Adicionado:** `Optional<Aluno> findByMatricula(String matricula);`
  - **Objetivo:** Buscar um aluno especificamente pelo seu número de matrícula único.

### 2.2. `IndicadorReutilizavelRepository`
- **Entidade:** `IndicadorReutilizavel`
- **Métodos Adicionados:** Apenas os métodos padrão do `JpaRepository`.

### 2.3. `EstudoDeCasoRepository`
- **Entidade:** `EstudoDeCaso`
- **Método Adicionado:** `List<EstudoDeCaso> findByAlunoId(UUID alunoId);`
  - **Objetivo:** Listar todos os estudos de caso abertos/vinculados a um aluno específico.

### 2.4. `AcompanhamentoRepository`
- **Entidade:** `Acompanhamento`
- **Método Adicionado:** `List<Acompanhamento> findByAlunoId(UUID alunoId);`
  - **Objetivo:** Localizar os registros de acompanhamento pertencentes a um determinado aluno.

### 2.5. `PlanoAcaoRepository`
- **Entidade:** `PlanoAcao`
- **Método Adicionado:** `List<PlanoAcao> findByAcompanhamentoId(UUID acompanhamentoId);`
  - **Objetivo:** Obter os Planos de Ação que derivam de um acompanhamento específico.

### 2.6. `PeiRepository`
- **Entidade:** `Pei`
- **Método Adicionado:** `List<Pei> findByAcompanhamentoId(UUID acompanhamentoId);`
  - **Objetivo:** Obter os Planos de Ensino Individualizado (PEI) vinculados a um acompanhamento específico.

### 2.7. `PeaRepository`
- **Entidade:** `Pea`
- **Método Adicionado:** `List<Pea> findByAcompanhamentoId(UUID acompanhamentoId);`
  - **Objetivo:** Obter os Planos de Ensino Adaptado (PEA) de um acompanhamento específico.

## 3. Conclusão
Com esses repositórios definidos, a aplicação está pronta para receber a camada de serviço (`Service`) e de controle (`Controller`), tendo o suporte necessário para salvar, buscar e gerenciar todos os documentos e dados interligados de maneira nativa e otimizada pelo Spring Data JPA.
