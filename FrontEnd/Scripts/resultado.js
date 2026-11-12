// Resultado da certificação: nota, situação (≥ 65% aprova) e detalhamento por tema.
// Quando aprovado, emite o certificado (a API devolve o mesmo se já foi emitido).
const PERCENTUAL_MINIMO = 65;

const $ = (id) => document.getElementById(id);
const icone = {
    certo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
    errado: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
};

if (MultiCore.exigirLogin()) carregar();

function mostrarEstado(mensagem, podeContinuar = false) {
    $("estado-mensagem").textContent = mensagem;
    $("estado-acoes").hidden = !podeContinuar;
    $("estado").hidden = false;
    $("conteudo").hidden = true;
}

function renderizarTemas(temas) {
    const modelo = $("modelo-tema");
    $("lista-temas").replaceChildren(...temas.map((tema) => {
        const item = modelo.content.cloneNode(true).querySelector("li");
        item.querySelector(".tema-numero").textContent = MultiCore.doisDigitos(tema.ordem);
        item.querySelector(".tema-nome").textContent = tema.nome;
        const etiqueta = item.querySelector(".etiqueta");
        etiqueta.classList.add(tema.acertou ? "etiqueta-sucesso" : "etiqueta-erro");
        etiqueta.innerHTML = `${tema.acertou ? icone.certo : icone.errado}${tema.acertou ? "Correta" : "Incorreta"}`;
        return item;
    }));
}

async function carregar() {
    try {
        const resultado = await MultiCore.api("/certificacao/resultado");
        if (!resultado.concluida) {
            mostrarEstado(
                `Você respondeu ${resultado.respondidos} de ${resultado.total} temas. O resultado fica disponível depois de concluir todos.`,
                true,
            );
            return;
        }

        const percentual = MultiCore.percentual(resultado.acertos, resultado.total);
        const aprovado = percentual >= PERCENTUAL_MINIMO;

        $("acertos").textContent = resultado.acertos;
        $("total").textContent = resultado.total;
        $("anel-percentual").textContent = `${percentual}%`;
        $("percentual-texto").textContent = `${percentual}% de acertos`;
        $("anel").classList.toggle("reprovado", !aprovado);
        // Pequeno atraso para o anel preencher com animação
        requestAnimationFrame(() => $("anel").style.setProperty("--valor", percentual));

        const situacao = $("situacao");
        situacao.classList.add(aprovado ? "etiqueta-sucesso" : "etiqueta-erro");
        situacao.innerHTML = `${aprovado ? icone.certo : icone.errado}${aprovado ? "Aprovado" : "Não aprovado"} · mínimo ${PERCENTUAL_MINIMO}%`;

        if (!aprovado) {
            $("titulo").innerHTML = 'Certificação <span class="destaque">finalizada</span>';
            $("subtitulo").textContent = `Desta vez não foi: o mínimo para aprovação é ${PERCENTUAL_MINIMO}%. Confira as respostas para revisar os temas.`;
        }

        renderizarTemas(resultado.temas);
        $("estado").hidden = true;
        $("conteudo").hidden = false;

        await atualizarCertificado(aprovado);
    } catch (erro) {
        console.error("Erro ao carregar o resultado:", erro.message);
        mostrarEstado("Não foi possível carregar o resultado. Verifique sua conexão e tente novamente.");
    }
}

async function atualizarCertificado(aprovado) {
    if (!aprovado) {
        $("certificado-status").textContent = "Indisponível";
        $("certificado-descricao").textContent = `O certificado exige ${PERCENTUAL_MINIMO}% de acertos.`;
        return;
    }
    try {
        await MultiCore.api("/candidatos/certificado", { method: "POST" });
        $("certificado-status").textContent = "Disponível";
        $("link-certificado").hidden = false;
        $("btn-baixar").hidden = false;
    } catch (erro) {
        console.error("Erro ao emitir o certificado:", erro.message);
        $("certificado-status").textContent = "Indisponível";
        $("certificado-descricao").textContent = "Não foi possível emitir o certificado agora. Recarregue a página.";
    }
}
