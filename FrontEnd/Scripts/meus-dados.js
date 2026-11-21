// Meus dados: acesso, correção, portabilidade e eliminação (LGPD, art. 18).
// Tudo passa pela API autenticada: o candidato vem do token, nunca da página.
const estado = document.getElementById("estado");
const secoes = document.getElementById("secoes");
const formDados = document.getElementById("form-dados");
const inputCpf = document.getElementById("cpf");
const inputNome = document.getElementById("nome");
const inputEmail = document.getElementById("email");
const ajudaNome = document.getElementById("ajuda-nome");
const avisoDados = document.getElementById("aviso-dados");
const btnSalvar = document.getElementById("btn-salvar");
const btnBaixar = document.getElementById("btn-baixar");

const dialogo = document.getElementById("dialogo-excluir");
const formExcluir = document.getElementById("form-excluir");
const inputSenha = document.getElementById("senha-excluir");
const inputConfirma = document.getElementById("confirma-excluir");
const btnConfirmarExcluir = document.getElementById("btn-confirmar-excluir");

let salvo = { nome: "", email: "" };

const formatarCpf = (cpf) => cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");

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

function mostrarAviso(mensagem, sucesso) {
    avisoDados.textContent = mensagem;
    avisoDados.classList.toggle("aviso-sucesso", sucesso);
    avisoDados.hidden = false;
}

/* ===== Acesso ===== */
function preencher(dados) {
    const { cadastro, consentimento, respostas, certificado } = dados;
    salvo = { nome: cadastro.nome, email: cadastro.email };

    inputCpf.value = formatarCpf(cadastro.cpf);
    inputNome.value = cadastro.nome;
    inputEmail.value = cadastro.email;

    // Nome gravado no certificado emitido não muda (mesma regra do servidor)
    inputNome.readOnly = Boolean(certificado);
    ajudaNome.hidden = !certificado;

    document.getElementById("criado-em").textContent = MultiCore.formatarData(cadastro.criado_em, true);
    document.getElementById("termos-aceitos").textContent = consentimento.aceito_em
        ? `${MultiCore.formatarData(consentimento.aceito_em, true)} (versão ${consentimento.termos_versao})`
        : "Ainda não aceitos";
    const encerradas = respostas.filter((r) => r.data_horario_resposta).length;
    document.getElementById("respostas").textContent = `${encerradas} de 12`;
    document.getElementById("certificado").textContent = certificado
        ? `Emitido em ${MultiCore.formatarData(certificado.emitido_em, true)}`
        : "Não emitido";
}

async function carregar() {
    try {
        preencher(await MultiCore.api("/candidatos/me/dados"));
        estado.hidden = true;
        secoes.hidden = false;
    } catch (erro) {
        console.error("Erro ao carregar os dados:", erro.message);
        estado.textContent = "Não foi possível carregar seus dados. Tente novamente em instantes.";
    }
}

/* ===== Correção ===== */
for (const input of [inputNome, inputEmail]) {
    input.addEventListener("input", () => {
        limparErro(input);
        avisoDados.hidden = true;
    });
}

formDados.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    avisoDados.hidden = true;

    const nome = inputNome.value.trim();
    const email = inputEmail.value.trim();
    let valido = true;
    if (nome === "") {
        mostrarErro(inputNome, "Informe seu nome completo.");
        valido = false;
    }
    if (!inputEmail.checkValidity() || email === "") {
        mostrarErro(inputEmail, "Informe um e-mail válido.");
        valido = false;
    }
    if (!valido) return;

    // Envia só o que mudou
    const corpo = {};
    if (nome !== salvo.nome && !inputNome.readOnly) corpo.nome = nome;
    if (email !== salvo.email) corpo.email = email;
    if (Object.keys(corpo).length === 0) {
        mostrarAviso("Nenhuma alteração para salvar.", true);
        return;
    }

    btnSalvar.disabled = true;
    try {
        const atualizado = await MultiCore.api("/candidatos/me", { method: "PATCH", corpo });
        salvo = { nome: atualizado.nome, email: atualizado.email };
        inputNome.value = atualizado.nome;
        inputEmail.value = atualizado.email;
        mostrarAviso("Dados atualizados.", true);
    } catch (erro) {
        mostrarAviso(erro.status === 400 || erro.status === 409
            ? erro.message
            : "Não foi possível salvar agora. Tente novamente.", false);
    } finally {
        btnSalvar.disabled = false;
    }
});

/* ===== Portabilidade ===== */
btnBaixar.addEventListener("click", async () => {
    btnBaixar.disabled = true;
    try {
        const dados = await MultiCore.api("/candidatos/me/dados");
        const arquivo = new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(arquivo);
        const link = document.createElement("a");
        link.href = url;
        // Nome do arquivo sem CPF ou nome: ele pode ficar em pastas compartilhadas
        link.download = "meus-dados-multicore.json";
        link.click();
        URL.revokeObjectURL(url);
    } catch (erro) {
        console.error("Erro ao baixar os dados:", erro.message);
        btnBaixar.textContent = "Falhou. Tentar de novo";
    } finally {
        btnBaixar.disabled = false;
    }
});

/* ===== Eliminação ===== */
document.getElementById("btn-excluir").addEventListener("click", () => {
    formExcluir.reset();
    limparErro(inputSenha);
    limparErro(inputConfirma);
    dialogo.showModal();
    inputSenha.focus();
});

document.getElementById("btn-cancelar-excluir").addEventListener("click", () => dialogo.close());
inputSenha.addEventListener("input", () => limparErro(inputSenha));
inputConfirma.addEventListener("change", () => limparErro(inputConfirma));

formExcluir.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    let valido = true;
    if (inputSenha.value === "") {
        mostrarErro(inputSenha, "Informe sua senha.");
        valido = false;
    }
    if (!inputConfirma.checked) {
        mostrarErro(inputConfirma, "Marque a confirmação para continuar.");
        valido = false;
    }
    if (!valido) return;

    btnConfirmarExcluir.disabled = true;
    try {
        await MultiCore.api("/candidatos/me", { method: "DELETE", corpo: { senha: inputSenha.value } });
        inputSenha.value = "";
        MultiCore.sair("inicial.html");
    } catch (erro) {
        if (erro.status === 403 || erro.status === 429) mostrarErro(inputSenha, erro.message);
        else mostrarErro(inputSenha, "Não foi possível excluir a conta agora. Tente novamente.");
    } finally {
        btnConfirmarExcluir.disabled = false;
    }
});

if (MultiCore.exigirLogin()) carregar();
