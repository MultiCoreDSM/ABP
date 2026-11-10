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

## 3. Gerenciamento de Tempo e Expiração (150 Segundos)
A interface de execução da prova (conforme arquivos de tela mapeados em `cronometro.html`) implementa um controle rígido de tempo por questão.

### 3.1 Regra de Contagem Regressiva
*   Assim que uma questão é renderizada na tela, um temporizador regressivo de **150 segundos** inicia automaticamente via código JavaScript local.
*   O tempo restante é exibido de forma visual e em tempo real para o candidato no componente do cronômetro.

### 3.2 Comportamento na Expiração do Tempo
*   Se o cronômetro atingir 0 segundos antes que o candidato clique em "Confirmar Resposta":
    1. O sistema dispara um gatilho automático de expiração.
    2. A questão atual é travada contra edições.
    3. O sistema registra a resposta do tema atual como "Não Marcada".
    4. A interface limpa o timer e avança o candidato automaticamente para a próxima questão do bloco.

## 4. Tratamento de Interrupções e Eventos de Conexão
Para mitigar falhas operacionais e comportamentos inesperados, o ciclo de vida da tentativa prevê estados consistentes frente a interrupções técnicas.

### 4.1 Pausa Defensiva e Fechamento do Navegador
*   O fechamento acidental da janela, comando de atualização da página (F5) ou fechamento do navegador congela o estado da tentativa atual na base de dados, prevenindo a perda total do teste.
*   **Efeito Contido:** Ao reautenticar-se, o sistema redireciona o candidato ao início exato da questão onde ocorreu a interrupção, mantendo o histórico das questões confirmadas anteriormente intacto.

### 4.2 Falha e Perda de Conexão (Offline)
*   Caso o sistema detecte perda de pacotes ou desconexão com a internet do candidato durante a contagem:
    1. Uma camada interceptadora suspende visualmente a prova, exibindo uma mensagem de alerta de rede.
    2. O cronômetro local é pausado temporariamente para não prejudicar o tempo do aluno injustamente até que a conexão seja restabelecida e validada pelo servidor.

## 5. Mapeamento de Estados e Incertezas Técnicas

### 5.1 Estado de Alternativas Marcadas vs Não Marcadas
*   O banco de dados armazena de forma explícita dois estados para fins de auditoria no final da prova:
    *   `Respondida`: Vincula o ID da alternativa escolhida pelo candidato.
    *   `Não Marcada`: Registra o estouro do cronômetro de 150 segundos sem nenhuma opção selecionada.

### 5.2 Identificação de Incertezas Técnicas para Validação
Identificou-se como ponto incerto a latência de rede no envio dos dados exatamente no milissegundo zero do cronômetro. Ficou definido para validação com o time que o timestamp do servidor terá prioridade sobre o relógio local do cliente web para evitar fraudes ou manipulação do código Javascript da página.

## 6. Critérios de Validação da Task
*   [X] Nenhum tema pode ser respondido duas vezes na mesma tentativa.
*   [X] O efeito de cada interrupção sobre a questão atual está definido.
*   [X] Fluxos alternativos convergem para um estado consistente da tentativa.
*   [X] Pontos tecnicamente incertos são identificados para validação.

