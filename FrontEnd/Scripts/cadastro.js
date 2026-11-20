const form = document.getElementById("form-cadastro");
const telaFormulario = document.getElementById("screen-form");
const telaSucesso = document.getElementById("screen-success");
const inputCpf = document.getElementById("cpf");
const inputNome = document.getElementById("nome");
const inputEmail = document.getElementById("email");
const inputSenha = document.getElementById("senha");
const btnOlho = document.getElementById("btn-olho");
const btnCadastrar = document.getElementById("btn-cadastrar");
const btnIniciar = document.getElementById("btn-iniciar");
const erroCadastro = document.getElementById("erro-cadastro");

const SENHA_MINIMA = 8;

// Máscara de CPF: 000.000.000-00
inputCpf.addEventListener("input", () => {
    const numeros = inputCpf.value.replace(/\D/g, "").slice(0, 11);
    inputCpf.value = numeros
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
});

for (const input of [inputCpf, inputNome, inputEmail, inputSenha]) {
    input.addEventListener("input", () => limparErro(input));
}

// Mostrar / ocultar senha
btnOlho.addEventListener("click", () => {
    const visivel = inputSenha.type === "password";
    inputSenha.type = visivel ? "text" : "password";
    btnOlho.classList.toggle("visivel", visivel);
    btnOlho.setAttribute("aria-pressed", visivel);
    btnOlho.setAttribute("aria-label", visivel ? "Ocultar senha" : "Mostrar senha");
});

// Validação dos dígitos verificadores do CPF (a mesma do login e do servidor)
function cpfValido(cpf) {
    const numeros = cpf.replace(/\D/g, "");
    if (numeros.length !== 11 || /^(\d)\1+$/.test(numeros)) return false;

    for (let t = 9; t < 11; t++) {
        let soma = 0;
        for (let i = 0; i < t; i++) {
            soma += Number(numeros[i]) * (t + 1 - i);
        }
        const digito = ((soma * 10) % 11) % 10;
        if (digito !== Number(numeros[t])) return false;
    }
    return true;
}

function mostrarErro(input, mensagem) {
    input.closest(".campo").classList.add("invalido");
    input.setAttribute("aria-invalid", "true");
    document.getElementById(`erro-${input.id}`).textContent = mensagem;
}

function limparErro(input) {
    input.closest(".campo").classList.remove("invalido");
    input.removeAttribute("aria-invalid");
    document.getElementById(`erro-${input.id}`).textContent = "";
}

function validar() {
    let valido = true;
    if (!cpfValido(inputCpf.value)) {
        mostrarErro(inputCpf, "Informe um CPF válido.");
        valido = false;
    }
    if (inputNome.value.trim() === "") {
        mostrarErro(inputNome, "Informe seu nome completo.");
        valido = false;
    }
    if (!inputEmail.checkValidity() || inputEmail.value.trim() === "") {
        mostrarErro(inputEmail, "Informe um e-mail válido.");
        valido = false;
    }
    if (inputSenha.value.length < SENHA_MINIMA) {
        mostrarErro(inputSenha, `A senha deve ter pelo menos ${SENHA_MINIMA} caracteres.`);
        valido = false;
    }
    return valido;
}

function mostrarErroCadastro(mensagem) {
    erroCadastro.textContent = mensagem;
    erroCadastro.hidden = false;
}

// Entra logo após o cadastro para o "Sim, iniciar agora" não pedir a senha de novo.
// A senha não fica guardada: só o token, no sessionStorage (como no login).
async function entrarAutomaticamente(cpf, senha) {
    try {
        const sessao = await MultiCore.api("/login", { corpo: { cpf, senha }, semRedirecionar: true });
        MultiCore.salvarToken(sessao.token);
    } catch (erro) {
        console.error("Erro ao entrar após o cadastro:", erro.message);
    }
}

form.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    erroCadastro.hidden = true;
    if (!validar()) return;

    const cpf = inputCpf.value.replace(/\D/g, "");
    const senha = inputSenha.value;

    btnCadastrar.disabled = true;
    try {
        await MultiCore.api("/candidatos", {
            corpo: { cpf, nome: inputNome.value.trim(), email: inputEmail.value.trim(), senha },
            semRedirecionar: true,
        });
        await entrarAutomaticamente(cpf, senha);
        form.reset();
        telaFormulario.hidden = true;
        telaSucesso.hidden = false;
        btnIniciar.focus();
    } catch (erro) {
        // 400 traz uma mensagem pensada para o usuário (ex.: "CPF já cadastrado.")
        if (erro.status === 400) mostrarErroCadastro(erro.message);
        else {
            console.error("Erro ao cadastrar:", erro.message);
            mostrarErroCadastro("Não foi possível concluir o cadastro agora. Tente novamente.");
        }
    } finally {
        btnCadastrar.disabled = false;
    }
});

// Se o login automático falhou, a prova mandaria para o login de qualquer forma
btnIniciar.addEventListener("click", () => {
    location.href = MultiCore.logado() ? "questao.html" : "login.html";
});
