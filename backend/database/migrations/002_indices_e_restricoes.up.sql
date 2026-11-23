-- Migracao 002 (UP): Indices de desempenho/unicidade e restricoes de integridade (DB-11 / DB-09)

-- Indices: CPF (candidatos_cpf_key via UNIQUE), temas, tentativas, historico e identificador publico
CREATE INDEX IF NOT EXISTS idx_temas_ordem
    ON temas (ordem);

CREATE INDEX IF NOT EXISTS idx_questoes_tema_id
    ON questoes (tema_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tentativa_ativa_candidato
    ON tentativas (candidato_id)
    WHERE estado IN ('em_andamento', 'pausada');

CREATE INDEX IF NOT EXISTS idx_tentativas_candidato_iniciado
    ON tentativas (candidato_id, iniciado_em DESC);

CREATE INDEX IF NOT EXISTS idx_tentativa_questoes_tentativa_ordem
    ON tentativa_questoes (tentativa_id, ordem_tema);

CREATE INDEX IF NOT EXISTS idx_respostas_candidato_inicio
    ON respostas (candidato_id, data_horario_inicio DESC);

CREATE INDEX IF NOT EXISTS idx_respostas_questao_id
    ON respostas (questao_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_candidatos_certificado_hash_unico
    ON candidatos (certificado_hash)
    WHERE certificado_hash IS NOT NULL;

-- Restricoes adicionais de integridade (aplicadas de forma idempotente)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_temas_ordem_valida') THEN
        ALTER TABLE temas
            ADD CONSTRAINT chk_temas_ordem_valida CHECK (ordem BETWEEN 1 AND 12);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_respostas_datas_coerentes') THEN
        ALTER TABLE respostas
            ADD CONSTRAINT chk_respostas_datas_coerentes
            CHECK (data_horario_resposta IS NULL OR data_horario_resposta >= data_horario_inicio);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_candidatos_certificado_coerente') THEN
        ALTER TABLE candidatos
            ADD CONSTRAINT chk_candidatos_certificado_coerente
            CHECK (
                num_nonnulls(certificado_hash, certificado_emitido_em, certificado_acertos, certificado_total) IN (0, 4)
                AND (
                    certificado_hash IS NULL
                    OR (
                        certificado_hash ~ '^[0-9a-f]{64}$'
                        AND certificado_acertos >= 0
                        AND certificado_total > 0
                        AND certificado_acertos <= certificado_total
                    )
                )
            );
    END IF;

    -- DB-09: impede resultado final (nota/situacao) antes da conclusao
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_tentativas_resultado_so_concluida') THEN
        ALTER TABLE tentativas
            ADD CONSTRAINT chk_tentativas_resultado_so_concluida
            CHECK (estado = 'concluida' OR (nota IS NULL AND situacao IS NULL));
    END IF;

    -- DB-09: limiar de aprovacao >= 65%
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_tentativas_situacao_limiar') THEN
        ALTER TABLE tentativas
            ADD CONSTRAINT chk_tentativas_situacao_limiar
            CHECK (
                situacao IS NULL
                OR (situacao = 'aprovado' AND nota >= 65)
                OR (situacao = 'reprovado' AND nota < 65)
            );
    END IF;

    -- DB-09: consistencia matematica entre acertos e nota (2 casas decimais)
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_tentativas_formula_nota') THEN
        ALTER TABLE tentativas
            ADD CONSTRAINT chk_tentativas_formula_nota
            CHECK (
                acertos IS NULL
                OR nota IS NULL
                OR nota = ROUND((acertos::numeric / total_questoes) * 100, 2)
            );
    END IF;
END
$$;
