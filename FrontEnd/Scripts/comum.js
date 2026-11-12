// Funções compartilhadas pelas páginas (carregar antes do script da página).
// O front-end é servido pelo próprio back-end, então a API fica na mesma origem.

const MultiCore = (() => {
    const CHAVE_TOKEN = "multicore:token";
    const TEMPO_LIMITE_MS = 15000;

    /* ===== Sessão ===== */
    // O token fica no sessionStorage: some ao fechar a aba e nunca vai na URL
    const token = () => sessionStorage.getItem(CHAVE_TOKEN);
    const logado = () => Boolean(token());
    const salvarToken = (valor) => sessionStorage.setItem(CHAVE_TOKEN, valor);

    function sair(destino = "inicial.html") {
        sessionStorage.removeItem(CHAVE_TOKEN);
        location.href = destino;
    }

    // Páginas que exigem login chamam isto logo no início
    function exigirLogin() {
        if (!logado()) location.replace("login.html");
        return logado();
    }

    /* ===== API ===== */
    async function api(caminho, opcoes = {}) {
        const cabecalhos = { ...opcoes.headers };
        if (opcoes.corpo !== undefined) cabecalhos["Content-Type"] = "application/json";
        if (logado()) cabecalhos.Authorization = `Bearer ${token()}`;

        const resposta = await fetch(`/api${caminho}`, {
            method: opcoes.method || (opcoes.corpo !== undefined ? "POST" : "GET"),
            headers: cabecalhos,
            body: opcoes.corpo !== undefined ? JSON.stringify(opcoes.corpo) : undefined,
            signal: AbortSignal.timeout(TEMPO_LIMITE_MS),
        });
        const corpo = await resposta.json().catch(() => ({}));

        // Token vencido ou inválido: volta ao login avisando que a sessão expirou
        if (resposta.status === 401 && logado() && !opcoes.semRedirecionar) {
            sessionStorage.removeItem(CHAVE_TOKEN);
            location.replace("login.html?expired=true");
        }
        if (!resposta.ok) {
            const erro = new Error(corpo.erro || `A API respondeu com status ${resposta.status}`);
            erro.status = resposta.status;
            erro.corpo = corpo;
            throw erro;
        }
        return corpo;
    }

    /* ===== Formatação ===== */
    const doisDigitos = (valor) => String(valor).padStart(2, "0");
    const percentual = (acertos, total) => (total > 0 ? Math.round((acertos / total) * 100) : 0);
    const primeiroNome = (nome = "") => nome.trim().split(/\s+/)[0] || "";

    function formatarData(valor, comHora = false) {
        const data = new Date(valor);
        if (Number.isNaN(data.getTime())) return "";
        const opcoes = { day: "2-digit", month: "2-digit", year: "numeric" };
        if (comHora) Object.assign(opcoes, { hour: "2-digit", minute: "2-digit" });
        return data.toLocaleString("pt-BR", opcoes);
    }

    // "Hoje", "Ontem" ou a data, como no histórico do design
    function dataRelativa(valor) {
        const data = new Date(valor);
        if (Number.isNaN(data.getTime())) return "";
        const inicioDoDia = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
        const dias = Math.round((inicioDoDia(new Date()) - inicioDoDia(data)) / 86400000);
        if (dias === 0) return "Hoje";
        if (dias === 1) return "Ontem";
        return formatarData(data);
    }

    /* ===== Fundo decorativo ===== */
    function montarFundo() {
        if (document.querySelector(".fundo")) return;
        const fundo = document.createElement("div");
        fundo.className = "fundo";
        fundo.setAttribute("aria-hidden", "true");
        fundo.innerHTML = `
            <div class="fundo-grade"></div>
            <div class="fundo-arco fundo-arco-topo"></div>
            <div class="fundo-arco fundo-arco-base"></div>
            <svg class="fundo-circuito fundo-circuito-esquerda" viewBox="0 0 250 90" fill="none">
                <path d="M0 12 H95 L122 38 H248" />
                <path d="M0 38 H62 L88 62 H220" />
                <path d="M0 62 H36 L58 86 H132" />
                <circle cx="248" cy="38" r="4.5" />
                <circle cx="220" cy="62" r="3.5" />
                <circle cx="132" cy="86" r="3" />
            </svg>
            <svg class="fundo-circuito fundo-circuito-direita" viewBox="0 0 250 90" fill="none">
                <path d="M2 30 H125 L152 4 H250" />
                <path d="M30 54 H158 L185 28 H250" />
                <path d="M118 78 H188 L212 54 H250" />
                <circle cx="2" cy="30" r="4.5" />
                <circle cx="30" cy="54" r="3.5" />
                <circle cx="118" cy="78" r="3" />
            </svg>`;
        document.body.prepend(fundo);
    }

    montarFundo();

    return {
        token, logado, salvarToken, sair, exigirLogin,
        api, doisDigitos, percentual, primeiroNome, formatarData, dataRelativa,
    };
})();
