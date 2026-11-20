# QA-08 — Issues para os riscos encontrados

Cada issue aponta para o risco no [relatório de revisão](qa-08-revisao-dados-pessoais.md#riscos-encontrados).

## Situação (11/11/2026)

| Risco | Situação | Onde |
|---|---|---|
| R1: validação pública pode expor CPF e e-mail | ✅ Implementado em 12/11 (a issue A não precisa mais ser aberta) | O PO aprovou os dados em 11/11: DP-01, DP-02 e RN-09 no [backlog](../backlog/README.md#decisões-do-po) |
| R3: gabarito no `seed.sql` de repositório público | ✅ Risco aceito pelo PO em 11/11 (sem issue) | DP-03 no backlog |
| R2, R4: erros em rotas assíncronas e mensagens do banco | ✅ Corrigido em 10/11 | [middlewares/erros.js](../../backend/src/middlewares/erros.js) |
| R3: login fictício e gabarito no front-end | ✅ Corrigido em 10/11 | `login.js`, `cadastro.js`, [routes/certificacao.js](../../backend/src/routes/certificacao.js) |
| R5, R6: tentativas ilimitadas, validação só no front-end, CPF descoberto pelo tempo | ✅ Corrigido em 11/11 | [middlewares/limiteLogin.js](../../backend/src/middlewares/limiteLogin.js), [utils/validacao.js](../../backend/src/utils/validacao.js), [services/login.js](../../backend/src/services/login.js) |
| R7: configuração do servidor | ✅ Corrigido em 10/11 | `server.js`, `routes/questoes.js` |
| R8: transmissão sem TLS | Requisito de implantação | Sem ação no ambiente local |

Os testes de cada correção estão no [relatório](qa-08-revisao-dados-pessoais.md#correções-aplicadas-após-a-revisão-10112026). A issue A foi implementada em 12/11/2026: as tarefas e os critérios abaixo estão atendidos.

---

## Issue A — Implementar a validação pública com os dados aprovados

**Título:** Implementar a validação pública do certificado com os dados aprovados (BL-21)
**Labels sugeridas:** `segurança`, `certificado`
**Origem:** QA-08 / R1 · RNF03, RNF04 · BL-19, BL-21 · DP-01, DP-02, RN-09

**Contexto**
O certificado (BL-19) traz nome, CPF, data/hora, nota e percentual. A validação pública (BL-21) pode ser aberta por qualquer pessoa que tenha o QR Code. Por isso, em 11/11/2026, o PO definiu que ela mostra somente nome completo, CPF mascarado (`***.456.789-**`), data de emissão, situação e percentual de acertos (DP-01, RN-09). O PO também definiu que o e-mail sai do certificado (DP-02). Hoje a data de emissão e a nota não são persistidas, então a validação não teria de onde ler esses dados.

**Tarefas**
- [x] O PO aprova a lista de campos da validação pública (DP-01, RN-09).
- [x] O PO decide sobre o e-mail no certificado (DP-02). Em 12/11 a decisão foi revista: o RF18 exige o e-mail no certificado.
- [x] Persistir `emitido_em` e a nota/percentual na emissão, alinhado à evolução TENTATIVA/CERTIFICADO do [modelo conceitual](../banco/modelo-conceitual.md#evolução-prevista).
- [x] Criar a rota pública de validação, que busca **somente** pelo código do certificado e devolve só os campos da RN-09 (`GET /api/certificados/:codigo`, `validacao.html`).
- [x] O certificado (BL-19) segue o RF18: nome, CPF, e-mail, data e hora, nota e percentual. Ele só aparece para o próprio candidato, e a validação pública não mostra o e-mail.

**Critérios de aceitação**
- A resposta da validação pública não contém e-mail nem CPF completo.
- Não existe rota pública que busque por CPF, nome ou id do candidato.
- Um código inexistente retorna 404 sem dizer se o candidato existe.
