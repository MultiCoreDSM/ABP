BEGIN;

INSERT INTO temas (nome, ordem) VALUES 
    ('Fundamentos da Agilidade', 1), 
    ('Manifesto Ágil', 2), 
    ('Introdução ao Scrum', 3), 
    ('Papéis do Scrum', 4),
    ('Eventos do Scrum', 5), 
    ('Artefatos do Scrum', 6), 
    ('User Stories', 7), 
    ('Gestão do Product Backlog', 8), 
    ('Kanban', 9),
    ('Planejamento Ágil', 10), 
    ('Métricas Ágeis', 11), 
    ('Qualidade em Projetos Ágeis', 12),
    ON CONFLICT (nome) DO NOTHING;

INSERT INTO questoes (tema_id, ordem, enunciado, imagem_url) VALUES
 
-- ---------- TEMA 1: Papeis ----------
(1, 1, 'Quais são as três responsabilidades (papéis) definidas no Scrum?',
       '/imagens/scrum/papeis_1.png'),        -- Correta: Product Owner, Scrum Master e Developers
(1, 2, 'Quem é o responsável por maximizar o valor do produto e gerenciar o Product Backlog?',
       '/imagens/scrum/papeis_2.png'),        -- Correta: Product Owner
(1, 3, 'Qual é a principal responsabilidade do Scrum Master?',
       '/imagens/scrum/papeis_3.png'),        -- Correta: Estabelecer o Scrum conforme o Scrum Guide, ajudando todos a entender teoria e prática
(1, 4, 'Quem é responsável por criar qualquer aspecto de um Incremento utilizável a cada Sprint?',
       '/imagens/scrum/papeis_4.png'),        -- Correta: Developers
 
-- ---------- TEMA 2: Eventos ----------
(2, 1, 'Qual é a duração máxima de uma Sprint?',
       '/imagens/scrum/eventos_1.png'),       -- Correta: Um mês (quatro semanas)
(2, 2, 'Qual é o timebox máximo da Daily Scrum?',
       '/imagens/scrum/eventos_2.png'),       -- Correta: 15 minutos
(2, 3, 'Qual evento do Scrum tem como propósito inspecionar o resultado da Sprint e determinar adaptações futuras?',
       '/imagens/scrum/eventos_3.png'),       -- Correta: Sprint Review
(2, 4, 'Qual é o propósito da Sprint Retrospective?',
       '/imagens/scrum/eventos_4.png'),       -- Correta: Planejar maneiras de aumentar a qualidade e a eficácia do time
 
-- ---------- TEMA 3: Artefatos e Valores ----------
(3, 1, 'Quais são os três artefatos do Scrum?',
       '/imagens/scrum/artefatos_1.png'),     -- Correta: Product Backlog, Sprint Backlog e Incremento
(3, 2, 'A Definition of Done (DoD) é o compromisso (commitment) de qual artefato?',
       '/imagens/scrum/artefatos_2.png'),     -- Correta: Incremento
(3, 3, 'Qual é o compromisso (commitment) associado ao Product Backlog?',
       '/imagens/scrum/artefatos_3.png'),     -- Correta: Product Goal
(3, 4, 'Quais são os cinco valores do Scrum?',
       '/imagens/scrum/artefatos_4.png')      -- Correta: Comprometimento, Foco, Abertura, Respeito e Coragem
ON CONFLICT (tema_id, ordem) DO NOTHING;

