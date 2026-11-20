const form = document.getElementById("form-login");
const inputCpf = document.getElementById("cpf");
const inputSenha = document.getElementById("senha");
const btnOlho = document.getElementById("btn-olho");
const btnEntrar = document.getElementById("btn-entrar");

if (new URLSearchParams(location.search).get("expired") === "true") {
    document.getElementById("aviso-sessao").hidden = false;
}

// Máscara de CPF: 000.000.000-00
inputCpf.addEventListener("input", () => {
    const numeros = inputCpf.value.replace(/\D/g, "").slice(0, 11);
    inputCpf.value = numeros
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    limparErro(inputCpf);
});

inputSenha.addEventListener("input", () => limparErro(inputSenha));

// Mostrar / ocultar senha
btnOlho.addEventListener("click", () => {
    const visivel = inputSenha.type === "password";
    inputSenha.type = visivel ? "text" : "password";
    btnOlho.classList.toggle("visivel", visivel);
    btnOlho.setAttribute("aria-pressed", visivel);
    btnOlho.setAttribute("aria-label", visivel ? "Ocultar senha" : "Mostrar senha");
});

// Validação dos dígitos verificadores do CPF
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

form.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    let valido = true;

    if (!cpfValido(inputCpf.value)) {
        mostrarErro(inputCpf, "Informe um CPF válido.");
        valido = false;
    }
    if (inputSenha.value.trim() === "") {
        mostrarErro(inputSenha, "Informe sua senha.");
        valido = false;
    }
    if (!valido) return;

    btnEntrar.disabled = true;
    try {
        const sessao = await MultiCore.api("/login", {
            corpo: { cpf: inputCpf.value.replace(/\D/g, ""), senha: inputSenha.value },
            semRedirecionar: true,
        });
        // A senha não é guardada: só o token, no sessionStorage
        MultiCore.salvarToken(sessao.token);
        location.href = "menu.html";
    } catch (erro) {
        if (erro.status === 401) mostrarErro(inputSenha, "CPF ou senha incorretos.");
        // 429: muitas tentativas erradas; a API manda uma mensagem pensada para o usuário
        else if (erro.status === 429) mostrarErro(inputSenha, erro.message);
        else {
            console.error("Erro ao autenticar:", erro.message);
            mostrarErro(inputSenha, "Não foi possível entrar agora. Tente novamente.");
        }
    } finally {
        btnEntrar.disabled = false;
    }
});
