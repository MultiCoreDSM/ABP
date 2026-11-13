// Express 4 não captura promessas rejeitadas: sem este wrapper, um erro do banco
// em uma rota async vira rejeição não tratada e derruba o processo Node.
export function capturar(rota) {
  return function (req, res, next) {
    Promise.resolve(rota(req, res, next)).catch(next);
  };
}

// Converte um parâmetro de rota em inteiro positivo; retorna null se for inválido
export function idPositivo(valor) {
  const id = Number(valor);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

// Último middleware: nunca devolve detalhes internos (mensagens do PostgreSQL,
// do jsonwebtoken, stack trace) ao cliente. O detalhe fica só no log do servidor.
// eslint-disable-next-line no-unused-vars
export function tratarErros(err, req, res, next) {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ erro: "JSON inválido no corpo da requisição." });
  }
  if (err.type === "entity.too.large") {
    return res.status(413).json({ erro: "Corpo da requisição muito grande." });
  }

  // Registra método, rota e erro; nunca o corpo da requisição (pode conter senha e CPF)
  console.error(`[erro] ${req.method} ${req.originalUrl}:`, err.message);
  if (res.headersSent) return;
  res.status(500).json({ erro: "Erro interno. Tente novamente mais tarde." });
}
