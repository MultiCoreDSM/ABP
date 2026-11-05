# Backlog da Sprint 1

## Identificação

| Item | Valor |
|---|---|
| Período | 28/09/2026 a 22/10/2026 |
| Fechamento | 22/10/2026, momento da avaliação |
| Versão entregue | commit [`8894fda`](https://github.com/MultiCoreDSM/ABP/commit/8894fda3d858ac5f6f8746930e8a0620260a3724), tag `sprint-1` |
| Sprint Goal | Preparar a base do projeto: protótipo das telas, modelagem e banco de dados, e conteúdos da certificação |

## Atividades da sprint

| Issue | Atividade | Área | Responsáveis | Resultado esperado | Status no fechamento |
|---|---|---|---|---|---|
| [#2](https://github.com/MultiCoreDSM/ABP/issues/2) | Protótipo da aplicação no Figma | Design | `eduardasantosalves`, `Juliocms46` | Criar uma referência visual para as telas e para o fluxo de navegação da plataforma | ⚠️ Entregue com pendências |
| [#5](https://github.com/MultiCoreDSM/ABP/issues/5) | Diagrama de Casos de Uso | Documentação / Modelagem | `Enzo2712`, `Rafinbolis` | Representar os usuários, as funcionalidades principais e as interações previstas no sistema | ✅ Concluída |
| [#6](https://github.com/MultiCoreDSM/ABP/issues/6) | Modelagem do Banco de Dados | Banco de Dados | `Araujojvl`, `GustavoMGreco` | Definir a estrutura necessária para armazenar candidatos, temas, questões, alternativas e respostas | ❌ Não atendeu à DoD (schema não executou) |
| [#7](https://github.com/MultiCoreDSM/ABP/issues/7) | Conteúdo das aulas do curso | Documentação / Modelagem | `GabrielBechtlufft`, `YanRafael2711` | Preparar e organizar os materiais dos 12 temas e as questões usadas na certificação | ⚠️ Entregue com pendências |

## Critérios de aceite

### #2: Protótipo no Figma
- [x] Telas de início, cadastro, login, menu, questão e confirmação em versão desktop e mobile
- [ ] Link do Figma com permissão de visualização registrado neste documento
- [ ] Protótipo navegável: é possível ir do cadastro até o resultado clicando
- [ ] Mapa de navegação cobrindo cadastro → login → estudos → prova → resultado → certificado → validação pública
- [ ] Estados de erro (login inválido), tempo esgotado, interrupção e retomada
- [ ] Todas as telas usam os 12 temas oficiais com os nomes do conteúdo

### #5: Diagrama de Casos de Uso
- [x] Ator Candidato representado
- [x] Casos de uso principais: cadastrar candidato, efetuar login, acessar área de estudos, controlar o tempo, armazenar histórico e emitir certificado
- [x] Arquivo versionado em `Diagrama/` (Astah)

### #6: Modelagem do Banco de Dados
- [x] Tabelas para candidatos, temas, questões, alternativas e respostas, com PK e FK
- [ ] Schema executa sem erro em **PostgreSQL 16 com banco vazio**
- [ ] Seed carrega 12 temas, 48 questões, 192 alternativas e exatamente 1 correta por questão
- [ ] DER conceitual com entidades, atributos, identificadores e cardinalidades
- [ ] Modelo lógico, justificativa até a 3FN e dicionário de dados
- [ ] Integridade: cada questão pertence a um tema; cada tema tem 4 questões; cada questão tem 4 alternativas

### #7: Conteúdo das aulas
- [x] 12 materiais em PDF, um por tema, com explicação, exercícios e referências
- [x] 48 questões, 4 por tema, com alternativas e gabarito
- [ ] Cada questão tem `imagem_url` apontando para um arquivo que existe
- [ ] Cada imagem corresponde ao conteúdo da questão
- [ ] Fonte/autoria das imagens registrada

## Resultado da sprint

| Itens planejados | Concluídos (atendendo à DoD) | Com pendências | Não atendidos |
|---|---|---|---|
| 4 | 1 | 2 | 1 |

O registro anterior marcava 4/4 (100%). Ele foi corrigido depois da Review, porque o schema falhou na execução e os vínculos das imagens estavam quebrados. Os critérios não marcados acima entram como correções no início da Sprint 2. Ver a [Review e Retrospectiva](REVIEW-RETROSPECTIVA.md).


---

[Voltar ao overview da Sprint 1](README.md)
