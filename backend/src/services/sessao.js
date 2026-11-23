// Revogacao de sessoes JWT no encerramento (API-03 / QA-01).
// Mantido em memoria com limpeza automatica de tokens vencidos (mesmo padrao do limiteLogin.js).

import { createHash } from "node:crypto";

const revogadas = new Map();

function chaveSessao(jti, tokenBruto) {
  if (typeof jti === "string" && jti.trim() !== "") return jti.trim();
  return createHash("sha256").update(String(tokenBruto || "")).digest("hex");
}

export function revogarSessao({ jti, tokenBruto, exp }) {
  const chave = chaveSessao(jti, tokenBruto);
  const expMs = (Number.isFinite(exp) ? exp : Math.floor(Date.now() / 1000) + 3600) * 1000;
  revogadas.set(chave, expMs);
}

export function sessaoRevogada({ jti, tokenBruto }) {
  const chave = chaveSessao(jti, tokenBruto);
  const expMs = revogadas.get(chave);
  if (expMs === undefined) return false;
  if (expMs <= Date.now()) {
    revogadas.delete(chave);
    return false;
  }
  return true;
}

setInterval(() => {
  const agora = Date.now();
  for (const [chave, expMs] of revogadas) {
    if (expMs <= agora) revogadas.delete(chave);
  }
}, 15 * 60 * 1000).unref();
