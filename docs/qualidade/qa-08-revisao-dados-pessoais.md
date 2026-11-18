# QA-08 — Revisão de proteção de dados pessoais

| | |
|---|---|
| **Sprint** | Sprint 2 (23/10/2026 a 05/11/2026) |
| **Origem** | RNF03 e RNF04 do documento oficial |
| **Prioridade** | Alta |
| **Data da revisão** | 10/11/2026 (correções e testes em 11/11/2026) |
| **Base revisada** | `main` em `eb72ae2` |
| **Situação** | ✅ Concluída. Em 11/11/2026, o PO decidiu os pontos pendentes (DP-01 a DP-03 no [backlog](../backlog/README.md#decisões-do-po)). Só falta implementar a validação pública na BL-21, conforme a [issue A](qa-08-issues.md). |
| **Escopo** | Cadastro, autenticação, respostas/histórico, certificado e validação pública: back-end ([backend/src](../../backend/src)), banco ([schemas.sql](../../backend/database/schemas.sql)), front-end ([FrontEnd](../../FrontEnd)), documentação e protótipos ([Design](../../Design)) |

## Resumo

O back-end atende ao essencial: as senhas são guardadas com bcrypt e nunca voltam nas respostas, as consultas são parametrizadas, toda rota do candidato usa o id que vem do token (e não da URL), e a nota é calculada no servidor. Os exemplos e protótipos usam apenas dados fictícios.

Os riscos que sobram ficam nas partes que **ainda não existem ou não estão integradas**:

1. **Validação pública:** não foi implementada, e o backlog (BL-19) manda imprimir CPF e e-mail no certificado. Se a página de validação mostrar o certificado como ele é, CPF e e-mail ficam públicos.
2. **Disponibilidade:** rotas assíncronas sem tratamento de erro podem derrubar o servidor no meio de uma prova cronometrada.
3. **Front-end:** o login aceita qualquer CPF válido, o cadastro não chama a API, e a página da prova carrega o gabarito completo.

Foram registrados 8 riscos (3 altos, 2 médios, 2 baixos, 1 informativo). A seção [Issues propostas](#issues-propostas) indica qual issue trata cada risco. O texto das issues está em [qa-08-issues.md](qa-08-issues.md).

## Correções aplicadas após a revisão (10/11/2026)

As seções seguintes descrevem o estado em `eb72ae2`, antes das correções. Esta tabela mostra o que já foi corrigido.

| Risco | Situação | O que mudou |
|---|---|---|
| R2 | ✅ Corrigido | Todas as rotas usam o wrapper `capturar`, e o middleware `tratarErros` fecha a cadeia ([middlewares/erros.js](../../backend/src/middlewares/erros.js)). Ids de rota são validados como inteiros positivos (400 se inválidos). JSON malformado responde 400. |
| R3 | ✅ Corrigido | O login chama `POST /api/login` e guarda o token em `sessionStorage`. O cadastro chama `POST /api/candidatos` e mostra o erro da API. O simulador com o gabarito (`questao-simulador.js`) foi apagado. A prova usa as novas rotas autenticadas em [routes/certificacao.js](../../backend/src/routes/certificacao.js): a alternativa correta só é enviada depois que a resposta foi registrada (BL-11), e prazo e acerto são decididos no servidor. Sem token, a página volta para o login. |
| R4 | ✅ Corrigido | As respostas 500 trazem só uma mensagem genérica. O erro é registrado no log do servidor sem o corpo da requisição. O cadastro valida CPF (11 dígitos), nome e e-mail antes do banco. |
| R7 | ✅ Corrigido | Todo `/api/questoes/*` exige token (RNF-03 do backlog). O servidor não sobe sem `JWT_SECRET`. O cabeçalho `X-Powered-By` foi desativado. |
| R5 | ✅ Corrigido (11/11) | O login responde 429 depois de 5 falhas por CPF ou 20 por IP em 15 minutos ([middlewares/limiteLogin.js](../../backend/src/middlewares/limiteLogin.js)). O cadastro confere no servidor os dígitos verificadores do CPF, o formato do e-mail e a senha de 8 a 72 caracteres ([utils/validacao.js](../../backend/src/utils/validacao.js)). |
| R6 | ✅ Mitigado (11/11) | Quando o CPF não existe, o login roda o bcrypt contra um hash fictício, e o tempo de resposta fica igual ([services/login.js](../../backend/src/services/login.js)). A mensagem "CPF já cadastrado." foi mantida por ajudar o usuário. Esse risco foi aceito e é reduzido pelo limite de tentativas. |
| R1 | ✅ Decidido (11/11) | O PO aprovou os dados da validação pública (DP-01, RN-09): nome, CPF mascarado, data, situação e percentual. Em 12/11, a DP-02 foi revista: o RF18 do documento oficial exige CPF e e-mail no certificado, que só o próprio candidato vê. A validação pública segue sem e-mail e com o CPF mascarado. |
| R3 (seed) | ✅ Risco aceito (11/11) | O repositório `MultiCoreDSM/ABP` **é público**, então o gabarito do `seed.sql` está exposto. O PO aceitou o risco por ser um projeto acadêmico (DP-03). |
| R8 | ⏳ Implantação | HTTPS é obrigatório antes de qualquer implantação. Não há ação no ambiente local. |

O front-end agora é servido pelo próprio back-end em `http://localhost:3001`, na mesma origem da API e sem CORS. Só as pastas `FrontEnd/` e `assets/` ficam expostas, e o restante do repositório (seed com gabarito, `.env`) não é servido.

**Verificação:** as consultas SQL de `services/certificacao.js` foram executadas num PostgreSQL temporário com o schema e o seed. Os cenários testados foram sortear, retomar o mesmo tema, responder certo, reenviar (idempotente), encerrar por tempo esgotado, responder sem alternativa, tema inexistente e listar temas, todos com o resultado esperado. Todos os arquivos JS passaram em `node --check`.

**Teste da API e do navegador (11/11/2026):** a API foi executada com o PostgreSQL 16 do `compose.yaml` (schema e seed) e só com candidatos fictícios. Todos os casos tiveram o resultado esperado:

| Caso | Resultado |
|---|---|
| R2: `POST /api/questoes/abc/responder` e `/api/certificacao/questoes/abc/resposta` com token válido; tema `-1` e id com 20 dígitos | 400 "Id inválido". O servidor continuou no ar. |
| R4: CPF com 3 dígitos, nome com 120 caracteres, JSON malformado | 400 com mensagem amigável, sem nome de tabela ou constraint |
| Senha no banco | `senha_hash` começa com `$2a$12$` (bcrypt, custo 12) |
| Login com senha errada | 401 "CPF ou senha incorretos" |
| R7: `GET /api/questoes/1` e `/api/certificacao/temas` sem token; token com `alg: none` | 401. O cabeçalho `X-Powered-By` não aparece. |
| Candidato B responde a questão sorteada para o candidato A | 404 "Questão não sorteada para este candidato" |
| Corpo com `acertou: true`, `valida: true` e `candidato_id` de outro candidato | Campos ignorados. O banco gravou `acertou = false`, calculado a partir do gabarito. |
| Reenvio com outra letra | Mantém a primeira resposta (idempotente) |
| Navegador: cadastro → login → prova | Cadastro e login pela API. O token fica no `sessionStorage`. A prova carrega só `questao.js`, sem `"correta"` no DOM antes da resposta e com o `localStorage` vazio. A correção exibida veio do servidor. |
| Navegador sem token | A prova redireciona para `login.html?expired=true` |
| Log do servidor | Só as linhas de inicialização. Nenhum CPF, senha ou corpo de requisição. |
| R5: cadastro com CPF de dígito verificador errado, senha `123456`, e-mail `x@` | 400 com mensagem amigável |
| R5: 6 logins errados seguidos no mesmo CPF | Da 1ª à 5ª: 401. A 6ª e até a senha certa: 429 com `Retry-After`. Outro CPF continua entrando. |
| R6: tempo do login com CPF cadastrado (senha errada) e com CPF inexistente | 0,358 s e 0,347 s (antes, o inexistente voltava sem rodar o bcrypt) |
| Front-end: tela inicial e cadastro refeitos com base em `Design/` | O cadastro valida por campo, entra automaticamente depois do cadastro e "Sim, iniciar agora" abre a prova. O login mostra a mensagem do 429. |

## Critérios de aceitação

| Critério | Situação | Evidência |
|---|---|---|
| Senhas não são armazenadas ou registradas em texto puro | ✅ Atendido | Hash bcrypt com custo 12 ([services/candidatos.js:7](../../backend/src/services/candidatos.js#L7)). `senha_hash` nunca entra em `RETURNING` nem na resposta do login ([services/login.js:16](../../backend/src/services/login.js#L16)). Não há log de corpo de requisição. |
| CPF, e-mail e histórico não são acessíveis por outro candidato | ✅ Atendido nas rotas existentes | Sorteio, resposta, próximo tema e certificado usam `req.candidatoId`, que vem do `sub` do JWT ([middlewares/autenticacao.js:26](../../backend/src/middlewares/autenticacao.js#L26)). Nenhuma rota recebe id de candidato pela URL ou pelo corpo. Ainda não existe rota de histórico (BL-22). Quando for criada, precisa seguir a mesma regra. |
| Manipulação do front-end não altera a nota oficial | ✅ Atendido (R3 corrigido e testado em 11/11) | `acertou` é gravado pelo banco a partir de `alternativas.correta` ([services/questoes.js:125-137](../../backend/src/services/questoes.js#L125-L137)). `valida` é uma coluna gerada. O percentual é calculado em `emitirCertificadoService`. O cliente só envia a letra. No teste, um corpo com `acertou: true` foi ignorado. Na revisão inicial o front-end carregava o gabarito (R3), o que foi corrigido. |
| A validação pública expõe somente dados aprovados | ✅ Dados aprovados definidos | O PO aprovou a lista em 11/11/2026 ([DP-01 e RN-09](../backlog/README.md#decisões-do-po)). A funcionalidade ainda não existe (BL-21 está ⬜). Os critérios de aceitação da [issue A](qa-08-issues.md) garantem que ela devolva só esses campos quando for implementada. |
| Evidências compartilhadas não contêm dados pessoais reais | ✅ Atendido | Uma busca por padrões de CPF e e-mail nos arquivos versionados encontrou só dados fictícios (`12345678901`, `pedro@example.com`, placeholders `000.000.000-00`). Os protótipos [cadastro.png](../../Design/cadastro.png), [Cadastro com sucesso.png](../../Design/Cadastro%20com%20sucesso.png) e [certificado.png](../../Design/certificado.png) usam placeholders. O `.env` nunca foi versionado. |

## Mapa de dados pessoais

| Dado | Coleta | Armazenamento | Transmissão | Exibição |
|---|---|---|---|---|
| **CPF** | Formulários de cadastro e login. A API usa `POST /api/candidatos` e `POST /api/login`. | `candidatos.cpf` CHAR(11) com CHECK de 11 dígitos, em texto puro e único | Corpo JSON. HTTP sem TLS no ambiente local (R8). | Volta para o próprio candidato na resposta do cadastro. O backlog prevê o CPF no certificado (BL-19, R1). |
| **Nome** | Cadastro | `candidatos.nome` | Corpo JSON | Respostas do cadastro e do login, e certificado (BL-19) |
| **E-mail** | Cadastro (formato validado no servidor desde 11/11) | `candidatos.email`, sem UNIQUE | Corpo JSON | Respostas do cadastro e do login. O backlog prevê o e-mail no certificado (BL-19, R1). |
| **Senha** | Cadastro e login | Só `candidatos.senha_hash` (bcrypt, custo 12) | Corpo JSON em texto puro, por isso o TLS é obrigatório em produção (R8) | Nunca |
| **Respostas e tempos** | `POST /api/questoes/:id/responder` | `respostas` (letra, início, resposta, `valida`, `acertou`) | Só com token, sempre do próprio candidato | Resposta da própria questão. Desde a correção de R3, nada fica guardado no navegador (o simulador com `localStorage` foi apagado). |
| **Nota e percentual** | Calculados no servidor | **Não são persistidos.** Só ficam guardados o `certificado_hash` e as respostas. | Resposta de `POST /api/candidatos/certificado` | Próprio candidato. O backlog prevê no certificado e, possivelmente, na validação pública (R1). |
| **Código do certificado** | Gerado no servidor com `randomBytes(32)` | `candidatos.certificado_hash` | Resposta do certificado. Futuramente, no QR Code. | Certificado e validação pública |
| **Token JWT** | Login | Não é guardado no servidor. HS256, expira em 1 h. | Cabeçalho `Authorization: Bearer` | `sessionStorage` do navegador (some ao fechar a aba e nunca vai na URL). Sem token, a prova volta para o login. |

## Pontos verificados que estão adequados

- **Senha:** bcrypt com custo 12. O hash não sai do banco. A mensagem de falha do login é genérica ("CPF ou senha incorretos") e não diz qual campo errou.
- **SQL:** todas as consultas usam parâmetros (`$1`, `$2`…). Não foi encontrada concatenação de entrada do usuário.
- **JWT:** algoritmo fixado em HS256 na verificação, `issuer` e `audience` são conferidos, e o `sub` é validado como inteiro seguro.
- **Autorização:** não existe rota que receba o id de outro candidato, por isso não há IDOR nas rotas atuais.
- **Integridade da nota:** a resposta é única. O `UPDATE` só altera a linha com `data_horario_resposta IS NULL`, o que evita duas respostas para a mesma questão. Respostas fora do prazo ficam com `valida = false` e não contam no percentual.
- **Código do certificado:** 256 bits aleatórios. Não dá para adivinhar nem percorrer em sequência.
- **Logs:** o servidor só registra a porta na inicialização. O front-end usa `console.error` só com o objeto de erro, sem dados do candidato.
- **Segredos:** `.env` está no `.gitignore` e nunca foi commitado. O antigo `.env.example` tinha só valores de exemplo.

## Riscos encontrados

Severidade: **Alta** quando expõe dado pessoal publicamente ou compromete a prova. **Média** quando facilita um ataque ou vaza informação técnica. **Baixa** quando o impacto é pequeno ou depende de outras falhas.

### R1 — Validação pública pode expor CPF e e-mail · Alta

- **Onde:** BL-19 e BL-21 em [docs/backlog/README.md](../backlog/README.md). Ainda não existe código.
- **Problema:** BL-19 define que o certificado tem "nome completo, CPF, e-mail, data e hora da emissão, nota final e percentual". A validação pública (BL-21) pode ser aberta por qualquer pessoa que tenha o QR Code. Se ela mostrar o mesmo conteúdo do certificado, CPF e e-mail ficam públicos. Isso contraria RNF03/RNF04 e o princípio de necessidade da LGPD (art. 6º, III).
- **Outro ponto:** a data de emissão e a nota não são persistidas. A validação não teria de onde tirar a data, e recalcular a nota a cada consulta é frágil.
- **Medida proposta:** definir com o PO a lista de dados aprovados para a validação pública. Sugestão: nome completo, CPF mascarado (`***.456.789-**`), data de emissão, situação "válido" e, se o PO aprovar, o percentual. O e-mail nunca aparece. A busca é feita só pelo código do certificado, nunca por CPF ou nome. Persistir `emitido_em` e a nota no momento da emissão (ver a evolução TENTATIVA/CERTIFICADO em [modelo-conceitual.md](../banco/modelo-conceitual.md#evolução-prevista)).

### R2 — Um erro em rota assíncrona derruba o servidor · Alta

- **Onde:** [routes/questoes.js:40-45](../../backend/src/routes/questoes.js#L40-L45) (`/:id/responder`) e [routes/temas.js:8-29](../../backend/src/routes/temas.js#L8-L29) (`/` e `/proximo`).
- **Problema:** essas rotas não têm `try/catch`. O Express 4 não captura promessas rejeitadas, e o Node 22 encerra o processo quando uma rejeição não é tratada. Exemplo: `POST /api/questoes/abc/responder` com um token válido faz `Number("abc")` virar `NaN`. O PostgreSQL rejeita o valor como inteiro, e o processo cai. Qualquer candidato logado consegue derrubar a API para todos durante uma prova de 150 s por questão.
- **Como foi verificado:** análise do código. Não foi executado, porque não havia banco disponível no ambiente da revisão.
- **Medida proposta:** validar `:id` como inteiro positivo, envolver as rotas em `try/catch` (ou num wrapper `asyncHandler`) e criar um middleware de erro final. Incluir um teste com id inválido.

### R3 — Front-end com login fictício e gabarito embutido · Alta

- **Onde:** [login.js:76](../../FrontEnd/Scripts/login.js#L76) (`// TODO: ... qualquer CPF válido entra`), [cadastro.js:33-38](../../FrontEnd/Scripts/cadastro.js#L33-L38) (mostra sucesso sem chamar a API) e [questao.html:125](../../FrontEnd/Pages/questao.html#L125), que carrega [questao-simulador.js](../../FrontEnd/Scripts/questao-simulador.js) com `"correta": true` em todas as 48 questões.
- **Problema:** se as páginas forem publicadas assim, qualquer pessoa vê o gabarito oficial no navegador (DevTools → Sources). As questões do simulador são as mesmas do banco, então a nota oficial deixa de ter valor. O simulador também calcula `acertou` no cliente. Isso não afeta o banco, mas mostra um resultado que não é o oficial.
- **Medida proposta:** integrar login e cadastro com a API. Retirar o `questao-simulador.js` das páginas de produção, ou trocar por questões que não sejam as oficiais. Exibir só a correção que vem do servidor. Definir onde guardar o token: `sessionStorage` é o mínimo, e nunca colocar o token na URL.
- **Observação:** o [seed.sql](../../backend/database/seed.sql) também traz o gabarito. Se o repositório for público, o gabarito já está acessível. A equipe precisa decidir se o seed oficial deve ficar fora do repositório público.

### R4 — Mensagens de erro expõem detalhes do banco · Média

- **Onde:** todos os `catch` que fazem `res.status(500).json({ erro: err.message })`, por exemplo [routes/candidatos.js:29](../../backend/src/routes/candidatos.js#L29) e [routes/login.js:41](../../backend/src/routes/login.js#L41).
- **Problema:** um cadastro com CPF de 3 dígitos devolve `new row for relation "candidatos" violates check constraint "candidatos_cpf_check"`. Um nome com mais de 100 caracteres devolve `value too long for type character varying(100)`. Se faltar o `JWT_SECRET`, o login devolve `secretOrPrivateKey must have a value`. Essas mensagens revelam a estrutura do banco e a configuração do servidor.
- **Medida proposta:** responder 500 com uma mensagem genérica e registrar o erro só no servidor, sem o corpo da requisição. Validar a entrada antes do banco para responder 400 com uma mensagem amigável.

### R5 — Sem limite de tentativas no login e sem validação no servidor · Média

- **Onde:** [routes/login.js](../../backend/src/routes/login.js) e [routes/candidatos.js](../../backend/src/routes/candidatos.js).
- **Problema:** o login aceita tentativas ilimitadas. O servidor aceita qualquer senha (o exemplo usa `123456`), não confere os dígitos verificadores do CPF nem o formato do e-mail. A validação do CPF existe só no front-end ([login.js:33](../../FrontEnd/Scripts/login.js#L33)).
- **Medida proposta:** limitar as tentativas por IP e por CPF (por exemplo, `express-rate-limit`), exigir senha mínima de 8 caracteres e validar CPF e e-mail no servidor.

### R6 — Dá para descobrir se um CPF está cadastrado · Baixa

- **Onde:** [services/candidatos.js:18](../../backend/src/services/candidatos.js#L18) ("CPF já cadastrado.") e [services/login.js:8-10](../../backend/src/services/login.js#L8-L10).
- **Problema:** o cadastro confirma se um CPF já existe. O login responde mais rápido quando o CPF não existe, porque pula o bcrypt. Com isso, dá para saber se uma pessoa está inscrita na certificação.
- **Medida proposta:** no login, rodar o `bcrypt.compare` contra um hash fixo quando o CPF não existir. No cadastro, a mensagem é útil para o usuário. Aceitar o risco e mitigar com o limite de tentativas de R5 (decisão de equipe).

### R7 — Ajustes de configuração · Baixa

- `GET /api/questoes/:id` não exige token. O [server.js:17](../../backend/src/server.js#L17) monta as rotas direto, e o [routes/index.js](../../backend/src/routes/index.js), que aplicaria o middleware, não é usado. O enunciado e as alternativas ficam públicos (sem a correta).
- `JWT_SECRET` não é conferido na inicialização. O servidor sobe e só falha no primeiro login.
- O cabeçalho `X-Powered-By: Express` está ativo.
- **Medida proposta:** remover o `routes/index.js` ou passar a usá-lo, conferir as variáveis obrigatórias na inicialização e usar `app.disable("x-powered-by")` (ou `helmet`).

### R8 — Transmissão sem TLS · Informativo

- O ambiente atual é local (HTTP). CPF e senha trafegam em texto no corpo da requisição. Antes de qualquer implantação, HTTPS é obrigatório. Isso vale também para a URL do QR Code. Fica registrado como requisito de implantação, sem ação nesta sprint.

## Issues propostas

Cinco grupos de risco foram planejados como issues. Quatro foram resolvidos na QA-08. Resta a issue A, que implementa a validação pública com os dados aprovados pelo PO. O texto final está em [qa-08-issues.md](qa-08-issues.md), pronto para colar no GitHub.

| Issue | Riscos | Prioridade |
|---|---|---|
| Implementar a validação pública com os dados aprovados (issue A) | R1 | Alta (aberta, BL-21) |
| ~~Tratar erros nas rotas assíncronas e validar ids~~ | R2, R4 | ✅ corrigida |
| ~~Integrar login/cadastro e remover gabarito do front-end~~ | R3 | ✅ corrigida; `seed.sql` com risco aceito (DP-03) |
| ~~Limitar tentativas de login e validar dados no servidor~~ | R5, R6 | ✅ corrigida |
| ~~Ajustes de configuração do servidor~~ | R7 | ✅ corrigida |

## Limitações da revisão

- A revisão inicial (10/11) foi estática, por leitura de código. As correções de R2, R3, R4 e R7 foram confirmadas com a API rodando em 11/11 (ver [Correções aplicadas](#correções-aplicadas-após-a-revisão-10112026)). Não há testes automatizados, por isso esses casos precisam ser repetidos manualmente depois de mudanças nas rotas.
- Em 11/11, todas as imagens de `Design/` e o PDF `Design/figma parte 2.pdf` foram abertos um a um. Eles só contêm placeholders e um primeiro nome de exemplo na saudação do menu, sem CPF, e-mail ou outro dado pessoal real.
- Em 11/11, a API do GitHub confirmou que o repositório `MultiCoreDSM/ABP` é **público**. Por isso o gabarito do `seed.sql` está exposto (DP-03).
