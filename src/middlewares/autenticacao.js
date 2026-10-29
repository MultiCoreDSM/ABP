import jwt from "jsonwebtoken";

export default function autenticacao(req, res, next) {
  const segredo = process.env.JWT_SECRET;
  // O cliente envia: Authorization: Bearer TOKEN
  const autorizacao = req.get("Authorization");
  if (!autorizacao) {
    return res.status(401).json({ erro: "Token obrigatório" });
  }

  const partes = autorizacao.split(" ");
  const tipo = partes[0];
  const token = partes[1];
  if (tipo.toLowerCase() !== "bearer" || !token) {
    res.status(401).json({ erro: "Use Authorization: Bearer TOKEN" });
  } else {
    // Verifica assinatura, validade, emissor e destinatário.
    const dados = jwt.verify(token, segredo, {
      algorithms: ["HS256"],
      issuer: "portal-certificacao-api",
      audience: "portal-certificacao",
    });
    const candidatoId = Number(dados.sub);
    if (!Number.isSafeInteger(candidatoId)) {
      return res.status(401).json({ erro: "Candidato inválido" });
    }
    // Guardo o ID para a próxima função da rota.
    req.candidatoId = candidatoId;

    next();
  }
}
