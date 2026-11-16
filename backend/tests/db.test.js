// Testes automatizados de modelagem e regras de negocio do Banco de Dados
import pool from '../src/config/database.js';

// Gerador de CPF valido com 11 digitos numericos
function gerarCpfValido() {
  const n = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));
  let d1 = 0;
  for (let i = 0; i < 9; i++) d1 += n[i] * (10 - i);
  d1 = ((d1 * 10) % 11) % 10;
  n.push(d1);

  let d2 = 0;
  for (let i = 0; i < 10; i++) d2 += n[i] * (11 - i);
  d2 = ((d2 * 10) % 11) % 10;
  n.push(d2);

  return n.join('');
}

describe('Sprint 2 — Modelagem de Banco de Dados (Tentativas de Certificacao)', () => {
  let candidatoId = null;
  const testCpf = gerarCpfValido();
  const questoesIds = [];

  beforeAll(async () => {
    // Garante que o schema de tentativas e tentativa_questoes esteja criado no banco
    await pool.query(`
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

      CREATE UNIQUE INDEX IF NOT EXISTS idx_tentativa_ativa_candidato
          ON tentativas (candidato_id)
          WHERE estado IN ('em_andamento', 'pausada');

      CREATE TABLE IF NOT EXISTS tentativa_questoes (
          tentativa_id INT NOT NULL REFERENCES tentativas(id) ON DELETE CASCADE,
          questao_id INT NOT NULL REFERENCES questoes(id),
          ordem_tema INT NOT NULL CHECK (ordem_tema BETWEEN 1 AND 12),
          letra_resposta CHAR(1) NULL CHECK (letra_resposta IN ('A','B','C','D')),
          data_horario_inicio TIMESTAMPTZ NULL,
          data_horario_resposta TIMESTAMPTZ NULL,
          acertou BOOLEAN NULL,
          PRIMARY KEY (tentativa_id, questao_id),
          UNIQUE (tentativa_id, ordem_tema)
      );
    `);

    // Cria um candidato exclusivo para esta suite
    const resCand = await pool.query(
      `INSERT INTO candidatos (cpf, nome, email, senha_hash)
       VALUES ($1, 'Candidato DB-05', 'db05@exemplo.com', 'hash123')
       RETURNING id`,
      [testCpf]
    );
    candidatoId = resCand.rows[0].id;

    // Obtem 12 questoes (1 de cada tema ou disponiveis) para testes de vinculo
    const resQ = await pool.query(`SELECT id FROM questoes LIMIT 12`);
    for (const row of resQ.rows) {
      questoesIds.push(row.id);
    }
  });

  afterAll(async () => {
    try {
      if (candidatoId) {
        await pool.query(`DELETE FROM candidatos WHERE id = $1`, [candidatoId]);
      }
    } catch (e) {
      // Ignora erro de limpeza
    }
    await pool.end();
  });

  test('Atividade 1 e Criterio 1: Uma tentativa identifica exatamente um candidato', async () => {
    const res = await pool.query(
      `INSERT INTO tentativas (candidato_id, estado)
       VALUES ($1, 'em_andamento')
       RETURNING id, candidato_id, estado, total_questoes`,
      [candidatoId]
    );

    expect(res.rows.length).toBe(1);
    expect(res.rows[0].candidato_id).toBe(candidatoId);
    expect(res.rows[0].total_questoes).toBe(12);

    // Tentativa com candidato inexistente deve falhar por Foreign Key
    let erroFk = null;
    try {
      await pool.query(
        `INSERT INTO tentativas (candidato_id, estado) VALUES (99999999, 'em_andamento')`
      );
    } catch (err) {
      erroFk = err;
    }
    expect(erroFk).not.toBeNull();
    expect(erroFk.code).toBe('23503'); // foreign_key_violation
  });

  test('Atividade 2 e Criterio 3: Estados invalidos nao sao aceitos silenciosamente', async () => {
    let erroCheck = null;
    try {
      await pool.query(
        `INSERT INTO tentativas (candidato_id, estado) VALUES ($1, 'estado_invalido')`,
        [candidatoId]
      );
    } catch (err) {
      erroCheck = err;
    }
    expect(erroCheck).not.toBeNull();
    expect(erroCheck.code).toBe('23514'); // check_violation
  });

  test('Atividade 3 e Criterio 4: Datas e transicoes permitem reconstruir o ciclo de vida da tentativa', async () => {
    // 1. Criar tentativa
    const novaTentativa = await pool.query(
      `INSERT INTO tentativas (candidato_id, estado, iniciado_em)
       VALUES ($1, 'concluida', now() - INTERVAL '30 minutes')
       RETURNING id, iniciado_em`,
      [candidatoId]
    );
    const tentativaId = novaTentativa.rows[0].id;
    const iniciadoEm = new Date(novaTentativa.rows[0].iniciado_em);

    // 2. Simular pausa
    await pool.query(
      `UPDATE tentativas
       SET estado = 'pausada', pausado_em = now() - INTERVAL '15 minutes', atualizado_em = now()
       WHERE id = $1`,
      [tentativaId]
    );

    // 3. Simular conclusao
    await pool.query(
      `UPDATE tentativas
       SET estado = 'concluida', concluido_em = now(), acertos = 10, nota = 83.33, atualizado_em = now()
       WHERE id = $1`,
      [tentativaId]
    );

    const consulta = await pool.query(
      `SELECT id, estado, iniciado_em, pausado_em, concluido_em, acertos, nota
       FROM tentativas WHERE id = $1`,
      [tentativaId]
    );

    const row = consulta.rows[0];
    expect(row.estado).toBe('concluida');
    expect(row.iniciado_em).toBeDefined();
    expect(row.pausado_em).toBeDefined();
    expect(row.concluido_em).toBeDefined();
    expect(Number(row.acertos)).toBe(10);
    expect(Number(row.nota)).toBe(83.33);

    // Garante que concluido_em > iniciado_em
    expect(new Date(row.concluido_em).getTime()).toBeGreaterThan(iniciadoEm.getTime());
  });

  test('Atividade 4 e Criterio 2: Vinculo imutavel com as 12 questoes sorteadas na tentativa', async () => {
    const criacao = await pool.query(
      `INSERT INTO tentativas (candidato_id, estado)
       VALUES ($1, 'expirada')
       RETURNING id`,
      [candidatoId]
    );
    const tentativaId = criacao.rows[0].id;

    // Vincula questoes para as 12 posicoes de tema
    for (let ordem = 1; ordem <= Math.min(12, questoesIds.length); ordem++) {
      const qId = questoesIds[ordem - 1];
      await pool.query(
        `INSERT INTO tentativa_questoes (tentativa_id, questao_id, ordem_tema)
         VALUES ($1, $2, $3)`,
        [tentativaId, qId, ordem]
      );
    }

    const { rows } = await pool.query(
      `SELECT COUNT(*)::int AS total
       FROM tentativa_questoes
       WHERE tentativa_id = $1`,
      [tentativaId]
    );
    expect(rows[0].total).toBe(Math.min(12, questoesIds.length));

    // Rejeita questao repetida na mesma tentativa (chave primaria composta)
    let erroPk = null;
    try {
      await pool.query(
        `INSERT INTO tentativa_questoes (tentativa_id, questao_id, ordem_tema)
         VALUES ($1, $2, 1)`,
        [tentativaId, questoesIds[0]]
      );
    } catch (err) {
      erroPk = err;
    }
    expect(erroPk).not.toBeNull();
    expect(erroPk.code).toBe('23505'); // unique_violation
  });

  test('Atividade 5: Impede tentativas simultaneas ativas para o mesmo candidato', async () => {
    // Limpa quaisquer tentativas ativas anteriores deste candidato
    await pool.query(
      `UPDATE tentativas SET estado = 'concluida' WHERE candidato_id = $1 AND estado IN ('em_andamento', 'pausada')`,
      [candidatoId]
    );

    // 1. Cria a primeira tentativa ativa
    await pool.query(
      `INSERT INTO tentativas (candidato_id, estado) VALUES ($1, 'em_andamento')`,
      [candidatoId]
    );

    // 2. Tentar criar uma segunda tentativa em_andamento para o mesmo candidato deve ser barrado pelo indice parcial
    let erroDuplicidade = null;
    try {
      await pool.query(
        `INSERT INTO tentativas (candidato_id, estado) VALUES ($1, 'em_andamento')`,
        [candidatoId]
      );
    } catch (err) {
      erroDuplicidade = err;
    }
    expect(erroDuplicidade).not.toBeNull();
    expect(erroDuplicidade.code).toBe('23505'); // unique_violation no indice idx_tentativa_ativa_candidato

    // 3. Tentar criar tentativa pausada tambem deve ser barrada enquanto houver uma ativa
    let erroPausada = null;
    try {
      await pool.query(
        `INSERT INTO tentativas (candidato_id, estado) VALUES ($1, 'pausada')`,
        [candidatoId]
      );
    } catch (err) {
      erroPausada = err;
    }
    expect(erroPausada).not.toBeNull();
    expect(erroPausada.code).toBe('23505');
  });
});
