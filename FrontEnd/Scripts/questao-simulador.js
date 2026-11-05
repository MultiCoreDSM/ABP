// SIMULADOR TEMPORÁRIO do servidor de certificação (API-08 e API-09).
// Apagar este arquivo, e o <script> dele em questao.html, quando a API existir.
// ATENÇÃO: contém o gabarito. Não pode ir para produção.
// Dados gerados a partir de Database/seed.sql.
// Para recomeçar a simulação, abra a página com ?reiniciar-simulacao na URL.
window.simuladorCertificacao = (() => {
    const CHAVE = "multicore:simulador-certificacao";
    const SEGUNDOS_POR_QUESTAO = 150;
    const ATRASO_MS = 350;

    const TEMAS = [
        {"id": 1, "nome": "Fundamentos da Agilidade", "ordem": 1},
        {"id": 2, "nome": "Manifesto Ágil", "ordem": 2},
        {"id": 3, "nome": "Introdução ao Scrum", "ordem": 3},
        {"id": 4, "nome": "Papéis do Scrum", "ordem": 4},
        {"id": 5, "nome": "Eventos do Scrum", "ordem": 5},
        {"id": 6, "nome": "Artefatos do Scrum", "ordem": 6},
        {"id": 7, "nome": "User Stories", "ordem": 7},
        {"id": 8, "nome": "Gestão do Product Backlog", "ordem": 8},
        {"id": 9, "nome": "Kanban", "ordem": 9},
        {"id": 10, "nome": "Planejamento Ágil", "ordem": 10},
        {"id": 11, "nome": "Métricas Ágeis", "ordem": 11},
        {"id": 12, "nome": "Qualidade em Projetos Ágeis", "ordem": 12}
    ];

    const QUESTOES = [
        {"id": 1, "tema_id": 1, "enunciado": "Qual prática permitiu à equipe incorporar a necessidade identificada na imagem?", "alternativas": [{"letra": "A", "texto": "Congelar os requisitos até concluir todo o portal.", "correta": false}, {"letra": "B", "texto": "Revisar as prioridades a partir do feedback e ajustar as próximas entregas.", "correta": true}, {"letra": "C", "texto": "Eliminar o planejamento para aceitar qualquer solicitação imediatamente.", "correta": false}, {"letra": "D", "texto": "Adiar o contato com candidatos até a entrega final.", "correta": false}]},
        {"id": 2, "tema_id": 1, "enunciado": "Como se caracteriza a evolução do produto apresentada na imagem?", "alternativas": [{"letra": "A", "texto": "Desenvolvimento sequencial, com uso permitido somente ao final.", "correta": false}, {"letra": "B", "texto": "Produção de protótipos descartáveis sem funcionalidades utilizáveis.", "correta": false}, {"letra": "C", "texto": "Repetição da mesma entrega sem ampliação do produto.", "correta": false}, {"letra": "D", "texto": "Desenvolvimento incremental, com ampliação das funcionalidades utilizáveis.", "correta": true}]},
        {"id": 3, "tema_id": 1, "enunciado": "Qual fundamento da agilidade é evidenciado pela sequência da imagem?", "alternativas": [{"letra": "A", "texto": "Aprender com evidências e ajustar a solução em ciclos.", "correta": true}, {"letra": "B", "texto": "Manter a decisão inicial para evitar retrabalho.", "correta": false}, {"letra": "C", "texto": "Tratar uma hipótese da equipe como requisito validado.", "correta": false}, {"letra": "D", "texto": "Medir o progresso apenas pela quantidade de telas desenhadas.", "correta": false}]},
        {"id": 4, "tema_id": 1, "enunciado": "Qual prática de melhoria está representada na imagem?", "alternativas": [{"letra": "A", "texto": "Substituir a análise de problemas por cobrança individual.", "correta": false}, {"letra": "B", "texto": "Repetir o processo anterior sem avaliar seus efeitos.", "correta": false}, {"letra": "C", "texto": "Refletir sobre o trabalho e experimentar ajustes no processo.", "correta": true}, {"letra": "D", "texto": "Suspender as entregas até estabelecer um processo definitivo.", "correta": false}]},
        {"id": 5, "tema_id": 2, "enunciado": "Qual valor do Manifesto Ágil é mais diretamente exemplificado pela resolução do bloqueio?", "alternativas": [{"letra": "A", "texto": "Software em funcionamento mais que documentação abrangente.", "correta": false}, {"letra": "B", "texto": "Indivíduos e interações mais que processos e ferramentas.", "correta": true}, {"letra": "C", "texto": "Responder a mudanças mais que seguir um plano.", "correta": false}, {"letra": "D", "texto": "Colaboração com o cliente mais que negociação de contratos.", "correta": false}]},
        {"id": 6, "tema_id": 2, "enunciado": "Considerando as evidências de progresso, qual valor do Manifesto Ágil é mais diretamente demonstrado por Horizonte?", "alternativas": [{"letra": "A", "texto": "Software em funcionamento mais que documentação abrangente.", "correta": true}, {"letra": "B", "texto": "Responder a mudanças mais que seguir um plano.", "correta": false}, {"letra": "C", "texto": "Colaboração com o cliente mais que negociação de contratos.", "correta": false}, {"letra": "D", "texto": "Indivíduos e interações mais que processos e ferramentas.", "correta": false}]},
        {"id": 7, "tema_id": 2, "enunciado": "Qual valor do Manifesto Ágil é mais diretamente evidenciado pela participação do parceiro?", "alternativas": [{"letra": "A", "texto": "Indivíduos e interações mais que processos e ferramentas.", "correta": false}, {"letra": "B", "texto": "Software em funcionamento mais que documentação abrangente.", "correta": false}, {"letra": "C", "texto": "Responder a mudanças mais que seguir um plano.", "correta": false}, {"letra": "D", "texto": "Colaboração com o cliente mais que negociação de contratos.", "correta": true}]},
        {"id": 8, "tema_id": 2, "enunciado": "Qual valor do Manifesto Ágil orienta mais diretamente a decisão apresentada?", "alternativas": [{"letra": "A", "texto": "Colaboração com o cliente mais que negociação de contratos.", "correta": false}, {"letra": "B", "texto": "Software em funcionamento mais que documentação abrangente.", "correta": false}, {"letra": "C", "texto": "Responder a mudanças mais que seguir um plano.", "correta": true}, {"letra": "D", "texto": "Indivíduos e interações mais que processos e ferramentas.", "correta": false}]},
        {"id": 9, "tema_id": 3, "enunciado": "A quais pilares do Scrum correspondem, respectivamente, os momentos 1, 2 e 3?", "alternativas": [{"letra": "A", "texto": "Transparência, inspeção e adaptação.", "correta": true}, {"letra": "B", "texto": "Inspeção, adaptação e transparência.", "correta": false}, {"letra": "C", "texto": "Adaptação, transparência e inspeção.", "correta": false}, {"letra": "D", "texto": "Transparência, adaptação e inspeção.", "correta": false}]},
        {"id": 10, "tema_id": 3, "enunciado": "Quais características do Scrum Team são demonstradas na imagem?", "alternativas": [{"letra": "A", "texto": "Hierarquia interna e especialização em departamentos separados.", "correta": false}, {"letra": "B", "texto": "Dependência de um gerente para distribuir todas as atividades.", "correta": false}, {"letra": "C", "texto": "Multifuncionalidade e autogerenciamento.", "correta": true}, {"letra": "D", "texto": "Ausência de responsabilidades e de objetivo compartilhado.", "correta": false}]},
        {"id": 11, "tema_id": 3, "enunciado": "Qual afirmação sobre a Sprint é compatível com o cenário e com o Scrum?", "alternativas": [{"letra": "A", "texto": "A Sprint é apenas a etapa de programação, seguida por uma etapa externa de testes.", "correta": false}, {"letra": "B", "texto": "A Sprint contém o trabalho e os eventos necessários para avançar em direção à Meta do Produto.", "correta": true}, {"letra": "C", "texto": "A Sprint só termina quando todos os itens do Product Backlog estiverem prontos.", "correta": false}, {"letra": "D", "texto": "O planejamento e a reflexão acontecem obrigatoriamente fora da Sprint.", "correta": false}]},
        {"id": 12, "tema_id": 3, "enunciado": "Qual conclusão é correta sobre os itens X e Y?", "alternativas": [{"letra": "A", "texto": "Ambos compõem o Incremento porque possuem uma tela visível.", "correta": false}, {"letra": "B", "texto": "X compõe o Incremento, pois os testes podem ser adiados sem afetar a conclusão.", "correta": false}, {"letra": "C", "texto": "Nenhum pode compor um Incremento antes de terminar todo o portal.", "correta": false}, {"letra": "D", "texto": "Y pode compor o Incremento; X ainda não atende à Definition of Done.", "correta": true}]},
        {"id": 13, "tema_id": 4, "enunciado": "Qual responsabilidade do Scrum é exercida por Marina no cenário?", "alternativas": [{"letra": "A", "texto": "Product Owner.", "correta": true}, {"letra": "B", "texto": "Scrum Master.", "correta": false}, {"letra": "C", "texto": "Developers.", "correta": false}, {"letra": "D", "texto": "Comitê de aprovação da Sprint.", "correta": false}]},
        {"id": 14, "tema_id": 4, "enunciado": "Qual responsabilidade do Scrum melhor corresponde à atuação de Rafael?", "alternativas": [{"letra": "A", "texto": "Product Owner, por distribuir as tarefas técnicas.", "correta": false}, {"letra": "B", "texto": "Developers, por aceitar o produto em nome do parceiro.", "correta": false}, {"letra": "C", "texto": "Scrum Master, por apoiar a efetividade da equipe e a remoção de impedimentos.", "correta": true}, {"letra": "D", "texto": "Gerente de projetos, uma responsabilidade formal do Scrum.", "correta": false}]},
        {"id": 15, "tema_id": 4, "enunciado": "Quem responde pela organização e adaptação desse plano técnico no Scrum?", "alternativas": [{"letra": "A", "texto": "O parceiro, ao atribuir tarefas diárias.", "correta": false}, {"letra": "B", "texto": "Os Developers, que planejam e adaptam o trabalho da Sprint.", "correta": true}, {"letra": "C", "texto": "O Scrum Master, que deve escolher a implementação.", "correta": false}, {"letra": "D", "texto": "O Product Owner, que deve definir quem escreve cada trecho de código.", "correta": false}]},
        {"id": 16, "tema_id": 4, "enunciado": "Quem permanece responsável pela ordenação do Product Backlog, mesmo ouvindo os demais?", "alternativas": [{"letra": "A", "texto": "O parceiro, porque toda solicitação deve ocupar o primeiro lugar.", "correta": false}, {"letra": "B", "texto": "Bruno, porque o Scrum Master gerencia as prioridades do produto.", "correta": false}, {"letra": "C", "texto": "Os Developers, exclusivamente por conhecerem o esforço técnico.", "correta": false}, {"letra": "D", "texto": "Lia, que pode colaborar com todos e responde pelas decisões de ordenação.", "correta": true}]},
        {"id": 17, "tema_id": 5, "enunciado": "Qual evento do Scrum está representado?", "alternativas": [{"letra": "A", "texto": "Daily Scrum.", "correta": false}, {"letra": "B", "texto": "Sprint Review.", "correta": false}, {"letra": "C", "texto": "Sprint Retrospective.", "correta": false}, {"letra": "D", "texto": "Sprint Planning.", "correta": true}]},
        {"id": 18, "tema_id": 5, "enunciado": "Qual é a finalidade do evento apresentado?", "alternativas": [{"letra": "A", "texto": "Inspecionar o progresso e adaptar o Sprint Backlog na Daily Scrum.", "correta": true}, {"letra": "B", "texto": "Prestar contas individuais ao Scrum Master para receber novas tarefas.", "correta": false}, {"letra": "C", "texto": "Obter a aprovação final do parceiro para liberar o produto.", "correta": false}, {"letra": "D", "texto": "Estimar todos os itens do Product Backlog.", "correta": false}]},
        {"id": 19, "tema_id": 5, "enunciado": "Qual evento corresponde à situação, considerando seu foco no produto e nos interessados?", "alternativas": [{"letra": "A", "texto": "Sprint Retrospective.", "correta": false}, {"letra": "B", "texto": "Daily Scrum.", "correta": false}, {"letra": "C", "texto": "Sprint Review.", "correta": true}, {"letra": "D", "texto": "Sprint Planning.", "correta": false}]},
        {"id": 20, "tema_id": 5, "enunciado": "Em qual evento essa análise do processo e a definição de melhorias se encaixam?", "alternativas": [{"letra": "A", "texto": "Sprint Review, cujo foco exclusivo é distribuir tarefas.", "correta": false}, {"letra": "B", "texto": "Sprint Retrospective, voltada a aumentar qualidade e efetividade.", "correta": true}, {"letra": "C", "texto": "Daily Scrum, destinada a avaliar todo o processo da Sprint encerrada.", "correta": false}, {"letra": "D", "texto": "Sprint Planning, destinado a aprovar contratos com o parceiro.", "correta": false}]},
        {"id": 21, "tema_id": 6, "enunciado": "Qual associação identifica corretamente A, B e C?", "alternativas": [{"letra": "A", "texto": "Sprint Backlog; Product Backlog; Incremento.", "correta": false}, {"letra": "B", "texto": "Product Backlog; Sprint Backlog; Incremento.", "correta": true}, {"letra": "C", "texto": "Product Backlog; Incremento; Sprint Backlog.", "correta": false}, {"letra": "D", "texto": "Incremento; Sprint Backlog; Product Backlog.", "correta": false}]},
        {"id": 22, "tema_id": 6, "enunciado": "Qual artefato foi diretamente atualizado pelos Developers na imagem?", "alternativas": [{"letra": "A", "texto": "A Meta do Produto, necessariamente substituída a cada falha.", "correta": false}, {"letra": "B", "texto": "O Incremento, que inclui qualquer atividade ainda não terminada.", "correta": false}, {"letra": "C", "texto": "A Definition of Done, reduzida para aceitar a falha.", "correta": false}, {"letra": "D", "texto": "O Sprint Backlog, que é atualizado à medida que se aprende sobre o trabalho.", "correta": true}]},
        {"id": 23, "tema_id": 6, "enunciado": "Quais compromissos associados aos artefatos correspondem, nessa ordem, aos três registros?", "alternativas": [{"letra": "A", "texto": "Meta do Produto; Meta da Sprint; Definition of Done.", "correta": true}, {"letra": "B", "texto": "Meta da Sprint; Definition of Done; Meta do Produto.", "correta": false}, {"letra": "C", "texto": "Definition of Done; Meta do Produto; Meta da Sprint.", "correta": false}, {"letra": "D", "texto": "Meta do Produto; Definition of Done; Meta da Sprint.", "correta": false}]},
        {"id": 24, "tema_id": 6, "enunciado": "Qual resultado pode integrar um Incremento, segundo as informações da imagem?", "alternativas": [{"letra": "A", "texto": "P, porque a aparência final dispensa integração.", "correta": false}, {"letra": "B", "texto": "Ambos, pois todo código escrito constitui um Incremento.", "correta": false}, {"letra": "C", "texto": "Q, pois está utilizável e atende à Definition of Done.", "correta": true}, {"letra": "D", "texto": "Nenhum, porque o portal inteiro deve ser concluído antes do primeiro Incremento.", "correta": false}]},
        {"id": 25, "tema_id": 7, "enunciado": "Qual user story melhor expressa a necessidade completa apresentada?", "alternativas": [{"letra": "A", "texto": "Como programador, quero criar uma tabela temas para organizar o código.", "correta": false}, {"letra": "B", "texto": "Como candidato, quero uma tela bonita para usar um portal moderno.", "correta": false}, {"letra": "C", "texto": "Como candidato, quero finalizar uma avaliação para receber um certificado.", "correta": false}, {"letra": "D", "texto": "Como candidato, quero filtrar o material por tema para estudar os assuntos em que tenho dificuldade.", "correta": true}]},
        {"id": 26, "tema_id": 7, "enunciado": "Qual critério de aceitação é verificável e corresponde à história?", "alternativas": [{"letra": "A", "texto": "O histórico deve ser agradável e bastante completo.", "correta": false}, {"letra": "B", "texto": "Ao acessar o histórico desse candidato, exibir suas duas avaliações com notas 50% e 75%.", "correta": true}, {"letra": "C", "texto": "A implementação deve usar a ferramenta favorita do desenvolvedor.", "correta": false}, {"letra": "D", "texto": "O portal deve receber uma avaliação positiva da maioria das pessoas.", "correta": false}]},
        {"id": 27, "tema_id": 7, "enunciado": "Qual divisão melhor preserva valor em cada história?", "alternativas": [{"letra": "A", "texto": "Uma história para responder a avaliação, outra para consultar histórico e outra para validar certificado, respeitando dependências.", "correta": true}, {"letra": "B", "texto": "Uma história apenas para tabelas, outra apenas para CSS e outra apenas para funções internas.", "correta": false}, {"letra": "C", "texto": "Uma história para o primeiro arquivo e outra para o segundo arquivo do projeto.", "correta": false}, {"letra": "D", "texto": "Manter o item inteiro e considerar concluída qualquer parte implementada.", "correta": false}]},
        {"id": 28, "tema_id": 7, "enunciado": "Qual interpretação corresponde aos três Cs das user stories nesse cenário?", "alternativas": [{"letra": "A", "texto": "O cartão substitui conversas e testes por um contrato completo.", "correta": false}, {"letra": "B", "texto": "A conversa permite abandonar a confirmação do comportamento.", "correta": false}, {"letra": "C", "texto": "Cartão, conversa e confirmação combinam um lembrete, esclarecimento e verificação do resultado.", "correta": true}, {"letra": "D", "texto": "A confirmação é apenas uma assinatura, independentemente do comportamento do sistema.", "correta": false}]},
        {"id": 29, "tema_id": 8, "enunciado": "Qual decisão de ordenação é mais adequada ao contexto apresentado?", "alternativas": [{"letra": "A", "texto": "Priorizar B, pois itens visuais devem sempre vir primeiro.", "correta": false}, {"letra": "B", "texto": "Manter a ordem de chegada, sem examinar os impactos.", "correta": false}, {"letra": "C", "texto": "Priorizar A, considerando o risco e o valor de corrigir a emissão incorreta.", "correta": true}, {"letra": "D", "texto": "Remover A porque correções não podem constar do Product Backlog.", "correta": false}]},
        {"id": 30, "tema_id": 8, "enunciado": "Qual atividade de gestão do Product Backlog está ilustrada?", "alternativas": [{"letra": "A", "texto": "Refinamento: detalhar, dividir e melhorar a compreensão dos itens.", "correta": true}, {"letra": "B", "texto": "Sprint Review: aprovar contratos e congelar requisitos.", "correta": false}, {"letra": "C", "texto": "Daily Scrum: estimar obrigatoriamente todo o trabalho do produto.", "correta": false}, {"letra": "D", "texto": "Encerramento do backlog: impedir novas alterações.", "correta": false}]},
        {"id": 31, "tema_id": 8, "enunciado": "Qual encaminhamento é compatível com o cenário?", "alternativas": [{"letra": "A", "texto": "Inserir a comparação imediatamente, ainda que a meta deixe de ser viável.", "correta": false}, {"letra": "B", "texto": "Cancelar automaticamente a Sprint sempre que surgir uma solicitação.", "correta": false}, {"letra": "C", "texto": "Excluir definitivamente o pedido por ter surgido durante uma Sprint.", "correta": false}, {"letra": "D", "texto": "Registrar e ordenar a necessidade no Product Backlog para trabalho futuro, preservando a meta atual.", "correta": true}]},
        {"id": 32, "tema_id": 8, "enunciado": "Qual característica do Product Backlog é evidenciada?", "alternativas": [{"letra": "A", "texto": "É um contrato imutável, definido antes da primeira Sprint.", "correta": false}, {"letra": "B", "texto": "É uma lista emergente e ordenada que evolui com o aprendizado sobre o produto.", "correta": true}, {"letra": "C", "texto": "É exclusivamente a lista de tarefas diárias de um desenvolvedor.", "correta": false}, {"letra": "D", "texto": "É formado somente por funcionalidades concluídas.", "correta": false}]},
        {"id": 33, "tema_id": 9, "enunciado": "Qual ação respeita a política de WIP da imagem?", "alternativas": [{"letra": "A", "texto": "Iniciar os três itens que aguardam, para maximizar a ocupação.", "correta": false}, {"letra": "B", "texto": "Ocultar um item iniciado para liberar espaço visual no quadro.", "correta": false}, {"letra": "C", "texto": "Elevar automaticamente o limite sempre que houver trabalho esperando.", "correta": false}, {"letra": "D", "texto": "Ajudar a concluir um item em andamento antes de puxar outro para a coluna.", "correta": true}]},
        {"id": 34, "tema_id": 9, "enunciado": "Qual ação tende a melhorar o fluxo no cenário?", "alternativas": [{"letra": "A", "texto": "Aumentar somente a quantidade de itens iniciados no desenvolvimento.", "correta": false}, {"letra": "B", "texto": "Investigar a fila de testes e colaborar para terminar itens antes de iniciar mais trabalho.", "correta": true}, {"letra": "C", "texto": "Mover os cinco itens para concluído sem verificar seu comportamento.", "correta": false}, {"letra": "D", "texto": "Remover a etapa de testes do quadro para eliminar a fila visível.", "correta": false}]},
        {"id": 35, "tema_id": 9, "enunciado": "Que prática do Kanban é representada pelo movimento?", "alternativas": [{"letra": "A", "texto": "Sistema puxado, com início condicionado à capacidade disponível.", "correta": true}, {"letra": "B", "texto": "Sistema empurrado, com entrada obrigatória independentemente da capacidade.", "correta": false}, {"letra": "C", "texto": "Alocação de tarefas por ordem de um gerente em todas as etapas.", "correta": false}, {"letra": "D", "texto": "Eliminação dos critérios de passagem entre etapas.", "correta": false}]},
        {"id": 36, "tema_id": 9, "enunciado": "Qual tratamento do item é coerente com a política apresentada?", "alternativas": [{"letra": "A", "texto": "Removê-lo do quadro para que ninguém considere a espera.", "correta": false}, {"letra": "B", "texto": "Marcá-lo como concluído, pois o impedimento é externo.", "correta": false}, {"letra": "C", "texto": "Sinalizar o bloqueio, mantê-lo visível no WIP e agir para resolver a dependência.", "correta": true}, {"letra": "D", "texto": "Devolver o item a uma lista oculta e descontá-lo do WIP.", "correta": false}]},
        {"id": 37, "tema_id": 10, "enunciado": "Como a equipe deve usar as informações para planejar a próxima Sprint?", "alternativas": [{"letra": "A", "texto": "Assumir que concluirá 30 pontos porque todos os itens já foram estimados.", "correta": false}, {"letra": "B", "texto": "Exigir pelo menos 22 pontos, pois toda Sprint deve superar a anterior.", "correta": false}, {"letra": "C", "texto": "Considerar desempenho passado, capacidade disponível e riscos para fazer uma previsão realista.", "correta": true}, {"letra": "D", "texto": "Ignorar as ausências porque story points tornam a capacidade constante.", "correta": false}]},
        {"id": 38, "tema_id": 10, "enunciado": "Qual escolha melhor orienta uma primeira entrega para validar o fluxo central com candidatos?", "alternativas": [{"letra": "A", "texto": "Escolher A e testar a capacidade funcional central antes de ampliar o produto.", "correta": true}, {"letra": "B", "texto": "Escolher B, pois aparência sempre valida a necessidade principal.", "correta": false}, {"letra": "C", "texto": "Implementar todas as funcionalidades futuras antes de permitir qualquer teste de uso.", "correta": false}, {"letra": "D", "texto": "Criar somente tabelas e considerar validada toda a experiência do candidato.", "correta": false}]},
        {"id": 39, "tema_id": 10, "enunciado": "Qual é o próximo passo mais adequado?", "alternativas": [{"letra": "A", "texto": "Converter 3 pontos em 3 horas e 8 pontos em 8 horas por uma regra universal.", "correta": false}, {"letra": "B", "texto": "Usar automaticamente o menor valor para reduzir o prazo.", "correta": false}, {"letra": "C", "texto": "Calcular a média e encerrar a discussão, mesmo mantendo hipóteses diferentes.", "correta": false}, {"letra": "D", "texto": "Discutir as hipóteses, considerar o trabalho completo e revisar a estimativa.", "correta": true}]},
        {"id": 40, "tema_id": 10, "enunciado": "Qual previsão inicial é coerente com esses dados?", "alternativas": [{"letra": "A", "texto": "Uma Sprint, pois todo o Product Backlog deve caber na próxima Sprint.", "correta": false}, {"letra": "B", "texto": "Cerca de três Sprints, como previsão a revisar quando as hipóteses mudarem.", "correta": true}, {"letra": "C", "texto": "Exatamente três Sprints garantidas, independentemente de novas descobertas.", "correta": false}, {"letra": "D", "texto": "Sessenta Sprints, pois um ponto representa obrigatoriamente uma Sprint.", "correta": false}]},
        {"id": 41, "tema_id": 11, "enunciado": "Qual foi a velocidade da equipe nessa Sprint, segundo a regra apresentada?", "alternativas": [{"letra": "A", "texto": "18 pontos.", "correta": false}, {"letra": "B", "texto": "10 pontos.", "correta": true}, {"letra": "C", "texto": "14 pontos.", "correta": false}, {"letra": "D", "texto": "8 pontos.", "correta": false}]},
        {"id": 42, "tema_id": 11, "enunciado": "Qual interpretação é sustentada pelo gráfico descrito na imagem?", "alternativas": [{"letra": "A", "texto": "A equipe deixou de trabalhar durante três dias.", "correta": false}, {"letra": "B", "texto": "A Sprint será concluída no prazo com certeza.", "correta": false}, {"letra": "C", "texto": "A qualidade caiu exatamente na mesma proporção que os pontos.", "correta": false}, {"letra": "D", "texto": "Não houve redução registrada do trabalho restante nos dias 3 a 5; é necessário investigar a causa.", "correta": true}]},
        {"id": 43, "tema_id": 11, "enunciado": "Qual é o tempo de ciclo, medido do início do trabalho à conclusão?", "alternativas": [{"letra": "A", "texto": "5 dias.", "correta": true}, {"letra": "B", "texto": "7 dias.", "correta": false}, {"letra": "C", "texto": "2 dias.", "correta": false}, {"letra": "D", "texto": "8 dias.", "correta": false}]},
        {"id": 44, "tema_id": 11, "enunciado": "Qual é o throughput da semana, medido em itens concluídos por semana?", "alternativas": [{"letra": "A", "texto": "12 itens por semana.", "correta": false}, {"letra": "B", "texto": "9 itens por semana.", "correta": false}, {"letra": "C", "texto": "7 itens por semana.", "correta": true}, {"letra": "D", "texto": "19 itens por semana.", "correta": false}]},
        {"id": 45, "tema_id": 12, "enunciado": "Quais resultados a função deve produzir, nessa ordem?", "alternativas": [{"letra": "A", "texto": "Aprovado; aprovado; aprovado.", "correta": false}, {"letra": "B", "texto": "Reprovado; reprovado; aprovado.", "correta": false}, {"letra": "C", "texto": "Reprovado; aprovado; reprovado.", "correta": false}, {"letra": "D", "texto": "Reprovado; aprovado; aprovado.", "correta": true}]},
        {"id": 46, "tema_id": 12, "enunciado": "Qual decisão preserva a qualidade e a transparência?", "alternativas": [{"letra": "A", "texto": "Marcar o item como concluído e remover o teste que falhou.", "correta": false}, {"letra": "B", "texto": "Manter o item como não concluído e corrigir a falha antes de atender à Definition of Done.", "correta": true}, {"letra": "C", "texto": "Reduzir retroativamente os critérios para registrar a entrega como pronta.", "correta": false}, {"letra": "D", "texto": "Contar como concluído porque a tela possui boa aparência.", "correta": false}]},
        {"id": 47, "tema_id": 12, "enunciado": "Qual é a finalidade principal da verificação descrita?", "alternativas": [{"letra": "A", "texto": "Testar regressão: verificar se a mudança prejudicou comportamentos que já funcionavam.", "correta": true}, {"letra": "B", "texto": "Testar somente a aparência visual da nova tela.", "correta": false}, {"letra": "C", "texto": "Medir a produtividade individual de quem alterou o código.", "correta": false}, {"letra": "D", "texto": "Substituir definitivamente todos os testes por uma demonstração.", "correta": false}]},
        {"id": 48, "tema_id": 12, "enunciado": "Qual conclusão distingue corretamente critério de aceitação e Definition of Done?", "alternativas": [{"letra": "A", "texto": "O critério de aceitação substitui todos os requisitos de qualidade comuns.", "correta": false}, {"letra": "B", "texto": "A Definition of Done especifica somente a duração do cronômetro desta história.", "correta": false}, {"letra": "C", "texto": "O comportamento específico foi implementado, mas o item ainda não atende às exigências comuns para ser concluído.", "correta": true}, {"letra": "D", "texto": "O item já está concluído porque demonstrar um comportamento dispensa integração.", "correta": false}]}
    ];

    function ler() {
        try {
            return JSON.parse(localStorage.getItem(CHAVE)) || { sorteio: {}, prazos: {}, respostas: {} };
        } catch {
            return { sorteio: {}, prazos: {}, respostas: {} };
        }
    }

    function gravar(dados) {
        try {
            localStorage.setItem(CHAVE, JSON.stringify(dados));
        } catch (erro) {
            console.warn("Simulador sem armazenamento:", erro);
        }
    }

    if (new URLSearchParams(location.search).has("reiniciar-simulacao")) {
        try {
            localStorage.removeItem(CHAVE);
        } catch (erro) {
            console.warn("Simulador sem armazenamento:", erro);
        }
    }

    const dados = ler();
    const esperar = () => new Promise((resolver) => setTimeout(resolver, ATRASO_MS));

    function registrar(questao, letra, tempoEsgotado) {
        // A resposta é única: uma nova tentativa recebe o registro já existente
        if (!dados.respostas[questao.id]) {
            const correta = questao.alternativas.find((alternativa) => alternativa.correta).letra;
            dados.respostas[questao.id] = {
                letra_resposta: letra,
                letra_correta: correta,
                acertou: !tempoEsgotado && letra === correta,
                tempo_esgotado: tempoEsgotado,
            };
            gravar(dados);
        }
        return dados.respostas[questao.id];
    }

    function questaoDoTema(temaId) {
        if (!dados.sorteio[temaId]) {
            const opcoes = QUESTOES.filter((questao) => questao.tema_id === temaId);
            dados.sorteio[temaId] = opcoes[Math.floor(Math.random() * opcoes.length)].id;
            dados.prazos[dados.sorteio[temaId]] = Date.now() + SEGUNDOS_POR_QUESTAO * 1000;
            gravar(dados);
        }
        return QUESTOES.find((questao) => questao.id === dados.sorteio[temaId]);
    }

    const tempoAcabou = (questao) => Date.now() >= dados.prazos[questao.id];

    return {
        async listarTemas() {
            await esperar();
            return TEMAS.map((tema) => ({
                ...tema,
                respondido: Boolean(dados.respostas[dados.sorteio[tema.id]]),
            }));
        },

        async abrirQuestao(temaId) {
            await esperar();
            const questao = questaoDoTema(temaId);
            const correcao =
                dados.respostas[questao.id] || (tempoAcabou(questao) ? registrar(questao, null, true) : null);

            return {
                id: questao.id,
                enunciado: questao.enunciado,
                imagem_url: `../../assets/imagens/tema_${questao.tema_id}/questão_${questao.id}.png`,
                alternativas: questao.alternativas.map(({ letra, texto }) => ({ letra, texto })),
                segundos_restantes: Math.max(0, Math.ceil((dados.prazos[questao.id] - Date.now()) / 1000)),
                correcao,
            };
        },

        async responder(questaoId, letra) {
            await esperar();
            const questao = QUESTOES.find((item) => item.id === questaoId);
            return registrar(questao, letra, tempoAcabou(questao));
        },
    };
})();
