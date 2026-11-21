// Termos de Uso e Política de Privacidade: o "Voltar" devolve o candidato para onde ele
// estava (ex.: o cadastro já preenchido), em vez de ir sempre para a tela inicial.
const CHAVE_NOVA_ABA = "multicore:legal-nova-aba";
const btnVoltar = document.getElementById("btn-voltar");
const ehDocumentoLegal = (url) => /\/(termos-de-uso|politica-de-privacidade)\.html/.test(url);

// Aberto pelo link do cadastro (target="_blank"): a aba começa com uma única entrada no
// histórico. O sessionStorage é da aba, então a marca não vaza para outras abas.
try {
    if (history.length === 1) sessionStorage.setItem(CHAVE_NOVA_ABA, "1");
} catch { /* sem armazenamento: cai no comportamento padrão do link */ }

const abertoEmNovaAba = () => {
    try { return sessionStorage.getItem(CHAVE_NOVA_ABA) === "1"; } catch { return false; }
};
const veioDoPortal = () => {
    try { return new URL(document.referrer).origin === location.origin; } catch { return false; }
};

if (abertoEmNovaAba()) {
    btnVoltar.lastChild.textContent = " Fechar e voltar";
}

btnVoltar.addEventListener("click", (evento) => {
    if (abertoEmNovaAba()) {
        evento.preventDefault();
        window.close();
        // Se o navegador não deixar fechar, segue o link (tela inicial)
        setTimeout(() => { location.href = btnVoltar.href; }, 300);
    } else if (veioDoPortal() && history.length > 1) {
        // Volta no histórico: o navegador restaura o formulário como estava
        evento.preventDefault();
        history.back();
    }
});

// Ir de um documento para o outro substitui a entrada do histórico: assim um único
// "Voltar" sempre retorna à página de origem, e não ao documento anterior.
document.addEventListener("click", (evento) => {
    const link = evento.target.closest("a[href]");
    if (!link || link === btnVoltar || link.target === "_blank") return;
    const destino = new URL(link.href, location.href);
    if (destino.origin === location.origin && ehDocumentoLegal(destino.pathname)
        && destino.pathname !== location.pathname) {
        evento.preventDefault();
        location.replace(destino.href);
    }
});
