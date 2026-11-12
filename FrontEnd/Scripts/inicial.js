// Com sessão, a tela troca "Entrar" por "Meu menu" e "Sair", e o botão principal leva ao menu
const logado = MultiCore.logado();

document.querySelectorAll("[data-logado]").forEach((el) => { el.hidden = !logado; });
document.querySelectorAll("[data-visitante]").forEach((el) => { el.hidden = logado; });

if (logado) {
    document.getElementById("btn-comecar").href = "menu.html";
    document.getElementById("btn-comecar-texto").textContent = "Ir para o menu";
}

document.getElementById("btn-sair").addEventListener("click", () => MultiCore.sair());
