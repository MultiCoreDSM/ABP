// Suite automatizada enxuta de validacao (OPS-04, DB-11, API-03, API-06, API-08, DB-09 e API-13).
// Execucao (a partir da pasta backend, com PostgreSQL 16 ativo):
//   node --env-file=../.env scripts/test-sprint2-3.mjs

import test, { describe, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import express from "express";
import pg from "pg";
import jwt from "jsonwebtoken";

import { validarVariaveisBanco, validarVariaveisJwt, carregarConfiguracao } from "../src/config/env.js";
import pool from "../src/config/database.js";
import { aplicarMigracoes, reverterMigracoes, statusMigracoes } from "../database/migrate.js";

import temasRoute from "../src/routes/temas.js";
import candidatosRoute from "../src/routes/candidatos.js";
import loginRoute from "../src/routes/login.js";
import certificacaoRoute from "../src/routes/certificacao.js";
import certificadosRoute from "../src/routes/certificados.js";
import { tratarErros } from "../src/middlewares/erros.js";

const RAIZ = path.resolve(import.meta.dirname, "../..");

function gerarCpfValido() {
  let n;
  do {
    n = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));
  } while (n.every((d) => d === n[0]));
  for (let t = 9; t < 11; t++) {
    let soma = 0;
    for (let i = 0; i < t; i++) soma += n[i] * (t + 1 - i);
    n.push(((soma * 10) % 11) % 10);
  }
  return n.join("");
}

const formatarCpf = (cpf) => cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");

let servidor;
let baseUrl;
const cpfsCriados = [];

async function api(caminho, { method = "GET", token, body } = {}) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${baseUrl}${caminho}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const texto = await res.text();
  return { status: res.status, body: texto ? JSON.parse(texto) : null };
}

async function cadastrarELogar(nome) {
  const cpf = gerarCpfValido();
  cpfsCriados.push(cpf);
  const senha = "SenhaSegura123!";
  const cad = await api("/api/candidatos", {
    method: "POST",
    body: { cpf, nome, email: `${cpf}@teste.local`, senha, aceite_termos: true },
  });
  assert.equal(cad.status, 201);
  // Login com CPF pontuado para validar normalizacao (API-03)
  const log = await api("/api/login", {
    method: "POST",
    body: { cpf: formatarCpf(cpf), senha },
  });
  assert.equal(log.status, 200);
  return { id: cad.body.id, cpf, senha, token: log.body.token };
}

before(async () => {
  await aplicarMigracoes(pool);
  const app = express();
  app.use(express.json());
  app.use("/api/temas", temasRoute);
  app.use("/api/candidatos", candidatosRoute);
  app.use("/api/login", loginRoute);
  app.use("/api/certificacao", certificacaoRoute);
  app.use("/api/certificados", certificadosRoute);
  app.use(tratarErros);

  await new Promise((resolve) => {
    servidor = app.listen(0, "127.0.0.1", () => {
      baseUrl = `http://127.0.0.1:${servidor.address().port}`;
      resolve();
    });
  });
});

after(async () => {
  if (servidor) await new Promise((resolve) => servidor.close(resolve));
  if (cpfsCriados.length > 0) {
    await pool.query("DELETE FROM respostas WHERE candidato_id IN (SELECT id FROM candidatos WHERE cpf = ANY($1))", [cpfsCriados]);
    await pool.query("DELETE FROM candidatos WHERE cpf = ANY($1)", [cpfsCriados]);
  }
  await pool.end();
});

describe("OPS-04 — Variaveis de ambiente e segredos", () => {
  test(".env.example existe, esta fora do .gitignore, sem segredos reais, e validacao protege obrigatorias", () => {
    const example = fs.readFileSync(path.join(RAIZ, ".env.example"), "utf8");
    for (const chave of ["POSTGRES_HOST", "POSTGRES_PORT", "POSTGRES_DB", "POSTGRES_USER", "POSTGRES_PASSWORD", "JWT_SECRET", "APP_PORT", "APP_URL"]) {
      assert.match(example, new RegExp(`^${chave}=`, "m"));
    }
    assert.equal(example.includes(process.env.JWT_SECRET), false);
    assert.match(fs.readFileSync(path.join(RAIZ, ".gitignore"), "utf8"), /^!\.env\.example$/m);

    assert.throws(() => validarVariaveisBanco({}), /POSTGRES_DB/);
    assert.throws(() => validarVariaveisJwt({}), /JWT_SECRET/);
    assert.throws(
      () => carregarConfiguracao({
        exigirJwt: true,
        envSource: {
          POSTGRES_DB: "db",
          POSTGRES_USER: "u",
          POSTGRES_PASSWORD: "segredo-nao-pode-vazar",
          JWT_SECRET: "jwt-nao-pode-vazar",
          APP_URL: "url-invalida",
        },
      }),
      (err) => !err.message.includes("segredo-nao-pode-vazar") && !err.message.includes("jwt-nao-pode-vazar")
    );
  });
});

