// Aguarda o carregamento do DOM para inicializar os eventos
document.addEventListener('DOMContentLoaded', () => {
    // Exibe mensagem caso venha o parâmetro ?expired=true na URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('expired') === 'true') {
        const alertBox = document.getElementById('alert-box');
        if (alertBox) {
            alertBox.style.display = 'block';
        }
    }

    // Associa o evento de envio do formulário de login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', realizarLogin);
    }

    // Exemplo de vínculo ao botão de logout (se existir na página protegida)
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', realizarLogout);
    }
});

// Função para processar o Login via API
async function realizarLogin(event) {
    event.preventDefault(); // Evita o recarregamento padrão da página

    const cpf = document.getElementById('cpf').value.trim();
    const password = document.getElementById('password').value;

    try {
        // Substituir pela URL real da API (Backend)
        const response = await fetch('http://localhost:8080/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ cpf, password })
        });

        if (response.ok) {
            const data = await response.json();
            
            // Armazena o token com segurança no sessionStorage
            sessionStorage.setItem('authToken', data.token);

            // Redireciona para o painel principal do candidato
            window.location.href = 'dashboard.html';
        } else {
            alert('CPF ou senha incorretos. Tente novamente.');
        }
    } catch (error) {
        console.error('Erro ao conectar com o servidor:', error);
        alert('Erro de conexão com o servidor. Verifique se o backend está rodando.');
    }
}

// Wrapper para requisições protegidas (trata sessão expirada 401/403)
async function apiFetch(url, options = {}) {
    const token = sessionStorage.getItem('authToken');
    
    if (!token) {
        window.location.href = 'login.html?expired=true';
        return;
    }

    options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    try {
        const response = await fetch(url, options);

        // Se a sessão expirou ou não tem autorização
        if (response.status === 401 || response.status === 403) {
            sessionStorage.clear();
            localStorage.clear();
            window.location.href = 'login.html?expired=true';
            return;
        }

        return await response.json();
    } catch (error) {
        console.error("Erro na requisição:", error);
        throw error;
    }
}

// Função para encerrar a sessão (Logout)
function realizarLogout() {
    sessionStorage.removeItem('authToken');
    sessionStorage.clear();
    window.location.href = 'login.html';
}