import { Router } from "express";
import jwt from "jsonwebtoken";
import { autenticarCandidatoService } from "../services/login.js";

const rotas = Router();

/*
curl -X POST http://localhost:3001/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "cpf": "12345678901",
    "senha": "123456"
  }'
*/
rotas.post("/", async function (req, res) {
  try {
    const { cpf, senha } = req.body;
    if (!cpf || !senha) {
      return res.status(400).json({ erro: "CPF e senha são obrigatórios." });
    }
    const candidato = await autenticarCandidatoService(cpf, senha);
    if (!candidato) {
      return res.status(401).json({ erro: "CPF ou senha incorretos" });
    }

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
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

export default rotas;

