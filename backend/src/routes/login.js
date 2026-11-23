import { randomUUID } from "node:crypto";
import { Router } from "express";
import jwt from "jsonwebtoken";
import { autenticarCandidatoService } from "../services/login.js";
import { revogarSessao } from "../services/sessao.js";
import autenticacao from "../middlewares/autenticacao.js";
import { capturar } from "../middlewares/erros.js";
import { verificarLimiteLogin, registrarFalhaLogin, registrarSucessoLogin } from "../middlewares/limiteLogin.js";
import { validarVariaveisJwt, calcularSegundosExpiracao } from "../config/env.js";

const rotas = Router();
const jwtConfig = validarVariaveisJwt();
const EXPIRA_EM_SEGUNDOS = calcularSegundosExpiracao(jwtConfig.expiresIn);

/*
curl -X POST http://localhost:3001/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "cpf": "12345678909",
    "senha": "senha-de-exemplo"
  }'
*/
rotas.post("/", verificarLimiteLogin, capturar(async function (req, res) {
  const { cpf, senha } = req.body ?? {};
  if (!cpf || !senha || typeof cpf !== "string" || typeof senha !== "string") {
    return res.status(400).json({ erro: "CPF e senha são obrigatórios." });
  }

  // Normaliza o CPF removendo pontuacao (ex.: 123.456.789-09 -> 12345678909) (API-03)
  const cpfNormalizado = cpf.replace(/\D/g, "");
  const candidato = await autenticarCandidatoService(cpfNormalizado, senha);
  if (!candidato) {
    registrarFalhaLogin(req);
    return res.status(401).json({ erro: "CPF ou senha incorretos" });
  }
  registrarSucessoLogin(req);

  const token = jwt.sign(
    {},
    jwtConfig.secret,
    {
      subject: String(candidato.id),
      jwtid: randomUUID(),
      algorithm: "HS256",
      expiresIn: jwtConfig.expiresIn,
      issuer: "portal-certificacao-api",
      audience: "portal-certificacao"
    }
  );

  res.json({ token, tipo: "Bearer", expira_em: EXPIRA_EM_SEGUNDOS, candidato });
}));

/*
curl -X POST http://localhost:3001/api/login/logout \
  -H "Authorization: Bearer SEU_TOKEN"
-> revoga o token atual no servidor para impedir reuso apos saida (API-03 / QA-01)
*/
const encerrarSessao = capturar(async function (req, res) {
  await revogarSessao({
    jti: req.tokenJti,
    tokenBruto: req.tokenBruto,
    candidatoId: req.candidatoId,
    exp: req.tokenExp,
  });
  res.json({ mensagem: "Sessão encerrada com sucesso." });
});

rotas.post("/logout", autenticacao, encerrarSessao);
rotas.delete("/", autenticacao, encerrarSessao);

export default rotas;