describe("DB-11 — Migracoes, indices e restricoes em PostgreSQL 16", () => {
  test("Cria banco vazio, reaplica sem duplicar, valida indices/restricoes e reverte", async () => {
    const tempDb = `abp1_mig_${Date.now()}`;
    const dbCfg = validarVariaveisBanco();
    const admin = new pg.Pool({ ...dbCfg, database: "postgres" });
    let tempPool;
    try {
      await admin.query(`CREATE DATABASE ${tempDb}`);
      tempPool = new pg.Pool({ ...dbCfg, database: tempDb });

      assert.equal((await aplicarMigracoes(tempPool)).length, 2);
      assert.equal((await aplicarMigracoes(tempPool)).length, 0); // idempotencia
      assert.equal((await statusMigracoes(tempPool)).every((m) => m.aplicada), true);

      const { rows: idxRows } = await tempPool.query(`SELECT indexname FROM pg_indexes WHERE schemaname = 'public'`);
      const indices = new Set(idxRows.map((r) => r.indexname));
      for (const esperado of [
        "candidatos_cpf_key",
        "idx_temas_ordem",
        "idx_questoes_tema_id",
        "idx_tentativa_ativa_candidato",
        "idx_tentativas_candidato_iniciado",
        "idx_tentativa_questoes_tentativa_ordem",
        "idx_respostas_candidato_inicio",
        "idx_respostas_questao_id",
        "idx_candidatos_certificado_hash_unico",
      ]) {
        assert.equal(indices.has(esperado), true, `Indice ausente: ${esperado}`);
      }

      const { rows: c } = await tempPool.query(
        `INSERT INTO candidatos (cpf, nome, email, senha_hash) VALUES ('11144477735', 'Mig', 'm@t.co', 'h') RETURNING id`
      );
      const cid = c[0].id;
      await assert.rejects(() => tempPool.query(`INSERT INTO temas (nome, ordem) VALUES ('X', 99)`), (e) => e.code === "23514");
      await assert.rejects(
        () => tempPool.query(`INSERT INTO tentativas (candidato_id, estado, acertos, nota, situacao) VALUES ($1, 'em_andamento', 8, 66.67, 'aprovado')`, [cid]),
        (e) => e.code === "23514"
      );
      await assert.rejects(
        () => tempPool.query(`INSERT INTO tentativas (candidato_id, estado, concluido_em, acertos, nota, situacao) VALUES ($1, 'concluida', now(), 7, 58.33, 'aprovado')`, [cid]),
        (e) => e.code === "23514"
      );

      assert.equal((await reverterMigracoes(tempPool, { todas: true })).length, 2);
      assert.equal((await aplicarMigracoes(tempPool)).length, 2);
    } finally {
      if (tempPool) await tempPool.end();
      await admin.query(`DROP DATABASE IF EXISTS ${tempDb} WITH (FORCE)`);
      await admin.end();
    }
  });
});

describe("API-03 — Autenticacao, expiracao e revogacao no logout", () => {
  test("CPF normalizado, erro uniforme, expiracao recusada e token revogado apos logout", async () => {
    const user = await cadastrarELogar("Usuario API-03");

    const rCpf = await api("/api/login", { method: "POST", body: { cpf: gerarCpfValido(), senha: "x" } });
    const rSenha = await api("/api/login", { method: "POST", body: { cpf: user.cpf, senha: "errada" } });
    assert.equal(rCpf.status, 401);
    assert.equal(rSenha.status, 401);
    assert.equal(rCpf.body.erro, rSenha.body.erro);

    const expirado = jwt.sign({}, process.env.JWT_SECRET, {
      subject: String(user.id),
      algorithm: "HS256",
      expiresIn: "-5s",
      issuer: "portal-certificacao-api",
      audience: "portal-certificacao",
    });
    assert.equal((await api("/api/candidatos/me", { token: expirado })).status, 401);

    assert.equal((await api("/api/candidatos/me", { token: user.token })).status, 200);
    assert.equal((await api("/api/login/logout", { method: "POST", token: user.token })).status, 200);
    // Mesmo token ainda valido no relogio e rejeitado apos logout
    assert.equal((await api("/api/candidatos/me", { token: user.token })).status, 401);
  });
});

