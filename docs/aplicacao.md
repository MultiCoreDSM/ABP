# Telas, API e segurança

Referência das páginas do front-end, das rotas da API e das proteções de dados pessoais da plataforma. Para instalar e rodar a aplicação, veja o [README principal](../README.md#como-executar).

## Telas

Todas as páginas ficam em [`FrontEnd/Pages/`](../FrontEnd/Pages) e são servidas pela aplicação em `http://localhost:3001/FrontEnd/Pages/`. A raiz (`http://localhost:3001`) abre a `inicial.html`.

| Página | Descrição | Exige login |
|---|---|---|
| `inicial.html` | Apresentação da certificação e "Como funciona", com links para cadastro, login, Área de Estudos e validação de certificado. | Não |
| `cadastro.html` | Criação de conta com aceite obrigatório dos termos. Depois do cadastro, o candidato já entra e pode iniciar a prova ou ir ao menu. | Não |
| `login.html` | Acesso com CPF e senha. Leva ao menu. Quando a sessão expira, volta para cá com um aviso. | Não |
| `esqueci-senha.html` | Formulário de recuperação. Valida CPF e e-mail, mas avisa que a recuperação por e-mail ainda não está disponível. Nada é enviado ao servidor. | Não |
| `menu.html` | Saudação com acesso a Meus dados, Exames (começar, continuar ou ver resultado), Área de Estudos, Histórico e Certificados. Pede um novo aceite se os termos mudaram. | Sim |
| `area-estudos.html` | Só estudo: os 12 temas, cada um com o material em PDF. O exame fica separado, em Exames, no menu. | Não |
| `questao.html` | Prova com cronômetro, confirmação da resposta e correção logo depois. A pausa acontece entre questões: sair com uma questão aberta encerra essa questão, porque o prazo corre no servidor. Os outros temas ficam salvos para continuar depois. Fechar ou recarregar a página com uma questão aberta pede confirmação e, se a pessoa sair, encerra a questão com a alternativa marcada. A alternativa marcada fica guardada no servidor desde o clique: se a conexão cair, ela reaparece ao voltar dentro do prazo, ou fica registrada quando o prazo vence. | Sim |
| `resultado.html` | Nota, aprovação e o resultado de cada tema. Se o candidato foi aprovado, emite o certificado e mostra o link para ele. | Sim |
| `respostas.html` | Resposta dada e alternativa correta de cada tema, com filtro por corretas e incorretas. | Sim |
| `certificado.html` | Certificado com nome, CPF, e-mail, nota, data e QR Code. Permite baixar em PDF (pela impressão do navegador), copiar o link de validação e validar. | Sim |
| `validacao.html` | Validação pública pelo código do certificado. É a página que o QR Code abre (`validacao.html?codigo=...`). | Não |
| `historico.html` | Estatísticas e linha do tempo de atividades, com filtro. | Sim |
| `meus-dados.html` | Direitos do titular (LGPD, art. 18): ver e corrigir nome e e-mail, baixar os dados em JSON e excluir a conta com confirmação de senha. | Sim |
| `termos-de-uso.html` · `politica-de-privacidade.html` | Documentos que o candidato aceita no cadastro. | Não |

Os protótipos estão em [`Design/`](../Design) e no [Figma](https://www.figma.com/design/ViL8tpfr58iVLNzIGPkpj1/abp?node-id=8-2). O visual comum das telas fica em [`FrontEnd/Styles/base.css`](../FrontEnd/Styles/base.css), e as funções compartilhadas (sessão e chamadas à API) ficam em [`FrontEnd/Scripts/comum.js`](../FrontEnd/Scripts/comum.js).

## API

Todas as rotas ficam sob `http://localhost:3001/api`. As rotas protegidas exigem o cabeçalho `Authorization: Bearer <token>`, e o token vem do login. Sem token, ou com token vencido ou inválido, a resposta é 401.

### Cadastro e login

| Método | Rota | Token | Descrição |
|---|---|---|---|
| `POST` | `/candidatos` | — | Cadastra um candidato (`cpf`, `nome`, `email`, `senha`). Exige `"aceite_termos": true` e grava a versão aceita. Responde 400 se o CPF já estiver cadastrado. |
| `POST` | `/login` | — | Autentica com `cpf` e `senha` e devolve o token (expira em 1 h). Responde 429 depois de 5 falhas no mesmo CPF ou 20 no mesmo IP, numa janela de 15 min. |

### Dados do candidato

| Método | Rota | Token | Descrição |
|---|---|---|---|
| `GET` | `/candidatos/me` | ✅ | Nome, data de cadastro e `termos_pendentes` do próprio candidato |
| `GET` | `/candidatos/me/dados` | ✅ | Todos os dados do candidato em JSON, menos o hash da senha (acesso e portabilidade). Não fica em cache. |
| `PATCH` | `/candidatos/me` | ✅ | Corrige `nome` e/ou `email`. O nome não muda depois da emissão do certificado (409). |
| `POST` | `/candidatos/me/termos` | ✅ | Registra o aceite da versão vigente dos termos |
| `DELETE` | `/candidatos/me` | ✅ | Exclui cadastro, respostas e certificado. Exige `{ "senha": "..." }`. Senha errada responde 403, e 5 erros em 15 min bloqueiam a exclusão (429). |

### Temas e certificação

| Método | Rota | Token | Descrição |
|---|---|---|---|
| `GET` | `/temas` | — | Lista os 12 temas |
| `GET` | `/temas/proximo` | ✅ | Próximo tema ainda não respondido |
| `GET` | `/certificacao/temas` | ✅ | Temas com `respondido`, `em_andamento` e `acertou` do candidato. O acerto só aparece em temas já encerrados. |
| `GET` | `/certificacao/temas/:id/questao` | ✅ | Sorteia ou retoma a questão do tema, com os segundos restantes e a alternativa já marcada (`letra_marcada`). Responde 409 se outra questão estiver aberta e 403 se os termos vigentes não foram aceitos. |
| `POST` | `/certificacao/questoes/:id/marcacao` | ✅ | Guarda a alternativa marcada (`{ "letra": "B" }`) sem encerrar a questão. Se o prazo vencer sem resposta, ela fica registrada e conta como incorreta. Responde 409 se a questão já foi encerrada. |
| `POST` | `/certificacao/questoes/:id/resposta` | ✅ | Registra a resposta (`{ "letra": "A" }` ou `null`) e devolve a correção. Também responde 403 sem o aceite dos termos vigentes. |
| `GET` | `/certificacao/resultado` | ✅ | Acertos, total e situação de cada tema |
| `GET` | `/certificacao/respostas` | ✅ | Respostas e correções, só dos temas já encerrados |
| `GET` | `/imagens/:id` | — | Imagem de uma questão |

### Certificado

| Método | Rota | Token | Descrição |
|---|---|---|---|
| `POST` | `/candidatos/certificado` | ✅ | Depois dos 12 temas, emite o certificado se o candidato tiver 65% ou mais (senão, 400). Se já foi emitido, devolve o mesmo. |
| `GET` | `/candidatos/certificado` | ✅ | Certificado já emitido, com nome, CPF e e-mail do titular (404 se não existe) |
| `GET` | `/candidatos/certificado/pdf` | ✅ | Emite o certificado, se ainda não existe, e devolve o PDF com QR Code. O endereço do QR Code vem de `APP_URL` ou do endereço acessado. |
| `GET` | `/certificados/:codigo` | — | Validação pública: nome, CPF mascarado, data, percentual e situação (RN-09). Código mal formado ou inexistente recebe a mesma resposta (404). |

### Versão anterior da prova

| Método | Rota | Token | Descrição |
|---|---|---|---|
| `GET` | `/questoes/:id` | ✅ | Enunciado e alternativas, sem a correta |
| `POST` | `/questoes/sortear` · `/questoes/:id/responder` | ✅ | Versão anterior da prova, mantida por compatibilidade. O front-end atual usa as rotas de `/certificacao`. |

Há exemplos de `curl` em comentários em cada arquivo de [`backend/src/routes/`](../backend/src/routes).

## Segurança e dados pessoais

Resumo da revisão de proteção de dados pessoais (QA-08):

- **Senhas:** guardadas com bcrypt (custo 12) e nunca devolvidas pela API.
- **Sessão:** o token JWT (HS256) vale 1 h e é assinado com o `JWT_SECRET` do `.env`. No navegador, fica no `sessionStorage`: some ao fechar a aba e nunca vai na URL.
- **Dados do candidato:** cada candidato só acessa os próprios dados, porque o id vem do token.
- **Nota:** acerto e prazo de 150 s são decididos no servidor, e o gabarito não vai para o navegador antes da resposta.
- **Erros:** as respostas não expõem detalhes do banco, e os logs não registram CPF, senha ou o corpo das requisições.
- **Login:** tem limite de tentativas por CPF e por IP, e o tempo de resposta não revela se um CPF está cadastrado. O contador fica na memória do servidor: zera quando a aplicação reinicia.
- **Arquivos servidos:** só as pastas `FrontEnd/` e `assets/` ficam acessíveis pelo navegador. O `.env`, o `seed.sql` e o resto do repositório não são expostos, e o `.env` também fica fora da imagem Docker.
- **Certificado:** o código de validação tem 64 caracteres aleatórios. A validação pública mostra só nome, CPF mascarado (`***.456.789-**`), data, percentual e situação, nunca o e-mail.
- **LGPD:** o cadastro exige o aceite dos [Termos de Uso](../FrontEnd/Pages/termos-de-uso.html) e da [Política de Privacidade](../FrontEnd/Pages/politica-de-privacidade.html). O banco guarda só a versão aceita e o horário, sem IP nem dados do navegador. Sem o aceite da versão vigente, o servidor não abre questões nem grava respostas. Em **Meus dados**, o candidato vê, corrige, baixa e exclui os próprios dados. A exclusão exige a senha e apaga cadastro, respostas e certificado numa transação. Depois dela, o código do certificado deixa de ser validado.
- **Nova versão dos termos:** ao mudar o texto, troque `TERMOS_VERSAO` em [`backend/src/utils/termos.js`](../backend/src/utils/termos.js) e a data nas duas páginas. Todos precisarão aceitar de novo.

**Atenção:** o repositório é público e o `seed.sql` contém o gabarito das questões. O PO aceitou esse risco por ser um projeto acadêmico ([DP-03](backlog/README.md#decisões-do-po)).
