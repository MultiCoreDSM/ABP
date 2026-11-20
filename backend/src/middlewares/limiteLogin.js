// Limite de tentativas de login (QA-08 / R5).
// Conta as falhas por IP e por CPF numa janela de tempo. Ao passar do limite,
// o login responde 429 até a janela acabar, o que torna inviável testar senhas
// em sequência ou varrer CPFs. Fica em memória: zera quando o servidor reinicia
// e não é compartilhado entre instâncias (suficiente para uma instância só).

const JANELA_MS = 15 * 60 * 1000;
const MAX_FALHAS_CPF = 5;
// Um IP pode errar mais vezes que um CPF (vários candidatos na mesma rede do laboratório)
const MAX_FALHAS_IP = 20;

const falhas = new Map();

function registro(chave, agora) {
  const atual = falhas.get(chave);
  if (!atual || agora - atual.inicio >= JANELA_MS) return null;
  return atual;
}

function bloqueadoPor(chave, limite, agora) {
  const atual = registro(chave, agora);
  return atual && atual.quantidade >= limite ? atual : null;
}

function chaves(req) {
  const cpf = typeof req.body?.cpf === "string" ? req.body.cpf : "";
  return { ip: `ip:${req.ip}`, cpf: `cpf:${cpf}` };
}

// Middleware: barra a requisição antes de consultar o banco
export function verificarLimiteLogin(req, res, next) {
  const agora = Date.now();
  const { ip, cpf } = chaves(req);
  const bloqueio = bloqueadoPor(ip, MAX_FALHAS_IP, agora) ?? bloqueadoPor(cpf, MAX_FALHAS_CPF, agora);
  if (bloqueio) {
    const segundos = Math.ceil((bloqueio.inicio + JANELA_MS - agora) / 1000);
    res.set("Retry-After", String(segundos));
    return res.status(429).json({ erro: "Muitas tentativas de login. Aguarde alguns minutos e tente novamente." });
  }
  next();
}

export function registrarFalhaLogin(req) {
  const agora = Date.now();
  for (const chave of Object.values(chaves(req))) {
    const atual = registro(chave, agora);
    if (atual) atual.quantidade++;
    else falhas.set(chave, { quantidade: 1, inicio: agora });
  }
}

// Login certo zera o contador do CPF (o do IP continua, para não liberar varredura)
export function registrarSucessoLogin(req) {
  falhas.delete(chaves(req).cpf);
}

// Remove janelas vencidas para o Map não crescer sem limite
setInterval(() => {
  const agora = Date.now();
  for (const [chave, atual] of falhas) {
    if (agora - atual.inicio >= JANELA_MS) falhas.delete(chave);
  }
}, JANELA_MS).unref();
