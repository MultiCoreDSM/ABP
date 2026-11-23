import jwt from "jsonwebtoken";
import { validarVariaveisJwt } from "../config/env.js";
import { sessaoRevogada } from "../services/sessao.js";

// Valida JWT_SECRET e JWT_EXPIRES_IN logo na inicializacao do servidor (OPS-04)
const jwtConfig = validarVariaveisJwt();

export default function autenticacao(req, res, next) {
  const autorizacao = req.get("Authorization");
  if (!autorizacao) {
    return res.status(401).json({ erro: "Token obrigatório" });
  }

  const partes = autorizacao.split(" ");
  const tipo = partes[0];
  const token = partes[1];
  if (tipo.toLowerCase() !== "bearer" || !token) {
    return res.status(401).json({ erro: "Use Authorization: Bearer TOKEN" });
  }

  try {
    const dados = jwt.verify(token, jwtConfig.secret, {
      algorithms: ["HS256"],
      issuer: "portal-certificacao-api",
      audience: "portal-certificacao",
    });
    const candidatoId = Number(dados.sub);
    if (!Number.isSafeInteger(candidatoId)) {
      return res.status(401).json({ erro: "Candidato inválido" });
    }

    if (sessaoRevogada({ jti: dados.jti, tokenBruto: token })) {
      return res.status(401).json({ erro: "Sessão encerrada ou token inválido" });
    }

    req.candidatoId = candidatoId;
    req.tokenJti = dados.jti ?? null;
    req.tokenExp = dados.exp;
    req.tokenBruto = token;

    next();
  } catch (err) {
    return res.status(401).json({ erro: "Token inválido ou expirado" });
  }
}
