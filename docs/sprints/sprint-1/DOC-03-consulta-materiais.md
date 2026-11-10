# DOC-03 — Consulta aos Materiais de Estudo

## 1. UC-03: Apresentação da Certificação e Escolha de Início
*   **Ator:** Candidato Autenticado.
*   **Pré-condições:** O candidato deve possuir uma sessão privada ativa no sistema e estar na tela inicial do painel (`inicial.html`).

### 1.1 Fluxo Principal
1. O candidato clica na opção de menu ou card "Trilha de Estudos".
2. O sistema intercepta o comando e faz a carga da tela de apresentação da certificação.
3. A interface renderiza as diretrizes gerais, contendo as regras dos testes, duração de cada questão e a nota de corte exigida.
4. O sistema apresenta de forma destacada o controle visual para avançar à listagem de temas.
5. O candidato aciona o controle de avanço.
*   **Pós-condições:** Rota privada de listagem de conteúdo acadêmico liberada e renderizada em tela.

## 2. Listagem Estruturada dos 12 Temas de Estudo
Conforme determinado nas especificações de escopo, a trilha de aprendizado é composta de forma imutável por exatamente 12 temas técnicos sequenciais:
*   Tema 01: Fundamentos de Arquitetura Multiplataforma
*   Tema 02: Engenharia de Requisitos e Casos de Uso
*   Tema 03: Modelagem Conceitual e Diagramação UML
*   Tema 04: Estrutura de Dados e Lógica Computacional
*   Tema 05: Princípios de Ciclo de Vida de Software
*   Tema 06: Arquitetura Front-End e Semântica Web
*   Tema 07: Programação Assíncrona e Manipulação Dinâmica de Telas
*   Tema 08: Versionamento Avançado e Controle de Commits no Git
*   Tema 09: Barramentos de API e Integração de Microsserviços
*   Tema 10: Persistência Relacional de Dados e Linguagem SQL
*   Tema 11: Cobertura de Testes Unitários e Garantia de Qualidade
*   Tema 12: Práticas de Integração Contínua e Deploy Automatizado (CI/CD)

### 2.1 Fluxo de Navegação e Abertura de Conteúdo
1. O candidato visualiza a listagem de cards organizados com os 12 temas na interface.
2. O candidato seleciona um dos temas ativos clicando sobre o card do conteúdo correspondente.
3. O sistema requisita o payload de texto e mídia do tema específico e renderiza o material de leitura na tela.


