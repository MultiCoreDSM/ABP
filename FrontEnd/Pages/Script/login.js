document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const alertBox = document.getElementById('alert-box');
    const loginForm = document.getElementById('loginForm');
    const cpfInput = document.getElementById('cpf');
    const passwordInput = document.getElementById('password');
    const togglePassword = document.getElementById('toggle-password');
    const btnCadastrar = document.getElementById('btn-cadastrar');

    if (urlParams.get('expired') === 'true' && alertBox) {
        alertBox.style.display = 'block';
    }

    if (cpfInput) {
        cpfInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 11) value = value.slice(0, 11);
            value = value.replace(/(\d{3})(\d)/, '$1.$2');
            value = value.replace(/(\d{3})(\d)/, '$1.$2');
            value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
            e.target.value = value;
        });
    }

    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', () => {
            const isPassword = passwordInput.type === 'password';
            passwordInput.type = isPassword ? 'text' : 'password';
            togglePassword.textContent = isPassword ? '🙈' : '👁';
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', (event) => {
            event.preventDefault();

            const cpf = cpfInput ? cpfInput.value.trim() : '';
            const password = passwordInput ? passwordInput.value.trim() : '';

            if (!cpf || !password) {
                alert('Por favor, preencha o CPF e a senha para continuar.');
                return;
            }

            window.location.href = 'cronometro.html';
        });
    }

    if (btnCadastrar) {
        btnCadastrar.addEventListener('click', () => {
            window.location.href = 'cadastro.html';
        });
    }
});
