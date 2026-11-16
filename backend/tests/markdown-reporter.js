import fs from 'node:fs';
import path from 'node:path';

class MarkdownReporter {
  constructor(globalConfig, options) {
    this._globalConfig = globalConfig;
    this._options = options;
  }

  onRunComplete(testContexts, results) {
    const relatoriosDir = path.resolve(process.cwd(), 'tests', 'relatorios');
    if (!fs.existsSync(relatoriosDir)) {
      fs.mkdirSync(relatoriosDir, { recursive: true });
    }

    const arquivosExistentes = fs.readdirSync(relatoriosDir);
    const regex = /^relatorio-(\d+)\.md$/;
    let proximoNumero = 1;

    for (const arquivo of arquivosExistentes) {
      const match = arquivo.match(regex);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num >= proximoNumero) {
          proximoNumero = num + 1;
        }
      }
    }

    const numeroFormatado = String(proximoNumero).padStart(3, '0');
    const nomeArquivo = `relatorio-${numeroFormatado}.md`;
    const caminhoCompleto = path.join(relatoriosDir, nomeArquivo);

    const dataHora = new Date().toLocaleString('pt-BR');
    const totalSuites = results.numTotalTestSuites;
    const suitesPassadas = results.numPassedTestSuites;
    const suitesFalhadas = results.numFailedTestSuites;
    const totalTestes = results.numTotalTests;
    const testesPassados = results.numPassedTests;
    const testesFalhados = results.numFailedTests;
    const duracaoSegundos = ((Date.now() - results.startTime) / 1000).toFixed(2);

    let linhasTabela = '';

    for (const testResult of results.testResults) {
      for (const assertion of testResult.testResults) {
        const status = assertion.status === 'passed' ? '✅ PASSOU' : '❌ FALHOU';
        const duracao = assertion.duration !== null ? `${assertion.duration} ms` : '-';
        const nome = assertion.fullName.replace(/\|/g, '-');
        linhasTabela += `| ${nome} | ${status} | ${duracao} |\n`;
      }
    }

    const statusGeral = results.success ? '✅ SUCESSO' : '❌ COM FALHAS';

    const conteudo = `# Relatório de Execução de Testes — Execução #${numeroFormatado}

**Data e Hora:** ${dataHora}  
**Status Geral:** ${statusGeral}  
**Tempo de Execução:** ${duracaoSegundos}s  

---

## 1. Resumo Quantitativo

| Métrica | Quantidade |
|:---|:---:|
| **Suítes de Teste Totais** | ${totalSuites} |
| **Suítes Aprovadas** | ${suitesPassadas} |
| **Suítes Reprovadas** | ${suitesFalhadas} |
| **Testes Totais** | ${totalTestes} |
| **Testes Aprovados** | ${testesPassados} |
| **Testes Reprovados** | ${testesFalhados} |

---

## 2. Detalhes das Asserções

| Cenário / Teste | Resultado | Duração |
|:---|:---:|:---:|
${linhasTabela || '| Nenhum teste executado | - | - |\n'}
---

*Relatório gerado automaticamente por reporter Jest customizado.*
`;

    fs.writeFileSync(caminhoCompleto, conteudo, 'utf8');
    console.log(`\n📄 [Relatório QA] Gerado com sucesso: tests/relatorios/${nomeArquivo}`);
  }
}

export default MarkdownReporter;
