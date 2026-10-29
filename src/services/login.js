import { Router } from "express";
import jtw from "jsonwebtoken";
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
  const { cpf, senha } = req.body;
  const candidato = await autenticarCandidatoService(cpf, senha);

  if (!candidato) {
    res.status(401).json({ error: "CPF ou senha incorretos" });
  } else {
    const segredo = process.env.JWT_SECRET;
    const token = jtw.sign({}, segredo, {
      subject: String(candidato.id),
      algorithm: "HS256",
      expiresIn: "th",
      issuer: "portal-certificacao-api",
      audience: "portal-certificacao",
    });
    res.json({token, tipo: "Bearer", expira_em: 3600, candidato});
  }
});

export default rotas;
