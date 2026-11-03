import pool from "../config/database.js";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { buscarProximoTemaService } from "./temas.js";

export async function cadastrarCandidatoService(cpf, nome, email, senha) {
  const senhaHash = await bcrypt.hash(senha, 12);
  const { rows } = await pool.query(
    `
        INSERT INTO candidatos (cpf, nome, email, senha_hash)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (cpf) DO NOTHING
        RETURNING id, cpf, nome, email, criado_em
    `,
    [cpf, nome, email, senhaHash]
  );
  if (!rows[0]) {
    return { erro: "CPF já cadastrado." };
  }
  return rows[0];
}

export async function emitirCertificadoService(candidatoId) {
  const candidato = await pool.query(
    `SELECT certificado_hash FROM candidatos WHERE id = $1`,
    [candidatoId]
  );
  if (candidato.rows.length === 0) {
    return { erro: "Candidato não encontrado." };
  }
  if (candidato.rows[0].certificado_hash != null) {
    return { erro: "O certificado já foi emitido." };
  }

  const tema = await buscarProximoTemaService(candidatoId);
  if (tema != null) {
    return { erro: "Conclua todos os temas antes de emitir o certificado." };
  }

  const resultado = await pool.query(
    `SELECT COUNT(*) AS total,
            COUNT(CASE WHEN acertou = true AND valida = true THEN 1 END) AS acertos
     FROM respostas
     WHERE candidato_id = $1`,
    [candidatoId]
  );
  const total = Number(resultado.rows[0].total);
  const acertos = Number(resultado.rows[0].acertos);
  const percentual = total > 0 ? (acertos / total) * 100 : 0;
  if (total === 0 || percentual < 65) {
    return {
      erro: `A sua nota é ${percentual}%. É necessário acertar pelo menos 65% das questões dentro do prazo.`,
    };
  }

  const codigo = randomBytes(32).toString("hex");
  const certificado = await pool.query(
    `
    UPDATE candidatos
    SET certificado_hash = $2
    WHERE id = $1 AND certificado_hash IS NULL
    RETURNING certificado_hash
    `,
    [candidatoId, codigo]
  );

  return {
    certificado_hash: certificado.rows[0].certificado_hash,
    total,
    acertos,
    percentual,
  };
}

