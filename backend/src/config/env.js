// Centralizacao e validacao das variaveis de ambiente (OPS-04).
// Nunca imprime valores de segredos (JWT_SECRET, POSTGRES_PASSWORD) em erros ou logs.

function parsePorta(valor, padrao, nome) {
  if (valor === undefined || valor === "") return padrao;
  const numero = Number(valor);
  if (!Number.isInteger(numero) || numero < 1 || numero > 65535) {
    throw new Error(`Variavel de ambiente ${nome} invalida: informe uma porta numerica entre 1 e 65535.`);
  }
  return numero;
}

function normalizarUrlPublica(valor) {
  if (!valor || typeof valor !== "string" || valor.trim() === "") return "";
  const limpa = valor.trim().replace(/\/+$/, "");
  try {
    const parsed = new URL(limpa);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error("protocolo invalido");
    }
  } catch {
    throw new Error("Variavel de ambiente APP_URL invalida: use uma URL completa com http:// ou https://.");
  }
  return limpa;
}

export function validarVariaveisBanco(envSource = process.env) {
  const obrigatorias = ["POSTGRES_DB", "POSTGRES_USER", "POSTGRES_PASSWORD"];
  const faltando = obrigatorias.filter((chave) => !envSource[chave] || String(envSource[chave]).trim() === "");
  if (faltando.length > 0) {
    throw new Error(
      `Configuracao de banco incompleta. Defina no .env: ${faltando.join(", ")}. Consulte .env.example.`
    );
  }
  return {
    host: envSource.POSTGRES_HOST || "localhost",
    port: parsePorta(envSource.POSTGRES_PORT, 5432, "POSTGRES_PORT"),
    database: envSource.POSTGRES_DB,
    user: envSource.POSTGRES_USER,
    password: String(envSource.POSTGRES_PASSWORD),
  };
}

export function validarVariaveisJwt(envSource = process.env) {
  const secret = envSource.JWT_SECRET;
  if (!secret || String(secret).trim() === "") {
    throw new Error("Variavel obrigatoria JWT_SECRET nao definida no .env. Consulte .env.example.");
  }
  const expiresIn = (envSource.JWT_EXPIRES_IN || "1h").trim();
  if (!/^\d+[smhd]$/.test(expiresIn) && !/^\d+$/.test(expiresIn)) {
    throw new Error("Variavel JWT_EXPIRES_IN invalida: use formato como 30m, 1h, 2h ou segundos.");
  }
  return {
    secret: String(secret),
    expiresIn,
  };
}

export function calcularSegundosExpiracao(expiresIn) {
  if (/^\d+$/.test(expiresIn)) return Number(expiresIn);
  const match = /^(\d+)([smhd])$/.exec(expiresIn);
  if (!match) return 3600;
  const valor = Number(match[1]);
  const fatores = { s: 1, m: 60, h: 3600, d: 86400 };
  return valor * fatores[match[2]];
}

export function carregarConfiguracao({ exigirJwt = false, envSource = process.env } = {}) {
  const postgres = validarVariaveisBanco(envSource);
  const jwt = exigirJwt
    ? validarVariaveisJwt(envSource)
    : {
        secret: envSource.JWT_SECRET || "",
        expiresIn: (envSource.JWT_EXPIRES_IN || "1h").trim(),
      };

  return {
    appPort: parsePorta(envSource.APP_PORT, 3001, "APP_PORT"),
    appUrl: normalizarUrlPublica(envSource.APP_URL),
    postgres,
    jwt,
  };
}

// Validacao imediata das configuracoes de banco e aplicacao ao importar o modulo
export const config = carregarConfiguracao({ exigirJwt: false });
