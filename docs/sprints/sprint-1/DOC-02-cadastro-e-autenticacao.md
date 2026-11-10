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