describe("API-06, API-08, API-13 e DB-09 — Sorteio, resposta idempotente, progresso e resultado", () => {
  test("Fluxo completo nos 12 temas: sorteio imutavel, concorrencia, prazo expirado, progresso sem gabarito, aprovacao (8/12) e reprovacao (7/12)", async () => {
    const { rows: temasRows } = await pool.query("SELECT id FROM temas ORDER BY ordem");
    const { rows: gabRows } = await pool.query("SELECT questao_id, letra FROM alternativas WHERE correta = true");
    const gabarito = new Map(gabRows.map((r) => [r.questao_id, r.letra.trim()]));
    const errada = (c) => (c === "A" ? "B" : "A");

    // --- Candidato 1: aprovado (8/12 = 66.67%) ---
    const u1 = await cadastrarELogar("Aprovado");

    // Progresso inicial (API-13) sem gabarito ou questoes futuras
    const p0 = await api("/api/certificacao/progresso", { token: u1.token });
    assert.equal(p0.status, 200);
    assert.equal(p0.body.estado, "nao_iniciada");
    assert.equal(p0.body.concluidos, 0);
    assert.equal(p0.body.pendentes, 12);
    const p0Json = JSON.stringify(p0.body);
    for (const proibido of ["questao_id", "enunciado", "alternativas", "correta", "acertou"]) {
      assert.equal(p0Json.includes(proibido), false);
    }

    // Resultado incompleto nunca e reprovado (DB-09)
    const resParcial = await api("/api/certificacao/resultado", { token: u1.token });
    assert.equal(resParcial.body.concluida, false);
    assert.equal(resParcial.body.nota, null);
    assert.equal(resParcial.body.aprovado, null);
    assert.notEqual(resParcial.body.situacao, "reprovado");

    // Tema 1: sorteio + reconsulta sem novo sorteio + bloqueio 409 ao abrir tema 2 (API-06)
    const q1 = await api(`/api/certificacao/temas/${temasRows[0].id}/questao`, { token: u1.token });
    const q1Reconsulta = await api(`/api/certificacao/temas/${temasRows[0].id}/questao`, { token: u1.token });
    assert.equal(q1.status, 200);
    assert.equal(q1Reconsulta.body.id, q1.body.id);
    assert.equal((await api(`/api/certificacao/temas/${temasRows[1].id}/questao`, { token: u1.token })).status, 409);

    // Enquanto tema 1 aberto, continua pendente no progresso (API-13)
    const pAberta = await api("/api/certificacao/progresso", { token: u1.token });
    assert.equal(pAberta.body.estado, "em_andamento");
    assert.equal(pAberta.body.concluidos, 0);
    assert.equal(pAberta.body.pendentes, 12);

    // Concorrencia + idempotencia na resposta do tema 1 (API-08)
    const correta1 = gabarito.get(q1.body.id);
    const [r1a, r1b] = await Promise.all([
      api(`/api/certificacao/questoes/${q1.body.id}/resposta`, { method: "POST", token: u1.token, body: { letra: correta1 } }),
      api(`/api/certificacao/questoes/${q1.body.id}/resposta`, { method: "POST", token: u1.token, body: { letra: correta1 } }),
    ]);
    assert.equal(r1a.status, 200);
    assert.equal(r1b.status, 200);
    assert.equal(r1a.body.acertou, true);

    const reenvio = await api(`/api/certificacao/questoes/${q1.body.id}/resposta`, {
      method: "POST",
      token: u1.token,
      body: { letra: errada(correta1) },
    });
    assert.equal(reenvio.body.ja_registrada, true);
    assert.equal(reenvio.body.letra_resposta, correta1);

    // Entre questoes: progresso pausado com 1 concluido e 11 pendentes (API-13)
    const pPausa = await api("/api/certificacao/progresso", { token: u1.token });
    assert.equal(pPausa.body.estado, "pausada");
    assert.equal(pPausa.body.concluidos, 1);
    assert.equal(pPausa.body.pendentes, 11);

    // Tema 2 expirado (>150s): conta como incorreta mesmo enviando a letra certa (API-08)
    const q2 = await api(`/api/certificacao/temas/${temasRows[1].id}/questao`, { token: u1.token });
    await pool.query(
      `UPDATE respostas SET data_horario_inicio = clock_timestamp() - INTERVAL '200 seconds'
       WHERE candidato_id = $1 AND questao_id = $2`,
      [u1.id, q2.body.id]
    );
    const r2 = await api(`/api/certificacao/questoes/${q2.body.id}/resposta`, {
      method: "POST",
      token: u1.token,
      body: { letra: gabarito.get(q2.body.id) },
    });
    assert.equal(r2.body.tempo_esgotado, true);
    assert.equal(r2.body.acertou, false);
    assert.equal(r2.body.motivo_encerramento, "tempo_esgotado");

    // Temas 3..9 certos (+7 -> total 8/12 = 66.67%) e 10..12 errados
    for (let i = 2; i < 12; i++) {
      const q = await api(`/api/certificacao/temas/${temasRows[i].id}/questao`, { token: u1.token });
      const c = gabarito.get(q.body.id);
      await api(`/api/certificacao/questoes/${q.body.id}/resposta`, {
        method: "POST",
        token: u1.token,
        body: { letra: i < 9 ? c : errada(c) },
      });
    }

    const pFinal = await api("/api/certificacao/progresso", { token: u1.token });
    assert.equal(pFinal.body.estado, "concluida");
    assert.equal(pFinal.body.concluidos, 12);
    assert.equal(pFinal.body.pendentes, 0);
    assert.equal(pFinal.body.percentual_andamento, 100);

    const resAprov = await api("/api/certificacao/resultado", { token: u1.token });
    assert.equal(resAprov.body.concluida, true);
    assert.equal(resAprov.body.acertos, 8);
    assert.equal(resAprov.body.nota, 66.67);
    assert.equal(resAprov.body.percentual, 67);
    assert.equal(resAprov.body.aprovado, true);
    assert.equal(resAprov.body.situacao, "aprovado");

    // --- Candidato 2: reprovado (7/12 = 58.33% < 65%) ---
    const u2 = await cadastrarELogar("Reprovado");
    for (let i = 0; i < 12; i++) {
      const q = await api(`/api/certificacao/temas/${temasRows[i].id}/questao`, { token: u2.token });
      const c = gabarito.get(q.body.id);
      await api(`/api/certificacao/questoes/${q.body.id}/resposta`, {
        method: "POST",
        token: u2.token,
        body: { letra: i < 7 ? c : errada(c) },
      });
    }
    const resReprov = await api("/api/certificacao/resultado", { token: u2.token });
    assert.equal(resReprov.body.acertos, 7);
    assert.equal(resReprov.body.nota, 58.33);
    assert.equal(resReprov.body.aprovado, false);
    assert.equal(resReprov.body.situacao, "reprovado");
  });

  test("API-06 falha parcial: tema sem 4 questoes validas retorna 422 sem gravar resposta parcial", async () => {
    const u = await cadastrarELogar("Falha Parcial");
    const { rows } = await pool.query(
      `SELECT a.id, q.tema_id FROM alternativas a JOIN questoes q ON q.id = a.questao_id WHERE a.correta = true ORDER BY a.id LIMIT 1`
    );
    const { id: altId, tema_id: temaId } = rows[0];
    try {
      await pool.query("UPDATE alternativas SET correta = false WHERE id = $1", [altId]);
      const r = await api(`/api/certificacao/temas/${temaId}/questao`, { token: u.token });
      assert.equal(r.status, 422);
      const { rows: resp } = await pool.query("SELECT COUNT(*)::int AS n FROM respostas WHERE candidato_id = $1", [u.id]);
      assert.equal(resp[0].n, 0);
    } finally {
      await pool.query("UPDATE alternativas SET correta = true WHERE id = $1", [altId]);
    }
  });
});
