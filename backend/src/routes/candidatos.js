import { Router } from "express";
import {
  cadastrarCandidatoService,
  emitirCertificadoService,
  buscarCandidatoService,
  buscarCertificadoCandidatoService,
  aceitarTermosService,
  exportarDadosCandidatoService,
  atualizarCandidatoService,
  excluirContaService,
} from "../services/candidatos.js";
import autenticacao from "../middlewares/autenticacao.js";
import { capturar } from "../middlewares/erros.js";
import { confirmacaoBloqueada, registrarFalhaConfirmacao } from "../middlewares/limiteLogin.js";
import { gerarPdfCertificado } from "../services/pdfCertificado.js";
import { cpfValido, emailValido, senhaValida, SENHA_MINIMA, SENHA_MAXIMA } from "../utils/validacao.js";
const rotas = Router();

// Valida antes do banco para responder 400 com mensagem clara, em vez de expor
// o erro da constraint do PostgreSQL. As regras não dependem do front-end (QA-08 / R5).
function validarCadastro({ cpf, nome, email, senha, aceite_termos }) {
  if (!cpf || !nome || !email || !senha) {
    return "Todos os campos (cpf, nome, email, senha) são obrigatórios.";
  }
  // Exige o booleano true: "sim", 1 ou um checkbox ausente não valem como aceite (LGPD, art. 8º)
  if (aceite_termos !== true) {
    return "Para criar a conta, aceite os Termos de Uso e a Política de Privacidade.";
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
    "senha": "senha-de-exemplo",
    "aceite_termos": true
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
curl -X POST http://localhost:3001/api/candidatos/me/termos -H "Authorization: Bearer SEU_TOKEN"
-> registra o aceite da versão vigente (contas antigas ou termos atualizados)
*/
rotas.post("/me/termos", autenticacao, capturar(async function (req, res) {
  if (!(await aceitarTermosService(req.candidatoId))) {
    return res.status(404).json({ erro: "Candidato não encontrado." });
  }
  res.status(204).end();
}));

/*
curl http://localhost:3001/api/candidatos/me/dados -H "Authorization: Bearer SEU_TOKEN"
-> todos os dados do candidato em JSON (LGPD, art. 18, II e V)
*/
rotas.get("/me/dados", autenticacao, capturar(async function (req, res) {
  const dados = await exportarDadosCandidatoService(req.candidatoId);
  if (!dados) {
    return res.status(404).json({ erro: "Candidato não encontrado." });
  }
  // Dados pessoais: nenhum cache intermediário ou do navegador guarda esta resposta
  res.set("Cache-Control", "no-store");
  res.json(dados);
}));

/*
curl -X PATCH http://localhost:3001/api/candidatos/me \
  -H "Content-Type: application/json" -H "Authorization: Bearer SEU_TOKEN" \
  -d '{"email":"novo@example.com"}'
*/
rotas.patch("/me", autenticacao, capturar(async function (req, res) {
  const { nome, email } = req.body ?? {};
  if (nome === undefined && email === undefined) {
    return res.status(400).json({ erro: "Informe o nome ou o e-mail." });
  }
  if (nome !== undefined && (typeof nome !== "string" || nome.trim().length === 0 || nome.length > 100)) {
    return res.status(400).json({ erro: "O nome deve ter entre 1 e 100 caracteres." });
  }
  if (email !== undefined && !emailValido(email)) {
    return res.status(400).json({ erro: "Informe um e-mail válido com até 100 caracteres." });
  }
  const resposta = await atualizarCandidatoService(req.candidatoId, {
    nome: nome?.trim(),
    email,
  });
  if (!resposta) {
    return res.status(404).json({ erro: "Candidato não encontrado." });
  }
  if (resposta.erro) {
    return res.status(409).json(resposta);
  }
  res.json(resposta);
}));

/*
curl -X DELETE http://localhost:3001/api/candidatos/me \
  -H "Content-Type: application/json" -H "Authorization: Bearer SEU_TOKEN" \
  -d '{"senha":"senha-de-exemplo"}'
-> 204: cadastro, respostas e certificado apagados
*/
rotas.delete("/me", autenticacao, capturar(async function (req, res) {
  const senha = req.body?.senha;
  if (typeof senha !== "string" || senha.length === 0) {
    return res.status(400).json({ erro: "Confirme a exclusão com a sua senha." });
  }
  if (confirmacaoBloqueada(req.candidatoId)) {
    return res.status(429).json({ erro: "Muitas tentativas. Aguarde alguns minutos e tente novamente." });
  }
  const resultado = await excluirContaService(req.candidatoId, senha);
  if (resultado.naoEncontrado) {
    return res.status(404).json({ erro: "Candidato não encontrado." });
  }
  if (resultado.senhaIncorreta) {
    registrarFalhaConfirmacao(req.candidatoId);
    // 403 e não 401: o token é válido, e o front-end não deve tratar como sessão expirada
    return res.status(403).json({ erro: "Senha incorreta." });
  }
  res.status(204).end();
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


/*
 GET /api/candidatos/certificado/pdf

 Emite o certificado, se necessário, e disponibiliza o PDF.
*/
rotas.get("/certificado/pdf", autenticacao, capturar(async function (req, res) {
    // Tenta emitir o certificado.
    const emissao = await emitirCertificadoService(req.candidatoId);

    if (emissao?.erro) {
        return res.status(400).json(emissao);
    }

    // Busca os dados completos do certificado.
    const certificado = await buscarCertificadoCandidatoService(
        req.candidatoId
    );

    if (!certificado) {
        return res.status(404).json({
            erro: "Certificado não encontrado."
        });
    }

    // Endereço público do sistema.
    const baseUrl = (
        process.env.APP_URL || `${req.protocol}://${req.get("host")}`
    ).replace(/\/+$/, "");

    // Gera o PDF com QR Code.
    const pdf = await gerarPdfCertificado(certificado, baseUrl);

    res.setHeader("Content-Type", "application/pdf");

    res.setHeader(
        "Content-Disposition",
        'attachment; filename="certificado-abp.pdf"'
    );

    res.send(pdf);
}));


export default rotas;
