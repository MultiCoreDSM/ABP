import jwt from "jsonwebtoken";

export default function autenticacao(req, res, next) {
  const segredo = process.env.JWT_SECRET;
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
    try {
      const dados = jwt.verify(token, segredo, {
        algorithms: ["HS256"],
        issuer: "portal-certificacao-api",
        audience: "portal-certificacao",
      });
      const candidatoId = Number(dados.sub);
      if (!Number.isSafeInteger(candidatoId)) {
        return res.status(401).json({ erro: "Candidato inválido" });
      }
      req.candidatoId = candidatoId;

      next();
    } catch (err) {
      return res.status(401).json({ erro: "Token inválido ou expirado" });
    }
  }
}

