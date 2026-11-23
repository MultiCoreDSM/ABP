-- Migracao 002 (DOWN): Remove restricoes adicionais e indices

ALTER TABLE tentativas DROP CONSTRAINT IF EXISTS chk_tentativas_formula_nota;
ALTER TABLE tentativas DROP CONSTRAINT IF EXISTS chk_tentativas_situacao_limiar;
ALTER TABLE tentativas DROP CONSTRAINT IF EXISTS chk_tentativas_resultado_so_concluida;
ALTER TABLE candidatos DROP CONSTRAINT IF EXISTS chk_candidatos_certificado_coerente;
ALTER TABLE respostas DROP CONSTRAINT IF EXISTS chk_respostas_datas_coerentes;
ALTER TABLE temas DROP CONSTRAINT IF EXISTS chk_temas_ordem_valida;

DROP INDEX IF EXISTS idx_candidatos_certificado_hash_unico;
DROP INDEX IF EXISTS idx_respostas_questao_id;
DROP INDEX IF EXISTS idx_respostas_candidato_inicio;
DROP INDEX IF EXISTS idx_tentativa_questoes_tentativa_ordem;
DROP INDEX IF EXISTS idx_tentativas_candidato_iniciado;
DROP INDEX IF EXISTS idx_tentativa_ativa_candidato;
DROP INDEX IF EXISTS idx_questoes_tema_id;
DROP INDEX IF EXISTS idx_temas_ordem;
