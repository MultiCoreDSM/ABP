-- DB-08 — Controle temporal, pausa e retomada
-- Compatibilidade: PostgreSQL 16; schema-base atual: backend/database/schemas.sql
-- Aplicar DEPOIS de schemas.sql e seed.sql.
--
-- Importante: esta migração é aditiva. Não cria uma segunda estrutura de tentativas
-- concorrente com DB-05/DB-07. Mantém respostas como registro principal até que
-- DB-05/DB-07 sejam integradas e aprovadas no schema físico.

BEGIN;

ALTER TABLE respostas
    ADD COLUMN IF NOT EXISTS data_horario_limite TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS motivo_encerramento VARCHAR(32);

-- Preenche o prazo de registros existentes sem alterar os horários históricos.
UPDATE respostas
SET data_horario_limite = data_horario_inicio + INTERVAL '150 seconds'
WHERE data_horario_limite IS NULL;

-- Migra respostas já encerradas para o vocabulário de motivos da certificação.
UPDATE respostas
SET motivo_encerramento = CASE
    WHEN letra_resposta IS NOT NULL AND valida IS TRUE
        THEN 'resposta_confirmada'
    WHEN valida IS FALSE
        THEN 'tempo_esgotado'
    ELSE motivo_encerramento
END
WHERE data_horario_resposta IS NOT NULL
  AND motivo_encerramento IS NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'respostas_motivo_encerramento_ck'
          AND conrelid = 'respostas'::regclass
    ) THEN
        ALTER TABLE respostas
            ADD CONSTRAINT respostas_motivo_encerramento_ck
            CHECK (
                motivo_encerramento IS NULL OR
                motivo_encerramento IN (
                    'resposta_confirmada',
                    'tempo_esgotado',
                    'pausa_solicitada',
                    'interrupcao_conexao'
                )
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'respostas_limite_posterior_inicio_ck'
          AND conrelid = 'respostas'::regclass
    ) THEN
        ALTER TABLE respostas
            ADD CONSTRAINT respostas_limite_posterior_inicio_ck
            CHECK (data_horario_limite > data_horario_inicio);
    END IF;
END $$;

ALTER TABLE respostas
    ALTER COLUMN data_horario_limite SET NOT NULL;

CREATE INDEX IF NOT EXISTS respostas_pendentes_por_candidato_idx
    ON respostas (candidato_id, data_horario_inicio DESC)
    WHERE data_horario_resposta IS NULL;

-- O banco fixa o deadline a partir do início original. Atualizações posteriores
-- não podem reiniciar nem estender os 150 segundos.
CREATE OR REPLACE FUNCTION db08_controlar_tempo_resposta()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.data_horario_inicio IS NULL THEN
            NEW.data_horario_inicio := clock_timestamp();
        END IF;
        NEW.data_horario_limite :=
            NEW.data_horario_inicio + INTERVAL '150 seconds';

        IF NEW.data_horario_resposta IS NOT NULL AND NEW.motivo_encerramento IS NULL THEN
            IF NEW.letra_resposta IS NOT NULL THEN
                NEW.motivo_encerramento := 'resposta_confirmada';
            ELSE
                NEW.motivo_encerramento := 'tempo_esgotado';
            END IF;
        END IF;

        RETURN NEW;
    END IF;

    IF NEW.data_horario_inicio IS DISTINCT FROM OLD.data_horario_inicio THEN
        RAISE EXCEPTION 'O início da questão é imutável';
    END IF;

    IF NEW.data_horario_limite IS DISTINCT FROM OLD.data_horario_limite THEN
        RAISE EXCEPTION 'O prazo oficial da questão é imutável';
    END IF;

    -- Uma questão já encerrada não pode receber outra resposta nem ser reaberta.
    IF OLD.data_horario_resposta IS NOT NULL THEN
        IF NEW.data_horario_resposta IS DISTINCT FROM OLD.data_horario_resposta
           OR NEW.letra_resposta IS DISTINCT FROM OLD.letra_resposta
           OR NEW.motivo_encerramento IS DISTINCT FROM OLD.motivo_encerramento THEN
            RAISE EXCEPTION 'Questão encerrada não pode ser alterada ou reaberta';
        END IF;
        RETURN NEW;
    END IF;

    -- O instante de encerramento é sempre definido pelo relógio do banco.
    IF OLD.data_horario_resposta IS NULL
       AND NEW.data_horario_resposta IS NOT NULL THEN
        NEW.data_horario_resposta := clock_timestamp();

        IF NEW.motivo_encerramento IS NULL THEN
            IF NEW.letra_resposta IS NOT NULL THEN
                NEW.motivo_encerramento := 'resposta_confirmada';
            ELSIF NEW.data_horario_resposta >= NEW.data_horario_limite THEN
                NEW.motivo_encerramento := 'tempo_esgotado';
            ELSE
                RAISE EXCEPTION
                    'Informe o motivo pausa_solicitada ou interrupcao_conexao para encerrar sem alternativa';
            END IF;
        END IF;
    END IF;

    IF NEW.data_horario_resposta IS NULL AND NEW.motivo_encerramento IS NOT NULL THEN
        RAISE EXCEPTION 'Motivo de encerramento exige data_horario_resposta';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS respostas_db08_controlar_tempo_trg ON respostas;
