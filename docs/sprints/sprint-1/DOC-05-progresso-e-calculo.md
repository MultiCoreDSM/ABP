# DOC-05 — Progresso, Cálculo e Resultado da Certificação

## 1. Controle de Estados dos Temas na Avaliação
Este documento estabelece as regras matemáticas determinísticas e funcionais que gerenciam a apuração dos resultados em tempo real (vínculo direto com BL-15 a BL-18).

### 1.1 Ciclo de Estados de Progresso
Durante a realização da avaliação, cada um dos 12 temas do teste trafega obrigatoriamente entre dois estados rastreáveis na interface de usuário:
*   `Pendente`: Tema sorteado cujas respostas ainda não foram confirmadas ou cujo temporizador individual de 150 segundos ainda está correndo.
*   `Concluído`: Tema cuja resposta foi devidamente selada em banco (ou expirada por tempo), alterando o contador visual de progresso (ex: "Questão 4 de 12 concluídas").

## 2. Fórmula Determinística de Cálculo de Acertos
Para garantir a integridade dos dados e um resultado imutável para as 12 questões sorteadas, o motor de cálculo da plataforma computa os acertos através da seguinte equação percentual:

$$\text{Percentual de Acertos} = \left( \frac{\text{Total de Respostas Corretas}}{12} \right) \times 100$$

### 2.1 Regra de Escala e Arredondamento (Critério de Aceitação)
*   A nota final obedece a uma escala absoluta que varia de 0 a 100 pontos.
*   **Regra de Arredondamento Sem Ambiguidade:** O sistema adota arredondamento matemático padrão truncado em duas casas decimais. Valores fracionários limítrofes abaixo da meta (ex: 64,99%) **não serão arredondados para cima**, impedindo que um candidato reprovado ganhe o status de aprovação de forma indevida.

## 3. Aplicação do Limite de Aprovação (Corte de 65%)

### 3.1 Comportamento do Limite de Corte
*   O limite de corte para a obtenção do título de aprovação é fixado em exatamente **65% de aproveitamento** (o que equivale ao acerto mínimo de 8 das 12 questões configuradas no simulado).
*   **Aproveitamento Exato:** De acordo com os critérios de aceitação da issue #54, o rendimento final igual a exatamente **65% é tratado explicitamente como APROVADO**.

### 3.2 Saídas de Estados Finais
A apuração resulta em dois caminhos funcionais unívocos no sistema:
*   `Rendimento >= 65%` $\rightarrow$ Estado Final: **Aprovado**. Libera o gatilho automático para a rotina de emissão do certificado digital.
*   `Rendimento < 65%` $\rightarrow$ Estado Final: **Reprovado**. Bloqueia a emissão de documentos públicos e encerra a tentativa.

## 4. Unicidade de Fonte de Dados
Para eliminar por completo qualquer risco de inconsistência operacional entre o que o candidato visualiza em tempo real e o que é armazenado na base:
*   **Fonte de Dados Unificada:** A barra visual de progresso da prova, a listagem de acertos e o cálculo da nota final consultam exatamente a mesma tabela transacional de respostas no banco de dados. Isso impede descolamento de informações induzido por atrasos de sincronização de rede ou manipulação do estado no lado do cliente.

## 5. Critérios de Validação da Task
*   [X] A fórmula de cálculo de notas é totalmente determinística.
*   [X] O limite de aprovação de 65% é tratado como barreira estrita de aprovação.
*   [X] A barra visual de progresso e as notas usam a mesma fonte de dados.

