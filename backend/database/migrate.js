// Executor de migracoes SQL ordenadas e reversiveis (DB-11).
//
// Uso (a partir da pasta backend):
//   node --env-file=../.env database/migrate.js up
//   node --env-file=../.env database/migrate.js down [--all]
//   node --env-file=../.env database/migrate.js status

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import pg from "pg";
import { validarVariaveisBanco } from "../src/config/env.js";

const MIGRATIONS_DIR = path.resolve(import.meta.dirname, "migrations");

async function garantirTabelaControle(cliente) {
  await cliente.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      versao VARCHAR(120) PRIMARY KEY,
      aplicada_em TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
}

export function listarArquivosMigracao(direcao = "up") {
  const sufixo = `.${direcao}.sql`;
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((nome) => nome.endsWith(sufixo))
    .sort()
    .map((arquivo) => ({
      versao: arquivo.slice(0, -sufixo.length),
      arquivo,
      caminho: path.join(MIGRATIONS_DIR, arquivo),
    }));
}

export async function aplicarMigracoes(pool) {
  const cliente = await pool.connect();
  const aplicadasAgora = [];
  try {
    await garantirTabelaControle(cliente);
    const { rows } = await cliente.query("SELECT versao FROM schema_migrations ORDER BY versao");
    const jaAplicadas = new Set(rows.map((r) => r.versao));

    for (const migracao of listarArquivosMigracao("up")) {
      if (jaAplicadas.has(migracao.versao)) continue;
      const sql = fs.readFileSync(migracao.caminho, "utf8");
      await cliente.query("BEGIN");
      try {
        await cliente.query(sql);
        await cliente.query(
          "INSERT INTO schema_migrations (versao) VALUES ($1) ON CONFLICT (versao) DO NOTHING",
          [migracao.versao]
        );
        await cliente.query("COMMIT");
        aplicadasAgora.push(migracao.versao);
      } catch (err) {
        await cliente.query("ROLLBACK").catch(() => {});
        throw new Error(`Falha ao aplicar migracao ${migracao.versao}: ${err.message}`);
      }
    }
    return aplicadasAgora;
  } finally {
    cliente.release();
  }
}

export async function reverterMigracoes(pool, { todas = false } = {}) {
  const cliente = await pool.connect();
  const revertidas = [];
  try {
    await garantirTabelaControle(cliente);
    const { rows } = await cliente.query("SELECT versao FROM schema_migrations ORDER BY versao DESC");
    const alvos = todas ? rows : rows.slice(0, 1);

    for (const { versao } of alvos) {
      const caminhoDown = path.join(MIGRATIONS_DIR, `${versao}.down.sql`);
      if (!fs.existsSync(caminhoDown)) {
        throw new Error(`Arquivo de reversao nao encontrado: ${versao}.down.sql`);
      }
      const sql = fs.readFileSync(caminhoDown, "utf8");
      await cliente.query("BEGIN");
      try {
        await cliente.query(sql);
        await cliente.query("DELETE FROM schema_migrations WHERE versao = $1", [versao]);
        await cliente.query("COMMIT");
        revertidas.push(versao);
      } catch (err) {
        await cliente.query("ROLLBACK").catch(() => {});
        throw new Error(`Falha ao reverter migracao ${versao}: ${err.message}`);
      }
    }
    return revertidas;
  } finally {
    cliente.release();
  }
}

export async function statusMigracoes(pool) {
  const cliente = await pool.connect();
  try {
    await garantirTabelaControle(cliente);
    const { rows } = await cliente.query("SELECT versao, aplicada_em FROM schema_migrations ORDER BY versao");
    const mapa = new Map(rows.map((r) => [r.versao, r.aplicada_em]));
    return listarArquivosMigracao("up").map((m) => ({
      versao: m.versao,
      aplicada: mapa.has(m.versao),
      aplicada_em: mapa.get(m.versao) ?? null,
    }));
  } finally {
    cliente.release();
  }
}

async function main() {
  const comando = process.argv[2] || "up";
  const todas = process.argv.includes("--all");
  const dbCfg = validarVariaveisBanco();
  const pool = new pg.Pool(dbCfg);

  try {
    if (comando === "up") {
      const aplicadas = await aplicarMigracoes(pool);
      if (aplicadas.length === 0) {
        console.log("Nenhuma migracao pendente. Banco ja esta atualizado.");
      } else {
        console.log(`Migracoes aplicadas (${aplicadas.length}): ${aplicadas.join(", ")}`);
      }
    } else if (comando === "down") {
      const revertidas = await reverterMigracoes(pool, { todas });
      if (revertidas.length === 0) {
        console.log("Nenhuma migracao aplicada para reverter.");
      } else {
        console.log(`Migracoes revertidas (${revertidas.length}): ${revertidas.join(", ")}`);
      }
    } else if (comando === "status") {
      const lista = await statusMigracoes(pool);
      for (const item of lista) {
        const marca = item.aplicada ? "[APLICADA]" : "[PENDENTE]";
        console.log(`${marca} ${item.versao}`);
      }
    } else {
      console.error("Comando invalido. Use: up | down [--all] | status");
      process.exitCode = 1;
    }
  } finally {
    await pool.end();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error("[migrate]", err.message);
    process.exit(1);
  });
}
