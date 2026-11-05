# Sprint 1 — Overview

## Sobre a sprint

A Sprint 1 foi o ponto de partida do projeto. O foco foi organizar as ideias e preparar tudo o que o time precisava para começar a desenvolver a plataforma de estudos e certificação em metodologias ágeis.

Nessa etapa, o time trabalhou no protótipo das telas, na estrutura do banco de dados, no diagrama de casos de uso e nos conteúdos que serão usados nas aulas e na certificação.

**Período:** 28/09/2026 a 22/10/2026  
**Versão entregue:** commit `8894fda` (tag `sprint-1`)  
**Status:** encerrada com pendências ⚠️  
**Atividades planejadas:** 4  
**Concluídas conforme a DoD:** 1 · **Com pendências:** 2 · **Não atendidas:** 1

> O registro original marcava 100%. Ele foi revisado depois da Review de 22/10/2026, porque o schema não executou no PostgreSQL 16 e os vínculos das imagens estavam quebrados.

## Objetivo da sprint

Montar a base do projeto para que as próximas sprints possam seguir com o desenvolvimento do front-end e do back-end.

## O que foi entregue

| Issue | Atividade | Área | Responsáveis | Status |
| --- | --- | --- | --- | --- |
| [#2](https://github.com/MultiCoreDSM/ABP/issues/2) | Protótipo da aplicação no Figma | Design | `eduardasantosalves`, `Juliocms46` | ⚠️ Com pendências |
| [#5](https://github.com/MultiCoreDSM/ABP/issues/5) | Diagrama de Casos de Uso | Documentação / Modelagem | `Enzo2712`, `Rafinbolis` | ✅ Concluída |
| [#6](https://github.com/MultiCoreDSM/ABP/issues/6) | Modelagem do Banco de Dados | Banco de Dados | `Araujojvl`, `GustavoMGreco` | ❌ Não atendeu à DoD |
| [#7](https://github.com/MultiCoreDSM/ABP/issues/7) | Conteúdo das aulas do curso | Documentação / Modelagem | `GabrielBechtlufft`, `YanRafael2711` | ⚠️ Com pendências |

## Um pouco sobre cada entrega

### Protótipo da aplicação

O protótipo no Figma serve como referência para a construção das telas e ajuda o time a visualizar como o usuário vai navegar pela plataforma.

### Diagrama de casos de uso

O diagrama mostra quem vai usar o sistema, quais são as principais funcionalidades e como essas partes se relacionam.

### Banco de dados

Foi criada uma estrutura inicial em PostgreSQL para guardar candidatos, temas, questões, alternativas e respostas. O time também preparou os dados dos 12 temas, com 48 questões e suas alternativas.

Os scripts estão em [`backend/database`](../../../backend/database). A documentação (DER, modelo lógico, 3FN, dicionário e roteiro de execução) está em [`docs/banco`](../../banco/README.md).

### Conteúdo educacional

Foram preparados os materiais dos 12 temas da certificação e as imagens usadas nas 48 questões. Tudo está organizado nas pastas [`assets/materiais`](../../../assets/materiais) e [`assets/imagens`](../../../assets/imagens).

## Links úteis

- [Backlog do produto](../../backlog/README.md)
- [Backlog da Sprint 1](BACKLOG.md) (critérios de aceite)
- [Review e Retrospectiva](REVIEW-RETROSPECTIVA.md)
- [Definition of Done](../../processo/definition-of-done.md)
- [Rastreabilidade](../../rastreabilidade.md)
- [Banco de dados](../../banco/README.md)
- [Materiais de estudo](../../../assets/materiais)
- [Imagens das questões](../../../assets/imagens)
- [Kanban ABP](https://github.com/users/MultiCoreDSM/projects/1)
- [Diagrama de casos de uso](../../../Diagrama)
- [Protótipo (exportações)](../../../Design)

## Próximos passos

A Sprint 2 começa pelas correções da Review (banco, imagens, modelagem, DoD) e segue com a construção das telas, as rotas da API e o estudo da integração do QR Code. As ações de melhoria do processo estão na [Retrospectiva](REVIEW-RETROSPECTIVA.md#ações-de-melhoria).

---

[Voltar ao README principal](../../../README.md)
