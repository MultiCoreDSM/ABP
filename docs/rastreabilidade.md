# Matriz de rastreabilidade

Liga cada requisito do [backlog](backlog/README.md) à issue, ao artefato e ao commit em que foi tratado. Deve ser atualizada a cada sprint.

**Versão de referência:** fim da Sprint 3 → commit `494a0db` (26/11/2026). As issues estão no [GitHub](https://github.com/MultiCoreDSM/ABP/issues) e no [Kanban ABP](https://github.com/users/MultiCoreDSM/projects/1).

| Sprint | Período | Último commit da sprint |
|---|---|---|
| Sprint 1 | 28/09 a 22/10/2026 | `8894fda` |
| Sprint 2 | 23/10 a 05/11/2026 | `29ce536` |
| Sprint 3 | 06/11 a 25/11/2026 | `494a0db` (inclui os ajustes de 26/11, antes da apresentação) |

## Sprint 1: artefatos de base

| Entrega | Issue | Requisitos atendidos | Artefato | Commits | PR |
|---|---|---|---|---|---|
| Protótipo das telas | #2, #35 a #49 (DES-01 a DES-15) | BL-01 a BL-05, BL-09, BL-10, BL-15, BL-19, BL-23 | `Design/*.png`, `Design/figma parte 2.pdf` | `063bef8`, `ff7f974`, `4e71033`, `aa48cb0` | #15 |
| Casos de uso | #5, #50 a #56 (DOC-01 a DOC-07) | BL-01, BL-02, BL-05, BL-09, BL-18, BL-22 | `Diagrama/UseCase Diagram1.asta` | `022ec85`, `37b74eb` | #12, #13 |
| Banco de dados | #6, #16 a #20 (DB-01 a DB-04, DB-12) | BL-01, BL-06, BL-07, BL-08, BL-09, BL-14, BL-22 | `backend/database/schemas.sql`, `backend/database/seed.sql`, `docs/banco/` | `aae36ea`, `42f13a3`, `0ea4c83`, `d0640f7` | #14 |
| Conteúdo | #7, #21 a #34 (CON-01 a CON-14) | BL-05, BL-06 | `assets/materiais/*.pdf`, `assets/imagens/tema_*/` | `983ac96`, `debcca8` | #8 |
| Backlog e documentação | — | todos (planejamento) | `docs/backlog/README.md`, `docs/sprints/sprint-1/`, `docs/processo/definition-of-done.md`, `docs/rastreabilidade.md` | `5eb00c1`, `0d0e5d7`, `5d776e8` | — |

## Sprint 2: front-end, API e integração

| Entrega | Issue | Requisitos atendidos | Artefato | Commits | PR |
|---|---|---|---|---|---|
| Correções da Review da Sprint 1 | — | BL-06, BL-19, BL-21 | `backend/database/`, `docs/` | `b754377`, `fd0d18b` | #118 |
| Banco: tentativas, respostas, tempo e restrições | #57 a #61 (DB-05 a DB-08, DB-11) | BL-07, BL-08, BL-09, BL-12 a BL-14, BL-22, RNF-05 | `backend/database/schemas.sql` (tabela `respostas`, coluna gerada `valida`), `backend/database/seed.sql` | `3e82231`, `c811eb8`, `f2d3e75` | #117 |
| Rotas da API | #72 a #80 (API-01 a API-09) | BL-01, BL-02, BL-05 a BL-08, BL-11, RNF-02, RNF-03 | `backend/src/routes/`, `backend/src/services/`, `backend/src/middlewares/autenticacao.js` | `3685829`, `d608e55`, `bf90aa9`, `8abca1f`, `5b7431d`, `b4701c1`, `55d00c0`, `59dec6b` | #117 |
| Telas do front-end | #62 a #71 (FE-01 a FE-10) | BL-01 a BL-05, BL-09 a BL-11 | `FrontEnd/Pages/` (inicial, cadastro, login, área de estudos, questão) | `9d59e86`, `724d3d3`, `025fd08`, `e35ee14`, `a77cb98`, `e614bcf` | #116 |
| Pesquisa e prova de conceito do QR Code | #81 a #83 (QR-01 a QR-03) | BL-20, BL-21, RN-08 | Decisão da URL pública e do identificador (DP-01) | — | — |
| Validações de integração | #84 a #86 (QA-01 a QA-03) | BL-01, BL-02, BL-05 a BL-17 | Testes manuais registrados nas issues | — | #120 (fechado sem merge) |
| Revisão de proteção de dados pessoais | #87 (QA-08) | RNF-02, RNF-03, RNF-07, BL-01, BL-02, BL-11, BL-16 a BL-19, BL-21 | `backend/src/middlewares/erros.js`, `backend/src/middlewares/limiteLogin.js`, `backend/src/utils/validacao.js`, `backend/src/routes/certificacao.js` | `99fdbf9` | #119 |
| Containers e variáveis de ambiente | #88 a #91 (OPS-01 a OPS-04) | RNF-04, RNF-08 | `compose.yaml`, `backend/Dockerfile`, `.dockerignore`, `.env` (fora do Git) | `2b3e412`, `99fdbf9`, `83a5c49` | #119 |

As issues da Sprint 2 de banco, API e QA-08 foram concluídas entre 09/11 e 16/11, já no período da Sprint 3, e entraram na `main` pelo PR #119.

## Sprint 3: certificação completa, certificado e LGPD

| Entrega | Issue | Requisitos atendidos | Artefato | Commits | PR |
|---|---|---|---|---|---|
| Integração front-end e back-end, novo design | #98 (FE-15) | BL-03, BL-04, BL-15, BL-23, RNF-06 | `FrontEnd/Pages/menu.html`, `FrontEnd/Scripts/comum.js`, `FrontEnd/Styles/base.css` | `140e349`, `99fdbf9`, `1202cdd`, `3517877` | #119, #122 |
| Tempo esgotado, pausa e retomada | #94 (FE-11), #99 a #101 (API-10 a API-12), #110 (QA-04) | BL-09, BL-12 a BL-14, RN-04, RN-05, RNF-05 | `backend/src/services/certificacao.js`, `FrontEnd/Scripts/questao.js` | `99fdbf9` | #119 |
| Progresso e resultado final | #92 (DB-09), #95 (FE-12), #102, #103 (API-13, API-14) | BL-15 a BL-17, RN-06 | `GET /api/certificacao/temas`, `GET /api/certificacao/resultado`, `FrontEnd/Pages/resultado.html` | `99fdbf9`, `68e5367` | #119 |
| Emissão do certificado | #93 (DB-10), #96 (FE-13), #104 (API-15) | BL-18, BL-19, RN-07, RN-08 | `backend/src/services/candidatos.js`, `FrontEnd/Pages/certificado.html` | `99fdbf9`, `cc41b48` | #119, #123 |
| QR Code no certificado e PDF | #107 a #109 (QR-04 a QR-06), #111 (QA-05) | BL-20, RN-08 | `FrontEnd/Scripts/qrcode.js`, `backend/src/services/pdfCertificado.js`, `GET /api/candidatos/certificado/pdf` | `c6b45ca`, `cc41b48`, `494a0db` | #122, #123 |
| Validação pública | #97 (FE-14), #105 (API-16) | BL-21, RN-09, RNF-07, DP-01 | `backend/src/routes/certificados.js`, `FrontEnd/Pages/validacao.html` | `99fdbf9` | #119 |
| Histórico e respostas | #106 (API-17) | BL-11, BL-22 | `GET /api/certificacao/respostas`, `FrontEnd/Pages/historico.html`, `FrontEnd/Pages/respostas.html` | `99fdbf9` | #119 |
| Imagens das questões | — | BL-05, BL-06 | `assets/imagens/tema_*/`, caminhos no `seed.sql` | `19058a0` a `9c837b6`, `3517877`, `a86b479` | #122 |
| Termos, privacidade e Meus dados (LGPD) | — | BL-24, BL-25, RN-10, RN-11, RNF-09 | `FrontEnd/Pages/termos-de-uso.html`, `politica-de-privacidade.html`, `meus-dados.html`, `backend/src/utils/termos.js` | `90ff15e`, `494a0db` | — |
| Auditoria de integridade do banco e do conteúdo | #112 (QA-06) | BL-06, RN-02 | `backend/scripts/qa-integridade.js` (`npm run qa:integridade`) | `a14a5d0` | — |
| Desempenho e aceite final | #113 (QA-07), #114 (QA-09) | todos | Evidências registradas nas issues | — | — |
| Guia de instalação e documentação | #115 (OPS-05) | RNF-04, RNF-08 | `README.md`, `docs/aplicacao.md`, `docs/banco/README.md`, `docs/burndown/` | `9cd61f1`, `53fef1c`, `a86b479`, `494a0db` | — |

**PRs ainda abertos:** #121 (DB-05 e QA-01) e #124 (consolidação de banco, API e OPS). O conteúdo deles já chegou à `main` por outros PRs, então podem ser fechados depois de conferidos.

## Requisito → onde está implementado

Status: ✅ implementado · 🟡 parcial · ⬜ não iniciado

### Requisitos funcionais

| Requisito | Banco | Back-end | Front-end | Status |
|---|---|---|---|---|
| BL-01 Cadastro | `candidatos` (CPF único, RN-01) | `POST /api/candidatos` | `cadastro.html` | ✅ |
| BL-02 Login | `candidatos.senha_hash` | `POST /api/login` (JWT, limite de tentativas) | `login.html` | ✅ |
| BL-03 / BL-04 Tela inicial e escolha de início | — | — | `inicial.html`; depois do cadastro, o candidato escolhe iniciar a prova ou ir ao menu | ✅ |
| BL-05 Área de estudos | `temas` | `GET /api/temas` | `area-estudos.html`, PDFs em `assets/materiais/` | ✅ |
| BL-06 Banco de questões | `questoes`, `alternativas` (RN-02) | `GET /api/imagens/:id` | Imagens em `assets/imagens/` | ✅ |
| BL-07 / BL-08 Sorteio, 1 por tema | `respostas` (chave candidato + questão) | `GET /api/certificacao/temas/:id/questao` (sorteia na primeira vez e devolve a mesma depois) | `questao.html` | ✅ |
| BL-09 Contagem de 150 segundos | `respostas.data_horario_inicio`, `respostas.valida` | `abrirQuestaoTemaService` devolve os segundos restantes, contados no servidor | `questao.js` (cronômetro) | ✅ |
| BL-10 Confirmação para avançar | — | — | `questao.js` (janela de confirmação da resposta) | ✅ |
| BL-11 Correção após resposta | `alternativas.correta` | `POST /api/certificacao/questoes/:id/resposta` (a correta só sai depois da resposta registrada) | `questao.js`, `respostas.html` | ✅ |
| BL-12 Pausa e retomada | `respostas` | `GET /api/certificacao/temas` informa `em_andamento`; abrir outro tema com questão aberta responde 409 | `questao.js`: pausa entre questões e janela "Continuar de onde parou?" | ✅ |
| BL-13 Perda de conexão ou navegador fechado | `respostas` | Ao reabrir, a questão com prazo vencido é encerrada como incorreta | Sair pelo botão registra a alternativa marcada. Ao fechar o navegador, a alternativa marcada não é enviada: a questão encerra sem resposta | 🟡 |
| BL-14 Tempo esgotado | `respostas.valida` | `responderQuestaoCandidatoService` aceita `letra: null`; resposta fora do prazo conta como incorreta (RN-05) | `questao.js` registra a alternativa marcada ao zerar o cronômetro e mostra a correção | ✅ |
| BL-15 Progresso | — | `GET /api/certificacao/temas`, `GET /api/certificacao/resultado` | `questao.html` (painel de temas, com X vermelho nos errados), `menu.html`, `resultado.html` | ✅ |
| BL-16 / BL-17 Percentual e nota | `respostas.acertou`, `respostas.valida` | `resultadoCandidatoService` (nota só com os 12 temas, RN-06) | `resultado.html` | ✅ |
| BL-18 Emissão ≥ 65% | `candidatos.certificado_hash` | `POST /api/candidatos/certificado` (RN-07) | `resultado.html` emite ao aprovar | ✅ |
| BL-19 Modelo do certificado | `candidatos.certificado_emitido_em`, `certificado_acertos`, `certificado_total` | `GET /api/candidatos/certificado`, `GET /api/candidatos/certificado/pdf` | `certificado.html` (nome, CPF, e-mail, data e hora, nota, percentual e QR Code, conforme o RF18 e a DP-02) | ✅ |
| BL-20 QR Code | `candidatos.certificado_hash` (RN-08) | QR Code no PDF (`pdfCertificado.js`) | QR Code em `certificado.html` (`qrcode.js`), que abre `validacao.html?codigo=...` | ✅ |
| BL-21 Validação pública | `candidatos.certificado_hash` | `GET /api/certificados/:codigo` (RN-09, DP-01) | `validacao.html` | ✅ |
| BL-22 Histórico | `respostas` | `GET /api/certificacao/respostas`, `GET /api/candidatos/me` | `historico.html`, `respostas.html` | ✅ |
| BL-23 Responsividade | — | — | Media queries no CSS das telas (FE-15, #98) | ✅ |
| BL-24 Termos e consentimento | `candidatos.termos_versao`, `termos_aceitos_em` | `POST /api/candidatos` exige o aceite; `POST /api/candidatos/me/termos`; rotas da prova respondem 403 sem o aceite vigente (RN-10) | `cadastro.html`, `menu.html` (novo aceite), `termos-de-uso.html`, `politica-de-privacidade.html` | ✅ |
| BL-25 Direitos do titular | `candidatos`, `respostas` | `GET /api/candidatos/me/dados`, `PATCH /api/candidatos/me`, `DELETE /api/candidatos/me` (RN-11) | `meus-dados.html` | ✅ |

### Requisitos não funcionais

| Requisito | Onde é atendido | Status |
|---|---|---|
| RNF-01 Tecnologia | HTML, CSS e JavaScript no front-end; Node.js 20.11+ e Express no back-end; PostgreSQL 16 (`backend/package.json`, `compose.yaml`) | ✅ |
| RNF-02 Senhas com bcrypt | `services/candidatos.js` (custo 12), `services/login.js` (`bcrypt.compare`) | ✅ |
| RNF-03 Rotas da prova com token | `middlewares/autenticacao.js` em `/api/questoes`, `/api/certificacao` e nas rotas de `/api/candidatos/me` | ✅ |
| RNF-04 Roda a partir de um clone limpo | Guia em `README.md`; testado de ponta a ponta em 26/11/2026 | ✅ |
| RNF-05 Horário registrado pelo servidor | `clock_timestamp()` em `services/certificacao.js` | ✅ |
| RNF-06 Telas a partir de 360 px | Media queries no CSS das telas (FE-15, #98) | ✅ |
| RNF-07 Validação sem CPF completo nem e-mail | `validarCertificadoService` (CPF mascarado `***.456.789-**`) | ✅ |
| RNF-08 Execução em contêiner | `compose.yaml` e `backend/Dockerfile`: banco e aplicação sobem com `docker compose up -d --build` | ✅ |
| RNF-09 Coleta mínima de dados | O aceite grava só versão e horário; o banco não guarda IP nem navegador | ✅ |

## Pendências

- **BL-13:** registrar a alternativa marcada quando o navegador fecha ou a conexão cai, por exemplo com `navigator.sendBeacon` no evento `pagehide`. Hoje ela só é registrada quando o candidato sai pelo botão ou quando o tempo acaba com a página aberta.
- **Tags de versão:** as tags `sprint-1`, `sprint-2` e `sprint-3` não existem no repositório. Para marcar as versões, crie as tags nos commits da tabela do início.
- **PRs abertos:** #121 e #124 (ver Sprint 3).
