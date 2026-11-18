import { Router } from "express";
import { validarCertificadoService } from "../services/candidatos.js";
import { capturar } from "../middlewares/erros.js";

// Validação pública do certificado (BL-21), aberta pelo QR Code. Não exige token.
// Busca só pelo código e devolve só os dados aprovados pelo PO (RN-09):
// nome, CPF mascarado, data de emissão, percentual e situação. Nunca e-mail.
const rotas = Router();

// O código é gerado com randomBytes(32): 64 caracteres hexadecimais
const CODIGO = /^[0-9a-f]{64}$/;

/*
curl http://localhost:3001/api/certificados/CODIGO
*/
rotas.get("/:codigo", capturar(async function (req, res) {
  const codigo = String(req.params.codigo).toLowerCase();
  const certificado = CODIGO.test(codigo) ? await validarCertificadoService(codigo) : null;
  if (!certificado) {
    // Mesma resposta para código mal formado ou inexistente: não revela nada
    return res.status(404).json({ erro: "Certificado não encontrado." });
  }
  res.json(certificado);
}));

export default rotas;
