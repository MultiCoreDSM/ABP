// 1. Variáveis de controlo do cronómetro
let tempoRestante = 150; // 150 segundos exigidos pelo desafio
let intervaloCronometro = null;

// 2. Função para iniciar a contagem regressiva
function iniciarCronometro() {
  const displayTempo = document.getElementById("timer-display");
  const caixaTempo = document.getElementById("timer-box");

  // Limpa qualquer intervalo anterior para evitar duplicações
  clearInterval(intervaloCronometro);

  intervaloCronometro = setInterval(() => {
    // Se o tempo chegou a zero
    if (tempoRestante <= 0) {
      clearInterval(intervaloCronometro);
      displayTempo.textContent = "00:00";
      caixaTempo.classList.add("warning");
      
      // Ação quando o tempo esgota
      tempoEsgotado();
      return;
    }

    // Decrementa 1 segundo a cada ciclo
    tempoRestante--;

    // Converte os segundos em minutos e segundos (ex: 02:30)
    const minutos = Math.floor(tempoRestante / 60);
    const segundos = tempoRestante % 60;

    // Atualiza o texto no HTML com zeros à esquerda (ex: 02:05)
    displayTempo.textContent = `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;

    // Alerta visual de atenção nos últimos 15 segundos
    if (tempoRestante <= 15) {
      caixaTempo.classList.add("warning");
    }
  }, 1000); // Roda a cada 1000 milissegundos (1 segundo)
}

// 3. Função executada quando o tempo acaba
function tempoEsgotado() {
  alert("O tempo esgotou-se!");
  // Aqui podes desativar os botões ou enviar o formulário automaticamente
  document.getElementById("btn-submit").disabled = true;
}

// Inicia o cronómetro assim que a página carregar
window.onload = function() {
  iniciarCronometro();
};