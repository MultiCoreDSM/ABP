-- Migracao 001 (UP): Estrutura completa de tabelas da plataforma ABP MultiCore (DB-11)
-- Idempotente: cria banco vazio do zero ou atualiza bancos criados por versoes anteriores do schemas.sql.

CREATE TABLE IF NOT EXISTS candidatos (
    id SERIAL PRIMARY KEY,
    cpf CHAR(11) NOT NULL UNIQUE CHECK (cpf ~ '^[0-9]{11}$'),
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    senha_hash TEXT NOT NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    certificado_hash VARCHAR(96)
);

ALTER TABLE candidatos ADD COLUMN IF NOT EXISTS certificado_emitido_em TIMESTAMPTZ;
ALTER TABLE candidatos ADD COLUMN IF NOT EXISTS certificado_acertos INT;
ALTER TABLE candidatos ADD COLUMN IF NOT EXISTS certificado_total INT;
ALTER TABLE candidatos ADD COLUMN IF NOT EXISTS termos_versao VARCHAR(20);
ALTER TABLE candidatos ADD COLUMN IF NOT EXISTS termos_aceitos_em TIMESTAMPTZ;

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
    letra CHAR(1) NOT NULL CHECK (letra IN ('A', 'B', 'C', 'D')),
    texto TEXT NOT NULL,
    correta BOOLEAN NOT NULL DEFAULT false,
    UNIQUE (questao_id, letra)
);

CREATE TABLE IF NOT EXISTS respostas (
    candidato_id INT NOT NULL REFERENCES candidatos(id),
    questao_id INT NOT NULL REFERENCES questoes(id),
    letra_resposta CHAR(1) NULL CHECK (letra_resposta IN ('A', 'B', 'C', 'D')),
    data_horario_inicio TIMESTAMPTZ NOT NULL DEFAULT now(),
    data_horario_resposta TIMESTAMPTZ NULL,
    valida BOOLEAN GENERATED ALWAYS AS (
        data_horario_resposta - data_horario_inicio <= INTERVAL '150 seconds'
    ) STORED,
    acertou BOOLEAN,
    PRIMARY KEY (candidato_id, questao_id)
);

CREATE TABLE IF NOT EXISTS tentativas (
    id SERIAL PRIMARY KEY,
    candidato_id INT NOT NULL REFERENCES candidatos(id) ON DELETE CASCADE,
    estado VARCHAR(20) NOT NULL DEFAULT 'em_andamento'
        CHECK (estado IN ('em_andamento', 'pausada', 'concluida', 'expirada', 'cancelada')),
    iniciado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    pausado_em TIMESTAMPTZ NULL,
    concluido_em TIMESTAMPTZ NULL,
    total_questoes INT NOT NULL DEFAULT 12 CHECK (total_questoes = 12),
    acertos INT NULL CHECK (acertos >= 0 AND acertos <= total_questoes),
    nota NUMERIC(5,2) NULL CHECK (nota >= 0 AND nota <= 100)
);

ALTER TABLE tentativas
    ADD COLUMN IF NOT EXISTS situacao VARCHAR(20) NULL
    CHECK (situacao IN ('aprovado', 'reprovado'));

CREATE TABLE IF NOT EXISTS tentativa_questoes (
    tentativa_id INT NOT NULL REFERENCES tentativas(id) ON DELETE CASCADE,
    questao_id INT NOT NULL REFERENCES questoes(id),
    ordem_tema INT NOT NULL CHECK (ordem_tema BETWEEN 1 AND 12),
    letra_resposta CHAR(1) NULL CHECK (letra_resposta IN ('A', 'B', 'C', 'D')),
    data_horario_inicio TIMESTAMPTZ NULL,
    data_horario_resposta TIMESTAMPTZ NULL,
    acertou BOOLEAN NULL,
    PRIMARY KEY (tentativa_id, questao_id),
    UNIQUE (tentativa_id, ordem_tema)
);