CREATE TRIGGER respostas_db08_controlar_tempo_trg
BEFORE INSERT OR UPDATE ON respostas
FOR EACH ROW
EXECUTE FUNCTION db08_controlar_tempo_resposta();

-- Histórico de pausa, retomada e interrupção, vinculado à resposta existente.
-- A chave candidata/questão mantém compatibilidade com o schema-base atual.
CREATE TABLE IF NOT EXISTS eventos_certificacao (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    candidato_id INT NOT NULL,
    questao_id INT NOT NULL,
    tipo_evento VARCHAR(32) NOT NULL
        CHECK (tipo_evento IN (
            'questao_aberta',
            'resposta_confirmada',
            'tempo_esgotado',
            'pausa_solicitada',
            'retomada',
            'interrupcao_conexao'
        )),
    ocorrido_em TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    origem VARCHAR(20) NOT NULL DEFAULT 'servidor'
        CHECK (origem IN ('servidor', 'cliente', 'rotina')),
    chave_idempotencia UUID,
    detalhes JSONB NOT NULL DEFAULT '{}'::jsonb,

    CONSTRAINT eventos_certificacao_resposta_fk
        FOREIGN KEY (candidato_id, questao_id)
        REFERENCES respostas (candidato_id, questao_id),

    CONSTRAINT eventos_certificacao_detalhes_objeto_ck
        CHECK (jsonb_typeof(detalhes) = 'object')
);

CREATE UNIQUE INDEX IF NOT EXISTS eventos_certificacao_idempotencia_uidx
    ON eventos_certificacao (candidato_id, chave_idempotencia)
    WHERE chave_idempotencia IS NOT NULL;

CREATE INDEX IF NOT EXISTS eventos_certificacao_resposta_data_idx
    ON eventos_certificacao (candidato_id, questao_id, ocorrido_em);

-- O horário do evento também é definido pelo servidor; eventos são append-only.
CREATE OR REPLACE FUNCTION db08_proteger_eventos_certificacao()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        NEW.ocorrido_em := clock_timestamp();
        RETURN NEW;
    END IF;
    RAISE EXCEPTION 'Eventos de certificação são imutáveis';
END;
$$;

DROP TRIGGER IF EXISTS eventos_certificacao_append_only_trg ON eventos_certificacao;
CREATE TRIGGER eventos_certificacao_append_only_trg
BEFORE INSERT OR UPDATE OR DELETE ON eventos_certificacao
FOR EACH ROW
EXECUTE FUNCTION db08_proteger_eventos_certificacao();

COMMIT;
