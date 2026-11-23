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
    const falhas = [];

    for (const testResult of results.testResults) {
      for (const assertion of testResult.testResults) {
        const status = assertion.status === 'passed' ? 'APROVADO' : 'REPROVADO';
        const duracao = assertion.duration !== null ? `${assertion.duration} ms` : '-';
        const nome = assertion.fullName.replace(/\|/g, '-');
        linhasTabela += `| ${nome} | ${status} | ${duracao} |\n`;

        if (assertion.status !== 'passed' && assertion.failureMessages?.length) {
          falhas.push({
            nome,
            mensagens: assertion.failureMessages.join('\n'),
          });
        }
      }
    }

    const passouTudo =
      totalTestes > 0 &&
      testesFalhados === 0 &&
      suitesFalhadas === 0 &&
      !results.wasInterrupted;
    const statusGeral = passouTudo ? 'APROVADO' : 'REPROVADO (COM FALHAS)';

    const secaoFalhas =
      falhas.length > 0
        ? `\n---\n\n## Falhas Registradas\n\n${falhas
            .map(
              (f) =>
                `### ${f.nome}\n\n\`\`\`text\n${f.mensagens.trim()}\n\`\`\``
            )
            .join('\n\n')}\n`
        : '';

    const conteudo = `# Relatório Técnico de Execução de Testes Automatizados

**Identificador da Execução:** #${numeroFormatado}  
**Data e Horário:** ${dataHora}  
**Status Geral da Suíte:** ${statusGeral}  
**Tempo Total de Execução:** ${duracaoSegundos}s  
**Ambiente de Execução:** Node.js com Jest / Supertest / PostgreSQL 16  

---

## 1. Objetivo do Documento

Este relatório documenta os resultados obtidos na execução real da suíte de testes automatizados do projeto MultiCore (ABP-1), cobrindo:
- **QA-01 (Integração):** cadastro válido e CPF duplicado, autenticação válida e credenciais incorretas, verificação de hash bcrypt no banco e ausência de senha em respostas/logs, acesso a rotas protegidas sem sessão, expiração e encerramento de sessão.
- **DB-05 (Modelagem do Banco de Dados):** identificação inequívoca de tentativa e candidato, validação de estados permitidos, reconstrução temporal do ciclo de vida (início, atualização, pausa e conclusão), vínculo com as 12 questões sorteadas e prevenção de tentativas ativas simultâneas.

---

## 2. Resumo Quantitativo da Execução

| Métrica Avaliada | Quantidade |
|:---|:---:|
| Total de Suítes de Teste | ${totalSuites} |
| Suítes Aprovadas | ${suitesPassadas} |
| Suítes Reprovadas | ${suitesFalhadas} |
| Total de Testes Unitários/Integração | ${totalTestes} |
| Testes com Sucesso (Passed) | ${testesPassados} |
| Testes com Falha (Failed) | ${testesFalhados} |

---

## 3. Detalhamento dos Cenários de Teste

A tabela a seguir apresenta os resultados individuais obtidos para cada cenário avaliado durante o ciclo de execução:

| Cenário de Teste / Asserção | Status | Duração |
|:---|:---:|:---:|
${linhasTabela || '| Nenhum cenário executado | - | - |\n'}${secaoFalhas}
---

## 4. Instruções para Reprodução dos Testes

Para reproduzir este conjunto de testes em ambiente local ou de integração contínua (CI), siga as etapas abaixo:

### 4.1. Pré-requisitos
1. **Node.js** na versão 20 ou superior.
2. **PostgreSQL** ativo e acessível (via Docker Compose ou instalação local), inicializado com \`backend/database/schemas.sql\` e \`backend/database/seed.sql\`.
3. Arquivo \`.env\` configurado na raiz do projeto contendo as credenciais de banco e a chave \`JWT_SECRET\`.

### 4.2. Instalação de Dependências
Caso ainda não tenha instalado as dependências do backend:

\`\`\`bash
cd backend
npm install
\`\`\`

### 4.3. Execução da Suíte de Testes
Para rodar a suíte completa (\`api.test.js\` e \`db.test.js\`) e disparar a geração automática deste relatório enumerado:

\`\`\`bash
cd backend
npm test
\`\`\`

O Jest executará as asserções de integração e banco de dados e, ao término, acionará o \`MarkdownReporter\` configurado, registrando o novo arquivo sequencial no diretório \`backend/tests/relatorios/\`.

---

*Documento gerado automaticamente pela infraestrutura de testes automatizados.*
`;

    fs.writeFileSync(caminhoCompleto, conteudo, 'utf8');
    console.log(`\n[Relatorio QA] Gerado com sucesso: tests/relatorios/${nomeArquivo}`);
  }
}

export default MarkdownReporter;
