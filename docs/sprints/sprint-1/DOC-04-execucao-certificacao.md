# DOC-04 — Execução da Certificação

## 1. Lógica de Inicialização e Sorteio de Questões
Este caso de uso documenta o ciclo de vida completo de uma tentativa de teste de certificação por parte do candidato (vínculo com BL-06 a BL-14).

### 1.1 Regra do Sorteio Randômico (Critério de Aceitação)
*   **Gatilho:** O candidato confirma o início do teste oficial.
*   **Lógica do Sistema:** O sistema realiza uma consulta automatizada ao banco de dados e sorteia exatamente **1 questão aleatória para cada um dos 12 temas** de estudo mapeados no DOC-03.
*   **Garantia de Escopo:** O teste é composto invariavelmente por um bloco fixo de 12 questões. Nenhuma tentativa pode omitir um tema ou repetir um tópico na mesma rodada.


