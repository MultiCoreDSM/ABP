// Validação pública do certificado (BL-21). Não exige login.
// A API busca só pelo código e devolve só os dados aprovados (RN-09).
const $ = (id) => document.getElementById(id);
const form = $("form-validar");
const inputCodigo = $("codigo");
const CODIGO = /^[0-9a-f]{64}$/;

inputCodigo.addEventListener("input", () => {
    inputCodigo.closest(".campo").classList.remove("invalido");
    $("erro-codigo").textContent = "";
});

async function validar(codigo) {
    $("resultado").hidden = true;
    $("nao-encontrado").hidden = true;

    if (!CODIGO.test(codigo)) {
        inputCodigo.closest(".campo").classList.add("invalido");
        $("erro-codigo").textContent = "O código tem 64 caracteres, com números e letras de A a F.";
        return;
    }

    $("btn-validar").disabled = true;
    try {
        const certificado = await MultiCore.api(`/certificados/${codigo}`);
        $("nome").textContent = certificado.nome;
        $("cpf").textContent = certificado.cpf;
        $("percentual").textContent = `${certificado.percentual}%`;
        $("emitido").textContent = MultiCore.formatarData(certificado.emitido_em);
        $("situacao").textContent = certificado.situacao;
        $("resultado").hidden = false;
    } catch (erro) {
        if (erro.status !== 404) console.error("Erro ao validar o certificado:", erro.message);
        $("nao-encontrado").textContent = erro.status === 404
            ? "Nenhum certificado encontrado com este código. Confira se ele foi digitado completo."
            : "Não foi possível validar agora. Tente novamente em instantes.";
        $("nao-encontrado").hidden = false;
    } finally {
        $("btn-validar").disabled = false;
    }
}

form.addEventListener("submit", (evento) => {
    evento.preventDefault();
    validar(inputCodigo.value.trim().toLowerCase());
});

// Aberta pelo link ou QR Code do certificado: ?codigo=...
const pedido = new URLSearchParams(location.search).get("codigo");
if (pedido) {
    inputCodigo.value = pedido;
    validar(pedido.trim().toLowerCase());
}
