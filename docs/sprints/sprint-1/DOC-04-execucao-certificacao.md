# DOC-04 — Execução da Certificação

## 1. Lógica de Inicialização e Sorteio de Questões
Este caso de uso documenta o ciclo de vida completo de uma tentativa de teste de certificação por parte do candidato (vínculo com BL-06 a BL-14).

### 1.1 Regra do Sorteio Randômico (Critério de Aceitação)
*   **Gatilho:** O candidato confirma o início do teste oficial.
*   **Lógica do Sistema:** O sistema realiza uma consulta automatizada ao banco de dados e sorteia exatamente **1 questão aleatória para cada um dos 12 temas** de estudo mapeados no DOC-03.
*   **Garantia de Escopo:** O teste é composto invariavelmente por um bloco fixo de 12 questões. Nenhuma tentativa pode omitir um tema ou repetir um tópico na mesma rodada.

## 2. Dinâmica de Resposta Única e Confirmação

### 2.1 Interface e Seleção
*   Cada questão sorteada é exibida individualmente na tela, contendo o enunciado e as alternativas de múltipla escolha.
*   O sistema aceita a seleção de **apenas uma única alternativa** por questão por parte do candidato.

### 2.2 Mecanismo de Salvamento Seguro e Bloqueio de Reenvio (Critério de Aceitação)
1. O usuário clica na alternativa desejada.
2. O sistema exige que o usuário clique em um botão de ação "Confirmar Resposta" antes de computar o ponto ou avançar.
3. **Bloqueio de Reenvio:** Uma vez clicado em confirmar, a resposta para aquele tema específico é gravada. O critério de aceitação garante que **nenhum tema pode ser respondido duas vezes na mesma tentativa**.

