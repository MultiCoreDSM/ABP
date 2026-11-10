# DOC-02 — Casos de Uso de Cadastro e Autenticação

## 1. UC-01: Cadastro de Novo Candidato
  * **Ator:** Candidato Não Autenticado.
  * **Pré-condições:** O usuário não deve possuir sessão ativa ou token válido no navegador.

### 1.1 Fluxo Principal
 1. O usuário acessa a página pública `cadastro.html`.
 2. O usuário preenche os campos obrigatórios: Nome Completo, E-mail, CPF e Senha.
 3. O usuário clica no controle de submissão "Concluir Cadastro".
 4. O sistema verifica se todos os dados foram preenchidos corretamente.
 5. O sistema persiste as informações de forma segura na base de dados.
 6. O sistema exibe feedback de sucesso e redireciona o fluxo para a tela de Login (`login.html`).
   **Pós-condições:** Registro ativo criado no banco; estado final definido.


## 2. Tratamento de Exceções no Cadastro de CPF

### 2.1 Fluxo Alternativo A: CPF Algoritmicamente Inválido
 1. O sistema intercepta o payload enviado no clique de submissão.
 2. Identificada a quebra dos dígitos verificadores do CPF, o sistema impede a gravação.
 3. É exibida uma mensagem visual de alerta em vermelho: *"Por favor, insira um CPF válido."*
 4. O foco da interface retorna para o campo de texto correspondente para que o usuário corrija.

### 2.2 Fluxo Alternativo B: CPF Duplicado (Usuário Existente)
 1. O sistema faz a checagem preventiva de unicidade na base de dados antes de salvar.
 2. Detectada a duplicidade do documento, a operação de inserção é abortada.
 3. O sistema retorna um feedback amigável na tela: *"Este documento já está registrado em nossa base de dados. Recupere seus acessos ou faça login."*

## 3. UC-02: Autenticação (Login) do Candidato
 *  **Ator:** Candidato Cadastrado.
 *  **Pré-condições:** Registro previamente existente e ativo no banco de dados.

### 3.1 Fluxo Principal
 1. O usuário acessa a interface de autenticação (`login.html`).
 2. O usuário fornece suas credenciais de identificação (E-mail ou CPF) junto com a Senha.
 3. O usuário clica na ação "Entrar".
 4. O sistema compara os hashes de segurança na base de dados.
 5. Sendo compatíveis, o sistema gera o token de sessão ativa do usuário.
 6. O navegador armazena a sessão e redireciona o candidato logado para a tela `inicial.html`.
  **Pós-condições:** Estado de sessão iniciado com token válido de navegação privada.

## 4. Segurança da Informação e Falhas Conhecidas de Login

### 4.1 Fluxo Alternativo C: Credenciais Incorretas (E-mail ou Senha Inválidos)
1. O sistema processa os parâmetros de autenticação e constata incompatibilidade de dados.
2. O token de acesso não é gerado pelo servidor.
3. **Regra de Segurança Estrita:** O sistema exibe o feedback genérico: *"E-mail/CPF ou senha incorretos."*
4. A mensagem é desenhada deliberadamente de forma abstrata para ocultar se o e-mail ou CPF digitado existem ou não na base de dados, prevenindo ataques maliciosos de descoberta de contas.




