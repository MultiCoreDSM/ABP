-- Schema do banco da plataforma ABP — grupo MultiCore
-- Versão suportada: PostgreSQL 16 (testado em banco vazio, 16.x)
-- Ordem de execução: 1) schemas.sql  2) seed.sql
-- Observação: a coluna gerada "valida" usa STORED. PostgreSQL 16 não aceita
-- colunas geradas VIRTUAL (só existem a partir da versão 18).

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
    ) STORED, 
    acertou BOOLEAN,
    PRIMARY KEY(candidato_id, questao_id)
);

-- Dados da emissão do certificado, gravados uma única vez (BL-19, BL-21, RN-09).
-- ADD COLUMN IF NOT EXISTS permite rodar este script de novo num banco já criado.
ALTER TABLE candidatos ADD COLUMN IF NOT EXISTS certificado_emitido_em TIMESTAMPTZ;
ALTER TABLE candidatos ADD COLUMN IF NOT EXISTS certificado_acertos INT;
ALTER TABLE candidatos ADD COLUMN IF NOT EXISTS certificado_total INT;

COMMIT; 
