import { Router } from "express";
import jwt from "jsonwebtoken";
import { autenticarCandidatoService } from "../services/login.js";
import { capturar } from "../middlewares/erros.js";
import { verificarLimiteLogin, registrarFalhaLogin, registrarSucessoLogin } from "../middlewares/limiteLogin.js";

const rotas = Router();

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
  const candidato = await autenticarCandidatoService(cpf, senha);
  if (!candidato) {
    registrarFalhaLogin(req);
    return res.status(401).json({ erro: "CPF ou senha incorretos" });
  }
  registrarSucessoLogin(req);

  const segredo = process.env.JWT_SECRET;
  const token = jwt.sign(
    {},
    segredo,
    {
      subject: String(candidato.id),
      algorithm: "HS256",
      expiresIn: "1h",
      issuer: "portal-certificacao-api",
      audience: "portal-certificacao"
    }
  );

  res.json({ token, tipo: "Bearer", expira_em: 3600, candidato });
}));

export default rotas;
