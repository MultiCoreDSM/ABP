// Certificado do candidato. Só existe depois da aprovação (o resultado.html emite).
// Conteúdo exigido pelo RF18 do documento oficial: nome completo, CPF, e-mail, data e
// hora de emissão, nota final e percentual de acertos (DP-02 revista em 12/11/2026).
const $ = (id) => document.getElementById(id);

const formatarCpf = (cpf) => cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");

if (MultiCore.exigirLogin()) carregar();

function linkValidacao(codigo) {
    return new URL(`validacao.html?codigo=${codigo}`, location.href).href;
}

function mostrarEstado(mensagem, comAcao = false) {
    $("estado-mensagem").textContent = mensagem;
    $("estado-acao").hidden = !comAcao;
}

async function carregar() {
    try {
        const certificado = await MultiCore.api("/candidatos/certificado");
        const { titular } = certificado;

        const aproveitamento = `${certificado.percentual}%`;
        const nota = `${certificado.acertos} de ${certificado.total}`;
        const emitidoEm = MultiCore.formatarData(certificado.emitido_em, true);

        $("folha-nome").textContent = titular.nome;
        $("folha-cpf").textContent = formatarCpf(titular.cpf);
        $("folha-email").textContent = titular.email;
        $("folha-nota").textContent = nota;
        $("folha-percentual").textContent = aproveitamento;
        $("folha-data").textContent = emitidoEm;
        $("folha-codigo").textContent = certificado.codigo.toUpperCase();

        $("painel-nome").textContent = titular.nome;
        $("painel-cpf").textContent = formatarCpf(titular.cpf);
        $("painel-email").textContent = titular.email;
        $("painel-aproveitamento").textContent = `${nota} · ${aproveitamento}`;
        $("painel-data").textContent = emitidoEm;
        // No painel, o código aparece abreviado; o completo está na folha e no link
        $("painel-codigo").textContent = `${certificado.codigo.slice(0, 8).toUpperCase()}…${certificado.codigo.slice(-6).toUpperCase()}`;
        $("painel-codigo").title = certificado.codigo.toUpperCase();

        const link = linkValidacao(certificado.codigo);
        $("btn-validar").href = link;
        $("btn-compartilhar").addEventListener("click", () => compartilhar(link));

        document.title = `Certificado de ${MultiCore.primeiroNome(titular.nome)} | MultiCore`;
        $("estado").hidden = true;
        $("conteudo").hidden = false;
    } catch (erro) {
        if (erro.status === 404) {
            mostrarEstado("Você ainda não tem um certificado. Ele é emitido quando você conclui os 12 temas com pelo menos 65% de acertos.", true);
        } else {
            console.error("Erro ao carregar o certificado:", erro.message);
            mostrarEstado("Não foi possível carregar o certificado. Verifique sua conexão e tente novamente.");
        }
    }
}

// Baixar PDF: a impressão do navegador mostra só a folha (ver @media print)
$("btn-pdf").addEventListener("click", () => window.print());

async function compartilhar(link) {
    const texto = $("btn-compartilhar-texto");
    try {
        await navigator.clipboard.writeText(link);
        texto.textContent = "Link copiado!";
    } catch {
        // Sem acesso à área de transferência: mostra o link para copiar manualmente
        window.prompt("Copie o link de validação:", link);
    }
    setTimeout(() => { texto.textContent = "Compartilhar link"; }, 2500);
}
