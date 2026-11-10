document.addEventListener("DOMContentLoaded", () => {
    const formCadastro = document.getElementById("form-cadastro");
    const screenForm = document.getElementById("screen-form");
    const screenSuccess = document.getElementById("screen-success");
    const toggleSenha = document.getElementById("toggle-senha");
    const senhaInput = document.getElementById("senha");
    const cpfInput = document.getElementById("cpf");
    const btnIniciar = document.getElementById("btn-iniciar");
    const btnMenu = document.getElementById("btn-menu");
    const btnEntrar = document.getElementById("btn-entrar");

    if (cpfInput) {
        cpfInput.addEventListener("input", (e) => {
            let value = e.target.value.replace(/\D/g, "");
            if (value.length > 11) value = value.slice(0, 11);

            value = value.replace(/(\d{3})(\d)/, "$1.$2");
            value = value.replace(/(\d{3})(\d)/, "$1.$2");
            value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");

            e.target.value = value;
        });
    }

    if (toggleSenha && senhaInput) {
        toggleSenha.addEventListener("click", () => {
            const isPassword = senhaInput.type === "password";
            senhaInput.type = isPassword ? "text" : "password";
            toggleSenha.textContent = isPassword ? "🙈" : "👁";
        });
    }

    if (formCadastro && screenForm && screenSuccess) {
        formCadastro.addEventListener("submit", (e) => {
            e.preventDefault();
            screenForm.classList.add("hidden");
            screenSuccess.classList.remove("hidden");
        });
    }

    if (btnIniciar) {
        btnIniciar.addEventListener("click", () => {
            window.location.href = "inicial.html";
        });
    }

    if (btnMenu) {
        btnMenu.addEventListener("click", () => {
            window.location.href = "inicial.html";
        });
    }

    if (btnEntrar) {
        btnEntrar.addEventListener("click", () => {
            window.location.href = "login.html";
        });
    }
});
