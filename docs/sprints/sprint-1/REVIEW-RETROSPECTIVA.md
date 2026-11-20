# Sprint 1 — Review e Retrospectiva

## Sprint Review

**Data:** 22/10/2026
**Participantes:** professores avaliadores e time MultiCore
**Versão inspecionada:** commit [`8894fda`](https://github.com/MultiCoreDSM/ABP/commit/8894fda3d858ac5f6f8746930e8a0620260a3724) (tag `sprint-1`)

### O que foi apresentado

| Entrega | Issue | Resultado na Review |
|---|---|---|
| Protótipo no Figma | #2 | Telas de início, cadastro, login, menu, questão e confirmação, em desktop e mobile. Faltam link navegável, fluxo de navegação e estados de erro e tempo esgotado. Temas do protótipo divergem dos 12 temas oficiais |
| Diagrama de casos de uso | #5 | Entregue. Não substitui o modelo conceitual de dados |
| Modelagem do banco | #6 | Relações com PK/FK coerentes. **O schema não executou no PostgreSQL 16** (cláusula `VIRTUAL`). Faltam DER, modelo lógico e 3FN |
| Conteúdo das aulas | #7 | 12 materiais com explicações, exercícios e referências; 48 questões coerentes. **Caminhos das imagens no seed estavam quebrados** |

### Feedback recebido

1. O banco precisa ser reproduzível: versão declarada, criação e carga em banco vazio sem erro.
2. Os 48 vínculos de imagem precisam apontar para arquivos reais, e o gabarito precisa ser conferido com as imagens.
3. Faltam DER conceitual, modelo lógico e justificativa de normalização.
4. O registro de "100% concluído" não condizia com o que foi verificado. Falta uma Definition of Done.
5. O protótipo deve usar os temas oficiais e permitir navegação verificável.
6. HTML, CSS e JavaScript precisam ser implementados (DW01 é verificado em todas as sprints).

### Impacto no Product Backlog

- Entram na Sprint 2, com prioridade máxima, as correções 1 a 4 acima, antes de novas funcionalidades.
- Novo requisito não funcional: o ambiente precisa ser reproduzível a partir de um clone (RNF-04 no [backlog](../../backlog/README.md)).
- Tentativa e certificado devem virar estruturas próprias para suportar o histórico (BL-22).

## Sprint Retrospective

**Data:** 05/11/2026
**Formato:** O que funcionou · O que não funcionou · O que vamos mudar

### O que funcionou
- Os oito integrantes contribuíram de forma verificável (ES09 atendido 8/8).
- A divisão por área (design, modelagem, banco, conteúdo) com dois responsáveis por issue.
- O conteúdo foi produzido com qualidade: materiais, exercícios e questões coerentes.

### O que não funcionou
- Marcamos a sprint como 100% concluída sem testar os scripts num banco vazio.
- Cada parte foi feita isolada: o seed apontava para imagens que o time de conteúdo tinha nomeado de outro jeito, e o protótipo usava temas que não eram os do conteúdo.
- Os artefatos ficaram em branches diferentes, e o README apontava para elas em vez da `main`.
- Não tínhamos um critério comum de "pronto".

### Ações de melhoria

| # | Ação | Responsável | Prazo | Como acompanhar |
|---|---|---|---|---|
| 1 | Adotar a [Definition of Done](../../processo/definition-of-done.md) e só mover issue para "Concluída" com o checklist marcado | Todo o time | Início da Sprint 2 | Checklist da DoD no corpo de cada PR |
| 2 | Toda mudança de banco é testada em PostgreSQL 16 com banco vazio antes do merge | Gustavo Monteiro e João Vitor | Contínuo | Resultado da execução anexado ao PR |
| 3 | Revisão cruzada entre áreas: conteúdo revisa protótipo e seed; banco revisa backend | Rafael de Paula | Contínuo | Revisor de outra área no PR |
| 4 | Fechar a sprint com tag de versão (`sprint-N`) e data/hora de fechamento no backlog | Gabriel Henrique | Fim de cada sprint | Tag visível no GitHub |

O resultado das ações será revisado na Retrospectiva da Sprint 2.

---

[Voltar ao overview da Sprint 1](README.md)