INSERT INTO alternativas (questao_id, letra, texto, correta)
SELECT q.id, v.letra, v.texto, v.correta
FROM (VALUES
    -- ---------- TEMA 1: Papeis ----------
    -- T1 / Q1 (correta: A)
    (1, 1, 'A', 'Product Owner, Scrum Master e Developers', true),
    (1, 1, 'B', 'Gerente de Projetos, Scrum Master e Desenvolvedores', false),
    (1, 1, 'C', 'Product Owner, Tech Lead e Testers', false),
    (1, 1, 'D', 'Scrum Master, Analista de Negócios e Desenvolvedores', false),
 
    -- T1 / Q2 (correta: C)
    (1, 2, 'A', 'Scrum Master', false),
    (1, 2, 'B', 'Developers', false),
    (1, 2, 'C', 'Product Owner', true),
    (1, 2, 'D', 'Stakeholders', false),
 
    -- T1 / Q3 (correta: B)
    (1, 3, 'A', 'Atribuir tarefas aos Developers e cobrar prazos', false),
    (1, 3, 'B', 'Estabelecer o Scrum conforme o Scrum Guide, ajudando todos a entender sua teoria e prática', true),
    (1, 3, 'C', 'Priorizar os itens do Product Backlog', false),
    (1, 3, 'D', 'Aprovar o Incremento antes da entrega', false),
 
    -- T1 / Q4 (correta: D)
    (1, 4, 'A', 'Product Owner', false),
    (1, 4, 'B', 'Scrum Master', false),
    (1, 4, 'C', 'Stakeholders', false),
    (1, 4, 'D', 'Developers', true),
 
    -- ---------- TEMA 2: Eventos ----------
    -- T2 / Q1 (correta: B)
    (2, 1, 'A', 'Duas semanas', false),
    (2, 1, 'B', 'Um mês (quatro semanas)', true),
    (2, 1, 'C', 'Seis semanas', false),
    (2, 1, 'D', 'Não há limite definido', false),
 
    -- T2 / Q2 (correta: D)
    (2, 2, 'A', '30 minutos', false),
    (2, 2, 'B', '1 hora', false),
    (2, 2, 'C', '10 minutos', false),
    (2, 2, 'D', '15 minutos', true),
 
    -- T2 / Q3 (correta: A)
    (2, 3, 'A', 'Sprint Review', true),
    (2, 3, 'B', 'Sprint Retrospective', false),
    (2, 3, 'C', 'Daily Scrum', false),
    (2, 3, 'D', 'Sprint Planning', false),
 
    -- T2 / Q4 (correta: C)
    (2, 4, 'A', 'Apresentar o Incremento aos stakeholders', false),
    (2, 4, 'B', 'Definir o Sprint Goal da próxima Sprint', false),
    (2, 4, 'C', 'Planejar maneiras de aumentar a qualidade e a eficácia do time', true),
    (2, 4, 'D', 'Avaliar o desempenho individual dos Developers', false),
 
    -- ---------- TEMA 3: Artefatos e Valores ----------
    -- T3 / Q1 (correta: C)
    (3, 1, 'A', 'Product Backlog, Sprint Backlog e Burndown Chart', false),
    (3, 1, 'B', 'Product Backlog, Roadmap e Incremento', false),
    (3, 1, 'C', 'Product Backlog, Sprint Backlog e Incremento', true),
    (3, 1, 'D', 'User Stories, Sprint Backlog e Incremento', false),
 
    -- T3 / Q2 (correta: A)
    (3, 2, 'A', 'Incremento', true),
    (3, 2, 'B', 'Product Backlog', false),
    (3, 2, 'C', 'Sprint Backlog', false),
    (3, 2, 'D', 'Roadmap do produto', false),
 
    -- T3 / Q3 (correta: D)
    (3, 3, 'A', 'Sprint Goal', false),
    (3, 3, 'B', 'Definition of Done', false),
    (3, 3, 'C', 'Roadmap do produto', false),
    (3, 3, 'D', 'Product Goal', true),
 
    -- T3 / Q4 (correta: B)
    (3, 4, 'A', 'Qualidade, Velocidade, Colaboração, Respeito e Inovação', false),
    (3, 4, 'B', 'Comprometimento, Foco, Abertura, Respeito e Coragem', true),
    (3, 4, 'C', 'Transparência, Inspeção, Adaptação, Foco e Respeito', false),
    (3, 4, 'D', 'Comunicação, Simplicidade, Feedback, Coragem e Respeito', false)
) AS v(tema_id, ordem, letra, texto, correta)
JOIN questoes q
  ON q.tema_id = v.tema_id
 AND q.ordem   = v.ordem
ON CONFLICT (questao_id, letra) DO NOTHING;

COMMIT;
    