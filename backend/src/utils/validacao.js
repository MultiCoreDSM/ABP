// Regras de validação compartilhadas pelas rotas de cadastro e login

export const SENHA_MINIMA = 8;
// O bcrypt só considera os primeiros 72 bytes; acima disso, a senha seria truncada sem aviso
export const SENHA_MAXIMA = 72;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Confere o formato (11 dígitos) e os dois dígitos verificadores do CPF
export function cpfValido(cpf) {
  if (typeof cpf !== "string" || !/^[0-9]{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) {
    return false;
  }
  for (let tamanho = 9; tamanho < 11; tamanho++) {
    let soma = 0;
    for (let i = 0; i < tamanho; i++) {
      soma += Number(cpf[i]) * (tamanho + 1 - i);
    }
    const digito = ((soma * 10) % 11) % 10;
    if (digito !== Number(cpf[tamanho])) return false;
  }
  return true;
}

export function emailValido(email) {
  return typeof email === "string" && email.length <= 100 && EMAIL.test(email);
}

export function senhaValida(senha) {
  return typeof senha === "string"
    && senha.length >= SENHA_MINIMA
    && Buffer.byteLength(senha, "utf8") <= SENHA_MAXIMA;
}
