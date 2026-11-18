import { Router } from "express";
import {
  cadastrarCandidatoService,
  emitirCertificadoService,
  buscarCandidatoService,
  buscarCertificadoCandidatoService,
} from "../services/candidatos.js";
import autenticacao from "../middlewares/autenticacao.js";
import { capturar } from "../middlewares/erros.js";

import { cpfValido, emailValido, senhaValida, SENHA_MINIMA, SENHA_MAXIMA } from "../utils/validacao.js";

const rotas = Router();

// Valida antes do banco para responder 400 com mensagem clara, em vez de expor
// o erro da constraint do PostgreSQL. As regras não dependem do front-end (QA-08 / R5).
function validarCadastro({ cpf, nome, email, senha }) {
  if (!cpf || !nome || !email || !senha) {
    return "Todos os campos (cpf, nome, email, senha) são obrigatórios.";
  }
  if (!cpfValido(cpf)) {
    return "Informe um CPF válido, com 11 dígitos numéricos.";
  }
  if (typeof nome !== "string" || nome.trim().length === 0 || nome.length > 100) {
    return "O nome deve ter entre 1 e 100 caracteres.";
  }
  if (!emailValido(email)) {
    return "Informe um e-mail válido com até 100 caracteres.";
  }
  if (!senhaValida(senha)) {
    return `A senha deve ter entre ${SENHA_MINIMA} e ${SENHA_MAXIMA} caracteres.`;
  }
  return null;
}

/*
curl -X POST http://localhost:3001/api/candidatos \
  -H "Content-Type: application/json" \
  -d '{
    "cpf": "12345678909",
    "nome": "Pedro Fonseca",
    "email": "pedro@example.com",
    "senha": "senha-de-exemplo"
  }'
*/
rotas.post("/", capturar(async function (req, res) {
  const dados = req.body ?? {};
  const invalido = validarCadastro(dados);
  if (invalido) {
    return res.status(400).json({ erro: invalido });
  }
  const resposta = await cadastrarCandidatoService(dados.cpf, dados.nome.trim(), dados.email, dados.senha);
  if (resposta?.erro) {
    return res.status(400).json(resposta);
  }
  res.status(201).json(resposta);
}));

/*
curl http://localhost:3001/api/candidatos/me -H "Authorization: Bearer SEU_TOKEN"
*/
rotas.get("/me", autenticacao, capturar(async function (req, res) {
  const candidato = await buscarCandidatoService(req.candidatoId);
  if (!candidato) {
    return res.status(404).json({ erro: "Candidato não encontrado." });
  }
  res.json(candidato);
}));

/*
curl http://localhost:3001/api/candidatos/certificado -H "Authorization: Bearer SEU_TOKEN"
-> o certificado já emitido, ou 404 se ainda não existe
*/
rotas.get("/certificado", autenticacao, capturar(async function (req, res) {
  const certificado = await buscarCertificadoCandidatoService(req.candidatoId);
  if (!certificado) {
    return res.status(404).json({ erro: "Certificado ainda não emitido." });
  }
  res.json(certificado);
}));

/*
curl -X POST http://localhost:3001/api/candidatos/certificado \
-H "Authorization: Bearer SEU_TOKEN"
-> emite o certificado (ou devolve o já emitido)
*/
rotas.post("/certificado", autenticacao, capturar(async function (req, res) {
  const certificado = await emitirCertificadoService(req.candidatoId);
  if (certificado?.erro) {
    return res.status(400).json(certificado);
  }
  res.json(certificado);
}));

export default rotas;
