import { Router } from "express";
import { cadastrarCandidatoService, emitirCertificadoService } from "../services/candidatos.js";
import autenticacao from "../middlewares/autenticacao.js";

const rotas = Router();

/*
curl -X POST http://localhost:3001/api/candidatos \
  -H "Content-Type: application/json" \
  -d '{
    "cpf": "12345678904",
    "nome": "Pedro Fonseca",
    "email": "maria@example.com",
    "senha": "123456"
  }'
*/
rotas.post("/", async function (req, res) {
  try {
    const { cpf, nome, email, senha } = req.body;
    if (!cpf || !nome || !email || !senha) {
      return res.status(400).json({ erro: "Todos os campos (cpf, nome, email, senha) são obrigatórios." });
    }
    const resposta = await cadastrarCandidatoService(cpf, nome, email, senha);
    if (resposta?.erro) {
      return res.status(400).json(resposta);
    }
    res.status(201).json(resposta);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

/*
curl -X POST http://localhost:3001/api/candidatos/certificado \
-H "Authorization: Bearer SEU_TOKEN"
*/
rotas.post("/certificado", autenticacao, async function (req, res) {
  try {
    const certificado = await emitirCertificadoService(req.candidatoId);
    if (certificado?.erro) {
      return res.status(400).json(certificado);
    }
    res.json(certificado);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

export default rotas;

