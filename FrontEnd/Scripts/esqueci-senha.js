// Recuperação de senha: a tela valida os campos, mas o envio do link depende de um
// serviço de e-mail que o projeto ainda não tem. Por isso ela avisa o candidato em vez
// de fingir que enviou. Nenhum dado é enviado ao servidor.
const form = document.getElementById("form-recuperar");
const inputCpf = document.getElementById("cpf");
const inputEmail = document.getElementById("email");
const aviso = document.getElementById("aviso-recuperar");

inputCpf.addEventListener("input", () => {
    const numeros = inputCpf.value.replace(/\D/g, "").slice(0, 11);
    inputCpf.value = numeros
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    limparErro(inputCpf);
});
inputEmail.addEventListener("input", () => limparErro(inputEmail));

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

form.addEventListener("submit", (evento) => {
    evento.preventDefault();
    let valido = true;
    if (inputCpf.value.replace(/\D/g, "").length !== 11) {
        mostrarErro(inputCpf, "Informe os 11 dígitos do CPF.");
        valido = false;
    }
    if (!inputEmail.checkValidity() || inputEmail.value.trim() === "") {
        mostrarErro(inputEmail, "Informe um e-mail válido.");
        valido = false;
    }
    aviso.hidden = !valido;
});
