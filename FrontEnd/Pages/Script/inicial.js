document.addEventListener('DOMContentLoaded', () => {
  const botaoTeste = document.getElementById('botao-teste');
  const botaoCadastro = document.getElementById('botao-cadastro');
  const feedback = document.getElementById('feedback');

  if (botaoTeste) {
    botaoTeste.addEventListener('click', () => {
      if (feedback) {
        feedback.textContent = '';
      }
      window.location.href = 'login.html';
    });
  }

  if (botaoCadastro) {
    botaoCadastro.addEventListener('click', () => {
      if (feedback) {
        feedback.textContent = '';
      }
      window.location.href = 'cadastro.html';
    });
  }
});
