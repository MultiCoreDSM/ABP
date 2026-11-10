# DOC-02 — Casos de Uso de Cadastro e Autenticação

## 1. UC-01: Cadastro de Novo Candidato
   **Ator:** Candidato Não Autenticado.
   **Pré-condições:** O usuário não deve possuir sessão ativa ou token válido no navegador.

### 1.1 Fluxo Principal
 O usuário acessa a página pública `cadastro.html`.
 O usuário preenche os campos obrigatórios: Nome Completo, E-mail, CPF e Senha.
 O usuário clica no controle de submissão "Concluir Cadastro".
 O sistema verifica se todos os dados foram preenchidos corretamente.
 O sistema persiste as informações de forma segura na base de dados.
 O sistema exibe feedback de sucesso e redireciona o fluxo para a tela de Login (`login.html`).
   **Pós-condições:** Registro ativo criado no banco; estado final definido.


## 2. Tratamento de Exceções no Cadastro de CPF

### 2.1 Fluxo Alternativo A: CPF Algoritmicamente Inválido
 O sistema intercepta o payload enviado no clique de submissão.
 Identificada a quebra dos dígitos verificadores do CPF, o sistema impede a gravação.
 É exibida uma mensagem visual de alerta em vermelho: *"Por favor, insira um CPF válido."*
 O foco da interface retorna para o campo de texto correspondente para que o usuário corrija.

### 2.2 Fluxo Alternativo B: CPF Duplicado (Usuário Existente)
 O sistema faz a checagem preventiva de unicidade na base de dados antes de salvar.
 Detectada a duplicidade do documento, a operação de inserção é abortada.
 O sistema retorna um feedback amigável na tela: *"Este documento já está registrado em nossa base de dados. Recupere seus acessos ou faça login."*


