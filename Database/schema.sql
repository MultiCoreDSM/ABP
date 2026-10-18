-- 1) CRIAÇÃO DO BANCO (executar conectado ao "postgres")
--    Após criar, conecte-se ao banco "abp1" e
--    execute o restante do script (passo 2).

-- 2) CRIAÇÃO DAS TABELAS (executar conectado ao "abp1")

BEGIN;

CREATE TABLE IF NOT EXISTS candidatos ( 
    id SERIAL PRIMARY KEY, 
    cpf CHAR(11) NOT NULL UNIQUE CHECK (cpf ~ '^[0-9]{11}$'), 
    nome VARCHAR(100) NOT NULL, 
    email VARCHAR(100) NOT NULL, 
    senha_hash TEXT NOT NULL, 
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now(), 
    certificado_hash VARCHAR(96) 
); 

CREATE TABLE IF NOT EXISTS temas ( 
    id SERIAL PRIMARY KEY, 
    nome VARCHAR(100) NOT NULL UNIQUE, 
    ordem INT NOT NULL 
); 

CREATE TABLE IF NOT EXISTS questoes ( 
    id SERIAL PRIMARY KEY, 
    tema_id INT NOT NULL REFERENCES temas(id), 
    ordem INT NOT NULL CHECK (ordem BETWEEN 1 AND 4), 
    enunciado TEXT NOT NULL, 
    imagem_url VARCHAR(200) NOT NULL, 
    UNIQUE (tema_id, ordem) 
); 

CREATE TABLE IF NOT EXISTS alternativas ( 
    id SERIAL PRIMARY KEY, 
    questao_id INT NOT NULL REFERENCES questoes(id), 
    letra CHAR(1) NOT NULL CHECK (letra IN ('A','B','C','D')), 
    texto TEXT NOT NULL, 
    correta BOOLEAN NOT NULL DEFAULT false,
    UNIQUE (questao_id, letra) 
); 

CREATE TABLE IF NOT EXISTS respostas ( 
    candidato_id INT NOT NULL REFERENCES candidatos(id), 
    questao_id INT NOT NULL REFERENCES questoes(id), 
    letra_resposta CHAR(1) NULL CHECK (letra_resposta IN ('A','B','C','D')), 
    data_horario_inicio TIMESTAMPTZ NOT NULL DEFAULT now(), 
    data_horario_resposta TIMESTAMPTZ NULL, 
    valida BOOLEAN GENERATED ALWAYS AS ( 
        data_horario_resposta - data_horario_inicio <= INTERVAL '150 seconds' 
    ) VIRTUAL, 
    acertou BOOLEAN, 
    PRIMARY KEY(candidato_id, questao_id) 
); 

COMMIT; 