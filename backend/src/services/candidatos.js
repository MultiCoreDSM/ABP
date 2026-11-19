import pool from "../config/database.js";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { buscarProximoTemaService } from "./temas.js";
import { resultadoCandidatoService } from "./certificacao.js";

export const PERCENTUAL_MINIMO = 65;

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

// Dados do próprio candidato para o menu e o histórico (nunca o hash da senha nem o CPF)
export async function buscarCandidatoService(candidatoId) {
  const { rows } = await pool.query(
    `SELECT nome, criado_em FROM candidatos WHERE id = $1`,
    [candidatoId]
  );
  return rows[0] ?? null;
}

function formatarCertificado(linha) {
  if (!linha?.certificado_hash) return null;
  const acertos = Number(linha.certificado_acertos);
  const total = Number(linha.certificado_total);
  return {
    codigo: linha.certificado_hash,
    emitido_em: linha.certificado_emitido_em,
    acertos,
    total,
    percentual: total > 0 ? Math.round((acertos / total) * 100) : 0,
  };
}

// Certificado do próprio candidato (rota autenticada). Traz os dados do titular que o
// RF18 do documento oficial exige no certificado: nome completo, CPF e e-mail.
// A validação pública (validarCertificadoService) continua com os dados da RN-09.
export async function buscarCertificadoCandidatoService(candidatoId) {
  const { rows } = await pool.query(
    `SELECT nome, cpf, email, certificado_hash, certificado_emitido_em, certificado_acertos, certificado_total
     FROM candidatos WHERE id = $1`,
    [candidatoId]
  );
  const certificado = formatarCertificado(rows[0]);
  if (!certificado) return null;
  return {
    ...certificado,
    titular: { nome: rows[0].nome, cpf: rows[0].cpf, email: rows[0].email },
  };
}

// Emite o certificado uma única vez; se já existe, devolve o mesmo (idempotente).
// A nota e a data ficam gravadas na emissão: a validação pública lê esses valores (RN-09).

export async function emitirCertificadoService(candidatoId) {
  // Verifica se o candidato já possui um certificado.
  // Se possuir, devolve o mesmo certificado.
  const existente = await buscarCertificadoCandidatoService(candidatoId);

  if (existente) return existente;

  // Verifica se ainda existem temas pendentes.
  const tema = await buscarProximoTemaService(candidatoId);

  if (tema != null) {
    return {
      erro: "Conclua todos os temas antes de emitir o certificado."
    };
  }

  // Obtém o resultado oficial da prova.
  const resultado = await resultadoCandidatoService(candidatoId);

  const total = Number(resultado.total);
  const acertos = Number(resultado.acertos);

  const percentual = total > 0
    ? (acertos / total) * 100
    : 0;

  // Verifica se o candidato atingiu a nota mínima.
  if (
    !resultado.concluida ||
    total === 0 ||
    percentual < PERCENTUAL_MINIMO
  ) {
    return {
      erro: `Sua nota foi ${Math.round(percentual)}%. É necessário acertar pelo menos ${PERCENTUAL_MINIMO}% das questões dentro do prazo.`
    };
  }

  // Gera um código único para validação do certificado.
  const codigo = randomBytes(32).toString("hex");

  // Salva os dados do certificado no banco.
  await pool.query(
    `
      UPDATE candidatos
      SET certificado_hash = $2,
          certificado_emitido_em = now(),
          certificado_acertos = $3,
          certificado_total = $4
      WHERE id = $1 AND certificado_hash IS NULL
    `,
    [candidatoId, codigo, acertos, total]
  );

  // Retorna o certificado salvo.
  // Também funciona caso duas solicitações ocorram simultaneamente.
  return buscarCertificadoCandidatoService(candidatoId);
}


// Mascara o CPF no formato aprovado pelo PO (RN-09): ***.456.789-**
function mascararCpf(cpf) {
  return `***.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-**`;
}

// Validação pública (BL-21, RN-09): busca só pelo código e devolve só os dados aprovados
export async function validarCertificadoService(codigo) {
  const { rows } = await pool.query(
    `SELECT nome, cpf, certificado_hash, certificado_emitido_em, certificado_acertos, certificado_total
     FROM candidatos WHERE certificado_hash = $1`,
    [codigo]
  );
  const linha = rows[0];
  if (!linha) return null;
  const certificado = formatarCertificado(linha);
  return {
    nome: linha.nome,
    cpf: mascararCpf(linha.cpf),
    emitido_em: certificado.emitido_em,
    percentual: certificado.percentual,
    situacao: "válido",
  };
}
